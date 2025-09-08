

import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { type Notification, type AppPage, type AppSettings } from '@/types';

async function getNotificationData(userId: string) {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        console.error(`No user document found for userId: ${userId}`);
        return { notifications: [], page: null };
    }
    
    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) {
        console.error(`User ${userId} does not have a workspaceId.`);
        return { notifications: [], page: null };
    }

    const notificationsQuery = query(
      collection(db, 'notifications'), 
      where("workspaceId", "==", workspaceId),
      orderBy('time', 'desc')
    );
    const appSettingsDocRef = doc(db, 'app-settings', workspaceId);

    const [notificationsSnapshot, appSettingsDoc] = await Promise.all([
        getDocs(notificationsQuery),
        getDoc(appSettingsDocRef)
    ]);

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: (doc.data().time as Timestamp).toDate(),
    } as Notification));
    
    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const page = appSettings?.pages.find(p => p.id === 'page-notifications') || null;

    return { notifications, page };
}

export default async function NotificationsPage() {
  let session;
  try {
    session = await auth().getUserByEmail('demo@strm.com');
  } catch (error) {
     return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl mb-2">Authentication Error</h2>
                <p className="text-muted-foreground">Could not authenticate user. Please ensure the demo user exists.</p>
            </div>
        </div>
      )
  }

  const { notifications, page } = await getNotificationData(session.uid);
  
  return <NotificationsContent initialNotifications={notifications} page={page || undefined} />;
}
