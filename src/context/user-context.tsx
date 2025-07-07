
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type AdminGroup, type BadgeCollectionOwner } from '@/types';
import { mockUsers as initialUsers, mockCalendars as initialCalendars, mockEvents as initialEvents, mockLocations as initialLocations, mockTeams, mockAppSettings } from '@/lib/mock-data';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hexToHsl } from '@/lib/utils';
import { startOfDay } from 'date-fns';

interface UserContextType {
  loading: boolean;
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
  allBadges: Badge[];
  allRolesAndBadges: { name: string; icon: string; color: string; }[];
  teams: Team[];
  addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  reorderTeams: (reorderedTeams: Team[]) => Promise<void>;
  unlinkAndCopyTeam: (teamToUnlink: Team, newOwner: BadgeCollectionOwner) => Promise<void>;
  linkTeam: (teamId: string) => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  addUser: (newUser: User) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  linkGoogleCalendar: (userId: string) => Promise<void>;
  calendars: SharedCalendar[];
  reorderCalendars: (reorderedCalendars: SharedCalendar[]) => Promise<void>;
  addCalendar: (newCalendar: Omit<SharedCalendar, 'id'>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<SharedCalendar>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  events: Event[];
  addEvent: (newEventData: Omit<Event, 'eventId'>) => Promise<void>;
  updateEvent: (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  locations: BookableLocation[];
  allBookableLocations: BookableLocation[];
  addLocation: (locationName: string) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  getPriorityDisplay: (badgeId: string) => { label: React.ReactNode, description?: string, color: string, icon?: string } | undefined;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateAppTab: (tabId: string, tabData: Partial<AppTab>) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

const getInitialAbsences = (): Record<string, UserStatusAssignment[]> => {
    const today = startOfDay(new Date());
    const todayISO = today.toISOString();
    
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();
    
    return {
        [todayISO]: [
            { userId: '2', status: 'PTO' },
            { userId: '4', status: 'Sick' },
        ],
        [tomorrowISO]: [
             { userId: '3', status: 'PTO (AM)' },
        ]
    };
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>(getInitialAbsences());
  const [calendars, setCalendars] = useState<SharedCalendar[]>(initialCalendars);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [locations, setLocations] = useState<BookableLocation[]>(initialLocations);
  const [appSettings, setAppSettings] = useState<AppSettings>(mockAppSettings);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate initial data loading process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, []);

  const allBadges = useMemo(() => {
    const badgesMap = new Map<string, Badge>();
    teams.forEach(team => {
        (team.allBadges || []).forEach(badge => {
            if (!badgesMap.has(badge.id)) {
                badgesMap.set(badge.id, badge);
            }
        });
    });
    return Array.from(badgesMap.values());
  }, [teams]);

  const allRolesAndBadges = useMemo(() => {
    const combined = new Map<string, { name: string; icon: string; color: string; }>();

    appSettings.adminGroups.forEach(group => {
      combined.set(group.name, group);
    });

    allBadges.forEach(badge => {
      if (!combined.has(badge.name)) {
        combined.set(badge.name, badge);
      }
    });

    return Array.from(combined.values());
  }, [appSettings.adminGroups, allBadges]);

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
      id: crypto.randomUUID(),
    };
    await simulateApi();
    setTeams(current => [...current, newTeam]);
  }, []);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    await simulateApi();
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } as Team : t));
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    await simulateApi();
    setTeams(current => current.filter(t => t.id !== teamId));
  }, []);

  const reorderTeams = useCallback(async (reordered: Team[]) => {
      await simulateApi();
      setTeams(reordered);
  }, []);
  
  const unlinkAndCopyTeam = useCallback(async (teamToUnlink: Team, newOwner: BadgeCollectionOwner) => {
    await simulateApi();
    
    const newTeamData: Omit<Team, 'id'> = {
        name: teamToUnlink.name,
        icon: teamToUnlink.icon,
        color: teamToUnlink.color,
        owner: newOwner,
        isShared: false,
        members: teamToUnlink.members,
        teamAdmins: teamToUnlink.teamAdmins,
        teamAdminsLabel: teamToUnlink.teamAdminsLabel,
        membersLabel: teamToUnlink.membersLabel,
        locationCheckManagers: teamToUnlink.locationCheckManagers,
        allBadges: JSON.parse(JSON.stringify(teamToUnlink.allBadges)),
        badgeCollections: JSON.parse(JSON.stringify(teamToUnlink.badgeCollections)),
        userBadgesLabel: teamToUnlink.userBadgesLabel,
        pinnedLocations: teamToUnlink.pinnedLocations,
        checkLocations: teamToUnlink.checkLocations,
        locationAliases: teamToUnlink.locationAliases,
        workstations: teamToUnlink.workstations,
        eventTemplates: JSON.parse(JSON.stringify(teamToUnlink.eventTemplates)),
    };
    
    addTeam(newTeamData); // This will add the new team with a new ID

    const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== teamToUnlink.id);
    await updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });

    toast({ title: 'Team Unlinked & Copied', description: `An independent copy of "${teamToUnlink.name}" is now on your board.` });
  }, [addTeam, viewAsUser, updateUser, toast]);

  const linkTeam = useCallback(async (teamId: string) => {
    await simulateApi();
    await updateUser(viewAsUser.userId, { 
      linkedTeamIds: Array.from(new Set([...(viewAsUser.linkedTeamIds || []), teamId]))
    });
  }, [viewAsUser.userId, viewAsUser.linkedTeamIds, updateUser]);


  const addCalendar = useCallback(async (newCalendarData: Omit<SharedCalendar, 'id'>) => {
    const newCalendar: SharedCalendar = {
      ...newCalendarData,
      id: crypto.randomUUID(),
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

  const reorderCalendars = useCallback(async (reordered: SharedCalendar[]) => {
      await simulateApi();
      setCalendars(reordered);
  }, []);


  const addEvent = useCallback(async (newEventData: Omit<Event, 'eventId'>) => {
    const event: Event = {
      ...newEventData,
      eventId: crypto.randomUUID(),
    };
    await simulateApi();
    setEvents(currentEvents => [...currentEvents, event]);
  }, []);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => {
    await simulateApi();
    setEvents(currentEvents =>
      currentEvents.map(e =>
        e.eventId === eventId ? { ...e, ...eventData, lastUpdated: new Date() } as Event : e
      )
    );
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    await simulateApi();
    setEvents(currentEvents => currentEvents.filter(e => e.eventId !== eventId));
  }, []);
  
  const addLocation = useCallback(async (locationName: string) => {
      const newLocation: BookableLocation = {
          id: crypto.randomUUID(),
          name: locationName,
      };
      await simulateApi();
      setLocations(current => [...current, newLocation]);
  }, []);

  const deleteLocation = useCallback(async (locationId: string) => {
      await simulateApi();
      setLocations(current => current.filter(loc => loc.id !== locationId));
  }, []);
  
  const getPriorityDisplay = useCallback((badgeId: string): { label: React.ReactNode, description?: string, color: string, icon?: string } | undefined => {
    if (!badgeId) return undefined;

    for (const team of teams) {
        const badge = (team.allBadges || []).find(b => b.id === badgeId);
        if (badge) {
            return {
                label: badge.name,
                description: badge.description,
                color: badge.color,
                icon: badge.icon
            };
        }
    }
    return undefined;
  }, [teams]);

  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    await simulateApi();
    setAppSettings(current => ({ ...current, ...settings }));
  }, []);

  const updateAppTab = useCallback(async (tabId: string, tabData: Partial<AppTab>) => {
    await simulateApi();
    setAppSettings(current => {
      const newTabs = current.tabs.map(t => t.id === tabId ? { ...t, ...tabData } : t);
      return { ...current, tabs: newTabs };
    });
  }, []);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      // In a real app, you would use signInWithPopup to get credentials
      // await signInWithPopup(auth, provider);
      // For this prototype, we will just simulate a successful link.
      await simulateApi(1000); 

      await updateUser(userId, { googleCalendarLinked: true, accountType: 'Full' });
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
    root.classList.remove('light', 'dark');
    
    const currentTheme = viewAsUser.theme || 'light';
    root.classList.add(currentTheme);
    
    if (viewAsUser.primaryColor) {
      const hslColor = hexToHsl(viewAsUser.primaryColor);
      if (hslColor) {
        root.style.setProperty('--primary', hslColor);
        root.style.setProperty('--ring', hslColor);
      }
    } else {
      // If no custom color, remove the style property to revert to the CSS default
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
    }
  }, [viewAsUser.theme, viewAsUser.primaryColor]);
  
  const value = useMemo(() => ({
    loading,
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users,
    allBadges,
    allRolesAndBadges,
    teams,
    addTeam,
    updateTeam,
    deleteTeam,
    reorderTeams,
    unlinkAndCopyTeam,
    linkTeam,
    notifications,
    setNotifications,
    userStatusAssignments,
    setUserStatusAssignments,
    addUser,
    updateUser,
    linkGoogleCalendar,
    calendars,
    reorderCalendars,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    locations,
    allBookableLocations,
    addLocation,
    deleteLocation,
    getPriorityDisplay,
    appSettings,
    updateAppSettings,
    updateAppTab,
  }), [
    loading, realUser, viewAsUser, users, allBadges, allRolesAndBadges, teams, notifications, userStatusAssignments,
    calendars, events, locations, allBookableLocations, appSettings,
    addTeam, updateTeam, deleteTeam, reorderTeams, unlinkAndCopyTeam, linkTeam, setNotifications, setUserStatusAssignments, addUser,
    updateUser, linkGoogleCalendar, reorderCalendars, addCalendar, updateCalendar, deleteCalendar,
    addEvent, updateEvent, deleteEvent, addLocation, deleteLocation,
    getPriorityDisplay, updateAppSettings, updateAppTab
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
