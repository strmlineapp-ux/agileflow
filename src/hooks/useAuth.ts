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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWorkstation, setCurrentWorkstation] = useState<BookableLocation | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
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
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard/overview');
      return true;
    } catch (error) {
      console.error("Google login failed", error);
      return false;
    }
  }, [router]);

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
  };
}
