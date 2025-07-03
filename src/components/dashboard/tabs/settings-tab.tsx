
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type AppPage } from '@/types';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export function SettingsContent({ tab: pageConfig }: { tab: AppPage }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
        <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
      </div>
      <UserManagement />
    </div>
  );
}
