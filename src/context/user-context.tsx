
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

// --- Helper Functions ---
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// --- Context Definition ---
interface UserContextType {
  realUser: User | null;
  viewAsUser: (User & { isDragModifierPressed?: boolean }) | null;
  users: User[];
  teams: Team[];
  allBadges: Badge[];
  allBadgeCollections: BadgeCollection[];
  calendars: SharedCalendar[];
  holidays: Holiday[];
  locations: BookableLocation[];
  userStatusAssignments: Record<string, UserStatusAssignment[]>; // day-iso -> assignments
  allBookableLocations: BookableLocation[];
  appSettings: AppSettings | null;

  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  addTeam: (data: Partial<Omit<Team, 'id'>>) => Promise<void>;
  updateTeam: (teamId: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string, router: any, pathname: string) => Promise<void>;
  reorderTeams: (reorderedTeams: Team[]) => Promise<void>;
  
  addBadgeCollection: (user: User, sourceCollection?: BadgeCollection) => Promise<void>;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => Promise<void>;
  deleteBadgeCollection: (collectionId: string) => Promise<void>;
  reorderBadgeCollections: (reorderedCollections: BadgeCollection[]) => Promise<void>;
  
  addBadge: (collectionId: string, sourceBadge: Badge | undefined, user: User, unlinkSource?: boolean) => Promise<void>;
  updateBadge: (badgeId: string, data: Partial<Badge>) => Promise<void>;
  deleteBadge: (badgeId: string, ownerCollectionId: string) => Promise<void>;
  reorderBadges: (collectionId: string, newBadgeIds: string[]) => Promise<void>;
  handleBadgeAssignment: (badge: Badge, userId: string) => void;
  handleBadgeUnassignment: (badge: Badge, userId: string) => void;
  
  updatePage: (pageId: string, data: Partial<AppPage>) => Promise<void>;
  
  setViewAsUser: (userId: string | null) => void;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
  setAllBadgeCollections: React.Dispatch<React.SetStateAction<BadgeCollection[]>>;

