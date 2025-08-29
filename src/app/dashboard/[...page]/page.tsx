
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hasAccess } from '@/lib/permissions';
import { type AppTab, type Team } from '@/types';

// Import all possible tab content components
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { BadgeManagement } from '@/components/teams/badge-management';
import { CalendarManagement } from '@/components/calendar/calendar-management';
import { TeamManagement } from '@/components/teams/team-management';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { WorkstationManagement } from '@/components/settings/workstation-management';
import { EventTemplateManagement } from '@/components/teams/event-template-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const componentMap = {
  admins: AdminsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
  badges: BadgeManagement,
  calendars: CalendarManagement,
  teams: TeamManagement,
  locations: PinnedLocationManagement,
  workstations: WorkstationManagement,
  templates: EventTemplateManagement,
  team_members: TeamMembersView,
  // Add other mappings as needed
};


export default function DynamicPage() {
  const params = useParams();
  const { appSettings, viewAsUser, loading, teams } = useUser();
  const { page: pagePath } = params;

  const path = Array.isArray(pagePath) ? `/dashboard/${pagePath.join('/')}` : `/dashboard/${pagePath}`;

  const { page, activeTab, teamContext } = useMemo(() => {
    if (loading || !appSettings.pages.length) {
      return { page: null, activeTab: null, teamContext: null };
    }

    const foundPage = appSettings.pages.find(p => p.isDynamic ? path.startsWith(p.path) : p.path === path);
    let foundTeam: Team | null = null;
    if (foundPage?.isDynamic) {
        const pathSegments = path.split('/');
        const teamId = pathSegments[pathSegments.length - 1];
        foundTeam = teams.find(t => t.id === teamId) || null;
    }
    
    if (!foundPage || !hasAccess(viewAsUser!, foundPage)) {
        return { page: null, activeTab: null, teamContext: null };
    }

    const firstTabId = foundPage.associatedTabs[0];
    const firstTab = appSettings.tabs.find(t => t.id === firstTabId);

    return { page: foundPage, activeTab: firstTab, teamContext: foundTeam };
  }, [path, appSettings, viewAsUser, loading, teams]);


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
      </div>
    );
  }
  
  if (!page) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-headline text-2xl font-thin mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">The page you are looking for does not exist or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const seamlessPageIds = ['page-overview', 'page-admin-management', 'page-calendar', 'page-tasks', 'page-notifications', 'page-settings'];

  const renderContent = () => {
    if (page.associatedTabs.length === 1 && activeTab) {
      const Component = componentMap[activeTab.componentKey as keyof typeof componentMap];
      return Component ? <Component tab={activeTab} page={page} team={teamContext} isSingleTabPage={true} /> : null;
    }
    
    const pageTabs = page.associatedTabs
        .map(tabId => appSettings.tabs.find(t => t.id === tabId))
        .filter((t): t is AppTab => !!t);

    if (pageTabs.length === 0) {
       return (
          <div className="text-center text-muted-foreground">
            <p>This page has no content tabs configured.</p>
          </div>
        );
    }
    
    return (
      <Tabs defaultValue={pageTabs[0].id} className="flex flex-col flex-1 gap-6">
        <TabsList className="w-full justify-around">
            {pageTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    <GoogleSymbol name={tab.icon} className="text-lg" />
                    {tab.name}
                </TabsTrigger>
            ))}
        </TabsList>
         <div className="flex-1 overflow-y-auto">
            {pageTabs.map(tab => {
                const Component = componentMap[tab.componentKey as keyof typeof componentMap];
                return Component ? (
                    <TabsContent key={tab.id} value={tab.id} className="h-full">
                        <Component tab={tab} page={page} team={teamContext} />
                    </TabsContent>
                ) : null;
            })}
        </div>
      </Tabs>
    )
  }
  
  return (
    <div className="flex flex-col h-full gap-6">
       {!seamlessPageIds.includes(page.id) && (
            <h1 className="font-headline text-2xl font-thin text-muted-foreground flex items-center gap-2">
                <GoogleSymbol name={page.icon} style={{color: page.color}} />
                {teamContext ? `${teamContext.name}: ${page.name}` : page.name}
            </h1>
       )}
       {renderContent()}
    </div>
  )
}
