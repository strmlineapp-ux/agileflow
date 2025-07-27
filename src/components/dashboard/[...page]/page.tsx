
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { type AppTab, type AppPage } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

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
import { TeamManagement } from '@/components/teams/team-management';

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
  // Correctly mapped generic components
  calendars: CalendarManagement,
  teams: TeamManagement,
};

const ADMIN_PAGE_ID = 'page-admin-management';
const ADMIN_TAB_ORDER = ['tab-admins', 'tab-admin-pages', 'tab-admin-tabs'];
const SEAMLESS_PAGES = ['page-overview', 'page-notifications', 'page-settings', 'page-admin-management', 'page-calendar', 'page-tasks'];

function SortableTabsTrigger({ id, children, className, ...props }: { id: string; children: React.ReactNode, className?: string } & React.ComponentProps<typeof TabsTrigger>) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TabsTrigger ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(className, isDragging && "opacity-50")} {...props}>
            {children}
        </TabsTrigger>
    );
}

export default function DynamicPage() {
    const params = useParams();
    const { loading, appSettings, teams, viewAsUser, updateAppSettings, isDragModifierPressed } = useUser();
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
                // Only set active tab if it's not already set or if the current active tab is no longer valid for this page
                if (!activeTab || !pageTabs.find(t => t.id === activeTab)) {
                    setActiveTab(pageTabs[0].id);
                }
            }
        }
    }, [pageConfig, appSettings.tabs, activeTab]);

    const pageTabs = useMemo(() => {
      if (!pageConfig) return [];
      // If we are on the admin page, force a specific order.
      if (pageConfig.id === ADMIN_PAGE_ID) {
          const adminTabs = new Map(appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id)).map(t => [t.id, t]));
          return ADMIN_TAB_ORDER.map(id => adminTabs.get(id)).filter((t): t is AppTab => !!t);
      }
      
      // For other pages, respect the order in associatedTabs
      const pageTabMap = new Map(appSettings.tabs.map(t => [t.id, t]));
      return pageConfig.associatedTabs
        .map(tabId => pageTabMap.get(tabId))
        .filter((t): t is AppTab => !!t);
    }, [pageConfig, appSettings.tabs]);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            onActivation: ({ event }) => {
                if (!isDragModifierPressed) {
                    return false;
                }
                return true;
            },
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
          onActivation: ({ event }) => {
            if (!isDragModifierPressed) {
                return false;
            }
            return true;
          }
        })
    );
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = pageTabs.findIndex((tab) => tab.id === active.id);
            const newIndex = pageTabs.findIndex((tab) => tab.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedTabIds = arrayMove(pageTabs, oldIndex, newIndex).map(t => t.id);
                const newPages = appSettings.pages.map(p => 
                    p.id === pageConfig!.id ? { ...p, associatedTabs: newOrderedTabIds } : p
                );
                updateAppSettings({ pages: newPages });
            }
        }
    };


    if (loading) {
        return <Skeleton className="h-full w-full" />;
    }

    if (!pageConfig || (pageConfig.isDynamic && pageConfig.path !== currentPath && !dynamicTeam)) {
        return <div className="p-4">404 - Page not found or team data is missing for path: {currentPath}</div>;
    }
    
    const showHeader = !SEAMLESS_PAGES.includes(pageConfig.id);
      
    const pageTitle = pageConfig.isDynamic && dynamicTeam ? `${dynamicTeam.name} ${pageConfig.name}` : pageConfig.name;

    if (pageTabs.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-4xl" weight={100} />
                    <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
                </div>
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <p>This page has no content configured.</p>
                    {viewAsUser?.isAdmin && <p>An administrator can add tabs to this page in the Admin section.</p>}
                </div>
            </div>
        );
    }
    
    // For seamless pages, we let the component inside handle its own title if needed.
    // For other multi-tab pages, we show a main header and then the tabs.
    const isSingleTabPage = pageTabs.length === 1;
    if (isSingleTabPage && !showHeader) {
        const tab = pageTabs[0];
        const contextTeam = tab.contextTeamId ? teams.find(t => t.id === tab.contextTeamId) : dynamicTeam;
        const ContentComponent = componentMap[tab.componentKey];
        return ContentComponent ? <ContentComponent tab={tab} team={contextTeam} page={pageConfig} isSingleTabPage={true} /> : <div>Component for {tab.name} not found.</div>;
    }
    
    return (
        <div className="flex flex-col gap-6">
            {showHeader && (
                <div className="flex items-center gap-3">
                    <GoogleSymbol name={pageConfig.icon} className="text-4xl" weight={100} />
                    <h1 className="font-headline text-3xl font-thin">{pageTitle}</h1>
                </div>
            )}
            <Tabs defaultValue={pageTabs[0]?.id} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                    <SortableContext items={pageTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                        <TabsList className="flex w-full">
                        {pageTabs.map(tab => (
                            <SortableTabsTrigger key={tab.id} id={tab.id} value={tab.id} className="flex-1 gap-2">
                                <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
                                <span>{tab.name}</span>
                            </SortableTabsTrigger>
                        ))}
                        </TabsList>
                    </SortableContext>
                </DndContext>
                {pageTabs.map(tab => {
                    const ContentComponent = componentMap[tab.componentKey];
                    const contextTeam = tab.contextTeamId ? teams.find(t => t.id === tab.contextTeamId) : dynamicTeam;
                    return (
                        <TabsContent key={tab.id} value={tab.id} className="mt-4">
                        {ContentComponent ? <ContentComponent tab={tab} team={contextTeam} page={pageConfig} isSingleTabPage={false} isActive={activeTab === tab.id} /> : <div>Component for {tab.name} not found.</div>}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}

    