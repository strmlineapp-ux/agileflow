import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Notifications</h1>
      </div>
      <NotificationList />
    </div>
  );
}
