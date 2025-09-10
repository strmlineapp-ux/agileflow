

'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, limit, onSnapshot, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { type User, type Team, type SharedCalendar, type Badge, type BadgeCollection, type Holiday, type BookableLocation, type UserStatusAssignment, type EventTemplate, type AppTab, type AppPage, type AdminGroup } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { systemPages, coreTabs } from '@/lib/core-data';
import { useRouter } from 'next/navigation';
import { GoogleSymbol } from '@/components/icons/google-symbol';

// --- Context Definition ---
interface UserContextType {
  realUser: User | null;
  viewAsUser: (User & { isDragModifierPressed?: boolean }) | null;
  calendars: SharedCalendar[];
  
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  
  setViewAsUser: (userId: string | null) => void;
  
  googleLogin: () => Promise<boolean>;
  linkGoogleCalendar: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  
  loading: boolean;
  isFirebaseReady: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);
  
  // This state is just to satisfy dependencies of components that haven't been refactored yet.
  // It will be removed as we migrate more components to use react-query.
  const [users, setUsers] = useState<User[]>([]);

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
    
    const workspaceId = getCurrentWorkspaceId();
    
    // --- AUTHENTICATION LISTENER ---
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const userDocUnsubscribe = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = { userId: docSnapshot.id, ...docSnapshot.data() } as User;
            setRealUser(userData);
            if (!viewAsUserId) {
              setViewAsUserId(userData.userId);
            }
          } else {
             try {
              const usersInWorkspaceQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId), limit(1));
              const preApprovedQuery = query(collection(db, 'pre-approved-emails'), where('email', '==', firebaseUser.email), where('workspaceId', '==', workspaceId));
              
              const [usersSnapshot, preApprovedSnapshot] = await Promise.all([
                getDocs(usersInWorkspaceQuery),
                getDocs(preApprovedQuery)
              ]);

              const isFirstUser = usersSnapshot.empty;
              const isPreApproved = !preApprovedSnapshot.empty;
              
              const newUser: User = {
                userId: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'New User',
                avatarUrl: firebaseUser.photoURL || '',
                isAdmin: isFirstUser,
                accountType: isFirstUser || isPreApproved ? 'Full' : 'Viewer',
                createdAt: new Date(),
                workspaceId,
                approvedBy: isFirstUser ? 'system' : (isPreApproved ? 'pre-approved' : ''),
                memberOfTeamIds: [],
                theme: 'light',
                defaultCalendarView: 'day',
                modifierKey: 'shift',
                primaryColor: '',
                easyBooking: false,
                timeFormat: '12h',
                googleCalendarLinked: false,
              };
              
              await setDoc(userRef, newUser);

              if (!isFirstUser && !isPreApproved) {
                 toast({
                  variant: 'default',
                  title: 'Account Pending Approval',
                  description: 'An administrator must approve your account before you can log in.',
                });
                await signOut(auth);
              }
            } catch (error: any) {
              console.error("CRITICAL: Failed during first-time user setup:", error);
              toast({ variant: 'destructive', title: 'Login Error', description: `A critical error occurred: ${error.message}` });
              await signOut(auth);
            }
          }
          setLoading(false);
        });

        // Setup listener for all users (needed for 'View As', etc.)
        const usersQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
        const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });
        
        // Setup listener for calendars (needed for event creation permissions)
        const calendarsQuery = query(collection(db, 'calendars'), where('workspaceId', '==', workspaceId));
        const calendarsUnsubscribe = onSnapshot(calendarsQuery, (snapshot) => {
            const calendarsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedCalendar));
            setCalendars(calendarsData);
        });
        
        return () => {
            userDocUnsubscribe();
            usersUnsubscribe();
            calendarsUnsubscribe();
        };

      } else {
        setRealUser(null);
        setUsers([]);
        setCalendars([]);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, [isFirebaseReady, toast, viewAsUserId]);
  
  const viewAsUser = useMemo(() => {
    if (!viewAsUserId || !realUser) return null;
    if (viewAsUserId === realUser.userId) {
        return { ...realUser, isDragModifierPressed };
    }
    const foundUser = users.find(u => u.userId === viewAsUserId);
    return foundUser ? { ...foundUser, isDragModifierPressed } : null;
  }, [viewAsUserId, realUser, users, isDragModifierPressed]);
  
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, userData);
  }, []);

  const googleLogin = useCallback(async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    try {
        await signInWithPopup(auth, provider);
        return true;
    } catch (error) {
        console.error("Error during Google Sign-In:", error);
        toast({ variant: 'destructive', title: 'Sign-In Failed' });
        return false;
    }
  }, [toast]);
  
  const linkGoogleCalendar = useCallback(async (userId: string) => {
      document.cookie = `userId=${userId};path=/;max-age=300`;
      const popup = window.open('/api/auth/google/signin', 'auth', 'width=600,height=700');
      // In a real app, you might poll the popup status or use a BroadcastChannel
      // to know when to refresh the user's data. For now, a manual refresh might be needed.
  }, []);
  
  const logout = useCallback(async () => {
    const auth = getAuthInstance();
    await signOut(auth);
    setRealUser(null);
    setViewAsUserId(null);
    router.push('/');
  }, [router]);
  
  useEffect(() => {
    if (!viewAsUser) return;
    const modifierKey = viewAsUser.modifierKey || 'shift';
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key.toLowerCase() === modifierKey) setIsDragModifierPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key.toLowerCase() === modifierKey) setIsDragModifierPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [viewAsUser?.modifierKey]);
  
  const contextValue = useMemo(() => ({
    realUser,
    viewAsUser,
    calendars,
    updateUser,
    setViewAsUser: setViewAsUserId,
    googleLogin,
    linkGoogleCalendar,
    logout,
    loading,
    isFirebaseReady,
  }), [
    realUser, viewAsUser, calendars,
    updateUser,
    googleLogin, linkGoogleCalendar, logout, loading, isFirebaseReady
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
