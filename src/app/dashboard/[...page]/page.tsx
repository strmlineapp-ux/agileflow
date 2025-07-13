
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { type AppTab, type AppPage } from '@/types';

// Import all possible tab components
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
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
import { CalendarManagement } from '@/components/calendar/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';

const componentMap: Record<string, React.ComponentType<any>> = {
  // Admin Page Tabs
  admins: AdminsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
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
  // Service Delivery Tabs
  calendars: CalendarManagement,
  teams: TeamManagement,
};

const ADMIN_PAGE_ID = 'page-admin-management';
const ADMIN_TAB_ORDER = ['tab-admins', 'tab-admin-pages', 'tab-admin-tabs'];


export default function DynamicPage() {
    const params = useParams();
    const { loading, appSettings, teams, viewAsUser } = useUser();
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    
    const slug = Array.isArray(params.page) ? params.page.join('/') : (params.page || '');
    const currentPath = `/dashboard/${slug}`;

    const { pageConfig, dynamicTeam } = useMemo(() => {
        const page = [...appSettings.pages]
            .sort((a, b) => b.path.length - a.path.length) 
            .find(p => currentPath.startsWith(p.path));

        if (!page) {
            return { pageConfig: null, dynamicTeam: null };
        }

        if (page.isDynamic) {
            const pathSegments = page.path.split('/').filter(Boolean);
            const urlSegments = currentPath.split('/').filter(Boolean);
            
            if (urlSegments.length > pathSegments.length) {
                const teamId = urlSegments[pathSegments.length];
                const team = teams.find(t => t.id === teamId);
                return { pageConfig: page, dynamicTeam: team };
            }
        }
        
        return { pageConfig: page, dynamicTeam: undefined };
    }, [appSettings.pages, currentPath, teams]);

    useEffect(() => {
        if (pageConfig) {
            const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));
            if (pageTabs.length > 0) {
                setActiveTab(pageTabs[0].id);
            }
        }
    }, [pageConfig, appSettings.tabs]);

    if (loading) {
        return <Skeleton className="h-full w-full" />;
    }

    if (!pageConfig || (pageConfig.isDynamic && pageConfig.path !== currentPath && !dynamicTeam)) {
        return <div className="p-4">404 - Page not found or team data is missing for path: {currentPath}</div>;
    }
    
    const pageTabs = useMemo(() => {
      // If we are on the admin page, force a specific order.
      if (pageConfig.id === ADMIN_PAGE_ID) {
          const adminTabs = new Map(appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id)).map(t => [t.id, t]));
          return ADMIN_TAB_ORDER.map(id => adminTabs.get(id)).filter((t): t is AppTab => !!t);
      }
      // Otherwise, use the order from appSettings.
      return appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));
    }, [pageConfig, appSettings.tabs]);

    const isSingleTabPage = pageTabs.length === 1;

    // Don't show header for seamless single-tab pages
    const showHeader = !isSingleTabPage || !['tab-overview', 'tab-notifications', 'tab-settings', 'tab-admins'].includes(pageTabs[0]?.id);
      
    const pageTitle = pageConfig.isDynamic && dynamicTeam ? `${dynamicTeam.name} ${pageConfig.name}` : pageConfig.name;

    if (pageTabs.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
                    <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
                </div>
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <p>This page has no content configured.</p>
                    {viewAsUser.isAdmin && <p>An administrator can add tabs to this page in the Admin section.</p>}
                </div>
            </div>
        );
    }
    
    if (isSingleTabPage) {
        const tab = pageTabs[0];
        const contextTeam = tab.contextTeamId ? teams.find(t => t.id === tab.contextTeamId) : dynamicTeam;
        const ContentComponent = componentMap[tab.componentKey];
        return ContentComponent ? <ContentComponent tab={tab} team={contextTeam} page={pageConfig} isSingleTabPage={true} isTeamSpecificPage={pageConfig.isDynamic} /> : <div>Component for {tab.name} not found.</div>;
    }
    
    return (
        <div className="flex flex-col gap-6">
            {showHeader && (
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
                    <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
                </div>
            )}
            <Tabs defaultValue={pageTabs[0]?.id} value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        {ContentComponent ? <ContentComponent tab={tab} team={contextTeam} page={pageConfig} isSingleTabPage={false} isActive={activeTab === tab.id} isTeamSpecificPage={pageConfig.isDynamic} /> : <div>Component for {tab.name} not found.</div>}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
