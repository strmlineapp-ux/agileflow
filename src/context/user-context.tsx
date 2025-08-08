'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollection, type BadgeOwner, type Task, type Holiday } from '@/lib/mock-data';
import { doc, getDoc, getFirestore, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore'; // Added setDoc
import { useToast } from '@/hooks/use-toast';
import { hexToHsl } from '@/lib/utils';
import { hasAccess, getOwnershipContext } from '@/lib/permissions';
import { googleSymbolNames } from '@/lib/google-symbols';
import { corePages, coreTabs } from '@/lib/core-data';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getFirebaseAppForTenant } from '@/lib/firebase';
import { mockEvents, mockTasks, mockNotifications } from '@/lib/mock-data';

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

// --- Context Definition ---
interface UserContextType {
  // Session
  realUser: User | null;
  viewAsUser: User | null;
  setViewAsUser: (userId: string) => void;
  login: (email: string, pass: string, googleUser?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;

  // Data & Actions
  isDragModifierPressed: boolean;
  holidays: Holiday[];
  users: User[];
  teams: Team[];
  appSettings: AppSettings;
  calendars: SharedCalendar[];
  locations: BookableLocation[];
  allBookableLocations: BookableLocation[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;

  // CRUD functions
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  addUser: (newUser: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string, router: AppRouterInstance, pathname: string) => Promise<void>;
  reorderTeams: (teams: Team[]) => Promise<void>;
  addCalendar: (newCalendar: Omit<SharedCalendar, 'id'>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<SharedCalendar>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;

  fetchEvents: (start: Date, end: Date) => Promise<Event[]>;
  addEvent: (currentEvents: Event[], newEventData: Omit<Event, 'eventId'>) => Promise<Event[]>;
  updateEvent: (currentEvents: Event[], eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => Promise<Event[]>;
  deleteEvent: (currentEvents: Event[], eventId: string) => Promise<Event[]>;

  fetchTasks: () => Promise<Task[]>;
  addTask: (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => Promise<Task[]>;
  updateTask: (currentTasks: Task[], taskId: string, taskData: Partial<Task>) => Promise<Task[]>;
  deleteTask: (currentTasks: Task[], taskId: string) => Promise<Task[]>;

  addLocation: (locationName: string) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;

  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateAppTab: (tabId: string, tabData: Partial<AppTab>) => Promise<void>;

  // Badge and Collection Management
  allBadges: Badge[];
  allBadgeCollections: BadgeCollection[];
  addBadgeCollection: (owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => void;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => void;
  deleteBadgeCollection: (collectionId: string) => void;
  addBadge: (collectionId: string, sourceBadge?: Badge) => void;
  updateBadge: (badgeId: string, badgeData: Partial<Badge>) => Promise<void>;
  deleteBadge: (badgeId: string, collectionId: string) => void;
  reorderBadges: (collectionId: string, badgeIds: string[]) => void;
  handleBadgeAssignment: (badge: Badge, memberId: string) => void;
  handleBadgeUnassignment: (badge: Badge, memberId: string) => void;

  // Utilities
  linkGoogleCalendar: (userId: string) => Promise<void>;
  getPriorityDisplay: (badgeId: string) => { label: React.ReactNode, description?: string, color: string, icon?: string } | undefined;
  searchSharedTeams: (searchTerm: string) => Promise<Team[]>;
  predefinedColors: string[];
}

const UserContext = createContext<UserContextType | null>(null);
const AUTH_COOKIE = 'agileflow-auth-user-id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [realUser, setRealUser] = useState<User | null>(null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [locations, setLocations] = useState<BookableLocation[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ pages: [], tabs: [] });
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allBadgeCollections, setAllBadgeCollections] = useState<BadgeCollection[]>([]);

  const { toast } = useToast();

  const loadUserAndData = useCallback(async (userId: string) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);

    const userQuery = query(collection(firestore, 'users'), where('userId', '==', userId));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
        console.error(`No user found with userId: ${userId}`);
        return false;
    }
    
    const user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as User;

    if (!user) return false;

    setRealUser(user);
    if (!users.find(u => u.userId === userId)) {
      setUsers(currentUsers => [...currentUsers, user]);
    }
    
    // Fetch all data from firestore
    const [teamsSnap, calendarsSnap, locationsSnap, badgesSnap, collectionsSnap, appSettingsSnap] = await Promise.all([
      getDocs(collection(firestore, 'teams')),
      getDocs(collection(firestore, 'calendars')),
      getDocs(collection(firestore, 'locations')),
      getDocs(collection(firestore, 'badges')),
      getDocs(collection(firestore, 'badgeCollections')),
      getDoc(doc(firestore, 'app-settings', 'global')),
    ]);

    setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    setCalendars(calendarsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SharedCalendar)));
    setLocations(locationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BookableLocation)));
    setAllBadges(badgesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Badge)));
    setAllBadgeCollections(collectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BadgeCollection)));
    
    if (appSettingsSnap.exists()) {
        const settingsData = appSettingsSnap.data() as AppSettings;
        const corePageIds = new Set(corePages.map(p => p.id));
        const dynamicPages = settingsData.pages.filter(p => !corePageIds.has(p.id));
        const finalPages = [...corePages];
        const tasksIndex = corePages.findIndex(p => p.id === 'page-tasks');

        if (tasksIndex !== -1) {
            finalPages.splice(tasksIndex + 1, 0, ...dynamicPages);
        } else {
            finalPages.push(...dynamicPages);
        }

        setAppSettings({
            ...settingsData,
            pages: finalPages,
            tabs: [...coreTabs, ...settingsData.tabs],
        });
    }

    return true;
}, [users]);


  useEffect(() => {
    const checkAuth = async () => {
        setLoading(true);
        try {
            const storedUserId = localStorage.getItem(AUTH_COOKIE);
            if (storedUserId) {
                await loadUserAndData(storedUserId);
            }
        } catch (error) {
            console.error("Failed to load user data:", error);
            // Handle error case, e.g., clear session
            localStorage.removeItem(AUTH_COOKIE);
            setRealUser(null);
            setViewAsUserId(null);
        } finally {
            setLoading(false);
        }
    };
    checkAuth();
  }, [loadUserAndData]);

  const viewAsUser = useMemo(() => users.find(u => u.userId === viewAsUserId) || realUser, [users, viewAsUserId, realUser]);

  useEffect(() => {
    if (!viewAsUser) return;
    const modifier = viewAsUser.dragActivationKey || 'shift';

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.key) return;
        if (e.key.toLowerCase() === modifier) {
            setIsDragModifierPressed(true);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.key) return;
        if (e.key.toLowerCase() === modifier) {
            setIsDragModifierPressed(false);
        }
    };

    const handleWindowBlur = () => {
        setIsDragModifierPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
    };
  }, [viewAsUser]);

  const login = useCallback(async (email: string, pass: string, googleUser?: any): Promise<boolean> => {
    console.log("Attempting login with email:", email, "and pass:", pass);
    setLoading(true);
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    
    try {
        await simulateApi(500);
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        let userToLogin: User | null = null;
        if (!querySnapshot.empty) {
            userToLogin = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
        }

        if (pass === 'google-sso' && googleUser) {
          if (!userToLogin) {
              const newUser: User = {
                  userId: googleUser.uid,
                  displayName: googleUser.displayName || 'New User',
                  email: googleUser.email!,
                  avatarUrl: googleUser.photoURL || undefined,
                  isAdmin: false,
                  accountType: 'Full',
                  memberOfTeamIds: [],
                  roles: [],
                  googleCalendarLinked: false,
                  theme: 'light',
                  dragActivationKey: 'shift',
              };
              userToLogin = newUser;
              await addDoc(collection(firestore, 'users'), newUser);
          }
        } else if (!userToLogin) { // Standard email/password check
            throw new Error("Invalid credentials");
        }

        if (userToLogin) {
            localStorage.setItem(AUTH_COOKIE, userToLogin.userId);
            await loadUserAndData(userToLogin.userId);
            toast({ title: "Welcome back!" });
            return true;
        } else {
            throw new Error("User not found after login attempt or creation.");
        }

    } catch (error) {
        toast({ variant: 'destructive', title: 'Login Failed', description: (error as Error).message });
        console.error("Login failed:", error);
        return false;
    } finally {
      setLoading(false);
    }
}, [loadUserAndData, toast]);
  
  
  const logout = useCallback(async () => {
      localStorage.removeItem(AUTH_COOKIE);
      setRealUser(null);
      setViewAsUserId(null);
  }, []);

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
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, userData);
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  }, []);

  const addUser = useCallback(async (newUser: User) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await addDoc(collection(firestore, 'users'), newUser);
    setUsers(currentUsers => [...currentUsers, newUser]);
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await deleteDoc(doc(firestore, 'users', userId));
    setUsers(currentUsers => currentUsers.filter(u => u.userId !== userId));
  }, []);

  const addTeam = useCallback(async (teamData: Omit<Team, 'id'>) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const docRef = await addDoc(collection(firestore, 'teams'), teamData);
    const newTeam = { ...teamData, id: docRef.id };
    setTeams(current => [...current, newTeam]);
    toast({ title: 'Success', description: `Team "${newTeam.name}" has been created.` });
  }, [toast]);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const teamRef = doc(firestore, 'teams', teamId);
    await updateDoc(teamRef, teamData);
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } : t));
  }, []);

  const deleteTeam = useCallback(async (teamId: string, router: AppRouterInstance, pathname: string) => {
    if (!viewAsUser) return;
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await deleteDoc(doc(firestore, 'teams', teamId));

    const team = teams.find(t => t.id === teamId);
    const page = appSettings.pages.find(p => pathname.startsWith(p.path));

    setTeams(current => current.filter(t => t.id !== teamId));

    if (page && team) {
      const userHadAccess = hasAccess(viewAsUser, page);
      const originalMemberOf = viewAsUser.memberOfTeamIds;
      viewAsUser.memberOfTeamIds = originalMemberOf?.filter(id => id !== teamId);

      const userWillLoseAccess = userHadAccess && !hasAccess(viewAsUser, page);
      viewAsUser.memberOfTeamIds = originalMemberOf;

      if (userWillLoseAccess) {
        router.push('/dashboard/notifications');
      }
    }

    toast({ title: 'Success', description: `Team "${team?.name}" has been deleted.` });
  }, [appSettings, viewAsUser, toast, teams]);

  const reorderTeams = useCallback(async (reorderedTeams: Team[]) => {
      // In a real app, you might save the order to a user preference document.
      await simulateApi();
      setTeams([...reorderedTeams]);
  }, []);

  const addCalendar = useCallback(async (newCalendarData: Omit<SharedCalendar, 'id'>) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const docRef = await addDoc(collection(firestore, 'calendars'), newCalendarData);
    const newCalendar = { ...newCalendarData, id: docRef.id };
    setCalendars(current => [...current, newCalendar]);
  }, []);

  const updateCalendar = useCallback(async (calendarId: string, calendarData: Partial<SharedCalendar>) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await updateDoc(doc(firestore, 'calendars', calendarId), calendarData);
    setCalendars(current => current.map(c => (c.id === calendarId ? { ...c, ...calendarData } : c)));
  }, []);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    if (calendars.length <= 1) {
      toast({ variant: 'destructive', title: 'Cannot Delete Calendar', description: 'You cannot delete the last remaining calendar.' });
      return;
    }
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await deleteDoc(doc(firestore, 'calendars', calendarId));
    setCalendars(current => current.filter(c => c.id !== calendarId));
  }, [calendars.length, toast]);

  const fetchEvents = useCallback(async (start: Date, end: Date): Promise<Event[]> => {
    await simulateApi();
    const filteredEvents = mockEvents.filter(event => {
        const eventTime = event.startTime.getTime();
        return eventTime >= start.getTime() && eventTime < end.getTime();
    });
    return filteredEvents;
  }, []);

  const addEvent = useCallback(async (currentEvents: Event[], newEventData: Omit<Event, 'eventId'>) => {
    const event: Event = { ...newEventData, eventId: crypto.randomUUID() };
    await simulateApi();
    return [...currentEvents, event];
  }, []);

  const updateEvent = useCallback(async (currentEvents: Event[], eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => {
      await simulateApi();
      const updatedEvent = { ...currentEvents.find(e => e.eventId === eventId)!, ...eventData, lastUpdated: new Date() } as Event;
      return currentEvents.map(e => e.eventId === eventId ? updatedEvent : e);
  }, []);

  const deleteEvent = useCallback(async (currentEvents: Event[], eventId: string) => {
    await simulateApi();
    return currentEvents.filter(e => e.eventId !== eventId);
  }, []);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    await simulateApi();
    return mockTasks;
  }, []);

  const addTask = useCallback(async (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>): Promise<Task[]> => {
    await simulateApi();
    if (!realUser) throw new Error("User not found");
    const newTask: Task = {
      ...newTaskData,
      taskId: crypto.randomUUID(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      createdBy: realUser.userId,
    };
    return [newTask, ...currentTasks];
  }, [realUser]);

  const updateTask = useCallback(async (currentTasks: Task[], taskId: string, taskData: Partial<Task>): Promise<Task[]> => {
    await simulateApi();
    return currentTasks.map(task =>
      task.taskId === taskId ? { ...task, ...taskData, lastUpdated: new Date() } : task
    );
  }, []);

  const deleteTask = useCallback(async (currentTasks: Task[], taskId: string): Promise<Task[]> => {
    await simulateApi();
    return currentTasks.filter(task => task.taskId !== taskId);
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
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const settingsRef = doc(firestore, 'app-settings', 'global');
    await updateDoc(settingsRef, settings);
    setAppSettings(current => ({ ...current, ...settings }));
  }, []);

  const updateAppTab = useCallback(async (tabId: string, tabData: Partial<AppTab>) => {
     const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...tabData } : t);
     await updateAppSettings({ tabs: newTabs });
  }, [appSettings.tabs, updateAppSettings]);

  const addBadgeCollection = useCallback(async (owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const batch = writeBatch(firestore);

    const newCollectionId = crypto.randomUUID();
    let newBadges: Badge[] = [];
    let newCollection: BadgeCollection;
    const ownerContext: BadgeOwner = { type: 'user', id: owner.userId };

    if (sourceCollection) {
        newBadges = sourceCollection.badgeIds.map(bId => {
            const originalBadge = allBadges.find(b => b.id === bId);
            if (!originalBadge) return null;
            const newBadgeId = crypto.randomUUID();
            const newBadge = { ...originalBadge, id: newBadgeId, owner: ownerContext, ownerCollectionId: newCollectionId, name: `${originalBadge.name} (Copy)` };
            batch.set(doc(firestore, 'badges', newBadgeId), newBadge);
            return newBadge;
        }).filter((b): b is Badge => b !== null);

        newCollection = {
            ...JSON.parse(JSON.stringify(sourceCollection)),
            id: newCollectionId,
            name: `${sourceCollection.name} (Copy)`,
            owner: ownerContext,
            isShared: false,
            description: sourceCollection.description || '',
            badgeIds: newBadges.map(b => b.id)
        };
    } else {
        const newBadgeId = crypto.randomUUID();
        const newBadge: Badge = {
            id: newBadgeId,
            owner: ownerContext,
            ownerCollectionId: newCollectionId,
            name: `New Badge`,
            icon: 'star',
            color: '#64748B'
        };
        newBadges.push(newBadge);
        batch.set(doc(firestore, 'badges', newBadgeId), newBadge);
        newCollection = {
            id: newCollectionId,
            name: `New Collection`,
            owner: ownerContext,
            icon: 'category',
            color: '#64748B',
            viewMode: 'compact',
            badgeIds: [newBadgeId],
            applications: [],
            description: '',
            isShared: false
        };
    }
    batch.set(doc(firestore, 'badgeCollections', newCollectionId), newCollection);
    await batch.commit();

    setAllBadgeCollections(prev => [...prev, newCollection]);
    if (newBadges.length > 0) {
        setAllBadges(prev => [...prev, ...newBadges]);
    }
    toast({ title: 'Collection Added', description: `"${newCollection.name}" has been created.` });

  }, [allBadges, toast]);

  const updateBadgeCollection = useCallback(async (collectionId: string, data: Partial<BadgeCollection>, teamId?: string) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await updateDoc(doc(firestore, 'badgeCollections', collectionId), data);
    setAllBadgeCollections(current => current.map(c => (c.id === collectionId ? { ...c, ...data } : c)));
  }, []);

  const deleteBadgeCollection = useCallback(async (collectionId: string) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const batch = writeBatch(firestore);

    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;
    
    batch.delete(doc(firestore, 'badgeCollections', collectionId));

    const badgeIdsToDelete = allBadges
      .filter(b => b.ownerCollectionId === collectionId)
      .map(b => b.id);
      
    badgeIdsToDelete.forEach(badgeId => {
      batch.delete(doc(firestore, 'badges', badgeId));
    });

    await batch.commit();

    setAllBadgeCollections(current => current.filter(c => c.id !== collectionId));
    if (badgeIdsToDelete.length > 0) {
      setAllBadges(current => current.filter(b => !badgeIdsToDelete.includes(b.id)));
    }
  }, [allBadgeCollections, allBadges]);

  const addBadge = useCallback(async (collectionId: string, sourceBadge?: Badge) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const collection = allBadgeCollections.find(c => c.id === collectionId);
    if (!collection || !viewAsUser) return;

    if (collection.owner.id !== viewAsUser.userId) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: "You can only add badges to collections you own."});
        return;
    }

    const batch = writeBatch(firestore);
    let newBadge: Badge;

    if (sourceBadge) {
        newBadge = {
            id: crypto.randomUUID(),
            owner: { type: 'user', id: viewAsUser.userId },
            ownerCollectionId: collectionId,
            name: `${sourceBadge.name} (Copy)`,
            icon: sourceBadge.icon,
            color: sourceBadge.color,
            description: sourceBadge.description,
        };
    } else {
        newBadge = {
            id: crypto.randomUUID(),
            owner: collection.owner,
            ownerCollectionId: collectionId,
            name: `New Badge`,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)]
        };
    }
    
    batch.set(doc(firestore, 'badges', newBadge.id), newBadge);
    const newBadgeIds = [newBadge.id, ...collection.badgeIds];
    batch.update(doc(firestore, 'badgeCollections', collectionId), { badgeIds: newBadgeIds });
    
    await batch.commit();

    setAllBadges(prev => [...prev, newBadge]);
    setAllBadgeCollections(prevCollections =>
        prevCollections.map(c =>
            c.id === collectionId ? { ...c, badgeIds: newBadgeIds } : c
        )
    );
}, [allBadgeCollections, viewAsUser, toast]);

  const updateBadge = useCallback(async (badgeId: string, badgeData: Partial<Badge>) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await updateDoc(doc(firestore, 'badges', badgeId), badgeData);
    setAllBadges(current => current.map(b => b.id === badgeId ? { ...b, ...badgeData } : b));
  }, []);

  const deleteBadge = useCallback(async (badgeId: string, collectionId: string) => {
    if (!viewAsUser) return;
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    const badge = allBadges.find(b => b.id === badgeId);
    if (!badge) return;

    if (badge.owner.id === viewAsUser.userId) {
        await deleteDoc(doc(firestore, 'badges', badgeId));
        const batch = writeBatch(firestore);
        allBadgeCollections.forEach(c => {
            if (c.badgeIds.includes(badgeId)) {
                batch.update(doc(firestore, 'badgeCollections', c.id), {
                    badgeIds: c.badgeIds.filter(id => id !== badgeId)
                });
            }
        });
        await batch.commit();

        setAllBadges(current => current.filter(b => b.id !== badgeId));
        setAllBadgeCollections(current => current.map(c => ({...c, badgeIds: c.badgeIds.filter(id => id !== badgeId)})));
    } else {
        const collectionRef = doc(firestore, 'badgeCollections', collectionId);
        await updateDoc(collectionRef, {
            badgeIds: allBadgeCollections.find(c => c.id === collectionId)!.badgeIds.filter(id => id !== badgeId)
        });
        setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) } : c));
    }
    toast({ title: 'Badge removed' });
  }, [allBadges, viewAsUser, allBadgeCollections, toast]);

  const reorderBadges = useCallback(async (collectionId: string, badgeIds: string[]) => {
    const db = getFirebaseAppForTenant('default');
    const firestore = getFirestore(db);
    await updateDoc(doc(firestore, 'badgeCollections', collectionId), { badgeIds });
    setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, badgeIds } : c));
  }, []);

  const handleBadgeAssignment = useCallback(async (badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const currentRoles = new Set(member.roles || []);
    if (currentRoles.has(badge.id)) return; // Already has it

    const updatedRoles = [...currentRoles, badge.id];
    await updateUser(memberId, { roles: updatedRoles });
    toast({ title: "Badge Assigned", description: `"${badge.name}" assigned to ${member.displayName}.` });
  }, [users, updateUser, toast]);

  const handleBadgeUnassignment = useCallback(async (badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const updatedRoles = (member.roles || []).filter(roleId => roleId !== badge.id);
    await updateUser(memberId, { roles: updatedRoles });
    toast({ title: 'Badge Un-assigned', description: `"${badge.name}" removed from ${member.displayName}.`});
  }, [users, updateUser, toast]);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    await simulateApi(1000);
    await updateUser(userId, { googleCalendarLinked: true, accountType: 'Full' });
    toast({ title: "Success!", description: "Your Google Calendar has been successfully connected." });
  }, [updateUser, toast]);

  const searchSharedTeams = useCallback(async (searchTerm: string): Promise<Team[]> => {
    await simulateApi();
    // In a real app, this would query a database. For now, filter local state.
    return teams.filter(team => team.isShared && team.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [teams]);

  useEffect(() => {
    if (viewAsUser) {
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
    }
  }, [viewAsUser]);

  const contextValue = useMemo(() => ({
    realUser, viewAsUser, setViewAsUser: setViewAsUserId, login, logout, loading,
    isDragModifierPressed, holidays, users, teams, appSettings, calendars, locations, allBookableLocations, notifications, setNotifications, userStatusAssignments, setUserStatusAssignments,
    updateUser, addUser, deleteUser, addTeam, updateTeam, deleteTeam, reorderTeams, addCalendar, updateCalendar, deleteCalendar, fetchEvents, addEvent, updateEvent, deleteEvent, fetchTasks, addTask, updateTask, deleteTask, addLocation, deleteLocation,
    updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, predefinedColors,
    handleBadgeAssignment, handleBadgeUnassignment, linkGoogleCalendar, getPriorityDisplay, searchSharedTeams,
  }), [
    realUser, viewAsUser, login, logout, loading, isDragModifierPressed, holidays, users, teams, appSettings, calendars, locations, allBookableLocations, notifications, userStatusAssignments,
    updateUser, addUser, deleteUser, addTeam, updateTeam, deleteTeam, reorderTeams, addCalendar, updateCalendar, deleteCalendar, fetchEvents, addEvent, updateEvent, deleteEvent, fetchTasks, addTask, updateTask, deleteTask, addLocation, deleteLocation,
    updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges,
    handleBadgeAssignment, handleBadgeUnassignment, linkGoogleCalendar, getPriorityDisplay, searchSharedTeams
  ]);

  return (
    <UserContext.Provider value={contextValue}>
        {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
