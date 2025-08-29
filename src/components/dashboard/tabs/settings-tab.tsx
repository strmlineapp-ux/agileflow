
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SettingsContent({ isActive }: { isActive: boolean }) {

  return (
    <div className="flex flex-col gap-6">
      <UserManagement showSearch={true} isActive={isActive} />
    </div>
  );
}
