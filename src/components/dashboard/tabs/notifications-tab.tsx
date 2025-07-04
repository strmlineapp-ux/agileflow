
'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { type AppPage } from '@/types';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NotificationsContent({ tab: pageConfig }: { tab: AppPage }) {
  const { notifications } = useUser();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
              </TooltipTrigger>
              {pageConfig.description && (
                <TooltipContent>
                  <p className="max-w-xs">{pageConfig.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full text-base px-3">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
      <NotificationList />
    </div>
  );
}
