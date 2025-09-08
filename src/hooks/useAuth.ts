
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser, type OAuthCredential } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, limit, updateDoc, writeBatch } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User, type Workspace } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { systemPages, coreTabs } from '@/lib/core-data';
import { saveCredentials } from '@/lib/google-auth-service';


const COMMON_EMAIL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com'
]);

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

    const auth = getAuthInstance();
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            // The useData hook will now handle creating/updating the user doc
            // and setting the realUser state. We just need to wait for it.
            setLoading(true);
        } else {
          setRealUser(null);
          setLoading(false);
        }
    });

    return () => unsubscribe();
  }, [isFirebaseReady]);

  const googleLogin = useCallback(async () => {
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Authentication service not ready."});
      return false;
    }
    const authInstance = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.setCustomParameters({ prompt: 'consent' });

    try {
        const result = await signInWithPopup(authInstance, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
            // The onAuthStateChanged listener will now pick up the new user
            // and the useData hook will handle the rest.
            await saveCredentials(result.user.uid, credential);
        }
        return true;
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In failed:", error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
        }
        return false;
    }
  }, [isFirebaseReady, toast]);


  const logout = useCallback(async (router: AppRouterInstance) => {
    if (!isFirebaseReady) return;
    const authInstance = getAuthInstance();
    try {
      await signOut(authInstance);
      setRealUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ variant: 'destructive', title: 'Logout Error', description: 'Could not sign out. Please try again.' });
    }
  }, [isFirebaseReady, toast]);

  // Pass setRealUser out so useData can update it
  return { realUser, loading, isFirebaseReady, googleLogin, logout, setRealUser };
}
