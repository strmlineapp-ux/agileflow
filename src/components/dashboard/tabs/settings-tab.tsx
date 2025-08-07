
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type AppPage } from '@/types';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SettingsContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {

  return (
    <div className="flex flex-col gap-6">
      <UserManagement showSearch={true} />
    </div>
  );
}
