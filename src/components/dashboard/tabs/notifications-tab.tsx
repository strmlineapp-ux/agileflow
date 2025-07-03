
'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { type AppTab } from '@/types';

export function NotificationsContent({ tab }: { tab: AppTab }) {
  // The header is now rendered by the dynamic page component.
  // This component just needs to render the list.
  return <NotificationList />;
}
