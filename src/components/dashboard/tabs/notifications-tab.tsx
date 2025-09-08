

'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { useUser } from '@/context/user-context';
import { type Notification, type AppPage, type AppTab } from '@/types';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

async function fetchNotifications(workspaceId: string): Promise<Notification[]> {
  const db = getDb();
  const q = query(
    collection(db, 'notifications'),
    where('workspaceId', '==', workspaceId),
    orderBy('time', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    time: (doc.data().time as Timestamp).toDate(),
  } as Notification));
}

export function NotificationsContent({ initialNotifications, page, tab }: { initialNotifications: Notification[], page?: AppPage, tab?: AppTab }) {
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  
  const { data: notifications = initialNotifications } = useQuery({
    queryKey: ['notifications', viewAsUser.workspaceId],
    queryFn: () => fetchNotifications(viewAsUser.workspaceId),
    enabled: !!viewAsUser.workspaceId,
    initialData: initialNotifications,
    refetchOnWindowFocus: true,
  });
  
  const title = page?.displayTitle ?? tab?.name ?? 'Notifications';
  const canManagePage = viewAsUser.isAdmin;

  const handleTitleSave = (newTitle: string) => {
    if (page) {
      updateUser(page.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (page && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updateUser(page.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  return (
    <div className="h-full">
      <PageTitle 
        title={title}
        onSave={handleTitleSave}
        onReset={handleTitleReset}
        disabled={!canManagePage || !page}
      />
      <NotificationList notifications={notifications} />
    </div>
  );
}
