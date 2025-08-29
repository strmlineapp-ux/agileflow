

'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User } from '@/types';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { useToast } from './use-toast';

export function useAuth() {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();

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

    const authInstance = getAuthInstance();
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (firebaseUser) {
            const db = getDb();
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = { userId: userDoc.id, ...userDoc.data() } as User;
                setRealUser(userData);
            } else {
                // If user doc doesn't exist, check for pre-approval or first user status
                const appSettingsRef = doc(db, 'app-settings', 'global');
                const appSettingsDoc = await getDoc(appSettingsRef);
                const preApprovedEmails = appSettingsDoc.data()?.preApprovedEmails || [];
                const isPreApproved = preApprovedEmails.includes(firebaseUser.email!);
                
                const usersCollectionRef = collection(db, 'users');
                const firstUserQuery = query(usersCollectionRef, limit(1));
                const firstUserSnapshot = await getDocs(firstUserQuery);
                const isFirstUser = firstUserSnapshot.empty;
                
                const isAdmin = isFirstUser;
                const accountType = isFirstUser || isPreApproved ? 'Full' : 'Viewer';
                const approvedBy = isFirstUser ? 'system' : (isPreApproved ? 'pre-approved' : undefined);

                const newUser: User = {
                    userId: firebaseUser.uid,
                    displayName: firebaseUser.displayName || 'New User',
                    email: firebaseUser.email!,
                    avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png`,
                    isAdmin,
                    accountType,
                    memberOfTeamIds: [],
                    roles: [],
                    googleCalendarLinked: false,
                    theme: 'light',
                    dragActivationKey: 'shift',
                    createdAt: new Date(),
                    approvedBy
                };
                await setDoc(userDocRef, newUser);
                setRealUser(newUser);
            }
        } else {
            setRealUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseReady]);

  const googleLogin = useCallback(async () => {
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Authentication service not ready. Please try again in a moment."});
      return false;
    }
    
    const authInstance = getAuthInstance();
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(authInstance, provider);
      // The onAuthStateChanged listener will handle the user state update.
      return true;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
      return false;
    }
  }, [isFirebaseReady, toast]);

  const logout = useCallback(async () => {
    if (!isFirebaseReady) return;
    const authInstance = getAuthInstance();
    await signOut(authInstance);
    setRealUser(null);
  }, [isFirebaseReady]);

  return { realUser, loading, isFirebaseReady, googleLogin, logout, setRealUser };
}
