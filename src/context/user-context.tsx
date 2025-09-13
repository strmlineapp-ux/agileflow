
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { type User, type BookableLocation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { getDb } from '@/lib/firebase';
import { updateDoc } from 'firebase/firestore';

interface UserContextType {
  realUser: User | null;
  viewAsUser: User | null;
  loading: boolean;
  
  googleLogin: () => Promise<boolean>;
  logout: () => void;
  reauthenticate: () => Promise<boolean>;
  linkGoogleCalendar: (userId: string) => void;

  setViewAsUser: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children, user: initialUser }: { children: React.ReactNode, user?: User | null }) {
  const [realUser, setRealUser] = useState<User | null>(initialUser || null);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(initialUser?.userId || null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const { toast } = useToast();
  const router = useRouter();

  // Effect for handling Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = { userId: userDoc.id, ...userDoc.data() } as User;
            setRealUser(userData);
            if (!viewAsUserId) { // Set initial view-as user only if not already set
                setViewAsUserId(userData.userId);
            }
          } else {
            // This can happen if the user document is not yet created or deleted
            console.warn(`User document for ${firebaseUser.uid} not found.`);
            setRealUser(null);
            setViewAsUserId(null);
          }
          setAuthLoading(false);
        });
        return () => userDocUnsubscribe();
      } else {
        setRealUser(null);
        setViewAsUserId(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [viewAsUserId]);

  // Effect for fetching all users once a workspace is known
  useEffect(() => {
    if (realUser?.workspaceId) {
      const usersQuery = collection(db, 'users');
      const q = query(usersQuery, where('workspaceId', '==', realUser.workspaceId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
        setAllUsers(usersData);
      });
      return () => unsubscribe();
    }
  }, [realUser?.workspaceId]);
  
  const viewAsUser = useMemo(() => {
    return allUsers.find(u => u.userId === viewAsUserId) || realUser;
  }, [viewAsUserId, realUser, allUsers]);

  const googleLogin = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the user state update
      router.push('/dashboard/overview');
      return true;
    } catch (error) {
      console.error("Google login failed", error);
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Could not sign in with Google.' });
      return false;
    }
  }, [router, toast]);
  
  const linkGoogleCalendar = useCallback(async (userId: string) => {
      const oAuth2Client = await getOAuth2Client();
      const state = JSON.stringify({ userId });

      const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar' // Read/write for full functionality
      ];
    
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: state,
      });

      // Open a popup for the OAuth flow
      const popup = window.open(authUrl, '_blank', 'width=500,height=600');
      // We can add a listener to check when the popup closes if needed
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setViewAsUserId(null);
      router.push('/');
    } catch (error) {
      console.error("Logout failed", error);
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not sign out.' });
    }
  }, [router, toast]);

  const reauthenticate = useCallback(async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const provider = new GoogleAuthProvider();
      try {
        await reauthenticateWithPopup(currentUser, provider);
        return true;
      } catch (error) {
        console.error("Re-authentication failed", error);
        await logout(); // Force logout on re-auth failure
        return false;
      }
    }
    return false;
  }, [logout]);
  
  const setViewAsUser = (userId: string) => {
    const userToView = allUsers.find(u => u.userId === userId);
    if (userToView && realUser?.isAdmin) {
      setViewAsUserId(userId);
      toast({ title: `Now viewing as ${userToView.displayName}` });
    } else if (userId === realUser?.userId) {
      setViewAsUserId(realUser.userId);
      toast({ title: 'Returned to your view' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not switch user view.' });
    }
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };

  const contextValue = useMemo(() => ({
    realUser,
    viewAsUser,
    loading: authLoading,
    users: allUsers,
    googleLogin,
    logout,
    reauthenticate,
    linkGoogleCalendar,
    setViewAsUser,
    updateUser,
  }), [realUser, viewAsUser, authLoading, allUsers, googleLogin, logout, reauthenticate, linkGoogleCalendar, setViewAsUser, updateUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider.');
  }
  return context;
}

    