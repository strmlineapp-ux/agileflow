
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type AppPage } from '@/types';

export function SettingsContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {

  return (
    <div className="flex flex-col gap-6">
      <UserManagement showSearch={isSingleTabPage} />
    </div>
  );
}
