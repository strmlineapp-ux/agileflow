
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollectionOwner, type BadgeCollection } from '@/types';
import { mockUsers as initialUsers, mockCalendars as initialCalendars, mockEvents as initialEvents, mockLocations as initialLocations, mockTeams, mockAppSettings } from '@/lib/mock-data';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hexToHsl } from '@/lib/utils';
import { startOfDay } from 'date-fns';
import { getOwnershipContext } from '@/lib/permissions';

interface UserContextType {
  loading: boolean;
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
  teams: Team[];
  addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  reorderTeams: (reorderedTeams: Team[]) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  addUser: (newUser: User) => Promise<void>;
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
  allBadges: Badge[];
  allBadgeCollections: BadgeCollection[];
  addBadgeCollection: (owner: BadgeCollectionOwner, sourceCollection?: BadgeCollection) => void;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => void;
  deleteBadgeCollection: (collectionId: string) => void;
  addBadge: (collectionId: string, sourceBadge?: Badge) => void;
  updateBadge: (badgeData: Partial<Badge>) => void;
  deleteBadge: (badgeId: string) => void;
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

  const [allBadges, setAllBadges] = useState<Badge[]>(() => {
    const badgesMap = new Map<string, Badge>();
    
    (mockAppSettings.globalBadges || []).forEach(badge => {
        if (!badgesMap.has(badge.id)) badgesMap.set(badge.id, badge);
    });

    mockTeams.forEach(team => {
        (team.allBadges || []).forEach(badge => {
            if (!badgesMap.has(badge.id)) badgesMap.set(badge.id, badge);
        });
    });
    return Array.from(badgesMap.values());
  });

  const [allBadgeCollections, setAllBadgeCollections] = useState<BadgeCollection[]>(() => {
    const collectionsMap = new Map<string, BadgeCollection>();
    mockTeams.forEach(team => {
        (team.badgeCollections || []).forEach(collection => {
            if (!collectionsMap.has(collection.id)) collectionsMap.set(collection.id, collection);
        });
    });
    return Array.from(collectionsMap.values());
  });

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

  useEffect(() => {
    // Simulate initial data loading to prevent infinite loading screen
    const timer = setTimeout(() => {
        setLoading(false);
    }, 500); 

    return () => clearTimeout(timer);
  }, []);
  
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

    const badge = allBadges.find(b => b.id === badgeId);
    if (badge) {
        return {
            label: badge.name,
            description: badge.description,
            color: badge.color,
            icon: badge.icon
        };
    }
    return undefined;
  }, [allBadges]);

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

  const addBadgeCollection = useCallback((owner: BadgeCollectionOwner, sourceCollection?: BadgeCollection) => {
    const newId = crypto.randomUUID();
    let newBadges: Badge[] = [];
    let newCollection: BadgeCollection;

    if (sourceCollection) {
        newBadges = sourceCollection.badgeIds.map(bId => {
            const originalBadge = allBadges.find(b => b.id === bId);
            return { ...(originalBadge || {}), id: crypto.randomUUID(), ownerCollectionId: newId, name: originalBadge?.name ? `${originalBadge.name} (Copy)`: 'New Badge' };
        });
        newCollection = {
            ...JSON.parse(JSON.stringify(sourceCollection)),
            id: newId,
            name: `${sourceCollection.name} (Copy)`,
            owner: owner,
            isShared: false,
            badgeIds: newBadges.map(b => b.id),
        };
    } else {
        newCollection = {
            id: newId,
            name: `New Collection ${allBadgeCollections.length + 1}`,
            owner: owner,
            icon: 'category',
            color: '#64748B',
            viewMode: 'detailed',
            badgeIds: [],
            applications: [],
            description: '',
            isShared: false,
        };
    }
    
    setAllBadgeCollections(prev => [...prev, newCollection]);
    if (newBadges.length > 0) {
        setAllBadges(prev => [...prev, ...newBadges]);
    }
  }, [allBadgeCollections, allBadges]);

  const updateBadgeCollection = useCallback((collectionId: string, data: Partial<BadgeCollection>) => {
    setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, ...data } : c));
  }, []);

  const deleteBadgeCollection = useCallback((collectionId: string) => {
    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;

    const badgeIdsToDelete = new Set(collectionToDelete.badgeIds.filter(badgeId => {
        const badge = allBadges.find(b => b.id === badgeId);
        return badge?.ownerCollectionId === collectionId;
    }));

    setAllBadgeCollections(current => current.filter(c => c.id !== collectionId));
    setAllBadges(current => current.filter(b => !badgeIdsToDelete.has(b.id)));
  }, [allBadgeCollections, allBadges]);

  const addBadge = useCallback((collectionId: string, sourceBadge?: Badge) => {
    const newBadgeId = crypto.randomUUID();
    const newBadge: Badge = {
      id: newBadgeId,
      ownerCollectionId: collectionId,
      name: sourceBadge ? `${sourceBadge.name} (Copy)` : `New Badge`,
      icon: sourceBadge?.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
      color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
    };
    setAllBadges(prev => [...prev, newBadge]);
    setAllBadgeCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        return { ...c, badgeIds: [newBadgeId, ...c.badgeIds] };
      }
      return c;
    }));
  }, []);

  const updateBadge = useCallback((badgeData: Partial<Badge>) => {
    setAllBadges(current => current.map(b => b.id === badgeData.id ? { ...b, ...badgeData } : b));
  }, []);

  const deleteBadge = useCallback((badgeId: string) => {
    setAllBadges(current => current.filter(b => b.id !== badgeId));
    setAllBadgeCollections(current => current.map(c => ({
        ...c,
        badgeIds: c.badgeIds.filter(id => id !== badgeId)
    })));
  }, []);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
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
    teams,
    addTeam,
    updateTeam,
    deleteTeam,
    reorderTeams,
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
    allBadges,
    allBadgeCollections,
    addBadgeCollection,
    updateBadgeCollection,
    deleteBadgeCollection,
    addBadge,
    updateBadge,
    deleteBadge,
  }), [
    loading, realUser, viewAsUser, users, teams, notifications, userStatusAssignments,
    calendars, events, locations, allBookableLocations, appSettings, allBadges, allBadgeCollections,
    addTeam, updateTeam, deleteTeam, reorderTeams, setNotifications, setUserStatusAssignments, addUser,
    updateUser, linkGoogleCalendar, reorderCalendars, addCalendar, updateCalendar, deleteCalendar,
    addEvent, updateEvent, deleteEvent, addLocation, deleteLocation,
    getPriorityDisplay, updateAppSettings, updateAppTab,
    addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge
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
