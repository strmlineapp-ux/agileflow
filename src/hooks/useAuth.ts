
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from './use-toast';
import { systemPages, coreTabs } from '@/lib/core-data';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      getAuthInstance();
      setIsFirebaseReady(true);
    } catch (error) {
      console.error("Firebase initialization error in useAuth:", error);
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
            try {
              const workspaceId = getCurrentWorkspaceId();
              const usersInWorkspaceQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId), limit(1));
              const preApprovedQuery = query(collection(db, 'pre-approved-emails'), where('email', '==', firebaseUser.email), where('workspaceId', '==', workspaceId));
              
              const [usersSnapshot, preApprovedSnapshot] = await Promise.all([
                getDocs(usersInWorkspaceQuery),
                getDocs(preApprovedQuery)
              ]);

              const isFirstUser = usersSnapshot.empty;
              const isPreApproved = !preApprovedSnapshot.empty;

              if (isFirstUser || isPreApproved) {
                const newUser: User = {
                  userId: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || 'New User',
                  avatarUrl: firebaseUser.photoURL || '',
                  isAdmin: isFirstUser,
                  accountType: 'Full',
                  createdAt: new Date(),
                  workspaceId,
                  approvedBy: isFirstUser ? 'system' : 'pre-approved',
                  memberOfTeamIds: [],
                  theme: 'light',
                  defaultCalendarView: 'day',
                  modifierKey: 'shift',
                  primaryColor: '',
                  easyBooking: false,
                  timeFormat: '12-hour',
                  googleCalendarLinked: false,
                };
                
                await setDoc(userRef, newUser);

              } else {
                toast({
                  variant: 'default',
                  title: 'Account Pending Approval',
                  description: 'An administrator must approve your account before you can log in.',
                });
                await signOut(auth);
                setLoading(false);
              }
            } catch (error: any) {
              const errorMessage = error.message || 'An unknown error occurred.';
              console.error("CRITICAL: Failed during first-time user setup:", error);
              toast({
                variant: 'destructive',
                title: 'Login Error',
                description: `A critical error occurred: ${errorMessage}`,
                duration: 15000,
              });
              await signOut(auth);
              setLoading(false);
            }
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

  const linkGoogleCalendar = useCallback(async (user: User) => {
    document.cookie = `userId=${user.userId};path=/;max-age=300`;
    window.location.href = '/api/auth/google/signin';
  }, []);

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

  return { realUser, users, loading, isFirebaseReady, googleLogin, linkGoogleCalendar, logout, setRealUser };
}
