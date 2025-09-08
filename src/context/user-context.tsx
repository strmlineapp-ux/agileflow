
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User } from '@/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { GoogleSymbol } from '@/components/icons/google-symbol';

// --- Context Definition ---
interface UserContextType {
  // Session
  realUser: User;
  viewAsUser: User & { isDragModifierPressed?: boolean };
  users: User[];
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  setViewAsUser: (userId: string) => void;
  googleLogin: () => Promise<boolean>;
  logout: (router: AppRouterInstance) => Promise<void>;
  linkGoogleCalendar: (user: User) => Promise<void>;
  loading: boolean;
  isFirebaseReady: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { realUser, users, loading: authLoading, isFirebaseReady, googleLogin, logout, linkGoogleCalendar, setRealUser } = useAuth();
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);
  
  const loading = authLoading;

  useEffect(() => {
    if (realUser && !viewAsUserId) {
      setViewAsUserId(realUser.userId);
    }
  }, [realUser, viewAsUserId]);

  const viewAsUser = useMemo(() => {
    if (viewAsUserId === realUser?.userId) return realUser;
    return users.find(u => u.userId === viewAsUserId) || realUser;
  }, [viewAsUserId, realUser, users]);
  
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, userData);
    
    // If updating the real user, update the context state as well
    if (userId === realUser?.userId) {
      setRealUser(prev => prev ? { ...prev, ...userData } : null);
    }
  }, [realUser, setRealUser]);

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
  
  
  const contextValue = useMemo(() => {
    if (loading || !realUser || !viewAsUser) {
        return null; // Return null or a loading state representation
    }

    const setViewAsUserWithReset = (userId: string) => {
      if (userId === realUser?.userId) {
        setViewAsUserId(null); // Reset to real user
      } else {
        setViewAsUserId(userId);
      }
    };

    const enrichedViewAsUser = { ...viewAsUser, isDragModifierPressed };

    return {
      realUser,
      viewAsUser: enrichedViewAsUser,
      users,
      updateUser,
      setViewAsUser: setViewAsUserWithReset,
      googleLogin,
      logout,
      linkGoogleCalendar,
      loading,
      isFirebaseReady,
    };
  }, [
    realUser, viewAsUser, users, googleLogin, logout, loading, isFirebaseReady, isDragModifierPressed, updateUser, linkGoogleCalendar
  ]);
  
  if (loading || !contextValue) {
    // Render a loading state or nothing, but don't provide an incomplete context
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <GoogleSymbol name="progress_activity" className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

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
