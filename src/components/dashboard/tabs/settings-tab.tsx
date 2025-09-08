
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { User } from '@/types';

export function SettingsContent({ allUsers, isActive }: { allUsers: User[], isActive: boolean }) {

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto hide-scrollbar">
      <UserManagement showSearch={true} isActive={isActive} allUsers={allUsers} />
    </div>
  );
}
