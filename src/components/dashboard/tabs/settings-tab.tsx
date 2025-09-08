
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type User } from '@/types';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { getDb } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export function SettingsContent({ isActive }: { isActive: boolean }) {
  const { viewAsUser } = useUser();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!viewAsUser?.workspaceId) return;
    const db = getDb();
    const q = query(collection(db, 'users'), where('workspaceId', '==', viewAsUser.workspaceId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
      setAllUsers(usersData);
    });
    return () => unsubscribe();
  }, [viewAsUser?.workspaceId]);

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto hide-scrollbar">
      <UserManagement showSearch={true} />
    </div>
  );
}
