

'use client';

import { useState } from 'react';
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('admins');

  return (
    <div className="flex flex-col h-full gap-6">
        <Tabs defaultValue="admins" onValueChange={setActiveTab} className="flex flex-col flex-1 gap-6">
            <TabsList className="w-full justify-around">
                <TabsTrigger value="admins" className="gap-2">
                    <GoogleSymbol name="admin_panel_settings" className="text-lg" weight={100} />
                    Admin Management
                </TabsTrigger>
                <TabsTrigger value="pages" className="gap-2">
                    <GoogleSymbol name="web" className="text-lg" weight={100} />
                    Pages
                </TabsTrigger>
                <TabsTrigger value="tabs" className="gap-2">
                    <GoogleSymbol name="tab" className="text-lg" weight={100} />
                    Tabs
                </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto">
                <TabsContent value="admins" className="h-full">
                    <AdminsManagement isActive={activeTab === 'admins'} />
                </TabsContent>
                <TabsContent value="pages" className="h-full">
                    <PagesManagement isActive={activeTab === 'pages'} />
                </TabsContent>
                <TabsContent value="tabs" className="h-full">
                    <TabsManagement isActive={activeTab === 'tabs'} />
                </TabsContent>
            </div>
        </Tabs>
    </div>
  );
}
