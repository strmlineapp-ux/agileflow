
'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { Badge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';

export default function NotificationsPage() {
  const { notifications } = useUser();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoogleSymbol name="notifications" className="text-3xl text-muted-foreground" />
          <h1 className="font-headline text-3xl font-semibold">Notifications</h1>
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
