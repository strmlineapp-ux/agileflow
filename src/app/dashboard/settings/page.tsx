
import { SettingsContent } from '@/components/dashboard/tabs/settings-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { type User } from '@/types';
import { collection, query, where, getDocs } from 'firebase/firestore';


async function getUsers(workspaceId: string): Promise<User[]> {
    const db = getDb();
    const usersQuery = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id
    } as User));
}

export default async function SettingsPage() {
  const session = await auth().getUserByEmail('demo@strm.com'); // This needs to be dynamic
  const userDoc = await auth().getUser(session.uid);
  const workspaceId = userDoc.customClaims?.workspaceId || 'default';
  
  const allUsers = await getUsers(workspaceId);

  return <SettingsContent allUsers={allUsers} isActive={true} />;
}
