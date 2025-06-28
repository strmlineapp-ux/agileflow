

'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type PageConfig, type Priority, type PriorityStrategy, type PriorityStrategyApplication } from '@/types';
import { mockUsers as initialUsers, mockCalendars as initialCalendars, mockEvents as initialEvents, mockLocations as initialLocations, mockTeams, mockPriorityStrategies as initialPriorityStrategies } from '@/lib/mock-data';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
  allTeamRoles: string[];
  teams: Team[];
  addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Omit<Team, 'id'>>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  addUser: (newUser: User) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  linkGoogleCalendar: (userId: string) => Promise<void>;
  calendars: SharedCalendar[];
  addCalendar: (newCalendar: Omit<SharedCalendar, 'id'>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<SharedCalendar>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  events: Event[];
  addEvent: (newEventData: Omit<Event, 'eventId' | 'createdBy' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  locations: BookableLocation[];
  addLocation: (locationName: string) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  pageConfigs: PageConfig[];
  updatePageConfig: (pageId: string, pageData: Partial<PageConfig>) => Promise<void>;
  priorityStrategies: PriorityStrategy[];
  addPriorityStrategy: (strategyData: Omit<PriorityStrategy, 'id'>) => Promise<void>;
  updatePriorityStrategy: (strategyId: string, strategyData: Partial<Omit<PriorityStrategy, 'id'>>) => Promise<void>;
  deletePriorityStrategy: (strategyId: string) => Promise<void>;
  getEventStrategy: () => PriorityStrategy | undefined;
  getTaskStrategy: () => PriorityStrategy | undefined;
  getPriorityDisplay: (priorityId: string) => { label: string, description?: string, color: string, shape: 'rounded-md' | 'rounded-full' } | undefined;
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

const initialPageConfigs: PageConfig[] = [
    { id: 'admin', name: 'Admin', icon: 'shield_person' },
    { id: 'service-delivery', name: 'Service Delivery', icon: 'business_center' }
];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [calendars, setCalendars] = useState<SharedCalendar[]>(initialCalendars);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [locations, setLocations] = useState<BookableLocation[]>(initialLocations);
  const [pageConfigs, setPageConfigs] = useState<PageConfig[]>(initialPageConfigs);
  const [priorityStrategies, setPriorityStrategies] = useState<PriorityStrategy[]>(initialPriorityStrategies);
  const { toast } = useToast();

  const allTeamRoles = useMemo(() => {
    const allRoles = new Set<string>();
    teams.forEach(team => {
        team.roles.forEach(role => allRoles.add(role));
    });
    return Array.from(allRoles).sort();
  }, [teams]);

  const realUser = useMemo(() => users.find(u => u.userId === REAL_USER_ID)!, [users]);
  const viewAsUser = useMemo(() => users.find(u => u.userId === viewAsUserId) || realUser, [users, viewAsUserId, realUser]);
  
  const updateUser = async (userId: string, userData: Partial<User>) => {
    console.log(`Updating user ${userId}:`, userData);
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  };

  const addUser = async (newUser: User) => {
    console.log('Adding new user:', newUser);
    setUsers(currentUsers => [...currentUsers, newUser]);
  }

   const addTeam = async (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
        ...teamData,
        id: teamData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    console.log("Adding new team:", newTeam);
    setTeams(current => [...current, newTeam]);
  };

  const updateTeam = async (teamId: string, teamData: Partial<Omit<Team, 'id'>>) => {
    console.log(`Updating team ${teamId}:`, teamData);
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } as Team : t));
  };

  const deleteTeam = async (teamId: string) => {
    console.log("Deleting team:", teamId);
    setTeams(current => current.filter(t => t.id !== teamId));
  };


  const addCalendar = async (newCalendarData: Omit<SharedCalendar, 'id'>) => {
    const newCalendar: SharedCalendar = {
      ...newCalendarData,
      id: newCalendarData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    console.log('Adding new calendar:', newCalendar);
    setCalendars(current => [...current, newCalendar]);
  };

  const updateCalendar = async (calendarId: string, calendarData: Partial<SharedCalendar>) => {
    console.log(`Updating calendar ${calendarId}:`, calendarData);
    setCalendars(current =>
      current.map(c => (c.id === calendarId ? { ...c, ...calendarData } : c))
    );
  };

  const deleteCalendar = async (calendarId: string) => {
    console.log('Deleting calendar:', calendarId);
    if (calendars.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete Calendar',
        description: 'You cannot delete the last remaining calendar.',
      });
      return;
    }
    setCalendars(current => current.filter(c => c.id !== calendarId));
  };


  const addEvent = async (newEventData: Omit<Event, 'eventId' | 'createdBy' | 'createdAt' | 'lastUpdated'>) => {
    console.log("Adding new event:", newEventData);
    const event: Event = {
      ...newEventData,
      eventId: new Date().toISOString(),
      createdBy: realUser.userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    setEvents(currentEvents => [...currentEvents, event]);
  };
  
  const addLocation = async (locationName: string) => {
      const newLocation: BookableLocation = {
          id: locationName.toLowerCase().replace(/\s+/g, '-'),
          name: locationName,
      };
      setLocations(current => [...current, newLocation]);
  };

  const deleteLocation = async (locationId: string) => {
      setLocations(current => current.filter(loc => loc.id !== locationId));
  };

  const updatePageConfig = async (pageId: string, pageData: Partial<PageConfig>) => {
    setPageConfigs(currentConfigs => 
      currentConfigs.map(p => (p.id === pageId ? { ...p, ...pageData } : p))
    );
  };

  const addPriorityStrategy = async (strategyData: Omit<PriorityStrategy, 'id'>) => {
    const newStrategy: PriorityStrategy = {
      ...strategyData,
      id: strategyData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    setPriorityStrategies(current => [...current, newStrategy]);
  };

  const updatePriorityStrategy = async (strategyId: string, strategyData: Partial<Omit<PriorityStrategy, 'id'>>) => {
    setPriorityStrategies(current =>
      current.map(s => (s.id === strategyId ? { ...s, ...strategyData } as PriorityStrategy : s))
    );
  };

  const deletePriorityStrategy = async (strategyId: string) => {
    setPriorityStrategies(current => current.filter(s => s.id !== strategyId));
  };

  const getStrategyForApplication = useCallback((application: PriorityStrategyApplication) => {
    return priorityStrategies.find(s => s.applications.includes(application));
  }, [priorityStrategies]);

  const getEventStrategy = useCallback(() => getStrategyForApplication('events'), [getStrategyForApplication]);
  const getTaskStrategy = useCallback(() => getStrategyForApplication('tasks'), [getStrategyForApplication]);
  
  const getPriorityDisplay = useCallback((priorityId: string): { label: string, description?: string, color: string, shape: 'rounded-md' | 'rounded-full' } | undefined => {
    if (!priorityId || !priorityId.includes(':')) return undefined;

    const [strategyId, value] = priorityId.split(':');
    const strategy = priorityStrategies.find(s => s.id === strategyId);
    if (!strategy) return undefined;

    switch (strategy.type) {
        case 'tier':
            const tierPriority = strategy.priorities.find(p => p.id === priorityId);
            return tierPriority;
        case 'symbol':
            const numValue = parseInt(value, 10);
            return {
                label: Array(numValue).fill(strategy.symbol).join(''),
                description: `${numValue} / ${strategy.max} ${strategy.symbol}`,
                color: strategy.color,
                shape: 'rounded-md'
            };
        case 'scale':
            const scaleValue = parseInt(value, 10);
            const interval = strategy.intervals.find(i => scaleValue >= i.from && scaleValue <= i.to);
            return {
                label: interval?.label || 'Uncategorized',
                description: `Score: ${scaleValue} / ${strategy.max}`,
                color: interval?.color || '#888888',
                shape: 'rounded-full'
            };
        default:
            return undefined;
    }
  }, [priorityStrategies]);


  const linkGoogleCalendar = async (userId: string) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      await signInWithPopup(auth, provider);
      await updateUser(userId, { googleCalendarLinked: true });
      toast({
        title: "Success!",
        description: "Your Google Calendar has been successfully connected.",
      });
    } catch (error) {
      console.error("Error linking Google Calendar:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem linking your Google Calendar. Please try again.",
      });
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-visibility', 'firebase');
    if (viewAsUser.theme) {
      root.classList.add(viewAsUser.theme);
    } else {
      root.classList.add('light'); // default
    }
  }, [viewAsUser.theme]);
  
  const value = {
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users,
    allTeamRoles,
    teams,
    addTeam,
    updateTeam,
    deleteTeam,
    notifications,
    setNotifications,
    userStatusAssignments,
    setUserStatusAssignments,
    addUser,
    updateUser,
    linkGoogleCalendar,
    calendars,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    events,
    addEvent,
    locations,
    addLocation,
    deleteLocation,
    pageConfigs,
    updatePageConfig,
    priorityStrategies,
    addPriorityStrategy,
    updatePriorityStrategy,
    deletePriorityStrategy,
    getEventStrategy,
    getTaskStrategy,
    getPriorityDisplay,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
