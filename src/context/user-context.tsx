'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { type User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

interface UserContextType {
  realUser: User;
  viewAsUser: User;
  setViewAsUser: (userId: string) => void;
  users: User[];
}

const UserContext = createContext<UserContextType | null>(null);

const REAL_USER_ID = '1'; // Alice is the admin

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUserId, setViewAsUserId] = useState<string>(REAL_USER_ID);

  const realUser = useMemo(() => mockUsers.find(u => u.userId === REAL_USER_ID)!, []);
  const viewAsUser = useMemo(() => mockUsers.find(u => u.userId === viewAsUserId)!, [viewAsUserId]);

  if (!realUser || !viewAsUser) {
    // This should not happen with mock data
    return <div>Error: User not found</div>;
  }
  
  const value = {
    realUser,
    viewAsUser,
    setViewAsUser: setViewAsUserId,
    users: mockUsers,
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
