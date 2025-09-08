

import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { collection, doc, getDoc, getDocs, limit, query, where, Timestamp } from 'firebase/firestore';
import { type Task, type AppSettings, type AppPage } from '@/types';


async function getOverviewData(userId: string) {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        console.error(`No user document found for userId: ${userId}`);
        return { tasks: [], page: null };
    }

    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) {
        console.error(`User ${userId} does not have a workspaceId.`);
        return { tasks: [], page: null };
    }
    
    const tasksQuery = query(
        collection(db, 'tasks'),
        where('workspaceId', '==', workspaceId),
        limit(5)
    );
    const appSettingsDocRef = doc(db, 'app-settings', workspaceId);

    const [tasksSnapshot, appSettingsDoc] = await Promise.all([
        getDocs(tasksQuery),
        getDoc(appSettingsDocRef)
    ]);

    const tasks = tasksSnapshot.docs.map(doc => ({
        taskId: doc.id,
        ...doc.data(),
        dueDate: (doc.data().dueDate as Timestamp).toDate(),
    } as Task));

    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const page = appSettings?.pages.find(p => p.id === 'page-overview') || null;

    return { tasks, page };
}


export default async function OverviewPage() {
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
  const { tasks, page } = await getOverviewData(session.uid);
  
  return <OverviewContent initialTasks={tasks} page={page || undefined} />;
}
