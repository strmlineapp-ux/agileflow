

'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { useUser } from '@/context/user-context';
import { type Notification, type AppPage, type AppTab } from '@/types';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';
import { useDataQueries } from '@/hooks/use-data-queries';

export function NotificationsContent({ page, tab }: { page?: AppPage, tab?: AppTab }) {
  const { viewAsUser, updateUser } = useUser();
  const { useFetchNotifications } = useDataQueries();
  const { toast } = useToast();
  
  const { data: notifications = [] } = useFetchNotifications(viewAsUser.workspaceId);
  
  const title = page?.displayTitle ?? tab?.name ?? 'Notifications';
  const canManagePage = viewAsUser.isAdmin;

  const handleTitleSave = (newTitle: string) => {
    if (page) {
      updateUser(page.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (page && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updateUser(page.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  return (
    <div className="h-full">
      <PageTitle 
        title={title}
        onSave={handleTitleSave}
        onReset={handleTitleReset}
        disabled={!canManagePage || !page}
      />
      <NotificationList notifications={notifications} />
    </div>
  );
}
