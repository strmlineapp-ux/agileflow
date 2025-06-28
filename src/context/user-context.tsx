

'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type Priority, type PriorityStrategy, type PriorityStrategyApplication, type AppSettings } from '@/types';
import { mockUsers as initialUsers, mockCalendars as initialCalendars, mockEvents as initialEvents, mockLocations as initialLocations, mockTeams, mockPriorityStrategies as initialPriorityStrategies, mockAppSettings } from '@/lib/mock-data';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '@/components/icons/google-symbol';

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
  updateEvent: (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => Promise<void>;
  locations: BookableLocation[];
  allBookableLocations: BookableLocation[];
  addLocation: (locationName: string) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  priorityStrategies: PriorityStrategy[];
  addPriorityStrategy: (strategyData: Omit<PriorityStrategy, 'id'>) => Promise<void>;
  updatePriorityStrategy: (strategyId: string, strategyData: Partial<Omit<PriorityStrategy, 'id'>>) => Promise<void>;
  deletePriorityStrategy: (strategyId: string) => Promise<void>;
  getEventStrategy: () => PriorityStrategy | undefined;
  getTaskStrategy: () => PriorityStrategy | undefined;
  getPriorityDisplay: (priorityId: string) => { label: React.ReactNode, description?: string, color: string, shape: 'rounded-md' | 'rounded-full' } | undefined;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [calendars, setCalendars] = useState<SharedCalendar[]>(initialCalendars);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [locations, setLocations] = useState<BookableLocation[]>(initialLocations);
  const [priorityStrategies, setPriorityStrategies] = useState<PriorityStrategy[]>(initialPriorityStrategies);
  const [appSettings, setAppSettings] = useState<AppSettings>(mockAppSettings);
  const { toast } = useToast();

  const allTeamRoles = useMemo(() => {
    const allRoles = new Set<string>();
    teams.forEach(team => {
        team.roles.forEach(role => allRoles.add(role.name));
    });
    return Array.from(allRoles).sort();
  }, [teams]);

  const realUser = useMemo(() => users.find(u => u.userId === REAL_USER_ID)!, [users]);
  const viewAsUser = useMemo(() => users.find(u => u.userId === viewAsUserId) || realUser, [users, viewAsUserId, realUser]);

  const allBookableLocations = useMemo(() => {
    const globalLocations = locations.map(l => ({ id: l.id, name: l.name }));
    
    const workstationLocations = teams.flatMap(team => 
        (team.workstations || []).map(wsName => ({
            id: `${team.id}-${wsName.toLowerCase().replace(/\s+/g, '-')}`,
            name: wsName,
        }))
    );
    
    const combined = [...globalLocations, ...workstationLocations];
    const uniqueNames = new Map();
    combined.forEach(loc => {
        if (!uniqueNames.has(loc.name)) {
            uniqueNames.set(loc.name, loc);
        }
    });
    
    return Array.from(uniqueNames.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [locations, teams]);
  
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    await simulateApi();
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  }, []);

  const addUser = useCallback(async (newUser: User) => {
    await simulateApi();
    setUsers(currentUsers => [...currentUsers, newUser]);
  }, []);

   const addTeam = useCallback(async (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
        ...teamData,
        id: teamData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    await simulateApi();
    setTeams(current => [...current, newTeam]);
  }, []);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Omit<Team, 'id'>>) => {
    await simulateApi();
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } as Team : t));
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    await simulateApi();
    setTeams(current => current.filter(t => t.id !== teamId));
  }, []);


  const addCalendar = useCallback(async (newCalendarData: Omit<SharedCalendar, 'id'>) => {
    const newCalendar: SharedCalendar = {
      ...newCalendarData,
      id: newCalendarData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    await simulateApi();
    setCalendars(current => [...current, newCalendar]);
  }, []);

  const updateCalendar = useCallback(async (calendarId: string, calendarData: Partial<SharedCalendar>) => {
    await simulateApi();
    setCalendars(current =>
      current.map(c => (c.id === calendarId ? { ...c, ...calendarData } : c))
    );
  }, []);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    if (calendars.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete Calendar',
        description: 'You cannot delete the last remaining calendar.',
      });
      return;
    }
    await simulateApi();
    setCalendars(current => current.filter(c => c.id !== calendarId));
  }, [calendars.length, toast]);


  const addEvent = useCallback(async (newEventData: Omit<Event, 'eventId' | 'createdBy' | 'createdAt' | 'lastUpdated'>) => {
    const event: Event = {
      ...newEventData,
      eventId: new Date().toISOString(),
      createdBy: realUser.userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    await simulateApi();
    setEvents(currentEvents => [...currentEvents, event]);
  }, [realUser.userId]);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => {
    await simulateApi();
    setEvents(currentEvents =>
      currentEvents.map(e =>
        e.eventId === eventId ? { ...e, ...eventData, lastUpdated: new Date() } as Event : e
      )
    );
  }, []);
  
  const addLocation = useCallback(async (locationName: string) => {
      const newLocation: BookableLocation = {
          id: locationName.toLowerCase().replace(/\s+/g, '-'),
          name: locationName,
      };
      await simulateApi();
      setLocations(current => [...current, newLocation]);
  }, []);

  const deleteLocation = useCallback(async (locationId: string) => {
      await simulateApi();
      setLocations(current => current.filter(loc => loc.id !== locationId));
  }, []);

  const addPriorityStrategy = useCallback(async (strategyData: Omit<PriorityStrategy, 'id'>) => {
    const newStrategy: PriorityStrategy = {
      ...strategyData,
      id: strategyData.name.toLowerCase().replace(/\s+/g, '-'),
    };
    await simulateApi();
    setPriorityStrategies(current => [...current, newStrategy]);
  }, []);

  const updatePriorityStrategy = useCallback(async (strategyId: string, strategyData: Partial<Omit<PriorityStrategy, 'id'>>) => {
    await simulateApi();
    setPriorityStrategies(current =>
      current.map(s => (s.id === strategyId ? { ...s, ...strategyData } as PriorityStrategy : s))
    );
  }, []);

  const deletePriorityStrategy = useCallback(async (strategyId: string) => {
    await simulateApi();
    setPriorityStrategies(current => current.filter(s => s.id !== strategyId));
  }, []);

  const getStrategyForApplication = useCallback((application: PriorityStrategyApplication) => {
    return priorityStrategies.find(s => s.applications.includes(application));
  }, [priorityStrategies]);

  const getEventStrategy = useCallback(() => getStrategyForApplication('events'), [getStrategyForApplication]);
  const getTaskStrategy = useCallback(() => getStrategyForApplication('tasks'), [getStrategyForApplication]);
  
  const getPriorityDisplay = useCallback((priorityId: string): { label: React.ReactNode, description?: string, color: string, shape: 'rounded-md' | 'rounded-full' } | undefined => {
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
                label: (
                    <div className="flex items-center">
                        {Array.from({ length: numValue }).map((_, i) => (
                            <GoogleSymbol key={i} name={strategy.icon} className="text-base" />
                        ))}
                    </div>
                ),
                description: `${numValue} / ${strategy.max}`,
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

  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    await simulateApi();
    setAppSettings(current => ({ ...current, ...settings }));
  }, []);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      await signInWithPopup(auth, provider);
      // In a real app, you would send the token to your backend to securely store it.
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
  }, [updateUser, toast]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-visibility', 'firebase');
    if (viewAsUser.theme) {
      root.classList.add(viewAsUser.theme);
    } else {
      root.classList.add('light'); // default
    }
  }, [viewAsUser.theme]);
  
  const value = useMemo(() => ({
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
    updateEvent,
    locations,
    allBookableLocations,
    addLocation,
    deleteLocation,
    priorityStrategies,
    addPriorityStrategy,
    updatePriorityStrategy,
    deletePriorityStrategy,
    getEventStrategy,
    getTaskStrategy,
    getPriorityDisplay,
    appSettings,
    updateAppSettings,
  }), [
    realUser, viewAsUser, users, allTeamRoles, teams, notifications, userStatusAssignments,
    calendars, events, locations, allBookableLocations, priorityStrategies, appSettings,
    addTeam, updateTeam, deleteTeam, setNotifications, setUserStatusAssignments, addUser,
    updateUser, linkGoogleCalendar, addCalendar, updateCalendar, deleteCalendar,
    addEvent, updateEvent, addLocation, deleteLocation, addPriorityStrategy,
    updatePriorityStrategy, deletePriorityStrategy, getEventStrategy, getTaskStrategy,
    getPriorityDisplay, updateAppSettings
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
