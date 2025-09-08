
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, writeBatch, query, where, limit, Timestamp } from 'firebase/firestore';
import { getDb, getCurrentWorkspaceId } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { type User, type Notification, type UserStatusAssignment, type SharedCalendar, type Event, type BookableLocation, type Team, type AppSettings, type Badge, type AppTab, type BadgeCollection, type BadgeOwner, type Task, type Holiday, type Project, type AppPage, type PreApprovedEmail } from '@/types';
import { hasAccess } from '@/lib/permissions';
import { googleSymbolNames } from '@/lib/google-symbols';
import { systemPages, coreTabs } from '@/lib/core-data';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { adjustHslColor } from '@/lib/utils';
import { getAuth } from 'firebase/auth';

const COMMON_EMAIL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com'
]);

// Helper to simulate async operations
const simulateApi = (delay = 50) => new Promise(res => setTimeout(res, delay));

const predefinedColors = [
    'hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(45, 93%, 47%)', 'hsl(88, 62%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(160, 100%, 37%)',
    'hsl(174, 100%, 34%)', 'hsl(188, 95%, 43%)', 'hsl(207, 90%, 54%)', 'hsl(221, 83%, 61%)', 'hsl(244, 100%, 72%)', 'hsl(262, 88%, 66%)',
    'hsl(271, 91%, 65%)', 'hsl(328, 84%, 60%)', 'hsl(347, 89%, 61%)', 'hsl(358, 86%, 56%)'
];

const randomDescriptions = [
    "Manage project assets and timelines.",
    "Track team progress and upcoming deadlines.",
    "A space for creative collaboration.",
    "The central hub for all client-related information.",
    "Planning and execution of marketing campaigns.",
    "Development and testing for the new feature.",
];

