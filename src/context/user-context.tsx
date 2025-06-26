
'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { type User, type Notification } from '@/types';
import { mockUsers as initialUsers, mockRoles as initialRoles, mockNotifications as initialNotifications } from '@/lib/mock-data';

interface UserContextType {
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  allRoles: string[];
  setAllRoles: React.Dispatch<React.SetStateAction<string[]>>;
  extraCheckLocations: Record<string, string[]>;
  setExtraCheckLocations: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  ptoAssignments: Record<string, string[]>;
  setPtoAssignments: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [allRoles, setAllRoles] = useState<string[]>(initialRoles);
  const [extraCheckLocations, setExtraCheckLocations] = useState<Record<string, string[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [ptoAssignments, setPtoAssignments] = useState<Record<string, string[]>>({});


  const realUser = useMemo(() => users.find(u => u.userId === REAL_USER_ID)!, [users]);
  const viewAsUser = useMemo(() => users.find(u => u.userId === viewAsUserId) || users.find(u => u.userId === REAL_USER_ID)!, [users, viewAsUserId]);

  if (!realUser || !viewAsUser) {
    // This should not happen with mock data
    return <div>Error: User not found</div>;
  }
  
  const value = {
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users,
    setUsers,
    allRoles,
    setAllRoles,
    extraCheckLocations,
    setExtraCheckLocations,
    notifications,
    setNotifications,
    ptoAssignments,
    setPtoAssignments,
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
