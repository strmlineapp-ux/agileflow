
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { type User } from '@/types';
import { getClientAuth, getClientDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// --- Context Definition ---
interface UserContextType {
  realUser: User;
  // Kept for legacy components, but should be phased out.
  viewAsUser: User | null; 
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean; // This will now be false by default
}

const UserContext = createContext<UserContextType | null>(null);

// --- Provider Component ---

// The provider now accepts the server-fetched user as a prop.
export function UserProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const { toast } = useToast();
  const router = useRouter();

  // The 'realUser' is now initialized directly from the prop.
  // No more client-side fetching for the initial user data.
  const [realUser, setRealUser] = useState<User>(user);
  
  // The concept of a global 'loading' state is removed, as the initial load
  // is handled by the server component's Suspense boundary.
  const loading = false;

  // The `viewAsUser` logic can remain for now, but it's greatly simplified.
  // In a full refactor, this might be handled by URL state.
  const viewAsUser = useMemo(() => {
    return realUser; // Simplified: always view as the real user.
  }, [realUser]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    const db = getClientDb();
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, userData);
      // Optimistically update local state if the user is updating themselves
      if (userId === realUser.userId) {
        setRealUser(prevUser => ({ ...prevUser, ...userData }));
      }
      toast({ title: 'Success', description: 'User profile updated.' });
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [realUser?.userId, toast]);

  const logout = useCallback(async () => {
    const auth = getClientAuth();
    try {
      await signOut(auth);
      // Clear the auth cookie by calling a local API route
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  }, [router, toast]);

  const contextValue = useMemo(() => ({
    realUser,
    viewAsUser, // Kept for now
    updateUser,
    logout,
    loading,
  }), [realUser, viewAsUser, updateUser, logout, loading]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// --- Hook ---
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider. Make sure a parent component is providing the user context.');
  }
  return context;
}
