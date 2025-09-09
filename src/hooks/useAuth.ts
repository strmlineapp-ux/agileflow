
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, limit, updateDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User, type Workspace } from '@/types';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const db = getDb();
            const userRef = doc(db, 'users', firebaseUser.uid);
            
            const userDocUnsubscribe = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                setRealUser({ userId: doc.id, ...doc.data() } as User);
              }
              setLoading(false);
            });

            let userDoc = await getDoc(userRef);
            const workspaceId = getCurrentWorkspaceId();

            if (!userDoc.exists()) {
              const usersInWorkspaceQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId), limit(1));
              const isFirstUser = (await getDocs(usersInWorkspaceQuery)).empty;

              const preApprovedQuery = query(collection(db, 'pre-approved-emails'), where('email', '==', firebaseUser.email), where('workspaceId', '==', workspaceId));
              const isPreApproved = !(await getDocs(preApprovedQuery)).empty;

              const newUser: User = {
                userId: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'New User',
                avatarUrl: firebaseUser.photoURL || '',
                isAdmin: isFirstUser,
                accountType: (isFirstUser || isPreApproved) ? 'Full' : 'Viewer',
                googleCalendarLinked: false, // Will be updated after OAuth flow
                createdAt: new Date(),
                workspaceId,
              };
              
              await setDoc(userRef, newUser);

              if (isFirstUser) {
                const batch = writeBatch(db);
                const appSettingsRef = doc(db, 'app-settings', workspaceId);
                batch.set(appSettingsRef, { pages: systemPages, tabs: coreTabs, workspaceId });
                await batch.commit();
              }
            }

            const usersQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
            const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
              setUsers(snapshot.docs.map(d => ({...d.data(), userId: d.id} as User)));
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

    return () => unsubscribe();
  }, [isFirebaseReady, toast]);

  const googleLogin = useCallback(async () => {
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Authentication service not ready."});
      return false;
    }
    const authInstance = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        const result = await signInWithPopup(authInstance, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          // This will trigger the onAuthStateChanged listener which handles user setup
          router.push('/dashboard/overview');
          return true;
        }
        return false;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In failed:", error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
        }
        return false;
    }
  }, [isFirebaseReady, toast, router]);
  
  const linkGoogleCalendar = useCallback(async (user: User) => {
    // The user's ID is needed server-side to associate the tokens.
    // In a real app, you'd securely get this from the session cookie.
    // For this context, we'll set a temporary cookie.
    document.cookie = `userId=${user.userId};path=/;max-age=300`; // Expires in 5 minutes
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
