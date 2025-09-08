
'use client';

import { NotificationList } from '@/components/notifications/notification-list';
import { useUser } from '@/context/user-context';
import { type Notification, type AppPage, type AppTab } from '@/types';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';

export function NotificationsContent({ notifications, page, tab }: { notifications: Notification[], page?: AppPage, tab?: AppTab }) {
  const { viewAsUser, updatePage } = useUser();
  const { toast } = useToast();
  
  const title = page?.displayTitle ?? tab?.name ?? 'Notifications';
  const canManagePage = viewAsUser.isAdmin;

  const handleTitleSave = (newTitle: string) => {
    if (page) {
      updatePage(page.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (page && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updatePage(page.id, { displayTitle: null });
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
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
