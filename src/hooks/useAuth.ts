
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, limit, updateDoc, writeBatch } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { type User, type Workspace } from '@/types';
import { getAuthInstance, getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { systemPages, coreTabs } from '../lib/core-data';

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

    const authInstance = getAuthInstance();
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (firebaseUser) {
            const db = getDb();
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = {
                    ...userDoc.data(),
                    userId: userDoc.id,
                    createdAt: userDoc.data().createdAt?.toDate ? userDoc.data().createdAt.toDate() : new Date(),
                } as User;

                setRealUser(userData);
            } else {
                const workspaceId = getCurrentWorkspaceId();
                const preApprovedQuery = query(collection(db, 'pre-approved-emails'), where('email', '==', firebaseUser.email!), where('workspaceId', '==', workspaceId));
                const preApprovedSnapshot = await getDocs(preApprovedQuery);
                const isPreApproved = !preApprovedSnapshot.empty;
                
                const usersCollectionRef = collection(db, 'users');
                const firstUserQuery = query(usersCollectionRef, where("workspaceId", "==", workspaceId), limit(1));
                const firstUserSnapshot = await getDocs(firstUserQuery);
                const isFirstUserOfWorkspace = firstUserSnapshot.empty;
                
                const isAdmin = isFirstUserOfWorkspace;
                const accountType = isFirstUserOfWorkspace || isPreApproved ? 'Full' : 'Viewer';
                const approvedByValue = isFirstUserOfWorkspace ? 'system' : (isPreApproved ? 'pre-approved' : undefined);
                
                const newUser: User = {
                    userId: firebaseUser.uid,
                    displayName: firebaseUser.displayName || 'New User',
                    email: firebaseUser.email!,
                    avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png`,
                    isAdmin,
                    accountType,
                    memberOfTeamIds: [],
                    roles: [],
                    googleApiAuthorized: false,
                    theme: 'light',
                    dragActivationKey: 'shift',
                    createdAt: new Date(),
                    workspaceId,
                };
                
                if (approvedByValue) {
                    newUser.approvedBy = approvedByValue;
                }
                
                const batch = writeBatch(db);
                batch.set(userDocRef, newUser);

                if (isFirstUserOfWorkspace) {
                    const workspaceDocRef = doc(db, 'workspaces', workspaceId);

                    const emailDomain = firebaseUser.email!.split('@')[1];
                    let companyName = "Workspace";

                    if (!COMMON_EMAIL_DOMAINS.has(emailDomain)) {
                        const domainName = emailDomain.split('.')[0];
                        companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
                    }

                    const newWorkspace: Workspace = {
                        id: workspaceId,
                        name: companyName,
                        ownerId: firebaseUser.uid,
                        createdAt: new Date(),
                    };
                    batch.set(workspaceDocRef, newWorkspace);

                    // Create workspace-specific app settings
                    const appSettingsRef = doc(db, 'app-settings', workspaceId);
                    const newAppSettings = {
                        pages: systemPages.map(p => ({...p, workspaceId})),
                        tabs: coreTabs.map(t => ({...t, workspaceId})),
                        workspaceId,
                    };
                    batch.set(appSettingsRef, newAppSettings);
                }
                
                await batch.commit();
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
    // Add the calendar scope to request permission at sign-in
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    try {
      await signInWithPopup(authInstance, provider);
      return true;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
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

  return { realUser, loading, isFirebaseReady, googleLogin, logout, setRealUser };
}
