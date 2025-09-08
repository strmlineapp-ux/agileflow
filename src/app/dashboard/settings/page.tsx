

import { SettingsContent } from '@/components/dashboard/tabs/settings-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { type User } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


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
  
  const userDocRef = doc(getDb(), 'users', session.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || !userDoc.data()?.workspaceId) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl mb-2">Workspace Error</h2>
                <p className="text-muted-foreground">Could not determine your workspace.</p>
            </div>
        </div>
      )
  }
  
  const workspaceId = userDoc.data()!.workspaceId;
  const allUsers = await getUsers(workspaceId);

  return <SettingsContent allUsers={allUsers} isActive={true} />;
}
