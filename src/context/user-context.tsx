
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { type User, type Team, type SharedCalendar, type BadgeCollection, type Badge, type Holiday, type BookableLocation, type AppSettings, type UserStatusAssignment, type Notification, type AppPage } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { googleSymbolNames } from '@/lib/google-symbols';
import { predefinedColors } from '@/lib/colors';

// --- Context Definition ---
interface UserContextType {
  realUser: User | null;
  viewAsUser: User;
  users: User[];
  teams: Team[];
  calendars: SharedCalendar[];
  allBadges: Badge[];
  allBadgeCollections: BadgeCollection[];
  holidays: Holiday[];
  locations: BookableLocation[];
  appSettings: AppSettings | null;
  userStatusAssignments: Record<string, UserStatusAssignment[]>;
  notifications: Notification[];
  loading: boolean;
  currentWorkstation: BookableLocation | null;

  googleLogin: () => Promise<boolean>;
  logout: () => void;
  reauthenticate: () => Promise<boolean>;
  selectWorkstation: (workstation: BookableLocation) => void;

  setViewAsUser: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  updatePage: (pageId: string, pageData: Partial<any>) => void;

  addTeam: (sourceTeam?: Team) => void;
  updateTeam: (teamId: string, data: Partial<Team>) => void;
  deleteTeam: (teamId: string, router: any, pathname: string) => void;
  reorderTeams: (reorderedTeams: Team[]) => void;

  addBadge: (collectionId: string, sourceBadge?: Badge, isLinked?: boolean) => void;
  updateBadge: (badgeId: string, data: Partial<Badge>) => void;
  deleteBadge: (badgeId: string, ownerCollectionId: string) => void;

  addBadgeCollection: (user: User, sourceCollection?: BadgeCollection) => void;
  updateBadgeCollection: (collectionId: string, data: Partial<BadgeCollection>) => void;
  deleteBadgeCollection: (collectionId: string) => void;
  reorderBadgeCollections: (reorderedCollections: BadgeCollection[]) => void;

  reorderBadges: (updates: { collectionId: string, badgeIds: string[] }[]) => void;
  setUserStatusAssignments: React.Dispatch<React.SetStateAction<Record<string, UserStatusAssignment[]>>>;
}

const UserContext = createContext<UserContextType | null>(null);

