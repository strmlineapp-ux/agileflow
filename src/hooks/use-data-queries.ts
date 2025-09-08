
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp, writeBatch, limit, orderBy } from 'firebase/firestore';
import { type User, type PreApprovedEmail, type AppSettings, type Team, type SharedCalendar, type BadgeCollection, type Badge, type Project, type Task, type Event, type Notification } from '@/types';
import { useToast } from './use-toast';
import { getDb } from '@/lib/firebase';

// Helper to convert Firestore Timestamps to Dates in a nested object
function convertTimestamps<T>(data: any): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Timestamp) {
    return data.toDate() as any;
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps) as any;
  }
  const newData: { [key: string]: any } = {};
  for (const key in data) {
    newData[key] = convertTimestamps(data[key]);
  }
  return newData as T;
}

export function useDataQueries() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const genericMutationOptions = (queryKey: string | (string | undefined)[]) => ({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toast({ title: 'Success', description: 'Your changes have been saved.' });
      },
      onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      },
    });

    // #region Users
    const useFetchUsers = (workspaceId?: string) => {
        return useQuery<User[]>({
            queryKey: ['users', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const q = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
            },
            enabled: !!workspaceId
        });
    };

    const useUpdateUser = () => {
        return useMutation({
            mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
                const db = getDb();
                await updateDoc(doc(db, "users", userId), data);
            },
            ...genericMutationOptions(['users']),
        });
    };
    
    const useDeleteUser = () => {
        return useMutation({
            mutationFn: async (userId: string) => {
                const db = getDb();
                await deleteDoc(doc(db, "users", userId));
            },
            ...genericMutationOptions(['users']),
        });
    }
    // #endregion

    // #region Pre-Approved Emails
    const useFetchPreApprovedEmails = (workspaceId?: string) => {
        return useQuery<PreApprovedEmail[]>({
            queryKey: ['preApprovedEmails', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const q = query(collection(db, 'pre-approved-emails'), where('workspaceId', '==', workspaceId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEmail));
            },
            enabled: !!workspaceId
        });
    };

    const useAddPreApprovedEmail = () => {
        return useMutation({
            mutationFn: async (variables: { email: string, invitedBy: string, workspaceId: string }) => {
                const db = getDb();
                await addDoc(collection(db, 'pre-approved-emails'), { ...variables, createdAt: new Date() });
            },
            ...genericMutationOptions(['preApprovedEmails']),
        });
    };

    const useRemovePreApprovedEmail = () => {
        return useMutation({
            mutationFn: async (docId: string) => {
                const db = getDb();
                await deleteDoc(doc(db, 'pre-approved-emails', docId));
            },
            ...genericMutationOptions(['preApprovedEmails']),
        });
    };
    // #endregion
    
    // #region AppSettings
    const useFetchAppSettings = (workspaceId?: string) => {
        return useQuery<AppSettings>({
            queryKey: ['appSettings', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const docRef = doc(db, 'app-settings', workspaceId!);
                const docSnap = await getDoc(docRef);
                return docSnap.data() as AppSettings;
            },
            enabled: !!workspaceId,
        });
    };

    const useUpdateAppSettings = () => {
        return useMutation({
            mutationFn: async ({ workspaceId, newSettings }: { workspaceId: string, newSettings: Partial<AppSettings> }) => {
                const db = getDb();
                await updateDoc(doc(db, 'app-settings', workspaceId), newSettings);
            },
            ...genericMutationOptions(['appSettings']),
        });
    };
    // #endregion

    // #region Badges & Collections
    const useFetchAllBadges = (workspaceId?: string) => {
        return useQuery<Badge[]>({
            queryKey: ['badges', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const q = query(collection(db, 'badges'), where('workspaceId', '==', workspaceId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
            },
            enabled: !!workspaceId,
        });
    };

    const useFetchAllBadgeCollections = (workspaceId?: string) => {
        return useQuery<BadgeCollection[]>({
            queryKey: ['badgeCollections', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const q = query(collection(db, 'badgeCollections'), where('workspaceId', '==', workspaceId));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BadgeCollection));
            },
            enabled: !!workspaceId,
        });
    };
    // #endregion

    // #region Projects
    const useFetchProjects = (workspaceId?: string) => {
      return useQuery<Project[]>({
          queryKey: ['projects', workspaceId],
          queryFn: async () => {
              const db = getDb();
              const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId));
              const snapshot = await getDocs(q);
              return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
          },
          enabled: !!workspaceId,
      });
    };
    
    const useFetchProject = (projectId?: string) => {
      return useQuery<Project | null>({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const db = getDb();
            const docRef = doc(db, 'projects', projectId!);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Project) : null;
        },
        enabled: !!projectId,
      });
    };

    const useAddProject = () => {
      return useMutation({
        mutationFn: async (variables: { projectData: Partial<Project>, ownerId: string, workspaceId: string }) => {
          const { projectData, ownerId, workspaceId } = variables;
          const db = getDb();
          await addDoc(collection(db, 'projects'), { ...projectData, owner: { type: 'user', id: ownerId }, workspaceId, icon: 'folder', color: '#888' });
        },
        ...genericMutationOptions(['projects'])
      });
    };

    const useUpdateProject = () => {
      return useMutation({
        mutationFn: async (variables: { projectId: string, data: Partial<Project> }) => {
          const db = getDb();
          await updateDoc(doc(db, 'projects', variables.projectId), variables.data);
        },
        onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
          toast({ title: 'Success', description: 'Project updated.' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
      });
    };

    const useDeleteProject = () => {
      return useMutation({
        mutationFn: async (projectId: string) => {
          const db = getDb();
          await deleteDoc(doc(db, 'projects', projectId));
        },
        ...genericMutationOptions(['projects'])
      });
    };
    // #endregion

    // #region Tasks
    const useFetchTasks = (workspaceId?: string, { projectId, limit: queryLimit }: { projectId?: string, limit?: number } = {}) => {
        return useQuery<Task[]>({
            queryKey: ['tasks', workspaceId, projectId, queryLimit],
            queryFn: async () => {
                const db = getDb();
                let constraints = [where('workspaceId', '==', workspaceId)];
                if (projectId) {
                    constraints.push(where('projectId', '==', projectId));
                }
                if (queryLimit) {
                    constraints.push(limit(queryLimit));
                }
                const q = query(collection(db, 'tasks'), ...constraints);
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => convertTimestamps<Task>({ taskId: doc.id, ...doc.data() }));
            },
            enabled: !!workspaceId,
        });
    };

    const useAddTask = () => {
        return useMutation({
            mutationFn: async (taskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => {
                const db = getDb();
                await addDoc(collection(db, 'tasks'), { ...taskData, createdAt: new Date(), lastUpdated: new Date() });
            },
            ...genericMutationOptions(['tasks']),
        });
    };

    const useUpdateTask = () => {
        return useMutation({
            mutationFn: async ({ taskId, updatedData }: { taskId: string, updatedData: Partial<Task> }) => {
                const db = getDb();
                await updateDoc(doc(db, 'tasks', taskId), { ...updatedData, lastUpdated: new Date() });
            },
            ...genericMutationOptions(['tasks']),
        });
    };

    const useDeleteTask = () => {
        return useMutation({
            mutationFn: async (taskId: string) => {
                const db = getDb();
                await deleteDoc(doc(db, 'tasks', taskId));
            },
            ...genericMutationOptions(['tasks']),
        });
    };
    // #endregion
    
    // #region Notifications
    const useFetchNotifications = (workspaceId?: string) => {
        return useQuery<Notification[]>({
            queryKey: ['notifications', workspaceId],
            queryFn: async () => {
                const db = getDb();
                const q = query(
                    collection(db, 'notifications'),
                    where('workspaceId', '==', workspaceId),
                    orderBy('time', 'desc')
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => convertTimestamps<Notification>({ id: doc.id, ...doc.data() }));
            },
            enabled: !!workspaceId,
        });
    };

    const useApproveAccessRequest = () => {
        return useMutation({
            mutationFn: async (variables: { workspaceId: string; notificationId: string; targetUserId: string; approvedBy: string; approved: boolean; }) => {
                const { workspaceId, notificationId, targetUserId, approvedBy, approved } = variables;
                const db = getDb();
                const userRef = doc(db, 'users', targetUserId);
                const notificationRef = doc(db, 'notifications', notificationId);
                const batch = writeBatch(db);
                if (approved) {
                    batch.update(userRef, { accountType: 'Full', approvedBy });
                    batch.update(notificationRef, { status: 'approved' });
                } else {
                    batch.delete(userRef);
                    batch.update(notificationRef, { status: 'rejected' });
                }
                await batch.commit();
            },
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['notifications', variables.workspaceId] });
                queryClient.invalidateQueries({ queryKey: ['users', variables.workspaceId] });
                toast({ title: variables.approved ? 'User Approved' : 'User Rejected' });
            },
            onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        });
    };

    const useMarkNotificationAsRead = () => {
        return useMutation({
            mutationFn: async (notificationId: string) => {
                const db = getDb();
                await updateDoc(doc(db, 'notifications', notificationId), { read: true });
            },
            ...genericMutationOptions(['notifications'])
        });
    };
    // #endregion
    
    // #region Events
    const useFetchEvents = (workspaceId?: string, start?: Date, end?: Date) => {
      return useQuery<Event[]>({
        queryKey: ['events', workspaceId, start?.toISOString(), end?.toISOString()],
        queryFn: async () => {
          const db = getDb();
          const eventsQuery = query(
            collection(db, "events"),
            where("workspaceId", "==", workspaceId),
            where("startTime", ">=", start),
            where("startTime", "<=", end)
          );
          const snapshot = await getDocs(eventsQuery);
          return snapshot.docs.map(doc => convertTimestamps<Event>({ eventId: doc.id, ...doc.data()}));
        },
        enabled: !!workspaceId && !!start && !!end,
      });
    };

    const useAddEvent = () => {
      return useMutation({
        mutationFn: async (eventData: Omit<Event, 'eventId'>) => {
          const db = getDb();
          await addDoc(collection(db, 'events'), { ...eventData });
        },
        ...genericMutationOptions(['events']),
      });
    };

    const useUpdateEvent = () => {
      return useMutation({
        mutationFn: async ({ eventId, eventData }: { eventId: string, eventData: Partial<Omit<Event, 'eventId'>> }) => {
          const db = getDb();
          await updateDoc(doc(db, 'events', eventId), { ...eventData, lastUpdated: new Date() });
        },
        ...genericMutationOptions(['events']),
      });
    };

    const useDeleteEvent = () => {
      return useMutation({
        mutationFn: async (eventId: string) => {
          const db = getDb();
          await deleteDoc(doc(db, 'events', eventId));
        },
        ...genericMutationOptions(['events']),
      });
    };
    // #endregion

    return {
        useFetchUsers,
        useUpdateUser,
        useDeleteUser,
        useFetchPreApprovedEmails,
        useAddPreApprovedEmail,
        useRemovePreApprovedEmail,
        useFetchAppSettings,
        useUpdateAppSettings,
        useFetchAllBadges,
        useFetchAllBadgeCollections,
        useFetchProjects,
        useFetchProject,
        useAddProject,
        useUpdateProject,
        useDeleteProject,
        useFetchTasks,
        useAddTask,
        useUpdateTask,
        useDeleteTask,
        useFetchNotifications,
        useApproveAccessRequest,
        useMarkNotificationAsRead,
        useFetchEvents,
        useAddEvent,
        useUpdateEvent,
        useDeleteEvent,
    };
}

    