export function useData(realUser: User | null, authLoading: boolean, setRealUser: (user: User | null) => void) {
  const [loading, setLoading] = useState(true);
  
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatusAssignments, setUserStatusAssignments] = useState<Record<string, UserStatusAssignment[]>>({});
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [locations, setLocations] = useState<BookableLocation[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ pages: [], tabs: [], workspaceId: 'default' });
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allBadgeCollections, setAllBadgeCollections] = useState<BadgeCollection[]>([]);
  const [preApprovedEmails, setPreApprovedEmails] = useState<PreApprovedEmail[]>([]);

  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (authLoading || !firebaseUser) {
            if (!authLoading) setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const db = getDb();
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            let userDoc = await getDoc(userDocRef);
            let currentUser: User;

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

                currentUser = {
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
                if (approvedByValue) currentUser.approvedBy = approvedByValue;
                await setDoc(userDocRef, currentUser);
                userDoc = await getDoc(userDocRef);
            }

            currentUser = { ...userDoc.data(), userId: userDoc.id } as User;
            setRealUser(currentUser);
            
            const workspaceId = currentUser.workspaceId;
            const [usersSnapshot, preApprovedEmailsSnap, appSettingsSnap] = await Promise.all([
                getDocs(query(collection(db, 'users'), where("workspaceId", "==", workspaceId))),
                getDocs(query(collection(db, 'pre-approved-emails'), where("workspaceId", "==", workspaceId))),
                getDoc(doc(db, 'app-settings', workspaceId)),
            ]);
            
            setUsers(usersSnapshot.docs.map(d => ({ ...d.data(), userId: d.id } as User)));
            setPreApprovedEmails(preApprovedEmailsSnap.docs.map(d => d.data() as PreApprovedEmail));

            if (appSettingsSnap.exists()) {
                setAppSettings(appSettingsSnap.data() as AppSettings);
            } else {
                const newAppSettings = {
                    tabs: coreTabs.map(t => ({...t, workspaceId})),
                    workspaceId,
                    pages: systemPages,
                };
                await setDoc(doc(db, 'app-settings', workspaceId), newAppSettings);
                setAppSettings(newAppSettings);
            }

        } catch (error) {
            console.error("Error loading essential data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to load application data." });
        } finally {
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, [authLoading, setRealUser, toast]);


  const allBookableLocations = useMemo(() => {
    const globalLocations = locations.map(l => ({ id: l.id, name: l.name }));
    const workstationLocations = teams.flatMap(team =>
        (team.workstations || []).map(wsName => ({
            id: `${team.id}-${wsName.toLowerCase().replace(/\s+/g, '-')}`,
            name: wsName,
        }))
    );
    const combined = [...globalLocations, ...workstationLocations];
    const uniqueNames = new Map();
    combined.forEach(loc => {
        if (!uniqueNames.has(loc.name)) {
            uniqueNames.set(loc.name, loc);
        }
    });
    return Array.from(uniqueNames.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [locations, teams]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    if (!realUser) return;
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    setUsers(currentUsers =>
      currentUsers.map(u => (u.userId === userId ? { ...u, ...userData } : u))
    );
  }, [realUser]);
  
  const reorderUsers = useCallback(async (reorderedUsers: User[]) => {
      await simulateApi();
      setUsers([...reorderedUsers]);
  }, []);
  
  const addPreApprovedEmail = useCallback(async (email: string) => {
    if (!realUser) return;
    if (preApprovedEmails.some(item => item.email === email)) {
        toast({ variant: 'destructive', title: 'Email already exists' });
        return;
    }
    const db = getDb();
    const newEmail: Omit<PreApprovedEmail, 'id'> = {
        email,
        invitedBy: realUser.userId,
        workspaceId: realUser.workspaceId,
        createdAt: new Date(),
    };
    await addDoc(collection(db, 'pre-approved-emails'), newEmail);
    setPreApprovedEmails(current => [...current, newEmail]);
  }, [preApprovedEmails, realUser, toast]);

  const removePreApprovedEmail = useCallback(async (email: string) => {
      if (!realUser) return;
      const db = getDb();
      const q = query(collection(db, 'pre-approved-emails'), where('email', '==', email), where('workspaceId', '==', realUser.workspaceId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
          const docToDelete = snapshot.docs[0];
          await deleteDoc(doc(db, 'pre-approved-emails', docToDelete.id));
          setPreApprovedEmails(current => current.filter(item => item.email !== email));
      }
  }, [realUser]);

  const handleApproveAccessRequest = useCallback(async (notificationId: string, approved: boolean) => {
    if (!realUser) return;
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || !notification.data) return;
    const userToUpdate = users.find(u => u.email === notification.data!.email);
    if (!userToUpdate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find user to update.' });
        return;
    }
    if (approved) {
        await updateUser(userToUpdate.userId, { accountType: 'Full', approvedBy: realUser.userId });
        toast({ title: 'User Approved', description: `${userToUpdate.displayName} has been granted access.` });
    } else {
        await deleteUser(userToUpdate.userId);
        toast({ title: 'User Rejected', description: `${userToUpdate.displayName}'s access request has been rejected.` });
    }
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, status: approved ? 'approved' : 'rejected' } : n));
  }, [notifications, users, updateUser, toast, realUser]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'users', userId));
    setUsers(currentUsers => currentUsers.filter(u => u.userId !== userId));
  }, [realUser]);

  const addTeam = useCallback(async (teamData: Partial<Omit<Team, 'id'>>): Promise<Team | null> => {
    if (!realUser) return null;
    const db = getDb();
    const isDuplicating = !!teamData.id;
    const newTeamData = {
      ...teamData,
      name: isDuplicating && teamData.name ? `${teamData.name} (Copy)` : 'New Team',
      icon: teamData.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
      color: isDuplicating && teamData.color ? adjustHslColor(teamData.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: { type: 'user', id: realUser.userId },
      members: teamData.members && teamData.members.length > 0 ? teamData.members : [realUser.userId],
      isShared: false,
      description: teamData.description || randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)],
      workspaceId: realUser.workspaceId,
    };
    const docRef = await addDoc(collection(db, 'teams'), newTeamData);
    const newTeam = { ...newTeamData, id: docRef.id };
    setTeams(current => [...current, newTeam]);
    toast({ title: 'Success', description: `Team "${newTeam.name}" has been created.` });
    return newTeam;
  }, [toast, realUser]);

  const updateTeam = useCallback(async (teamId: string, teamData: Partial<Team>) => {
    if (!realUser) return;
    const db = getDb();
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, teamData);
    setTeams(current => current.map(t => t.id === teamId ? { ...t, ...teamData } : t));
  }, [realUser]);

  const deleteTeam = useCallback(async (teamId: string, router: AppRouterInstance, pathname: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'teams', teamId));

    const team = teams.find(t => t.id === teamId);
    const page = appSettings.pages.find(p => pathname.startsWith(p.path));

    setTeams(current => current.filter(t => t.id !== teamId));

    if (page && team) {
      const userHadAccess = hasAccess(realUser, page);
      const originalMemberOf = realUser.memberOfTeamIds;
      realUser.memberOfTeamIds = originalMemberOf?.filter(id => id !== teamId);

      const userWillLoseAccess = userHadAccess && !hasAccess(realUser, page);
      realUser.memberOfTeamIds = originalMemberOf;

      if (userWillLoseAccess) {
        router.push('/dashboard/notifications');
      }
    }
    toast({ title: 'Success', description: `Team "${team?.name}" has been deleted.` });
  }, [appSettings, toast, teams, realUser]);

  const reorderTeams = useCallback(async (reorderedTeams: Team[]) => {
      await simulateApi();
      setTeams([...reorderedTeams]);
  }, []);
  
  const addProject = useCallback(async (projectData: Partial<Project>) => {
    if (!realUser) return;
    const db = getDb();
    const newProjectData = {
        name: 'New Project',
        icon: 'folder',
        color: 'hsl(220, 13%, 47%)',
        ...projectData,
        owner: { type: 'user', id: realUser.userId },
        isShared: false,
        workspaceId: realUser.workspaceId,
    };
    const docRef = await addDoc(collection(db, 'projects'), newProjectData);
    const newProject = { ...newProjectData, id: docRef.id };
    setProjects(current => [...current, newProject]);
    toast({ title: 'Project Created' });
  }, [toast, realUser]);

  const updateProject = useCallback(async (projectId: string, projectData: Partial<Project>) => {
    if (!realUser) return;
    const db = getDb();
    await updateDoc(doc(db, 'projects', projectId), projectData);
    setProjects(current => current.map(p => (p.id === projectId ? { ...p, ...projectData } : p)));
  }, [realUser]);
  
  const deleteProject = useCallback(async (projectId: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'projects', projectId));
    setProjects(current => current.filter(p => p.id !== projectId));
    toast({ title: 'Project Deleted' });
  }, [toast, realUser]);

  const addCalendar = useCallback(async (calendarData: Partial<Omit<SharedCalendar, 'id'>>): Promise<SharedCalendar | null> => {
    if (!realUser) return null;
    const isDuplicating = !!calendarData.id;
    const newCalendarData = {
      ...calendarData,
      name: isDuplicating && calendarData.name ? `${calendarData.name} (Copy)` : 'New Calendar',
      icon: calendarData.icon || 'calendar_month',
      color: isDuplicating && calendarData.color ? adjustHslColor(calendarData.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: { type: 'user', id: realUser.userId },
      workspaceId: realUser.workspaceId,
    };
    
    const db = getDb();
    const docRef = await addDoc(collection(db, 'calendars'), newCalendarData);
    const newCalendar = { ...newCalendarData, id: docRef.id };
    setCalendars(current => [...current, newCalendar]);
    return newCalendar;
  }, [realUser]);

  const updateCalendar = useCallback(async (calendarId: string, calendarData: Partial<SharedCalendar>) => {
    if (!realUser) return;
    const db = getDb();
    await updateDoc(doc(db, 'calendars', calendarId), calendarData);
    setCalendars(current => current.map(c => (c.id === calendarId ? { ...c, ...calendarData } : c)));
  }, [realUser]);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'calendars', calendarId));
    setCalendars(current => current.filter(c => c.id !== calendarId));
  }, [realUser]);
  
  const reorderCalendars = useCallback(async (reorderedCalendars: SharedCalendar[]) => {
      await simulateApi();
      setCalendars([...reorderedCalendars]);
  }, []);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    if (!realUser?.workspaceId) return [];
    const db = getDb();
    const tasksQuery = query(collection(db, 'tasks'), where("workspaceId", "==", realUser.workspaceId));
    const snapshot = await getDocs(tasksQuery);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        taskId: doc.id,
        dueDate: doc.data().dueDate.toDate(),
    } as Task));
  }, [realUser?.workspaceId]);

  const addTask = useCallback(async (currentTasks: Task[], newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>): Promise<Task[]> => {
    if (!realUser) throw new Error("User not found or Firebase not ready");
    const db = getDb();
    const newTaskWithMeta = {
      ...newTaskData,
      createdAt: new Date(),
      lastUpdated: new Date(),
      createdBy: realUser.userId,
      workspaceId: realUser.workspaceId,
    };
    const docRef = await addDoc(collection(db, 'tasks'), newTaskWithMeta);
    const newTask: Task = { ...newTaskWithMeta, taskId: docRef.id };
    return [newTask, ...currentTasks];
  }, [realUser]);

  const updateTask = useCallback(async (currentTasks: Task[], taskId: string, taskData: Partial<Task>): Promise<Task[]> => {
    const db = getDb();
    await updateDoc(doc(db, 'tasks', taskId), { ...taskData, lastUpdated: new Date() });
    return currentTasks.map(task =>
      task.taskId === taskId ? { ...task, ...taskData, lastUpdated: new Date() } : task
    );
  }, []);

  const deleteTask = useCallback(async (currentTasks: Task[], taskId: string): Promise<Task[]> => {
    const db = getDb();
    await deleteDoc(doc(db, 'tasks', taskId));
    return currentTasks.filter(task => task.taskId !== taskId);
  }, []);

  const addLocation = useCallback(async (locationName: string) => {
    if(!realUser) return;
    const db = getDb();
    const newLocationData = { name: locationName, workspaceId: realUser.workspaceId };
    const docRef = await addDoc(collection(db, 'locations'), newLocationData);
    const newLocation: BookableLocation = { ...newLocationData, id: docRef.id };
    setLocations(current => [...current, newLocation]);
  }, [realUser]);

  const deleteLocation = useCallback(async (locationId: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'locations', locationId));
    setLocations(current => current.filter(loc => loc.id !== locationId));
  }, [realUser]);

  const updateAppSettings = useCallback(async (settings: Partial<AppSettings>) => {
    if(!realUser) return;
    const db = getDb();
    const settingsRef = doc(db, 'app-settings', realUser.workspaceId);
    await updateDoc(settingsRef, settings);
    setAppSettings(current => ({ ...current, ...settings }));
  }, [realUser]);
  
  const addPage = useCallback(async (pageData: Partial<AppPage>) => {
    if (!realUser) return;
    const db = getDb();
    const newDocRef = doc(collection(db, 'pages'));

    const isDuplicating = !!pageData.id;
    const randomIcon = googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)];
    const randomDesc = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
    const pageName = isDuplicating ? `${pageData.name} (Copy)` : (pageData.name || "New Page");
    const slug = pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newPage: AppPage = {
      id: newDocRef.id,
      name: pageName,
      path: `/dashboard/${slug}-${newDocRef.id}`,
      icon: pageData.icon || randomIcon,
      color: pageData.color ? adjustHslColor(pageData.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      description: pageData.description || randomDesc,
      isDynamic: pageData.isDynamic || false,
      associatedTabs: pageData.associatedTabs || [],
      access: pageData.access || { users: [], teams: [] },
      owner: { type: 'user', id: realUser.userId },
      workspaceId: realUser.workspaceId,
      isSystemPage: false,
    };

    await setDoc(newDocRef, newPage);
    setAppSettings(current => ({...current, pages: [...current.pages, newPage]}));
  }, [realUser]);

  const updatePage = useCallback(async (pageId: string, pageData: Partial<AppPage>) => {
    const page = appSettings.pages.find(p => p.id === pageId);
    if (!page) return;

    if (!page.isSystemPage) {
        if (!realUser) return;
        const db = getDb();
        await updateDoc(doc(db, 'pages', pageId), pageData);
    }
    
    setAppSettings(current => ({ ...current, pages: current.pages.map(p => p.id === pageId ? { ...p, ...pageData } : p)}));
  }, [appSettings.pages, realUser]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!realUser) return;
    const db = getDb();
    await deleteDoc(doc(db, 'pages', pageId));
    setAppSettings(current => ({...current, pages: current.pages.filter(p => p.id !== pageId)}));
  }, [realUser]);
  
  const reorderPages = useCallback(async (reorderedPages: AppPage[]) => {
    const systemPageIds = new Set(systemPages.map(p => p.id));
    const userPages = reorderedPages.filter(p => !systemPageIds.has(p.id));
    const newPageOrder = [...systemPages, ...userPages];
    setAppSettings(current => ({ ...current, pages: newPageOrder }));
  }, []);

  const updateAppTab = useCallback(async (tabId: string, tabData: Partial<AppTab>) => {
    const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...tabData } : t);
    await updateAppSettings({ tabs: newTabs });
  }, [appSettings.tabs, updateAppSettings]);

  const reorderTabs = useCallback(async (reorderedTabs: AppTab[]) => {
      await updateAppSettings({ tabs: reorderedTabs });
  }, [updateAppSettings]);

  const addBadgeCollection = useCallback(async (owner: User, sourceCollection?: BadgeCollection, contextTeam?: Team) => {
    if (!realUser) return;
    const db = getDb();
    const batch = writeBatch(db);
    const workspaceId = owner.workspaceId;

    const newCollectionId = crypto.randomUUID();
    let newBadges: Badge[] = [];
    let newCollection: BadgeCollection;
    const ownerContext: BadgeOwner = { type: 'user', id: owner.userId };
    const isDuplicating = !!sourceCollection;

    if (isDuplicating) {
        newBadges = sourceCollection.badgeIds.map(bId => {
            const originalBadge = allBadges.find(b => b.id === bId);
            if (!originalBadge) return null;
            const newBadgeId = crypto.randomUUID();
            const newBadge = { 
                ...originalBadge, 
                id: newBadgeId, 
                owner: ownerContext, 
                ownerCollectionId: newCollectionId, 
                name: `${originalBadge.name} (Copy)`,
                color: adjustHslColor(originalBadge.color),
                workspaceId 
            };
            batch.set(doc(db, 'badges', newBadgeId), newBadge);
            return newBadge;
        }).filter((b): b is Badge => b !== null);

        newCollection = {
            ...JSON.parse(JSON.stringify(sourceCollection)),
            id: newCollectionId,
            name: `${sourceCollection.name} (Copy)`,
            color: adjustHslColor(sourceCollection.color),
            owner: ownerContext,
            isShared: false,
            description: sourceCollection.description || '',
            badgeIds: newBadges.map(b => b.id),
            workspaceId,
        };
    } else {
        const collectionColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
        const newBadge: Badge = {
            id: crypto.randomUUID(),
            owner: ownerContext,
            ownerCollectionId: newCollectionId,
            name: `New Badge`,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: adjustHslColor(collectionColor),
            workspaceId,
        };
        newBadges.push(newBadge);
        batch.set(doc(db, 'badges', newBadge.id), newBadge);
        newCollection = {
            id: newCollectionId,
            name: `New Collection`,
            owner: ownerContext,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: collectionColor,
            viewMode: 'compact',
            badgeIds: [newBadge.id],
            applications: [],
            description: 'A collection of badges.',
            isShared: false,
            workspaceId,
        };
    }
    batch.set(doc(db, 'badgeCollections', newCollectionId), newCollection);
    await batch.commit();

    setAllBadgeCollections(prev => [...prev, newCollection]);
    if (newBadges.length > 0) {
        setAllBadges(prev => [...prev, ...newBadges]);
    }
    toast({ title: 'Collection Added', description: `"${newCollection.name}" has been created.` });
  }, [allBadges, toast, realUser]);

  const updateBadgeCollection = useCallback(async (collectionId: string, data: Partial<BadgeCollection>, teamId?: string) => {
    if (!realUser) return;
    const db = getDb();
    await updateDoc(doc(db, 'badgeCollections', collectionId), data);
    setAllBadgeCollections(current => current.map(c => (c.id === collectionId ? { ...c, ...data } : c)));
  }, [realUser]);

  const deleteBadgeCollection = useCallback(async (collectionId: string) => {
    if (!realUser) return;
    const db = getDb();
    const batch = writeBatch(db);

    const collectionToDelete = allBadgeCollections.find(c => c.id === collectionId);
    if (!collectionToDelete) return;
    
    batch.delete(doc(db, 'badgeCollections', collectionId));

    const badgeIdsToDelete = allBadges
      .filter(b => b.ownerCollectionId === collectionId)
      .map(b => b.id);
      
    badgeIdsToDelete.forEach(badgeId => {
      batch.delete(doc(db, 'badges', badgeId));
    });

    await batch.commit();

    setAllBadgeCollections(current => current.filter(c => c.id !== collectionId));
    if (badgeIdsToDelete.length > 0) {
      setAllBadges(current => current.filter(b => !badgeIdsToDelete.includes(b.id)));
    }
  }, [allBadgeCollections, allBadges, realUser]);
  
  const reorderBadgeCollections = useCallback(async (reorderedCollections: BadgeCollection[]) => {
      await simulateApi();
      setAllBadgeCollections([...reorderedCollections]);
  }, []);

  const addBadge = useCallback(async (collectionId: string, sourceBadge?: Badge, unlinkSource: boolean = false) => {
    if (!realUser) return;
    const db = getDb();
    const collection = allBadgeCollections.find(c => c.id === collectionId);
    if (!collection) return;

    if (collection.owner.id !== realUser.userId) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: "You can only add badges to collections you own."});
        return;
    }

    const batch = writeBatch(db);
    let newBadge: Badge;
    const workspaceId = realUser.workspaceId;
    const isDuplicating = !!sourceBadge;
    
    const existingBadgesInCollection = collection.badgeIds.map(id => allBadges.find(b => b.id === id)?.name);
    const newBadgeCount = existingBadgesInCollection.filter(name => name?.startsWith('New Badge')).length;

    if (isDuplicating) {
        newBadge = {
            id: crypto.randomUUID(),
            owner: { type: 'user', id: realUser.userId },
            ownerCollectionId: collectionId,
            name: `${sourceBadge.name} (Copy)`,
            icon: sourceBadge.icon,
            color: adjustHslColor(sourceBadge.color),
            description: sourceBadge.description || '',
            workspaceId,
        };
    } else {
        newBadge = {
            id: crypto.randomUUID(),
            owner: collection.owner,
            ownerCollectionId: collectionId,
            name: newBadgeCount > 0 ? `New Badge ${newBadgeCount + 1}` : 'New Badge',
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: adjustHslColor(collection.color),
            workspaceId,
        };
    }
    
    batch.set(doc(db, 'badges', newBadge.id), newBadge);
    const newBadgeIds = [newBadge.id, ...collection.badgeIds];
    batch.update(doc(db, 'badgeCollections', collectionId), { badgeIds: newBadgeIds });
    
    if (unlinkSource && sourceBadge) {
      const sourceCollection = allBadgeCollections.find(c => c.badgeIds.includes(sourceBadge.id));
      if (sourceCollection && sourceBadge.ownerCollectionId !== sourceCollection.id) { // Only unlink if it's a linked badge
        const updatedSourceBadgeIds = sourceCollection.badgeIds.filter(id => id !== sourceBadge.id);
        batch.update(doc(db, 'badgeCollections', sourceCollection.id), {badgeIds: updatedSourceBadgeIds});
      }
    }

    await batch.commit();

    setAllBadges(prev => [...prev, newBadge]);
    setAllBadgeCollections(prevCollections =>
        prevCollections.map(c => {
          if (c.id === collectionId) return { ...c, badgeIds: newBadgeIds };
          if (unlinkSource && sourceBadge && c.badgeIds.includes(sourceBadge.id) && sourceBadge.ownerCollectionId !== c.id) {
            return { ...c, badgeIds: c.badgeIds.filter(id => id !== sourceBadge.id) };
          }
          return c;
        })
    );
  }, [allBadgeCollections, allBadges, toast, realUser]);

  const updateBadge = useCallback(async (badgeId: string, badgeData: Partial<Badge>) => {
    if (!realUser) return;
    const db = getDb();
    await updateDoc(doc(db, 'badges', badgeId), badgeData);
    setAllBadges(current => current.map(b => b.id === badgeId ? { ...b, ...badgeData } : b));
  }, [realUser]);

  const deleteBadge = useCallback(async (badgeId: string, collectionId: string) => {
    if (!realUser) return;
    const db = getDb();
    const badge = allBadges.find(b => b.id === badgeId);
    if (!badge) return;

    const collection = allBadgeCollections.find(c => c.id === collectionId);
    if (!collection) return;
    
    // Unlink logic
    if (badge.ownerCollectionId !== collectionId) {
        const updatedBadgeIds = collection.badgeIds.filter(id => id !== badgeId);
        await updateDoc(doc(db, 'badgeCollections', collectionId), { badgeIds: updatedBadgeIds });
        setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, badgeIds: updatedBadgeIds } : c));
        toast({ title: 'Badge Unlinked' });
        return;
    }

    // Delete logic (only owner can delete)
    if (badge.owner.id === realUser.userId) {
        await deleteDoc(doc(db, 'badges', badgeId));
        const batch = writeBatch(db);
        allBadgeCollections.forEach(c => {
            if (c.badgeIds.includes(badgeId)) {
                batch.update(doc(db, 'badgeCollections', c.id), {
                    badgeIds: c.badgeIds.filter(id => id !== badgeId)
                });
            }
        });
        await batch.commit();

        setAllBadges(current => current.filter(b => b.id !== badgeId));
        setAllBadgeCollections(current => current.map(c => ({...c, badgeIds: c.badgeIds.filter(id => id !== badgeId)})));
        toast({ title: 'Badge Deleted' });
    } else {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You can only delete badges you own.'});
    }
  }, [allBadges, allBadgeCollections, toast, realUser]);

  const reorderBadges = useCallback(async (collectionId: string, badgeIds: string[]) => {
    if (!realUser) return;
    const db = getDb();
    await updateDoc(doc(db, 'badgeCollections', collectionId), { badgeIds });
    setAllBadgeCollections(current => current.map(c => c.id === collectionId ? { ...c, badgeIds } : c));
  }, [realUser]);

  const handleBadgeAssignment = useCallback(async (badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const currentRoles = new Set(member.roles || []);
    if (currentRoles.has(badge.id)) return;

    const updatedRoles = [...currentRoles, badge.id];
    await updateUser(memberId, { roles: updatedRoles });
    toast({ title: "Badge Assigned", description: `"${badge.name}" assigned to ${member.displayName}.` });
  }, [users, updateUser, toast]);

  const handleBadgeUnassignment = useCallback(async (badge: Badge, memberId: string) => {
    const member = users.find(u => u.userId === memberId);
    if (!member) return;

    const updatedRoles = (member.roles || []).filter(roleId => roleId !== badge.id);
    await updateUser(memberId, { roles: updatedRoles });
    toast({ title: 'Badge Un-assigned', description: `"${badge.name}" removed from ${member.displayName}.`});
  }, [users, updateUser, toast]);

  const searchSharedTeams = useCallback(async (searchTerm: string): Promise<Team[]> => {
    await simulateApi();
    return teams.filter(team => team.isShared && team.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [teams]);
  
  const fetchEvents = useCallback(async (start: Date, end: Date): Promise<Event[]> => {
    if (!realUser?.workspaceId) return [];
    
    const db = getDb();
    const eventsQuery = query(
      collection(db, "events"),
      where("workspaceId", "==", realUser.workspaceId)
    );
  
    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        eventId: doc.id,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
      } as Event;
    });
  }, [realUser?.workspaceId]);

  const addEvent = useCallback(async (currentEvents: Event[], newEventData: Omit<Event, 'eventId'>): Promise<Event[]> => {
    if (!realUser) throw new Error("User not authenticated");
    const db = getDb();
    const fullEventData = {
      ...newEventData,
      workspaceId: realUser.workspaceId,
    };
    const docRef = await addDoc(collection(db, "events"), {
      ...fullEventData,
      startTime: Timestamp.fromDate(fullEventData.startTime),
      endTime: Timestamp.fromDate(fullEventData.endTime),
    });
    const newEvent: Event = { ...fullEventData, eventId: docRef.id };
    return [newEvent, ...currentEvents];
  }, [realUser]);

  const updateEvent = useCallback(async (currentEvents: Event[], eventId: string, eventData: Partial<Omit<Event, 'eventId'>>): Promise<Event[]> => {
    const db = getDb();
    const dataToUpdate: Record<string, any> = { ...eventData, lastUpdated: new Date() };
    if (eventData.startTime) dataToUpdate.startTime = Timestamp.fromDate(eventData.startTime);
    if (eventData.endTime) dataToUpdate.endTime = Timestamp.fromDate(eventData.endTime);
    
    await updateDoc(doc(db, "events", eventId), dataToUpdate);
    return currentEvents.map(e => e.eventId === eventId ? { ...e, ...eventData, lastUpdated: new Date() } : e);
  }, []);

  const deleteEvent = useCallback(async (currentEvents: Event[], eventId: string): Promise<Event[]> => {
    const db = getDb();
    await deleteDoc(doc(db, 'events', eventId));
    return currentEvents.filter(e => e.eventId !== eventId);
  }, []);


  // A placeholder for seeding the database if it's empty
  const seedDatabase = useCallback(async () => {
    console.log("Seeding is not implemented for live Firestore connection.");
  }, []);
  
  return {
    loading, users, teams, projects, appSettings, calendars, locations, notifications, userStatusAssignments, allBadges, allBadgeCollections, holidays, allBookableLocations,
    preApprovedEmails,
    addPreApprovedEmail,
    removePreApprovedEmail,
    setUsers, setTeams, setAllBadgeCollections, setAppSettings, setCalendars, setLocations, setNotifications, setUserStatusAssignments, setAllBadges,
    handleApproveAccessRequest, updateUser, deleteUser, reorderUsers, addTeam, updateTeam, deleteTeam, reorderTeams,
    addProject, updateProject, deleteProject,
    addCalendar, updateCalendar, deleteCalendar, reorderCalendars,
    fetchEvents, addEvent, updateEvent, deleteEvent,
    fetchTasks, addTask, updateTask, deleteTask, addLocation, deleteLocation,
    updateAppSettings: (settings: Partial<Omit<AppSettings, 'preApprovedEmails'>>) => updateAppSettings(settings),
    addPage,
    updatePage, deletePage, reorderPages,
    updateAppTab, reorderTabs,
    addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, reorderBadgeCollections, addBadge, updateBadge, deleteBadge,
    reorderBadges, handleBadgeAssignment, handleBadgeUnassignment,
    searchSharedTeams,
    predefinedColors,
    seedDatabase,
  };
}
