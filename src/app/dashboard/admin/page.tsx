

'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { InlineEditor } from '@/components/common/inline-editor';
import { toast } from '@/hooks/use-toast';
import { CenteredTabList } from '@/components/common/centered-tab-list';

export default function AdminPage() {
  const { appSettings, updateAppTab, updatePage } = useUser();
  const [activeTabKey, setActiveTabKey] = useState('admins');

  const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');

  const adminTabs = [
    { key: 'admins', id: 'tab-admins', name: 'Admin Management', icon: 'admin_panel_settings', component: AdminsManagement },
    { key: 'pages', id: 'tab-admin-pages', name: 'Pages', icon: 'web', component: PagesManagement },
    { key: 'tabs', id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', component: TabsManagement },
  ];

  const activeTabData = appSettings.tabs.find(t => t.id === adminTabs.find(at => at.key === activeTabKey)?.id);
  
  if (!adminPage) return null;

  return (
    <div className="flex flex-col h-full gap-6">
        <Tabs defaultValue="admins" onValueChange={setActiveTabKey} className="flex flex-col flex-1 gap-6 min-h-0">
            <CenteredTabList>
                <TabsList>
                    {adminTabs.map(tab => (
                        <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                           <GoogleSymbol name={tab.icon} className="text-lg" weight={100} />
                           {appSettings.tabs.find(t => t.id === tab.id)?.name || tab.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </CenteredTabList>
            <div className="flex-1 overflow-hidden">
                {adminTabs.map(tab => {
                  const Component = tab.component;
                  return (
                    <TabsContent key={tab.key} value={tab.key} className="h-full mt-0">
                      <Component isActive={activeTabKey === tab.key} />
                    </TabsContent>
                  )
                })}
            </div>
        </Tabs>
    </div>
  );
}
