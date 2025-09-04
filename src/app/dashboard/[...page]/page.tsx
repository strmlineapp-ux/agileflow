
'use client';

import { useMemo, useState } from 'react';
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
import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { SettingsContent } from '@/components/dashboard/tabs/settings-tab';
import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { ProjectsContent } from '@/components/dashboard/tabs/projects-tab';
import { EventsContent } from '@/components/dashboard/tabs/events-tab';
import { Tabs, TabsTrigger, TabsContent, SortableTabsList } from '@/components/ui/tabs';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { PageTitle } from '@/components/common/page-title';
import { cn } from '@/lib/utils';


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
  overview: OverviewContent,
  tasks: TasksContent,
  notifications: NotificationsContent,
  settings: SettingsContent,
  calendar: CalendarPageContent,
  projects: ProjectsContent,
  events: EventsContent,
  // Add other mappings as needed
};


export default function DynamicPage() {
  const params = useParams();
  const { appSettings, viewAsUser, loading, teams, updatePage } = useUser();
  const { page: pagePath } = params;
  
  const [activeTabValue, setActiveTabValue] = useState<string | undefined>();

  const path = Array.isArray(pagePath) ? `/dashboard/${pagePath.join('/')}` : `/dashboard/${pagePath}`;

  const { page, teamContext } = useMemo(() => {
    if (loading || !appSettings.pages.length) {
      return { page: null, teamContext: null };
    }

    const foundPage = appSettings.pages.find(p => p.isDynamic ? path.startsWith(p.path) : p.path === path);
    let foundTeam: Team | null = null;
    if (foundPage?.isDynamic) {
        const pathSegments = path.split('/');
        const teamId = pathSegments[pathSegments.length - 1];
        foundTeam = teams.find(t => t.id === teamId) || null;
    }
    
    if (!foundPage || !hasAccess(viewAsUser!, foundPage)) {
        return { page: null, teamContext: null };
    }

    return { page: foundPage, teamContext: foundTeam };
  }, [path, appSettings, viewAsUser, loading, teams]);

  useEffect(() => {
    if (page && page.associatedTabs.length > 0) {
      const firstTabId = page.associatedTabs[0];
      const firstTab = appSettings.tabs.find(t => t.id === firstTabId);
      if(firstTab) {
        setActiveTabValue(firstTab.id);
      }
    }
  }, [page, appSettings.tabs]);

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
          <h2 className="text-2xl mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">The page you are looking for does not exist or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const seamlessPageIds = ['page-overview', 'page-admin-management', 'page-calendar', 'page-tasks', 'page-notifications', 'page-settings'];

  const renderContent = () => {
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
    
    if (page.associatedTabs.length === 1 && pageTabs[0]) {
      const Component = componentMap[pageTabs[0].componentKey as keyof typeof componentMap];
      return Component ? <div className="flex-1 min-h-0"><Component tab={pageTabs[0]} page={page} team={teamContext} isSingleTabPage={true} isActive={true} /></div> : null;
    }
    
    const handleReorderPageTabs = (reorderedPageTabs: AppTab[]) => {
      const newTabIds = reorderedPageTabs.map(tab => tab.id);
      updatePage(page.id, { associatedTabs: newTabIds });
    };
    
    return (
       <Tabs value={activeTabValue} onValueChange={setActiveTabValue} className="flex flex-col h-full">
          <CenteredTabList>
            <SortableTabsList
                items={pageTabs}
                onReorder={handleReorderPageTabs}
                disabled={!viewAsUser.isAdmin}
            >
                {pageTabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                     <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
                     <span>{tab.name}</span>
                  </TabsTrigger>
                ))}
            </SortableTabsList>
          </CenteredTabList>
         <div className="flex-1 flex flex-col min-h-0 pt-6">
            {pageTabs.map(tab => {
                const Component = componentMap[tab.componentKey as keyof typeof componentMap];
                return Component ? (
                    <TabsContent 
                        key={tab.id} 
                        value={tab.id} 
                        className={cn("flex-col mt-0", activeTabValue === tab.id ? 'flex flex-1' : 'h-0')}
                    >
                      <Component tab={tab} page={page} team={teamContext} isActive={activeTabValue === tab.id} />
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
            <PageTitle 
              title={page.displayTitle || page.name}
              icon={page.icon}
              iconColor={page.color}
              onSave={(newTitle) => updatePage(page.id, { displayTitle: newTitle })}
              disabled={!viewAsUser.isAdmin}
            />
       )}
       {renderContent()}
    </div>
  )
}
