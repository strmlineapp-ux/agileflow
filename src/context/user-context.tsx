
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { type User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { GoogleSymbol } from '@/components/icons/google-symbol';

// --- Context Definition ---
interface UserContextType {
  realUser: User | null;
  viewAsUser: (User & { isDragModifierPressed?: boolean }) | null;
  users: User[];
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  setViewAsUser: (userId: string | null) => void;
  googleLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
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
    // When the real user is available, set the view-as user to be the real user by default.
    // If the real user logs out (becomes null), reset the view-as user as well.
    if (realUser) {
      setViewAsUserId(realUser.userId);
    } else {
      setViewAsUserId(null);
    }
  }, [realUser]);

  const viewAsUser = useMemo(() => {
    if (!viewAsUserId || !realUser) return null;
    if (viewAsUserId === realUser.userId) return realUser;
    return users.find(u => u.userId === viewAsUserId) || null;
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

    const modifierKey = viewAsUser.modifierKey || 'shift';
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === modifierKey) {
            setIsDragModifierPressed(true);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === modifierKey) {
            setIsDragModifierPressed(false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewAsUser?.modifierKey]);
  
  
  const contextValue = useMemo(() => {
    const enrichedViewAsUser = viewAsUser ? { ...viewAsUser, isDragModifierPressed } : null;

    return {
      realUser,
      viewAsUser: enrichedViewAsUser,
      users,
      updateUser,
      setViewAsUser: setViewAsUserId,
      googleLogin,
      logout,
      linkGoogleCalendar,
      loading,
      isFirebaseReady,
    };
  }, [
    realUser, viewAsUser, users, googleLogin, logout, loading, isFirebaseReady, isDragModifierPressed, updateUser, linkGoogleCalendar
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
