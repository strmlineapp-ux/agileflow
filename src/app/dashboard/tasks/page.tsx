
'use client';

import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { useUser } from '@/context/user-context';
import { useDataQueries } from '@/hooks/use-data-queries';

export default function TasksPage() {
  const { viewAsUser } = useUser();
  const { useFetchAppSettings } = useDataQueries();
  const { data: appSettings } = useFetchAppSettings(viewAsUser?.workspaceId);
  
  const page = appSettings?.pages.find(p => p.id === 'page-tasks');
  const tab = appSettings?.tabs.find(t => t.id === 'tab-tasks');

  return <TasksContent page={page} tab={tab} />;
}
