

'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollection, type BadgeOwner, type Task, type Holiday, type Project } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { useTheme } from 'next-themes';
import { hexToHsl } from '@/lib/utils';
import { arrayMove } from '@dnd-kit/sortable';

// --- Context Definition ---
interface UserContextType {
  // Session
  realUser: User | null;
  viewAsUser: User | null;
  setViewAsUser: (userId: string) => void;
  googleLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
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
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  handleApproveAccessRequest: (notificationId: string, approved: boolean) => Promise<void>;

  // CRUD functions
  seedDatabase: () => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  addUser: (newUser: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  reorderUsers: (reorderedUsers: User[]) => Promise<void>;
  addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string, router: AppRouterInstance, pathname: string) => Promise<void>;
  reorderTeams: (teams: Team[]) => Promise<void>;
  addProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addCalendar: (newCalendar: Omit<SharedCalendar, 'id'>) => Promise<void>;
  updateCalendar: (calendarId: string, calendarData: Partial<SharedCalendar>) => Promise<void>;
  deleteCalendar: (calendarId: string) => Promise<void>;
  reorderCalendars: (calendars: SharedCalendar[]) => Promise<void>;

  fetchEvents: (start: Date, end: Date) => Promise<Event[]>;
  addEvent: (currentEvents: Event[], newEventData: Omit<Event, 'eventId'>) => Promise<Event[]>;
  updateEvent: (currentEvents: Event[], eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => Promise<Event[]>;
  deleteEvent: (currentEvents: Event[], eventId: string) => Promise<Event[]>;

  fetchProjectEvents: (projectId: string, start: Date, end: Date) => Promise<Event[]>;
  addProjectEvent: (projectId: string, currentEvents: Event[], newEventData: Omit<Event, 'eventId'>) => Promise<Event[]>;
  updateProjectEvent: (projectId: string, currentEvents: Event[], eventId: string, eventData: Partial<Event>) => Promise<Event[]>;
  deleteProjectEvent: (projectId: string, currentEvents: Event[], eventId: string) => Promise<Event[]>;
  
  fetchTasks: () => Promise<Task[]>;
  addTask: (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => Promise<Task[]>;
  updateTask: (currentTasks: Task[], taskId: string, taskData: Partial<Task>) => Promise<Task[]>;
  deleteTask: (currentTasks: Task[], taskId: string) => Promise<Task[]>;

  addLocation: (locationName: string) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;

  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
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
  addBadge: (collectionId: string, sourceBadge?: Badge) => void;
  updateBadge: (badgeId: string, badgeData: Partial<Badge>) => Promise<void>;
  deleteBadge: (badgeId: string, collectionId: string) => void;
  reorderBadges: (collectionId: string, badgeIds: string[]) => void;
  handleBadgeAssignment: (badge: Badge, memberId: string) => void;
  handleBadgeUnassignment: (badge: Badge, memberId: string) => void;

  // Utilities
  linkGoogleCalendar: (userId: string) => Promise<void>;
  searchSharedTeams: (searchTerm: string) => Promise<Team[]>;
  predefinedColors: string[];
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { realUser, loading: authLoading, isFirebaseReady, googleLogin, logout } = useAuth();
  const dataHook = useData(realUser, authLoading);
  
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const { setTheme, theme: currentTheme } = useTheme();

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

  const contextValue = useMemo(() => {
    const setViewAsUserWithReset = (userId: string) => {
      if (userId === realUser?.userId) {
        setViewAsUserId(null); // Reset to real user
      } else {
        setViewAsUserId(userId);
      }
    };

    const addTeamWithUser = (teamData: Omit<Team, 'id'>) => dataHook.addTeam(teamData, realUser!);
    const deleteUserWithUser = (userId: string) => dataHook.deleteUser(userId, realUser!);
    const addProjectWithUser = (projectData: Partial<Project>) => dataHook.addProject(projectData, realUser!);
    const deleteTeamWithRouter = (teamId: string, router: AppRouterInstance, pathname: string) => dataHook.deleteTeam(teamId, router, pathname, realUser!);
    const handleApproveAccessRequestWithUser = (notificationId: string, approved: boolean) => dataHook.handleApproveAccessRequest(notificationId, approved, realUser!);
    const addBadgeWithUser = (collectionId: string, sourceBadge?: Badge) => dataHook.addBadge(collectionId, sourceBadge, realUser!);
    const deleteBadgeWithUser = (badgeId: string, collectionId: string) => dataHook.deleteBadge(badgeId, collectionId, realUser!);
    const addTaskWithUser = (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => dataHook.addTask(currentTasks, newTaskData, realUser!);
    const addProjectEventWithUser = (projectId: string, currentEvents: Event[], newEventData: Omit<Event, 'eventId'>) => dataHook.addProjectEvent(projectId, currentEvents, newEventData, realUser!);

    return {
      realUser,
      viewAsUser,
      setViewAsUser: setViewAsUserWithReset,
      googleLogin,
      logout,
      loading,
      isFirebaseReady,
      ...dataHook,
      addTeam: addTeamWithUser,
      deleteUser: deleteUserWithUser,
      addProject: addProjectWithUser,
      deleteTeam: deleteTeamWithRouter,
      handleApproveAccessRequest: handleApproveAccessRequestWithUser,
      addBadge: addBadgeWithUser,
      deleteBadge: deleteBadgeWithUser,
      addTask: addTaskWithUser,
      addProjectEvent: addProjectEventWithUser,
    };
  }, [
    realUser, viewAsUser, googleLogin, logout, loading, isFirebaseReady, dataHook
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
