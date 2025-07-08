
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { type AppTab, type AppPage } from '@/types';
import { hasAccess } from '@/lib/permissions';

// Import all possible tab components
import { AdminGroupsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement as ServiceDeliveryTeamManagement } from '@/components/service-delivery/team-management';
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
  // Team Management Tabs
  team_members: TeamMembersView,
  badges: BadgeManagement,
  locations: PinnedLocationManagement,
  workstations: TeamWorkstationManagement,
  templates: EventTemplateManagement,
  // Main Content Tabs (formerly static pages)
  overview: OverviewContent,
  calendar: CalendarPageContent,
  tasks: TasksContent,
  notifications: NotificationsContent,
  settings: SettingsContent,
};


export default function DynamicPage() {
    const params = useParams();
    const { loading, appSettings, teams, viewAsUser } = useUser();
    
    const slug = Array.isArray(params.page) ? params.page.join('/') : (params.page || '');
    const currentPath = `/dashboard/${slug}`;

    const pageConfig = useMemo(() => {
        return [...appSettings.pages]
            .sort((a, b) => b.path.length - a.path.length) // Sort to match more specific paths first e.g. /dashboard/teams over /dashboard
            .find(p => currentPath.startsWith(p.path));
    }, [appSettings.pages, currentPath]);
    
    const dynamicTeam = useMemo(() => {
      const teamId = pageConfig?.isDynamic && Array.isArray(params.page) ? params.page[1] : undefined;
      return teams.find(t => t.id === teamId)
    }, [teams, pageConfig, params.page]);

    const userAdminGroupIds = useMemo(() => new Set(appSettings.adminGroups.filter(ag => (viewAsUser.roles || []).includes(ag.name)).map(ag => ag.id)), [appSettings.adminGroups, viewAsUser.roles]);

    if (loading) {
        return <Skeleton className="h-full w-full" />;
    }

    if (!pageConfig || (pageConfig.isDynamic && !dynamicTeam && pageConfig.id !== 'page-team-management')) {
        return <div className="p-4">404 - Page not found for path: {currentPath}</div>;
    }
    
    const pageTabs = appSettings.tabs
      .filter(t => pageConfig.associatedTabs.includes(t.id))
      .filter(t => {
        // A tab is visible if its parent page is visible, UNLESS the tab itself has an admin group restriction.
        if (t.access?.adminGroups && t.access.adminGroups.length > 0) {
          // If restricted, user must be a system admin or in one of the specified groups.
          return viewAsUser.isAdmin || t.access.adminGroups.some(reqId => userAdminGroupIds.has(reqId));
        }
        // Otherwise, if it has no restrictions, it's visible because we already know the user can see the page.
        return true;
      });
      
    const pageTitle = pageConfig.isDynamic && dynamicTeam ? `${dynamicTeam.name} ${pageConfig.name}` : pageConfig.name;

    // Render page with no tabs (single view)
    if (pageTabs.length === 0) {
        const ContentComponent = pageConfig.componentKey ? componentMap[pageConfig.componentKey] : null;
        
        if (ContentComponent) {
            const pseudoTab: AppPage = { ...pageConfig, componentKey: pageConfig.componentKey as any };
            return <ContentComponent tab={pseudoTab} team={dynamicTeam} page={pageConfig} />;
        }

        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
                    <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
                </div>
            </div>
        );
    }
    
    // Render page with single tab (no tab list)
    if (pageTabs.length === 1) {
        const tab = pageTabs[0];
        const contextTeam = tab.contextTeamId ? teams.find(t => t.id === tab.contextTeamId) : dynamicTeam;
        const ContentComponent = componentMap[tab.componentKey];
        // The page header is rendered directly by the content component.
        // We pass the page's title, icon, and description to the tab to ensure the correct header is displayed.
        const pageAsTab = { ...tab, name: pageTitle, icon: pageConfig.icon, description: tab.description };
        return ContentComponent ? <ContentComponent tab={pageAsTab} team={contextTeam} page={pageConfig} /> : <div>Component for {tab.name} not found.</div>;
    }
    
    // Render page with multiple tabs
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
                <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
            </div>
            <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
                <TabsList className="flex w-full">
                {pageTabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
                    <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
                    <span>{tab.name}</span>
                    </TabsTrigger>
                ))}
                </TabsList>
                {pageTabs.map(tab => {
                    const ContentComponent = componentMap[tab.componentKey];
                    const contextTeam = tab.contextTeamId ? teams.find(t => t.id === tab.contextTeamId) : dynamicTeam;
                    return (
                        <TabsContent key={tab.id} value={tab.id} className="mt-4">
                        {ContentComponent ? <ContentComponent tab={tab} team={contextTeam} page={pageConfig} /> : <div>Component for {tab.name} not found.</div>}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
