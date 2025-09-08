

'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type User } from '@/types';
import { useUser } from '@/context/user-context';
import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';


async function fetchUsers(workspaceId: string): Promise<User[]> {
  const db = getDb();
  const q = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
}


export function SettingsContent({ allUsers: initialUsers, isActive }: { allUsers: User[], isActive: boolean }) {
  const { viewAsUser } = useUser();
  const { data: allUsers = initialUsers } = useQuery({
    queryKey: ['users', viewAsUser.workspaceId],
    queryFn: () => fetchUsers(viewAsUser.workspaceId),
    initialData: initialUsers,
    enabled: !!viewAsUser.workspaceId
  });

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto hide-scrollbar">
      <UserManagement allUsers={allUsers} showSearch={true} />
    </div>
  );
}
