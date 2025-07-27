
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollection, type BadgeOwner, type Task, type Holiday } from '@/types';
import { mockUsers, mockCalendars, mockLocations, mockTeams, mockAppSettings, allMockBadgeCollections, videoProdBadges, liveEventsBadges, pScaleBadges, starRatingBadges, effortBadges, mockHolidays } from '@/lib/mock-data';
import { GoogleAuthProvider, getAuth, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { hexToHsl } from '@/lib/utils';
import { hasAccess, getOwnershipContext } from '@/lib/permissions';
import { googleSymbolNames } from '@/lib/google-symbols';
import { corePages, coreTabs } from '@/lib/core-data';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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
  login: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
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
      await simulateApi(100);
      
      const user = mockUsers.find(u => u.userId === userId);
      if (!user) return false;

      setRealUser(user);
      setViewAsUserId(user.userId);
      
      setUsers(mockUsers);
      setTeams(mockTeams);
      setCalendars(mockCalendars);
      setLocations(mockLocations);
      setHolidays(mockHolidays);

      const badgesMap = new Map<string, Badge>();
      [...videoProdBadges, ...liveEventsBadges, ...pScaleBadges, ...starRatingBadges, ...effortBadges].forEach(badge => {
          if (badge && !badgesMap.has(badge.id)) {
              badgesMap.set(badge.id, badge);
          }
      });
      setAllBadges(Array.from(badgesMap.values()).filter(Boolean));
      setAllBadgeCollections(allMockBadgeCollections);
      
      // Correctly combine core and dynamic pages
      const corePageIds = new Set(corePages.map(p => p.id));
      const dynamicPages = mockAppSettings.pages.filter(p => !corePageIds.has(p.id));
      const finalPages = [...corePages];
      const tasksIndex = corePages.findIndex(p => p.id === 'page-tasks');
      if (tasksIndex !== -1) {
          finalPages.splice(tasksIndex + 1, 0, ...dynamicPages);
      } else {
          finalPages.push(...dynamicPages);
      }
      setAppSettings({
        pages: finalPages,
        tabs: [...coreTabs, ...mockAppSettings.tabs],
      });
      
      return true;
  }, []);
  
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

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
      setLoading(true);
      try {
          await simulateApi(500);
          const user = mockUsers.find(u => u.email === email);
          if (user) {
              localStorage.setItem(AUTH_COOKIE, user.userId);
              await loadUserAndData(user.userId);
              toast({ title: "Welcome back!" });
              return true;
          }
          throw new Error("Invalid credentials");
      } catch (error) {
          toast({ variant: 'destructive', title: 'Login Failed', description: (error as Error).message });
          return false;
      } finally {
        setLoading(false);
      }
  }, [loadUserAndData, toast]);
  
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
      setLoading(true);
      try {
          await simulateApi(500);
          const user = mockUsers.find(u => u.userId === '1');
          if (user) {
              localStorage.setItem(AUTH_COOKIE, user.userId);
              await loadUserAndData(user.userId);
              toast({ title: "Welcome back!" });
              return true;
          }
          throw new Error("Google sign-in failed.");
      } catch (error) {
          toast({ variant: 'destructive', title: 'Login Failed', description: (error as Error).message });
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
    await simulateApi();
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  }, []);

  const addUser = useCallback(async (newUser: User) => {
    await simulateApi();
    setUsers(currentUsers => [...currentUsers, newUser]);
  }, []);
  
  const deleteUser = useCallback(async (userId: string) => {
      await simulateApi();
      setUsers(currentUsers => currentUsers.filter(u => u.userId !== userId));
  }, []);

  const addTeam = useCallback(async (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = { ...teamData, id: crypto.randomUUID() };
    await simulateApi();
    setTeams(current => [...current, newTeam]);
    toast({ title: 'Success', description: `Team "${newTeam.name}" has been created.` });
  }, [toast]);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    await simulateApi();
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } : t));
  }, []);

  const deleteTeam = useCallback(async (teamId: string, router: AppRouterInstance, pathname: string) => {
    await simulateApi();
     if (!viewAsUser) return;
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
  }, [appSettings, viewAsUser, toast, teams, setTeams]);

  const reorderTeams = useCallback(async (reorderedTeams: Team[]) => {
      await simulateApi();
      setTeams([...reorderedTeams]);
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

  const fetchEvents = useCallback(async (start: Date, end: Date): Promise<Event[]> => {
    await simulateApi(); 
    const { mockEvents } = await import('@/lib/mock-data');
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
    const { mockTasks } = await import('@/lib/mock-data');
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
    await simulateApi();
    setAppSettings(current => ({ ...current, ...settings }));
  }, []);

  const updateAppTab = useCallback(async (tabId: string, tabData: Partial<AppTab>) => {
    await simulateApi();
    setAppSettings(current => ({ ...current, tabs: current.tabs.map(t => t.id === tabId ? { ...t, ...tabData } : t) }));
  }, []);

  const addBadgeCollection = useCallback((owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => {
    const newCollectionId = crypto.randomUUID();
    let newBadges: Badge[] = [];
    let newCollection: BadgeCollection;
    const ownerContext: BadgeOwner = { type: 'user', id: owner.userId };

    if (sourceCollection) {
        newBadges = sourceCollection.badgeIds.map(bId => {
            const originalBadge = allBadges.find(b => b.id === bId);
            if (!originalBadge) return null;
            const newBadgeId = crypto.randomUUID();
            return { ...originalBadge, id: newBadgeId, owner: ownerContext, ownerCollectionId: newCollectionId, name: `${originalBadge.name} (Copy)` };
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
    
    setAllBadgeCollections(prev => [...prev, newCollection]);
    if (newBadges.length > 0) {
        setAllBadges(prev => [...prev, ...newBadges]);
    }
    
    toast({ title: 'Collection Added', description: `"${newCollection.name}" has been created.` });

  }, [allBadges, toast]);

  const updateBadgeCollection = useCallback((collectionId: string, data: Partial<BadgeCollection>, teamId?: string) => {
    setAllBadgeCollections(current => current.map(c => (c.id === collectionId ? { ...c, ...data } : c)));
  }, []);


  const deleteBadgeCollection = useCallback((collectionId: string) => {
    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;

    const badgeIdsToDelete = allBadges
      .filter(b => b.ownerCollectionId === collectionId)
      .map(b => b.id);

    setAllBadgeCollections(current => current.filter(c => c.id !== collectionId));

    if (badgeIdsToDelete.length > 0) {
      setAllBadges(current => current.filter(b => !badgeIdsToDelete.includes(b.id)));
    }

  }, [allBadgeCollections, allBadges]);

  const addBadge = useCallback((collectionId: string, sourceBadge?: Badge) => {
    const collection = allBadgeCollections.find(c => c.id === collectionId);
    if (!collection || !viewAsUser) return;
    
    if (collection.owner.id !== viewAsUser.userId) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: "You can only add badges to collections you own."
        });
        return;
    }

    if (sourceBadge) {
        // If it's a duplication, create a new badge and add it.
        const newBadge: Badge = {
            id: crypto.randomUUID(),
            owner: { type: 'user', id: viewAsUser.userId },
            ownerCollectionId: collectionId,
            name: `${sourceBadge.name} (Copy)`,
            icon: sourceBadge.icon,
            color: sourceBadge.color,
            description: sourceBadge.description,
        };
        setAllBadges(prev => [...prev, newBadge]);
        setAllBadgeCollections(prevCollections =>
            prevCollections.map(c =>
                c.id === collectionId
                    ? { ...c, badgeIds: [newBadge.id, ...c.badgeIds] }
                    : c
            )
        );
    } else {
        // If it's a new badge from scratch
        const newBadge: Badge = {
            id: crypto.randomUUID(),
            owner: collection.owner,
            ownerCollectionId: collectionId,
            name: `New Badge`,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)]
        };
        setAllBadges(prev => [newBadge, ...prev]);
        setAllBadgeCollections(prevCollections =>
            prevCollections.map(c =>
                c.id === collectionId
                    ? { ...c, badgeIds: [newBadge.id, ...c.badgeIds] }
                    : c
            )
        );
    }
}, [allBadgeCollections, viewAsUser, toast]);

  const updateBadge = useCallback(async (badgeId: string, badgeData: Partial<Badge>) => {
    await simulateApi();
    setAllBadges(current => current.map(b => b.id === badgeId ? { ...b, ...badgeData } : b));
  }, []);

  const deleteBadge = useCallback((badgeId: string, collectionId: string) => {
    const badge = allBadges.find(b => b.id === badgeId);
    if (!badge) return;

    if (badge.owner.id === viewAsUser?.userId) {
        // If the user owns the badge, delete it from everywhere.
        setAllBadges(current => current.filter(b => b.id !== badgeId));
        setAllBadgeCollections(current => 
            current.map(c => ({
                ...c,
                badgeIds: c.badgeIds.filter(id => id !== badgeId)
            }))
        );
    } else {
        // If the user does not own the badge, just unlink it from this collection.
        setAllBadgeCollections(current => current.map(c => {
            if (c.id === collectionId) {
                return { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) };
            }
            return c;
        }));
    }
  }, [allBadges, viewAsUser]);
  
  const reorderBadges = useCallback((collectionId: string, badgeIds: string[]) => {
    setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, badgeIds } : c));
  }, []);

  const handleBadgeAssignment = useCallback((badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const currentRoles = new Set(member.roles || []);
    if (currentRoles.has(badge.id)) return; // Already has it

    const updatedRoles = [...currentRoles, badge.id];
    updateUser(memberId, { roles: updatedRoles });
    toast({ title: "Badge Assigned", description: `"${badge.name}" assigned to ${member.displayName}.` });
  }, [users, updateUser, toast]);

  const handleBadgeUnassignment = useCallback((badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const updatedRoles = (member.roles || []).filter(roleId => roleId !== badge.id);
    updateUser(memberId, { roles: updatedRoles });
    toast({ title: 'Badge Un-assigned', description: `"${badge.name}" removed from ${member.displayName}.`});
  }, [users, updateUser, toast]);

  const linkGoogleCalendar = useCallback(async (userId: string) => {
    await simulateApi(1000);
    updateUser(userId, { googleCalendarLinked: true, accountType: 'Full' });
    toast({ title: "Success!", description: "Your Google Calendar has been successfully connected." });
  }, [updateUser, toast]);

  const searchSharedTeams = useCallback(async (searchTerm: string): Promise<Team[]> => {
    await simulateApi();
    return mockTeams.filter(team => team.isShared && team.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, []);

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
    realUser, viewAsUser, setViewAsUser: setViewAsUserId, login, signInWithGoogle, logout, loading,
    isDragModifierPressed, holidays, users, teams, appSettings, calendars, locations, allBookableLocations, notifications, setNotifications, userStatusAssignments, setUserStatusAssignments,
    updateUser, addUser, deleteUser, addTeam, updateTeam, deleteTeam, reorderTeams, addCalendar, updateCalendar, deleteCalendar, fetchEvents, addEvent, updateEvent, deleteEvent, fetchTasks, addTask, updateTask, deleteTask, addLocation, deleteLocation,
    updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, predefinedColors,
    handleBadgeAssignment, handleBadgeUnassignment, linkGoogleCalendar, getPriorityDisplay, searchSharedTeams,
  }), [
    realUser, viewAsUser, login, signInWithGoogle, logout, loading, isDragModifierPressed, holidays, users, teams, appSettings, calendars, locations, allBookableLocations, notifications, userStatusAssignments,
    updateUser, addUser, deleteUser, addTeam, updateTeam, deleteTeam, reorderTeams, addCalendar, updateCalendar, deleteCalendar, fetchEvents, addEvent, updateEvent, deleteEvent, fetchTasks, addTask, updateTask, deleteTask, addLocation, deleteLocation,
    updateAppSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, predefinedColors,
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
