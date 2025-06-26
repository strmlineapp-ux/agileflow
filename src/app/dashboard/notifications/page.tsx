import { NotificationList } from '@/components/notifications/notification-list';
import { Badge } from '@/components/ui/badge';
import { mockNotifications } from '@/lib/mock-data';

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