// --- Provider Component ---
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();

  const { user: realUser, loading: authLoading, googleLogin, logout, reauthenticate, currentWorkstation, selectWorkstation } = useAuth();
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allBadgeCollections, setAllBadgeCollections] = useState<BadgeCollection[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [locations, setLocations] = useState<BookableLocation[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (realUser) {
      setViewAsUserId(realUser.userId);
    } else {
      setViewAsUserId(null);
    }
  }, [realUser]);

  const viewAsUser = useMemo(() => {
    const userToView = users.find(u => u.userId === viewAsUserId);
    return userToView || realUser;
  }, [viewAsUserId, realUser, users]);

  useEffect(() => {
    if (!viewAsUser) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    const unsubscribers: (() => void)[] = [];

    const collectionsToFetch = [
        { name: 'users', setter: setUsers },
        { name: 'teams', setter: setTeams },
        { name: 'calendars', setter: setCalendars },
        { name: 'badges', setter: setAllBadges },
        { name: 'badgeCollections', setter: setAllBadgeCollections },
        { name: 'locations', setter: setLocations },
        { name: 'userStatusAssignments', setter: setUserStatusAssignments, isMap: true },
        { name: 'notifications', setter: setNotifications },
    ];

    collectionsToFetch.forEach(({ name, setter, isMap }) => {
        const q = query(collection(db, name), where('workspaceId', '==', viewAsUser.workspaceId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = isMap
                ? snapshot.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data()}), {})
                : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(data as any);
        });
        unsubscribers.push(unsubscribe);
    });

    const appSettingsRef = doc(db, 'app-settings', viewAsUser.workspaceId);
    const unsubscribeAppSettings = onSnapshot(appSettingsRef, (doc) => {
        setAppSettings(doc.exists() ? doc.data() as AppSettings : null);
    });
    unsubscribers.push(unsubscribeAppSettings);

    setIsDataLoading(false);

    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}, [viewAsUser?.workspaceId]);

  const setViewAsUser = (userId: string) => {
    const userToView = users.find(u => u.userId === userId);
    if(userToView && realUser?.isAdmin) {
      setViewAsUserId(userId);
      toast({ title: `Now viewing as ${userToView.displayName}` });
    } else if (userId === realUser?.userId) {
      setViewAsUserId(realUser.userId);
      toast({ title: `Returned to your view` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not switch user view.' });
    }
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, data);
      toast({ title: 'Success', description: 'User preferences updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };

  const updatePage = async (pageId: string, pageData: Partial<AppPage>) => {
      if(!viewAsUser) return;
      const pageDocRef = doc(db, 'app-settings', viewAsUser.workspaceId, 'pages', pageId);
      try {
        await updateDoc(pageDocRef, pageData);
        toast({ title: 'Success', description: 'Page updated.'});
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      }
  };

  const addTeam = async (sourceTeam?: Team) => {
    if (!viewAsUser) return;
    const newTeamData = {
        name: sourceTeam ? `${sourceTeam.name} (Copy)` : "New Team",
        icon: sourceTeam?.icon || 'group',
        color: sourceTeam?.color || predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
        owner: { type: 'user', id: viewAsUser.userId },
        workspaceId: viewAsUser.workspaceId,
        members: [viewAsUser.userId],
    };
    console.log("Adding new team:", newTeamData);
    toast({ title: 'Team Added', description: `"${newTeamData.name}" has been created.` });
  };

  const updateTeam = async (teamId: string, data: Partial<Team>) => {
    console.log(`Updating team ${teamId} with:`, data);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...data } : t));
  };

  const deleteTeam = async (teamId: string, router: any, pathname: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    if (pathname.includes(teamId)) {
        router.push('/dashboard/teams');
    }
    toast({ title: 'Team Deleted' });
  };

  const reorderTeams = (reorderedTeams: Team[]) => {
    setTeams(reorderedTeams);
  };

  const addBadge = (collectionId: string, sourceBadge?: Badge, isLinked: boolean = false) => {
    if (!viewAsUser) return;
    const newBadge = {
      id: `badge-${Date.now()}`,
      name: sourceBadge ? `${sourceBadge.name} (Copy)` : 'New Badge',
      icon: sourceBadge?.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
      color: sourceBadge?.color || predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: sourceBadge && isLinked ? sourceBadge.owner : { type: 'user', id: viewAsUser.userId },
      ownerCollectionId: sourceBadge && isLinked ? sourceBadge.ownerCollectionId : collectionId,
      workspaceId: viewAsUser.workspaceId,
    };

    setAllBadges(prev => [...prev, newBadge]);
    setAllBadgeCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, badgeIds: [...c.badgeIds, newBadge.id] } : c
    ));
    toast({ title: sourceBadge ? 'Badge Duplicated' : 'Badge Added' });
  };

  const updateBadge = (badgeId: string, data: Partial<Badge>) => {
    setAllBadges(prev => prev.map(b => b.id === badgeId ? { ...b, ...data } : b));
  };

  const deleteBadge = (badgeId: string, ownerCollectionId: string) => {
    setAllBadges(prev => prev.filter(b => b.id !== badgeId));
    setAllBadgeCollections(prev => prev.map(c =>
      c.id === ownerCollectionId ? { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) } : c
    ));
    toast({ title: 'Badge Deleted' });
  };

  const addBadgeCollection = (user: User, sourceCollection?: BadgeCollection) => {
    const newCollection = {
      id: `collection-${Date.now()}`,
      name: sourceCollection ? `${sourceCollection.name} (Copy)` : 'New Collection',
      icon: sourceCollection?.icon || 'category',
      color: sourceCollection?.color || predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: { type: 'user', id: user.userId },
      badgeIds: [],
      viewMode: 'compact' as const,
      workspaceId: user.workspaceId,
    };
    setAllBadgeCollections(prev => [...prev, newCollection]);
    toast({ title: sourceCollection ? 'Collection Duplicated' : 'Collection Added' });
  };

  const updateBadgeCollection = (collectionId: string, data: Partial<BadgeCollection>) => {
    setAllBadgeCollections(prev => prev.map(c => c.id === collectionId ? { ...c, ...data } : c));
  };

  const deleteBadgeCollection = (collectionId: string) => {
    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;

    const badgesToDelete = new Set(collectionToDelete.badgeIds.filter(badgeId => {
      const badge = allBadges.find(b => b.id === badgeId);
      return badge && badge.ownerCollectionId === collectionId;
    }));

    setAllBadges(prev => prev.filter(b => !badgesToDelete.has(b.id)));
    setAllBadgeCollections(prev => prev.filter(c => c.id !== collectionId));
    toast({ title: 'Collection Deleted' });
  };

  const reorderBadgeCollections = (reorderedCollections: BadgeCollection[]) => {
      setAllBadgeCollections(reorderedCollections);
  };

  const reorderBadges = (updates: { collectionId: string, badgeIds: string[] }[]) => {
    setAllBadgeCollections(prev => prev.map(collection => {
      const update = updates.find(u => u.collectionId === collection.id);
      return update ? { ...collection, badgeIds: update.badgeIds } : collection;
    }));
  };

  const contextValue = useMemo(() => ({
    realUser,
    viewAsUser,
    users,
    teams,
    calendars,
    allBadges,
    allBadgeCollections,
    holidays,
    locations,
    appSettings,
    userStatusAssignments,
    notifications,
    loading: authLoading || isDataLoading,
    currentWorkstation,
    googleLogin,
    logout,
    reauthenticate,
    selectWorkstation,
    setViewAsUser,
    updateUser,
    updatePage,
    addTeam,
    updateTeam,
    deleteTeam,
    reorderTeams,
    addBadge,
    updateBadge,
    deleteBadge,
    addBadgeCollection,
    updateBadgeCollection,
    deleteBadgeCollection,
    reorderBadgeCollections,
    reorderBadges,
    setUserStatusAssignments
  }), [
      realUser, viewAsUser, users, teams, calendars, allBadges, allBadgeCollections, holidays, locations, appSettings, userStatusAssignments, notifications, authLoading, isDataLoading, currentWorkstation,
      googleLogin, logout, reauthenticate, selectWorkstation, setViewAsUser, updateUser, updatePage, addTeam, updateTeam, deleteTeam, reorderTeams, addBadge, updateBadge, deleteBadge,
      addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, reorderBadgeCollections, reorderBadges, setUserStatusAssignments
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// --- Hook ---
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider. Make sure a parent component is providing the user context.');
  }
  return context;
}
