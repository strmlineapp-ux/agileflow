
'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { InlineEditor } from '@/components/common/inline-editor';
import { toast } from '@/hooks/use-toast';

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
  
  const handleTitleSave = (newTitle: string) => {
    if (adminPage) {
      updatePage(adminPage.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (adminPage && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updatePage(adminPage.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };
  
  const title = adminPage?.displayTitle ?? adminPage?.name ?? 'Admin';

  if (!adminPage) return null;

  return (
    <div className="flex flex-col h-full gap-6">
        <Tabs defaultValue="admins" onValueChange={setActiveTabKey} className="flex flex-col flex-1 gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <GoogleSymbol name={adminPage.icon} style={{color: adminPage.color, fontSize: '32px'}} />
                     <InlineEditor
                        value={title}
                        onSave={handleTitleSave}
                        onClick={handleTitleReset}
                        className="h-auto p-0 font-headline text-2xl tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={!appSettings.isAdmin}
                     />
                </div>
                 <TabsList>
                    {adminTabs.map(tab => (
                        <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                           <GoogleSymbol name={tab.icon} className="text-lg" weight={100} />
                           {appSettings.tabs.find(t => t.id === tab.id)?.name || tab.name}
                        </TabsTrigger>
                    ))}
                 </TabsList>
            </div>
            <div className="flex-1 overflow-y-auto">
                {adminTabs.map(tab => {
                  const Component = tab.component;
                  return (
                    <TabsContent key={tab.key} value={tab.key} className="h-full">
                      <Component isActive={activeTabKey === tab.key} />
                    </TabsContent>
                  )
                })}
            </div>
        </Tabs>
    </div>
  );
}
