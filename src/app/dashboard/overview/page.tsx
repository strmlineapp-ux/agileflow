
'use client';

import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { useUser } from '@/context/user-context';
import { useDataQueries } from '@/hooks/use-data-queries';

export default function OverviewPage() {
  const { viewAsUser } = useUser();
  const { useFetchAppSettings } = useDataQueries();
  const { data: appSettings } = useFetchAppSettings(viewAsUser?.workspaceId);
  
  const page = appSettings?.pages.find(p => p.id === 'page-overview');
  const tab = appSettings?.tabs.find(t => t.id === 'tab-overview');

  return <OverviewContent page={page} tab={tab} />;
}
