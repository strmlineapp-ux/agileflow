
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { type User, type BookableLocation } from '@/types';
import { db, auth } from '@/lib/firebase';
import { getOAuth2Client } from '@/lib/google-auth-service';

export function useAuth(initialUser?: User | null) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(true);
  const [currentWorkstation, setCurrentWorkstation] = useState<BookableLocation | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            setUser({ userId: userDoc.id, ...userDoc.data() } as User);
          } else {
            console.error(`User with UID ${firebaseUser.uid} is authenticated but has no user document.`);
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setCurrentWorkstation(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const googleLogin = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    try {
      await signInWithPopup(auth, provider);
      // Let the onAuthStateChanged listener handle the redirect and state update
      return true;
    } catch (error) {
      console.error("Google login failed", error);
      return false;
    }
  }, []);
  
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
    await signOut(auth);
    router.push('/');
  }, [router]);

  const selectWorkstation = useCallback(async (workstation: BookableLocation) => {
    setCurrentWorkstation(workstation);
    if (user) {
        const userDocRef = doc(db, 'users', user.userId);
        try {
            await updateDoc(userDocRef, { lastKnownWorkstationId: workstation.id });
        } catch(error) {
            console.error("Failed to update user's last known workstation", error);
        }
    }
  }, [user]);

  const reauthenticate = useCallback(async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const provider = new GoogleAuthProvider();
      try {
        await reauthenticateWithPopup(currentUser, provider);
        return true;
      } catch (error) {
        console.error("Re-authentication failed", error);
        await logout();
        return false;
      }
    }
    return false;
  }, [logout]);

  return {
    user,
    loading,
    googleLogin,
    logout,
    currentWorkstation,
    selectWorkstation,
    reauthenticate,
    linkGoogleCalendar,
  };
}

    