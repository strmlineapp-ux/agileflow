
'use client';

import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { useUser } from '@/context/user-context';
import { useDataQueries } from '@/hooks/use-data-queries';

export default function NotificationsPage() {
  const { viewAsUser } = useUser();
  const { useFetchAppSettings } = useDataQueries();
  const { data: appSettings } = useFetchAppSettings(viewAsUser?.workspaceId);
  
  const page = appSettings?.pages.find(p => p.id === 'page-notifications');
  const tab = appSettings?.tabs.find(t => t.id === 'tab-notifications');

  return <NotificationsContent page={page} tab={tab} />;
}
