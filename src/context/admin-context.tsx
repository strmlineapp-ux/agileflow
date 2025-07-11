
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User, type AppSettings, type AppTab, type Team } from '@/types';
import { mockUsers, mockAppSettings, mockTeams } from '@/lib/mock-data';

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

interface AdminContextType {
  loading: boolean;
  appSettings: AppSettings;
  users: User[];
  teams: Team[];
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateAppTab: (tabId: string, tabData: Partial<AppTab>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings>(mockAppSettings);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [teams, setTeams] = useState<Team[]>(mockTeams);

  useEffect(() => {
    // Simulate initial data loading for this specific context
    const timer = setTimeout(() => {
        setLoading(false);
    }, 50); 
    return () => clearTimeout(timer);
  }, []);

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
  
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    await simulateApi();
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  }, []);
  
  const value = useMemo(() => ({
    loading,
    appSettings,
    users,
    teams,
    updateAppSettings,
    updateAppTab,
    updateUser,
  }), [loading, appSettings, users, teams, updateAppSettings, updateAppTab, updateUser]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
