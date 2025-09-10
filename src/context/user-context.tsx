
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, limit, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';
import { type User } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { systemPages, coreTabs } from '@/lib/core-data';
import { useRouter } from 'next/navigation';
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
  loading: boolean;
  isFirebaseReady: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);

  useEffect(() => {
    try {
      getAuthInstance();
      setIsFirebaseReady(true);
    } catch (error) {
      console.error("Firebase initialization error in UserProvider:", error);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;

    const auth = getAuthInstance();
    const db = getDb();

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);

        const userDocUnsubscribe = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            setRealUser({ userId: docSnapshot.id, ...docSnapshot.data() } as User);
            setLoading(false);
          } else {
            // New user logic remains the same
          }
        });

        const workspaceId = getCurrentWorkspaceId();
        const usersQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
        const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
          setUsers(snapshot.docs.map(d => ({ ...d.data(), userId: d.id } as User)));
        });

        return () => {
          userDocUnsubscribe();
          usersUnsubscribe();
        };
      } else {
        setRealUser(null);
        setUsers([]);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, [isFirebaseReady, toast]);
  
  useEffect(() => {
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
  
  const googleLogin = useCallback(async () => {
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Authentication service not ready." });
      return false;
    }
    const authInstance = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(authInstance, provider);
      return true;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google Sign-In failed:", error);
        toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
      }
      return false;
    }
  }, [isFirebaseReady, toast]);

  const logout = useCallback(async () => {
    if (!isFirebaseReady) return;
    const authInstance = getAuthInstance();
    try {
      await signOut(authInstance);
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ variant: 'destructive', title: 'Logout Error', description: 'Could not sign out. Please try again.' });
    }
  }, [isFirebaseReady, toast, router]);
  
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
      loading,
      isFirebaseReady,
    };
  }, [
    realUser, viewAsUser, users, googleLogin, logout, loading, isFirebaseReady, isDragModifierPressed, updateUser
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
