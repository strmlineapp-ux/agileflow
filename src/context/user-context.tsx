
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollectionOwner, type BadgeCollection } from '@/types';
import { mockUsers as initialUsers, mockCalendars as initialCalendars, mockEvents as initialEvents, mockLocations as initialLocations, mockTeams, mockAppSettings } from '@/lib/mock-data';
import { GoogleAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { hexToHsl } from '@/lib/utils';
import { getOwnershipContext } from '@/lib/permissions';
import { googleSymbolNames } from '@/lib/google-symbols';

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

// --- Split Contexts for Performance ---

// Context for frequently updated, session-specific data (e.g., who the user is viewing as)
interface UserSessionContextType {
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[]; // Keep users here as it's needed for the "View As" dropdown
}
const UserSessionContext = createContext<UserSessionContextType | null>(null);


// Context for heavier, less frequently updated application data
interface UserDataContextType {
  loading: boolean;
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
  addBadgeCollection: (owner: BadgeCollectionOwner, sourceCollection?: BadgeCollection, contextTeam?: Team) => void;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => void;
  deleteBadgeCollection: (collectionId: string, contextTeam?: Team) => void;
  addBadge: (collectionId: string, sourceBadge?: Badge) => void;
  updateBadge: (badgeData: Partial<Badge>) => void;
  deleteBadge: (badgeId: string) => void;
}
const UserDataContext = createContext<UserDataContextType | null>(null);

const REAL_USER_ID = '1'; // Bernardo is the default user

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
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
    const timer = setTimeout(() => {
        setLoading(false);
    }, 50); 
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
    const newTeam: Team = { ...teamData, id: crypto.randomUUID() };
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
    const newCalendar: SharedCalendar = { ...newCalendarData, id: crypto.randomUUID() };
    await simulateApi();
    setCalendars(current => [...current, newCalendar]);
  }, []);

  const updateCalendar = useCallback(async (calendarId: string, calendarData: Partial<SharedCalendar>) => {
    await simulateApi();
    setCalendars(current => current.map(c => (c.id === calendarId ? { ...c, ...calendarData } : c)));
  }, []);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    if (calendars.length <= 1) {
      toast({ variant: 'destructive', title: 'Cannot Delete Calendar', description: 'You cannot delete the last remaining calendar.' });
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
    const event: Event = { ...newEventData, eventId: crypto.randomUUID() };
    await simulateApi();
    setEvents(currentEvents => [...currentEvents, event]);
  }, []);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => {
    await simulateApi();
    setEvents(currentEvents => currentEvents.map(e => e.eventId === eventId ? { ...e, ...eventData, lastUpdated: new Date() } as Event : e));
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    await simulateApi();
    setEvents(currentEvents => currentEvents.filter(e => e.eventId !== eventId));
  }, []);

  const addLocation = useCallback(async (locationName: string) => {
      const newLocation: BookableLocation = { id: crypto.randomUUID(), name: locationName };
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
    if (badge) return { label: badge.name, description: badge.description, color: badge.color, icon: badge.icon };
    return undefined;
  }, [allBadges]);

  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    await simulateApi();
    setAppSettings(current => ({ ...current, ...settings }));
  }, []);

  const updateAppTab = useCallback(async (tabId: string, tabData: Partial<AppTab>) => {
    await simulateApi();
    setAppSettings(current => ({ ...current, tabs: current.tabs.map(t => t.id === tabId ? { ...t, ...tabData } : t) }));
  }, []);

  const addBadgeCollection = useCallback((owner: BadgeCollectionOwner, sourceCollection?: BadgeCollection, contextTeam?: Team) => {
    const newCollectionId = crypto.randomUUID();
    let newBadges: Badge[] = [];
    let newCollection: BadgeCollection;
    if (sourceCollection) {
        newBadges = sourceCollection.badgeIds.map(bId => {
            const originalBadge = allBadges.find(b => b.id === bId);
            if (!originalBadge) return null;
            return { ...originalBadge, id: crypto.randomUUID(), ownerCollectionId: newCollectionId, name: `${originalBadge.name} (Copy)` };
        }).filter((b): b is Badge => b !== null);
        newCollection = { ...JSON.parse(JSON.stringify(sourceCollection)), id: newCollectionId, name: `${sourceCollection.name} (Copy)`, owner: owner, isShared: false, badgeIds: newBadges.map(b => b.id) };
    } else {
        const newBadgeId = crypto.randomUUID();
        const newBadge: Badge = { id: newBadgeId, ownerCollectionId: newCollectionId, name: `New Badge`, icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)], color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)] };
        newBadges.push(newBadge);
        newCollection = { id: newCollectionId, name: `New Collection ${allBadgeCollections.length + 1}`, owner: owner, icon: 'category', color: '#64748B', viewMode: 'detailed', badgeIds: [newBadgeId], applications: [], description: 'Badge Collection description', isShared: false };
    }
    setAllBadgeCollections(prev => [...prev, newCollection]);
    if (newBadges.length > 0) setAllBadges(prev => [...prev, ...newBadges]);
    if (contextTeam) {
        const updatedTeam = { ...contextTeam, badgeCollections: [...contextTeam.badgeCollections, newCollection], allBadges: [...contextTeam.allBadges, ...newBadges], activeBadgeCollections: contextTeam.activeBadgeCollections ? [...contextTeam.activeBadgeCollections] : [] };
        setTeams(currentTeams => currentTeams.map(t => t.id === contextTeam.id ? updatedTeam : t));
    }
  }, [allBadgeCollections.length, allBadges]);

  const updateBadgeCollection = useCallback((collectionId: string, data: Partial<BadgeCollection>) => {
    setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, ...data } : c));
    setTeams(currentTeams => currentTeams.map(t => ({ ...t, badgeCollections: t.badgeCollections.map(c => c.id === collectionId ? { ...c, ...data } : c) })));
  }, []);

  const deleteBadgeCollection = useCallback((collectionId: string, contextTeam?: Team) => {
    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;
    const badgeIdsToDelete = new Set(allBadges.filter(b => b.ownerCollectionId === collectionId).map(b => b.id));
    setAllBadgeCollections(current => current.filter(c => c.id !== collectionId));
    setAllBadges(current => current.filter(b => !badgeIdsToDelete.has(b.id)));
    setTeams(currentTeams => currentTeams.map(t => {
        const isTargetTeam = contextTeam ? t.id === contextTeam.id : t.badgeCollections.some(c => c.id === collectionId);
        if (isTargetTeam) {
            return { ...t, allBadges: t.allBadges.filter(b => !badgeIdsToDelete.has(b.id)), badgeCollections: t.badgeCollections.filter(c => c.id !== collectionId), activeBadgeCollections: (t.activeBadgeCollections || []).filter(id => id !== collectionId) };
        }
        return t;
    }));
  }, [allBadgeCollections, allBadges]);

  const addBadge = useCallback((collectionId: string, sourceBadge?: Badge) => {
    const newBadgeId = crypto.randomUUID();
    const newBadge: Badge = { id: newBadgeId, ownerCollectionId: collectionId, name: sourceBadge ? `${sourceBadge.name} (Copy)` : `New Badge`, icon: sourceBadge?.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)], color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)] };
    setAllBadges(prev => [...prev, newBadge]);
    setAllBadgeCollections(prev => prev.map(c => c.id === collectionId ? { ...c, badgeIds: [newBadgeId, ...c.badgeIds] } : c));
    setTeams(currentTeams => currentTeams.map(t => ({ ...t, allBadges: t.allBadges ? [...t.allBadges, newBadge] : [newBadge], badgeCollections: t.badgeCollections.map(c => c.id === collectionId ? { ...c, badgeIds: [newBadgeId, ...c.badgeIds] } : c) })));
  }, []);

  const updateBadge = useCallback((badgeData: Partial<Badge>) => {
    setAllBadges(current => current.map(b => b.id === badgeData.id ? { ...b, ...badgeData } : b));
    setTeams(currentTeams => currentTeams.map(t => ({ ...t, allBadges: t.allBadges.map(b => b.id === badgeData.id ? { ...b, ...badgeData } : b) })));
  }, []);

  const deleteBadge = useCallback((badgeId: string) => {
    setAllBadges(current => current.filter(b => b.id !== badgeId));
    setAllBadgeCollections(current => current.map(c => ({ ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) })));
    setTeams(currentTeams => currentTeams.map(t => ({ ...t, allBadges: t.allBadges.filter(b => b.id !== badgeId), badgeCollections: t.badgeCollections.map(c => ({ ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) })) })));
  }, []);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    await simulateApi(1000);
    updateUser(userId, { googleCalendarLinked: true, accountType: 'Full' });
    toast({ title: "Success!", description: "Your Google Calendar has been successfully connected." });
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

  const sessionValue = useMemo(() => ({
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users,
  }), [realUser, viewAsUser, users]);

  const dataValue = useMemo(() => ({
    loading, teams, addTeam, updateTeam, deleteTeam, reorderTeams, updateUser, notifications, setNotifications, userStatusAssignments, setUserStatusAssignments, addUser, linkGoogleCalendar, calendars, reorderCalendars, addCalendar, updateCalendar, deleteCalendar, events, addEvent, updateEvent, deleteEvent, locations, allBookableLocations, addLocation, deleteLocation, getPriorityDisplay, appSettings, updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge,
  }), [loading, teams, addTeam, updateTeam, deleteTeam, reorderTeams, updateUser, notifications, setNotifications, userStatusAssignments, setUserStatusAssignments, addUser, linkGoogleCalendar, calendars, reorderCalendars, addCalendar, updateCalendar, deleteCalendar, events, addEvent, updateEvent, deleteEvent, locations, allBookableLocations, addLocation, deleteLocation, getPriorityDisplay, appSettings, updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge]);

  return (
    <UserSessionContext.Provider value={sessionValue}>
      <UserDataContext.Provider value={dataValue}>
        {children}
      </UserDataContext.Provider>
    </UserSessionContext.Provider>
  );
}

// Custom hooks for consuming the contexts
export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) throw new Error('useUserSession must be used within a UserProvider');
  return context;
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useUserData must be used within a UserProvider');
  return context;
}

// Combined hook for convenience, for components that need both.
// Note: Components using this will re-render on both session and data changes.
export function useUser() {
    const session = useUserSession();
    const data = useUserData();
    return { ...session, ...data };
}
