

'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger, SortableTabsList } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { InlineEditor } from '@/components/common/inline-editor';
import { toast } from '@/hooks/use-toast';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { type AppTab } from '@/types';

export default function AdminPage() {
  const { appSettings, updateAppTab, reorderTabs, isDragModifierPressed } = useUser();
  const [activeTabKey, setActiveTabKey] = useState('admins');

  const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');

  const adminTabs: AppTab[] = useMemo(() => {
      const tabIds = ['tab-admins', 'tab-admin-pages', 'tab-admin-tabs'];
      return tabIds.map(id => appSettings.tabs.find(t => t.id === id)).filter((t): t is AppTab => !!t);
  }, [appSettings.tabs]);
  
  if (!adminPage) return null;

  return (
    <div className="flex flex-col h-full gap-6">
        <Tabs defaultValue="tab-admins" onValueChange={setActiveTabKey} className="flex flex-col flex-1 gap-6 min-h-0">
            <CenteredTabList>
                <SortableTabsList
                    items={adminTabs}
                    onReorder={reorderTabs}
                    disabled={!isDragModifierPressed}
                >
                    {adminTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                           <GoogleSymbol name={tab.icon} className="text-lg" weight={100} />
                           {tab.name}
                        </TabsTrigger>
                    ))}
                </SortableTabsList>
            </CenteredTabList>
            <div className="flex-1 overflow-hidden">
                {adminTabs.map(tab => {
                  let Component;
                  switch (tab.componentKey) {
                    case 'admins': Component = AdminsManagement; break;
                    case 'pages': Component = PagesManagement; break;
                    case 'tabs': Component = TabsManagement; break;
                    default: return null;
                  }
                  return (
                    <TabsContent key={tab.id} value={tab.id} className="h-full mt-0">
                      <Component isActive={activeTabKey === tab.id} />
                    </TabsContent>
                  )
                })}
            </div>
        </Tabs>
    </div>
  );
}
