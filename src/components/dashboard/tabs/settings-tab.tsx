
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type User } from '@/types';
import { useUser } from '@/context/user-context';
import { useDataQueries } from '@/hooks/use-data-queries';

export function SettingsContent({ isActive }: { isActive: boolean }) {
  const { viewAsUser } = useUser();
  const { useFetchUsers } = useDataQueries();
  
  if (!viewAsUser) {
    return null; // Or a loading skeleton
  }
  
  const { data: allUsers = [] } = useFetchUsers(viewAsUser.workspaceId);

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto hide-scrollbar">
      <UserManagement allUsers={allUsers} showSearch={true} />
    </div>
  );
}
