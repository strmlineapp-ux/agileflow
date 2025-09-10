

'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { cn } from '@/lib/utils';
import { useDataQueries } from '@/hooks/use-data-queries';

export default function AdminPage() {
  const { viewAsUser } = useUser();
  const { useFetchAppSettings } = useDataQueries();
  const [activeTabKey, setActiveTabKey] = useState('admins');
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);

  const { data: appSettings, isLoading: isLoadingSettings } = useFetchAppSettings(viewAsUser?.workspaceId);

  // Statically define the admin tabs to ensure they are always present.
  const adminTabs = [
    { key: 'admins', id: 'tab-admins', name: 'Admin Management', icon: 'admin_panel_settings', component: AdminsManagement },
    { key: 'pages', id: 'tab-admin-pages', name: 'Pages', icon: 'web', component: PagesManagement },
    { key: 'tabs', id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', component: TabsManagement },
  ];
  
  // Find the corresponding data from appSettings to get the potentially user-edited name.
  const getTabName = (tabId: string, defaultName: string) => {
    if (!appSettings?.tabs) return defaultName;
    return appSettings.tabs.find(t => t.id === tabId)?.name || defaultName;
  }

  if (isLoadingSettings || !appSettings) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
        </div>
    );
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
            <div className="flex-1 pt-6 min-h-0">
                {adminTabs.map(tab => {
                  const Component = tab.component;
                  const props = {
                    isActive: activeTabKey === tab.key,
                    isSharedPanelOpen: tab.key === 'pages' ? isSharedPanelOpen : undefined,
                    setIsSharedPanelOpen: tab.key === 'pages' ? setIsSharedPanelOpen : undefined,
                    appSettings: appSettings, // Pass appSettings to children that need it
                  };

                  return (
                    <TabsContent 
                        key={tab.key} 
                        value={tab.key} 
                        className="mt-0 h-full"
                    >
                      <Component {...props} />
                    </TabsContent>
                  )
                })}
            </div>
        </Tabs>
    </div>
  );
}
