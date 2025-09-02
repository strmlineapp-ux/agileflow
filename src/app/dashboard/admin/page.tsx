
'use client';

import { useState, useMemo } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { type AppTab } from '@/types';

export default function AdminPage() {
  const { appSettings } = useUser();
  const [activeTabKey, setActiveTabKey] = useState('tab-admins');

  const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');

  const adminTabsMap = useMemo<{ [key: string]: AppTab | undefined }>(() => {
    return {
      'tab-admins': appSettings.tabs.find(t => t.id === 'tab-admins'),
      'tab-admin-pages': appSettings.tabs.find(t => t.id === 'tab-admin-pages'),
      'tab-admin-tabs': appSettings.tabs.find(t => t.id === 'tab-admin-tabs'),
    };
  }, [appSettings.tabs]);

  const adminTabs = useMemo(() => {
    return Object.values(adminTabsMap).filter((t): t is AppTab => !!t);
  }, [adminTabsMap]);
  
  if (!adminPage) return null;

  const renderComponent = (tab: AppTab) => {
    switch (tab.componentKey) {
      case 'admins': return <AdminsManagement isActive={activeTabKey === tab.id} />;
      case 'pages': return <PagesManagement isActive={activeTabKey === tab.id} />;
      case 'tabs': return <TabsManagement isActive={activeTabKey === tab.id} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
        <Tabs defaultValue="tab-admins" onValueChange={setActiveTabKey} className="flex flex-col flex-1 gap-6 min-h-0">
            <CenteredTabList>
                <TabsList>
                    {adminTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                           <GoogleSymbol name={tab.icon} className="text-lg" weight={100} />
                           {tab.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </CenteredTabList>
            <div className="flex-1 overflow-hidden">
                {adminTabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id} className="h-full mt-0">
                      {renderComponent(tab)}
                    </TabsContent>
                ))}
            </div>
        </Tabs>
    </div>
  );
}
