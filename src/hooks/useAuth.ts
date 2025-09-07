
'use client';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User as FirebaseUser, type OAuthCredential, getRedirectResult, linkWithRedirect } from 'firebase/auth';
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
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const db = getDb();
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            let userDoc = await getDoc(userDocRef);
            let userData: User;

            if (!userDoc.exists()) {
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

                userData = {
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
                    modifierKey: 'shift',
                    createdAt: new Date(),
                    workspaceId,
                };
                
                if (approvedByValue) {
                    userData.approvedBy = approvedByValue;
                }

                await setDoc(userDocRef, userData);
                
                // If it's the first user, also create the workspace and app-settings
                if (isFirstUserOfWorkspace) {
                    const batch = writeBatch(db);
                    const workspaceDocRef = doc(db, 'workspaces', workspaceId);
                    const emailDomain = firebaseUser.email!.split('@')[1];
                    let companyName = "Workspace";

                    if (!COMMON_EMAIL_DOMAINS.has(emailDomain)) {
                        const domainName = emailDomain.split('.')[0];
                        companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
                    }
                    const newWorkspace: Workspace = { id: workspaceId, name: companyName, ownerId: firebaseUser.uid, createdAt: new Date() };
                    batch.set(workspaceDocRef, newWorkspace);

                    const appSettingsRef = doc(db, 'app-settings', workspaceId);
                    const newAppSettings = {
                        pages: systemPages.map(p => ({...p, workspaceId})),
                        tabs: coreTabs.map(t => ({...t, workspaceId})),
                        workspaceId,
                    };
                    batch.set(appSettingsRef, newAppSettings);
                    await batch.commit();
                }
            } else {
                const existingData = userDoc.data();
                userData = {
                    ...existingData,
                    userId: userDoc.id,
                    createdAt: existingData.createdAt?.toDate ? existingData.createdAt.toDate() : new Date(),
                } as User;
            }

            // Check for redirect result to get calendar credentials
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    if (credential) {
                        await saveCredentials(firebaseUser.uid, credential);
                        if (!userData.googleCalendarLinked) {
                            userData.googleCalendarLinked = true;
                            await updateDoc(userDocRef, { googleCalendarLinked: true });
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting redirect result:", error);
            }

            setRealUser(userData);
        } else {
          setRealUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseReady]);

  const googleLogin = useCallback(async () => {
    if (!isFirebaseReady) {
      toast({ variant: "destructive", title: "Authentication service not ready."});
      return;
    }
    const authInstance = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    // Using linkWithRedirect for existing users or signInWithRedirect for new ones
    // will ensure the flow works correctly. For simplicity and robustness with popups,
    // signInWithPopup is often used, with getRedirectResult handling the credential return.
    // However, since we are having issues, let's stick to the popup and handle the result in the listener.
    try {
        await signInWithPopup(authInstance, provider);
        // The onAuthStateChanged listener will handle the result.
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In failed:", error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.' });
        }
    }
  }, [isFirebaseReady, toast]);

  const linkGoogleCalendar = useCallback(async (user: FirebaseUser) => {
    if (!isFirebaseReady) return;
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
        await linkWithRedirect(user, provider);
        // The result will be handled by the onAuthStateChanged listener on redirect
    } catch (error) {
        console.error("Failed to link with redirect:", error);
        toast({ variant: 'destructive', title: 'Error', description: "Could not initiate Google Calendar connection." });
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

  return { realUser, loading, isFirebaseReady, googleLogin, linkGoogleCalendar, logout, setRealUser };
}
