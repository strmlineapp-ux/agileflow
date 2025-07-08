
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type AppPage } from '@/types';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SettingsContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  const title = isSingleTabPage ? pageConfig.name : tab.name;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-headline text-3xl font-thin">{title}</h1>
              </TooltipTrigger>
              {pageConfig.description && (
                <TooltipContent>
                  <p className="max-w-xs">{pageConfig.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
      </div>
      <UserManagement />
    </div>
  );
}
