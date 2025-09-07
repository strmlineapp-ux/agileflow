

'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollection, type BadgeOwner, type Task, type Holiday, type Project, type AppPage, type PreApprovedEmail } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { useTheme } from 'next-themes';
import { arrayMove } from '@dnd-kit/sortable';
import { googleSymbolNames } from '@/lib/google-symbols';
import { predefinedColors } from '@/lib/colors';
import { adjustHslColor } from '@/lib/utils';

// --- Context Definition ---
interface UserContextType {
  // Session
  realUser: User | null;
  viewAsUser: User & { isDragModifierPressed?: boolean } | null;
  setViewAsUser: (userId: string) => void;
  googleLogin: () => Promise<boolean>;
  logout: (router: AppRouterInstance) => Promise<void>;
  loading: boolean;
  isFirebaseReady: boolean;

  // Data & Actions
  holidays: Holiday[];
  users: User[];
  teams: Team[];
  projects: Project[];
  appSettings: AppSettings;
  calendars: SharedCalendar[];
  locations: BookableLocation[];
  allBookableLocations: BookableLocation[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  preApprovedEmails: PreApprovedEmail[];
  addPreApprovedEmail: (email: string) => Promise<void>;
  removePreApprovedEmail: (email: string) => Promise<void>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  handleApproveAccessRequest: (notificationId: string, approved: boolean) => Promise<void>;

  // CRUD functions
  seedDatabase: () => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  addUser: (newUser: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  reorderUsers: (reorderedUsers: User[]) => Promise<void>;
  addTeam: (teamData: Partial<Omit<Team, 'id'>>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string, router: AppRouterInstance, pathname: string) => Promise<void>;
  reorderTeams: (teams: Team[]) => Promise<void>;
  addProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addCalendar: (newCalendar: Partial<Omit<SharedCalendar, 'id'>>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<SharedCalendar>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  reorderCalendars: (calendars: SharedCalendar[]) => Promise<void>;

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
  addPage: (pageData: Partial<AppPage>) => Promise<void>;
  updatePage: (pageId: string, pageData: Partial<AppPage>) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  reorderPages: (reorderedPages: AppPage[]) => Promise<void>;
  updateAppTab: (tabId: string, tabData: Partial<AppTab>) => Promise<void>;
  reorderTabs: (reorderedTabs: AppTab[]) => Promise<void>;

  // Badge and Collection Management
  allBadges: Badge[];
  allBadgeCollections: BadgeCollection[];
  setAllBadgeCollections: React.Dispatch<React.SetStateAction<BadgeCollection[]>>;
  addBadgeCollection: (owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => void;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => void;
  deleteBadgeCollection: (collectionId: string) => void;
  reorderBadgeCollections: (collections: BadgeCollection[]) => void;
  addBadge: (collectionId: string, sourceBadge?: Badge, unlinkSource?: boolean) => void;
  updateBadge: (badgeId: string, badgeData: Partial<Badge>) => Promise<void>;
  deleteBadge: (badgeId: string, collectionId: string) => void;
  reorderBadges: (collectionId: string, badgeIds: string[]) => void;
  handleBadgeAssignment: (badge: Badge, memberId: string) => void;
  handleBadgeUnassignment: (badge: Badge, memberId: string) => void;

  // Utilities
  searchSharedTeams: (searchTerm: string) => Promise<Team[]>;
  predefinedColors: string[];
}

const UserContext = createContext<UserContextType | null>(null);

const randomDescriptions = [
    "Manage project assets and timelines.",
    "Track team progress and upcoming deadlines.",
    "A space for creative collaboration.",
    "The central hub for all client-related information.",
    "Planning and execution of marketing campaigns.",
    "Development and testing for the new feature.",
];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { realUser, loading: authLoading, isFirebaseReady, googleLogin, logout } = useAuth();
  const dataHook = useData(realUser, authLoading);
  
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const { setTheme, theme: currentTheme } = useTheme();
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);

  const loading = authLoading || dataHook.loading;

  useEffect(() => {
    if (realUser && !viewAsUserId) {
      setViewAsUserId(realUser.userId);
    }
  }, [realUser, viewAsUserId]);

  const viewAsUser = useMemo(() => {
    if (!viewAsUserId) return realUser;
    return dataHook.users.find(u => u.userId === viewAsUserId) || realUser;
  }, [dataHook.users, viewAsUserId, realUser]);

  useEffect(() => {
    if (!viewAsUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        const key = viewAsUser.modifierKey || 'shift';
        if (e.key.toLowerCase() === key) {
            setIsDragModifierPressed(true);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        const key = viewAsUser.modifierKey || 'shift';
        if (e.key.toLowerCase() === key) {
            setIsDragModifierPressed(false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
}, [viewAsUser]);
  
  const addCalendarWithDefaults = useCallback(async (calendarData: Partial<Omit<SharedCalendar, 'id'>>) => {
    if (!realUser) return;
    
    const isDuplicating = !!calendarData.id;
    const newCalendarData = {
      name: isDuplicating ? `${calendarData.name} (Copy)` : 'New Calendar',
      icon: calendarData.icon || 'calendar_month',
      color: isDuplicating && calendarData.color ? adjustHslColor(calendarData.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: { type: 'user', id: realUser.userId },
      ...calendarData,
    };
    
    await dataHook.addCalendar(newCalendarData as Omit<SharedCalendar, 'id'>);
  }, [realUser, dataHook.addCalendar]);
  
  const contextValue = useMemo(() => {
    const setViewAsUserWithReset = (userId: string) => {
      if (userId === realUser?.userId) {
        setViewAsUserId(null); // Reset to real user
      } else {
        setViewAsUserId(userId);
      }
    };

    const addTeamWithUser = (teamData: Partial<Omit<Team, 'id'>>) => {
        if (!realUser) return;
        const isDuplicating = !!teamData.id;
        const newTeamData = {
            name: isDuplicating ? `${teamData.name} (Copy)` : 'New Team',
            icon: teamData.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: isDuplicating && teamData.color ? adjustHslColor(teamData.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
            owner: { type: 'user', id: realUser.userId },
            members: [realUser.userId],
            isShared: false,
            description: teamData.description || randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)],
            workspaceId: realUser.workspaceId,
            ...teamData,
        };
        dataHook.addTeam(newTeamData, realUser);
    };

    const deleteUserWithUser = (userId: string) => dataHook.deleteUser(userId, realUser!);
    const addProjectWithUser = (projectData: Partial<Project>) => dataHook.addProject(projectData, realUser!);
    const deleteTeamWithRouter = (teamId: string, router: AppRouterInstance, pathname: string) => dataHook.deleteTeam(teamId, router, pathname, realUser!);
    const handleApproveAccessRequestWithUser = (notificationId: string, approved: boolean) => dataHook.handleApproveAccessRequest(notificationId, approved, realUser!);
    
    const addBadgeCollectionWithUser = (owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => {
        dataHook.addBadgeCollection(owner, sourceCollection, contextTeam);
    };
    
    const addBadgeWithUser = (collectionId: string, sourceBadge?: Badge, unlinkSource: boolean = false) => {
        if (!realUser) return;
        dataHook.addBadge(collectionId, sourceBadge, realUser, unlinkSource);
    };

    const deleteBadgeWithUser = (badgeId: string, collectionId: string) => dataHook.deleteBadge(badgeId, collectionId, realUser!);
    const addTaskWithUser = (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => dataHook.addTask(currentTasks, newTaskData, realUser!);
    const addPreApprovedEmailWithUser = (email: string) => dataHook.addPreApprovedEmail(email, realUser!);

    const enrichedViewAsUser = viewAsUser ? { ...viewAsUser, isDragModifierPressed } : null;

    return {
      realUser,
      viewAsUser: enrichedViewAsUser,
      setViewAsUser: setViewAsUserWithReset,
      googleLogin,
      logout,
      loading,
      isFirebaseReady,
      ...dataHook,
      addBadgeCollection: addBadgeCollectionWithUser,
      addCalendar: addCalendarWithDefaults,
      addTeam: addTeamWithUser,
      deleteUser: deleteUserWithUser,
      addProject: addProjectWithUser,
      deleteTeam: deleteTeamWithRouter,
      handleApproveAccessRequest: handleApproveAccessRequestWithUser,
      addBadge: addBadgeWithUser,
      deleteBadge: deleteBadgeWithUser,
      addTask: addTaskWithUser,
      addPreApprovedEmail: addPreApprovedEmailWithUser,
    };
  }, [
    realUser, viewAsUser, googleLogin, logout, loading, isFirebaseReady, dataHook, addCalendarWithDefaults, isDragModifierPressed
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
