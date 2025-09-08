
import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { type AppSettings, type AppPage, type Task } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


async function getTasksData(userId: string) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { tasks: [], page: null };
    
    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) return { tasks: [], page: null };

    const tasksQuery = query(collection(db, 'tasks'), where("workspaceId", "==", workspaceId));
    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
        taskId: doc.id,
        ...doc.data(),
        dueDate: (doc.data().dueDate as any).toDate(),
    } as Task));

    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const page = appSettings?.pages.find(p => p.id === 'page-tasks') || null;

    return { tasks, page };
}

export default async function TasksPage() {
  const session = await auth().getUserByEmail('demo@strm.com'); // This needs to be dynamic
  const { tasks, page } = await getTasksData(session.uid);

  return <TasksContent initialTasks={tasks} page={page || undefined} />;
}