  googleLogin: () => Promise<boolean>;
  linkGoogleCalendar: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  
  loading: boolean;
  isFirebaseReady: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allBadgeCollections, setAllBadgeCollections] = useState<BadgeCollection[]>([]);
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [locations, setLocations] = useState<BookableLocation[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDragModifierPressed, setIsDragModifierPressed] = useState(false);

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

    const collectionListeners = [
      { name: 'users', setter: setUsers, key: 'userId' },
      { name: 'teams', setter: setTeams, key: 'id' },
      { name: 'badges', setter: setAllBadges, key: 'id' },
      { name: 'badgeCollections', setter: setAllBadgeCollections, key: 'id' },
      { name: 'calendars', setter: setCalendars, key: 'id' },
      { name: 'locations', setter: setLocations, key: 'id' },
    ];
    
    const unsubscribes = collectionListeners.map(({ name, setter, key }) => {
      const q = query(collection(db, name), where('workspaceId', '==', workspaceId));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ [key]: doc.id, ...doc.data() }));
        setter(data as any);
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        toast({ variant: 'destructive', title: `Error loading ${name}` });
      });
    });

    const settingsRef = doc(db, 'app-settings', workspaceId);
    const settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data() as AppSettings);
      } else {
        console.warn('No app-settings document found for this workspace.');
        // Potentially create a default one here if needed
      }
    });
    unsubscribes.push(settingsUnsubscribe);

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDocUnsubscribe = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            setRealUser({ userId: docSnapshot.id, ...docSnapshot.data() } as User);
          } else {
            // New user logic
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
        unsubscribes.push(userDocUnsubscribe);
      } else {
        setRealUser(null);
        setUsers([]);
        setLoading(false);
      }
    });
    unsubscribes.push(authUnsubscribe);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isFirebaseReady, toast]);
  
  useEffect(() => {
    setViewAsUserId(realUser?.userId || null);
  }, [realUser]);

  const viewAsUser = useMemo(() => {
    if (!viewAsUserId || !realUser) return null;
    if (viewAsUserId === realUser.userId) return realUser;
    return users.find(u => u.userId === viewAsUserId) || null;
  }, [viewAsUserId, realUser, users]);
  
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, userData);
  }, []);

  const updatePage = useCallback(async (pageId: string, pageData: Partial<AppPage>) => {
      if(!viewAsUser) return;
      const db = getDb();
      const settingsRef = doc(db, 'app-settings', viewAsUser.workspaceId);
      const currentSettings = { ...appSettings };
      const pageIndex = currentSettings.pages?.findIndex(p => p.id === pageId);
      if (pageIndex !== -1 && currentSettings.pages) {
          currentSettings.pages[pageIndex] = { ...currentSettings.pages[pageIndex], ...pageData };
          await updateDoc(settingsRef, { pages: currentSettings.pages });
      }
  }, [appSettings, viewAsUser]);

  // Team Management
    const addTeam = useCallback(async (data: Partial<Omit<Team, 'id'>>) => {
        if (!viewAsUser) return;
        const db = getDb();
        const newTeam = {
            name: 'New Team',
            icon: 'group',
            color: '#888',
            members: [],
            ...data,
            owner: { type: 'user', id: viewAsUser.userId },
            workspaceId: viewAsUser.workspaceId,
        };
        await addDoc(collection(db, 'teams'), newTeam);
    }, [viewAsUser]);

    const updateTeam = useCallback(async (teamId: string, data: Partial<Team>) => {
        const db = getDb();
        await updateDoc(doc(db, 'teams', teamId), data);
    }, []);

    const deleteTeam = useCallback(async (teamId: string, router: any, pathname: string) => {
        const db = getDb();
        await deleteDoc(doc(db, 'teams', teamId));
        toast({ title: 'Team Deleted' });
        // If viewing the deleted team's page, navigate away
        if (pathname.includes(teamId)) {
            router.push('/dashboard/overview');
        }
    }, [toast]);
    
    const reorderTeams = useCallback(async (reorderedTeams: Team[]) => {
      // This is a UI-only operation for now as order isn't persisted in DB.
      // We update the local state to reflect the new order.
      setTeams(reorderedTeams);
      toast({ title: 'Teams reordered (local only)' });
    }, []);

    // Badge and Collection Management
    const addBadgeCollection = useCallback(async (user: User, sourceCollection?: BadgeCollection) => {
        if (!user) return;
        const db = getDb();
        const newCollection: Omit<BadgeCollection, 'id'> = {
            name: sourceCollection ? `${sourceCollection.name} (Copy)` : 'New Collection',
            icon: sourceCollection?.icon || 'style',
            color: sourceCollection?.color || '#888',
            owner: { type: 'user', id: user.userId },
            badgeIds: sourceCollection?.badgeIds || [],
            viewMode: sourceCollection?.viewMode || 'list',
            workspaceId: user.workspaceId,
            isShared: false,
        };
        await addDoc(collection(db, 'badgeCollections'), newCollection);
        toast({ title: 'Badge Collection Added' });
    }, [toast]);

    const updateBadgeCollection = useCallback(async (collectionId: string, data: Partial<BadgeCollection>) => {
        const db = getDb();
        await updateDoc(doc(db, 'badgeCollections', collectionId), data);
    }, []);

    const deleteBadgeCollection = useCallback(async (collectionId: string) => {
        const db = getDb();
        await deleteDoc(doc(db, 'badgeCollections', collectionId));
        toast({ title: 'Badge Collection Deleted' });
    }, [toast]);

    const reorderBadgeCollections = useCallback(async (reorderedCollections: BadgeCollection[]) => {
      // UI-only for now
      setAllBadgeCollections(reorderedCollections);
    }, []);

    const addBadge = useCallback(async (collectionId: string, sourceBadge: Badge | undefined, user: User, unlinkSource: boolean = false) => {
      if (!user) return;
      const db = getDb();
      const batch = writeBatch(db);
      
      const newBadgeData = {
        name: sourceBadge ? `${sourceBadge.name} (Copy)` : 'New Badge',
        icon: sourceBadge?.icon || 'new_releases',
        color: sourceBadge?.color || '#888',
        description: sourceBadge?.description || '',
        owner: { type: 'user', id: user.userId },
        workspaceId: user.workspaceId,
      };

      const newBadgeRef = doc(collection(db, 'badges'));
      batch.set(newBadgeRef, { ...newBadgeData, ownerCollectionId: collectionId });

      const collectionRef = doc(db, 'badgeCollections', collectionId);
      const collectionDoc = await getDoc(collectionRef);
      const currentBadgeIds = collectionDoc.data()?.badgeIds || [];
      batch.update(collectionRef, { badgeIds: [...currentBadgeIds, newBadgeRef.id] });

      if (unlinkSource && sourceBadge) {
        const sourceCollectionRef = doc(db, 'badgeCollections', sourceBadge.ownerCollectionId);
        const sourceCollectionDoc = await getDoc(sourceCollectionRef);
        const sourceBadgeIds = sourceCollectionDoc.data()?.badgeIds || [];
        batch.update(sourceCollectionRef, { badgeIds: sourceBadgeIds.filter((id: string) => id !== sourceBadge.id) });
      }

      await batch.commit();
      toast({ title: 'Badge Added' });
    }, [toast]);
    
    const updateBadge = useCallback(async (badgeId: string, data: Partial<Badge>) => {
        const db = getDb();
        await updateDoc(doc(db, 'badges', badgeId), data);
    }, []);

    const deleteBadge = useCallback(async (badgeId: string, ownerCollectionId: string) => {
      const db = getDb();
      const batch = writeBatch(db);
      
      // Remove badge document
      batch.delete(doc(db, 'badges', badgeId));

      // Remove from owner collection
      const ownerCollectionRef = doc(db, 'badgeCollections', ownerCollectionId);
      const ownerCollectionDoc = await getDoc(ownerCollectionRef);
      if (ownerCollectionDoc.exists()) {
          const ownerBadgeIds = ownerCollectionDoc.data().badgeIds || [];
          batch.update(ownerCollectionRef, { badgeIds: ownerBadgeIds.filter((id: string) => id !== badgeId) });
      }

      await batch.commit();
      toast({ title: 'Badge Deleted' });
    }, [toast]);
    
    const reorderBadges = useCallback(async (collectionId: string, newBadgeIds: string[]) => {
      const db = getDb();
      await updateDoc(doc(db, 'badgeCollections', collectionId), { badgeIds: newBadgeIds });
    }, []);
    
    const handleBadgeAssignment = useCallback(async (badge: Badge, userId: string) => {
      const db = getDb();
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userRoles = userDoc.data()?.roles || [];
      if (!userRoles.includes(badge.id)) {
        await updateDoc(userRef, { roles: [...userRoles, badge.id] });
        toast({title: 'Badge Assigned'});
      }
    }, [toast]);

    const handleBadgeUnassignment = useCallback(async (badge: Badge, userId: string) => {
      const db = getDb();
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userRoles = userDoc.data()?.roles || [];
      if (userRoles.includes(badge.id)) {
        await updateDoc(userRef, { roles: userRoles.filter((id: string) => id !== badge.id) });
        toast({title: 'Badge Unassigned'});
      }
    }, [toast]);


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
  
  const googleLogin = useCallback(async () => { /* ... */ return true; }, []);
  const linkGoogleCalendar = useCallback(async (user: User) => {
      document.cookie = `userId=${user.userId};path=/;max-age=300`;
      const popup = window.open('/api/auth/google/signin', 'auth', 'width=600,height=700');
      // Add logic to check popup status and refresh data
  }, []);
  const logout = useCallback(async () => { /* ... */ }, []);
  
  const contextValue = useMemo(() => {
    const enrichedViewAsUser = viewAsUser ? { ...viewAsUser, isDragModifierPressed } : null;

    return {
      realUser,
      viewAsUser: enrichedViewAsUser,
      users,
      teams,
      allBadges,
      allBadgeCollections,
      calendars,
      holidays,
      locations,
      userStatusAssignments,
      allBookableLocations: locations,
      appSettings,
      updateUser,
      addTeam,
      updateTeam,
      deleteTeam,
      reorderTeams,
      addBadgeCollection,
      updateBadgeCollection,
      deleteBadgeCollection,
      reorderBadgeCollections,
      addBadge,
      updateBadge,
      deleteBadge,
      reorderBadges,
      handleBadgeAssignment,
      handleBadgeUnassignment,
      updatePage,
      setViewAsUser: setViewAsUserId,
      setUserStatusAssignments,
      setAllBadgeCollections,
      googleLogin,
      linkGoogleCalendar,
      logout,
      loading,
      isFirebaseReady,
    };
  }, [
    realUser, viewAsUser, users, teams, allBadges, allBadgeCollections, calendars, holidays, locations, userStatusAssignments, appSettings,
    updateUser, addTeam, updateTeam, deleteTeam, reorderTeams,
    addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, reorderBadgeCollections,
    addBadge, updateBadge, deleteBadge, reorderBadges, handleBadgeAssignment, handleBadgeUnassignment,
    updatePage,
    googleLogin, linkGoogleCalendar, logout, loading, isFirebaseReady, isDragModifierPressed
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
