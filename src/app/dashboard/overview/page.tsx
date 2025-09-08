
import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { type Task, type AppSettings, type AppPage } from '@/types';


async function getOverviewData(userId: string) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { tasks: [], page: null };

    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) return { tasks: [], page: null };
    
    // Fetch a few recent tasks for the overview
    const tasksQuery = query(
        collection(db, 'tasks'),
        where('workspaceId', '==', workspaceId),
        limit(5)
    );
    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
        taskId: doc.id,
        ...doc.data(),
        dueDate: (doc.data().dueDate as any).toDate(),
    } as Task));

    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const page = appSettings?.pages.find(p => p.id === 'page-overview') || null;

    return { tasks, page };
}


export default async function OverviewPage() {
  const session = await auth().getUserByEmail('demo@strm.com');
  const { tasks, page } = await getOverviewData(session.uid);
  
  return <OverviewContent initialTasks={tasks} page={page || undefined} />;
}
