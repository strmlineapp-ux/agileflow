

'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { useUser } from '@/context/user-context';
import { type Notification, type AppPage, type AppTab } from '@/types';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export function NotificationsContent({ page, tab }: { page?: AppPage, tab?: AppTab }) {
  const { viewAsUser, updateUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!viewAsUser?.workspaceId) return;
    const db = getDb();
    const q = query(
      collection(db, 'notifications'),
      where('workspaceId', '==', viewAsUser.workspaceId),
      orderBy('time', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: (doc.data().time as any).toDate(),
      } as Notification));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [viewAsUser?.workspaceId]);
  
  const handleApproveAccessRequest = async (notificationId: string, approved: boolean) => {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification || !notification.data?.userId) return;

      const db = getDb();
      const userRef = doc(db, 'users', notification.data.userId);
      const notificationRef = doc(db, 'notifications', notificationId);

      const batch = writeBatch(db);
      
      if (approved) {
          batch.update(userRef, { accountType: 'Full', approvedBy: viewAsUser.userId });
          batch.update(notificationRef, { status: 'approved' });
          toast({ title: 'User Approved' });
      } else {
          batch.delete(userRef);
          batch.update(notificationRef, { status: 'rejected' });
          toast({ title: 'User Rejected' });
      }
      await batch.commit();
  };
  
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
      <NotificationList initialNotifications={notifications} onApprove={handleApproveAccessRequest} />
    </div>
  );
}
