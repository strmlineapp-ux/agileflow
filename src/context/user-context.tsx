
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { type User, type Notification, type UserStatusAssignment, type RoleCategories } from '@/types';
import { mockUsers as initialUsers, initialRoleCategories } from '@/lib/mock-data';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
  allRoles: string[];
  roleCategories: RoleCategories;
  updateRoleCategories: (newCategories: RoleCategories) => Promise<void>;
  extraCheckLocations: Record<string, string[]>;
  setExtraCheckLocations: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  addUser: (newUser: User) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  linkGoogleCalendar: (userId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roleCategories, setRoleCategories] = useState<RoleCategories>(initialRoleCategories);
  const [extraCheckLocations, setExtraCheckLocations] = useState<Record<string, string[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const { toast } = useToast();

  const allRoles = useMemo(() => {
    // Exclude system roles from the list of assignable roles
    const { System, ...assignableCategories } = roleCategories;
    return Object.values(assignableCategories).flat().sort();
  }, [roleCategories]);

  const realUser = useMemo(() => users.find(u => u.userId === REAL_USER_ID)!, [users]);
  const viewAsUser = useMemo(() => users.find(u => u.userId === viewAsUserId) || users.find(u => u.userId === REAL_USER_ID)!, [users, viewAsUserId]);

  const updateUser = async (userId: string, userData: Partial<User>) => {
    // In a real app, this would be an API call to your backend
    console.log(`Updating user ${userId}:`, userData);
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  };

  const addUser = async (newUser: User) => {
    // In a real app, this would be an API call to your backend
    console.log('Adding new user:', newUser);
    setUsers(currentUsers => [...currentUsers, newUser]);
  }

  const updateRoleCategories = async (newCategories: RoleCategories) => {
    console.log('Updating role categories:', newCategories);
    setRoleCategories(newCategories);
  };

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
    if (realUser.theme) {
      root.classList.add(realUser.theme);
    } else {
      root.classList.add('light'); // default
    }
  }, [realUser.theme]);

  if (!realUser || !viewAsUser) {
    // This should not happen with mock data
    return <div>Error: User not found</div>;
  }
  
  const value = {
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users,
    allRoles,
    roleCategories,
    updateRoleCategories,
    extraCheckLocations,
    setExtraCheckLocations,
    notifications,
    setNotifications,
    userStatusAssignments,
    setUserStatusAssignments,
    addUser,
    updateUser,
    linkGoogleCalendar,
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
