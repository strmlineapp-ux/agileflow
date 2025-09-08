
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser, type OAuthCredential } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, limit, updateDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User, type Workspace } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from './use-toast';
import { systemPages, coreTabs } from '@/lib/core-data';
import { saveCredentials } from '@/lib/google-auth-service';
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
              // The onSnapshot listener will now set the realUser state.

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
            await linkGoogleCalendar(result.user, credential);
        }
        router.push('/dashboard/overview'); // Redirect after successful login
        return true;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In failed:", error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
        }
        return false;
    }
  }, [isFirebaseReady, toast, router]);

  const linkGoogleCalendar = useCallback(async (firebaseUser: FirebaseUser, credential?: OAuthCredential | null) => {
    if (!firebaseUser) return;
    const db = getDb();
    const userRef = doc(db, 'users', firebaseUser.uid);
    const finalCredential = credential || GoogleAuthProvider.credentialFromError({ code: 'auth/requires-recent-login' });
    if(finalCredential) {
        await saveCredentials(firebaseUser.uid, finalCredential);
        await updateDoc(userRef, { googleCalendarLinked: true });
        setRealUser(prev => prev ? { ...prev, googleCalendarLinked: true } : null);
        toast({ title: 'Success', description: 'Google Calendar connected.' });
    }
  }, [toast]);

  const logout = useCallback(async () => {
    if (!isFirebaseReady) return;
    const authInstance = getAuthInstance();
    try {
      await signOut(authInstance);
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ variant: 'destructive', title: 'Logout Error', description: 'Could not sign out. Please try again.' });
    }
  }, [isFirebaseReady, toast]);

  return { realUser, users, loading, isFirebaseReady, googleLogin, logout, setRealUser, linkGoogleCalendar };
}
