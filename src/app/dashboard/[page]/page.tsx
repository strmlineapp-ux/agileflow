
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { AdminGroupsManagement, PagesManagement, TabsManagement } from '@/app/dashboard/admin/page';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement as ServiceDeliveryTeamManagement } from '@/components/service-delivery/team-management';
import { StrategyManagement } from '@/components/service-delivery/strategy-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { BadgeManagement } from '@/components/teams/badge-management';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { WorkstationManagement as TeamWorkstationManagement } from '@/components/teams/workstation-management';
import { EventTemplateManagement } from '@/components/teams/event-template-management';
import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { SettingsContent } from '@/components/dashboard/tabs/settings-tab';
import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';

const componentMap: Record<string, React.ComponentType<any>> = {
  // Admin Page Tabs
  adminGroups: AdminGroupsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
  // Service Delivery Tabs
  calendars: CalendarManagement,
  teams: ServiceDeliveryTeamManagement,
  strategy: StrategyManagement,
  // Team Management Tabs
  team_members: TeamMembersView,
  badges: BadgeManagement,
  locations: PinnedLocationManagement,
  workstations: TeamWorkstationManagement,
  templates: EventTemplateManagement,
  // Main Content Tabs
  overview: OverviewContent,
  tasks: TasksContent,
  notifications: NotificationsContent,
  settings: SettingsContent,
  calendar: CalendarPageContent,
};


export default function DynamicPage() {
    const params = useParams();
    const { loading, appSettings } = useUser();
    
    // Reconstruct the path from the slug. `params.page` could be a string or an array.
    const slug = Array.isArray(params.page) ? params.page.join('/') : params.page;
    const currentPath = `/dashboard/${slug}`;

    const pageConfig = appSettings.pages.find(p => p.path === currentPath);
    
    if (loading) {
        return <Skeleton className="h-full w-full" />;
    }

    if (!pageConfig) {
        return <div>404 - Page configuration not found for path: {currentPath}</div>;
    }
    
    const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

    if (pageTabs.length === 0) {
      return (
         <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
              <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
            </div>
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">This page has no content. Add tabs in Admin Management.</p>
            </div>
        </div>
      )
    }

    // If there is only one tab, don't render the tab list, just the content.
    if (pageTabs.length === 1) {
        const tab = pageTabs[0];
        const ContentComponent = componentMap[tab.componentKey];
        return (
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
                    <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
                </div>
                {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </div>
        )
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
                <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
            </div>
            <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
                <TabsList className="flex w-full">
                {pageTabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
                    <GoogleSymbol name={tab.icon} className="text-lg" />
                    <span>{tab.name}</span>
                    </TabsTrigger>
                ))}
                </TabsList>
                {pageTabs.map(tab => {
                const ContentComponent = componentMap[tab.componentKey];
                return (
                    <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
                    </TabsContent>
                );
                })}
            </Tabs>
        </div>
    );
}
