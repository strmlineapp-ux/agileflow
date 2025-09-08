
import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { type Notification, type AppPage, type AppSettings } from '@/types';

async function getNotificationData(userId: string) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { notifications: [], page: null };
    
    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) return { notifications: [], page: null };

    // This is simplified. A real app would have more complex logic to fetch relevant notifications.
    const notificationsQuery = query(
      collection(db, 'notifications'), 
      where("workspaceId", "==", workspaceId),
      orderBy('time', 'desc')
    );
    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));

    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: (doc.data().time as any).toDate(),
    } as Notification));
    
    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const page = appSettings?.pages.find(p => p.id === 'page-notifications') || null;

    return { notifications, page };
}

export default async function NotificationsPage() {
  const session = await auth().getUserByEmail('demo@strm.com'); // This should be replaced by actual auth
  const { notifications, page } = await getNotificationData(session.uid);
  
  return <NotificationsContent notifications={notifications} page={page || undefined} />;
}
