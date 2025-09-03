

'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { CenteredTabList } from '@/components/common/centered-tab-list';

export default function AdminPage() {
  const { appSettings } = useUser();
  const [activeTabKey, setActiveTabKey] = useState('admins');

  // Statically define the admin tabs to ensure they are always present.
  const adminTabs = [
    { key: 'admins', id: 'tab-admins', name: 'Admin Management', icon: 'admin_panel_settings', component: AdminsManagement },
    { key: 'pages', id: 'tab-admin-pages', name: 'Pages', icon: 'web', component: PagesManagement },
    { key: 'tabs', id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', component: TabsManagement },
  ];
  
  // Find the corresponding data from appSettings to get the potentially user-edited name.
  const getTabName = (tabId: string, defaultName: string) => {
    return appSettings.tabs.find(t => t.id === tabId)?.name || defaultName;
  }

  return (
    <div className="flex flex-col h-full">
        <Tabs defaultValue="admins" onValueChange={setActiveTabKey} className="flex flex-col flex-1 min-h-0">
            <CenteredTabList>
                <TabsList>
                    {adminTabs.map(tab => (
                        <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                           <GoogleSymbol name={tab.icon} className="text-lg" weight={100} />
                           {getTabName(tab.id, tab.name)}
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
