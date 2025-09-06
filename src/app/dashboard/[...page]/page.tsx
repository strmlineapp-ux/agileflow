

'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hasAccess } from '@/lib/permissions';
import { type AppTab, type Team, type AppPage, type BadgeCollection, type SharedCalendar, type Badge, type User } from '@/types';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, pointerWithin, type DragStartEvent, type DragEndEvent, type Active, type Over } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useToast } from '@/hooks/use-toast';

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
import { ManagementPageLayout } from '@/components/common/management-page-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

type DraggableItem = Team | SharedCalendar | BadgeCollection | AppPage | Badge | User;

const managementComponentKeys = new Set(['calendars', 'teams', 'badges', 'pages']);

export default function DynamicPage() {
  const params = useParams();
  const { viewAsUser, loading, appSettings, teams, reorderPages, addPage, updatePage, deletePage, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, reorderBadgeCollections, allBadges, addBadge, updateBadge, deleteBadge, reorderBadges, users, updateUser, reorderTeams, addTeam, updateTeam, deleteTeam, reorderCalendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { page: pagePath } = params;
  const { toast } = useToast();
  
  const [activeTabValue, setActiveTabValue] = useState<string | undefined>();
  const [activeDragItem, setActiveDragItem] = useState<DraggableItem | null>(null);

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
  
  const onDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.collection || event.active.data.current?.team || event.active.data.current?.calendar || event.active.data.current?.page || event.active.data.current?.badge || event.active.data.current?.user;
    if(item) setActiveDragItem(item);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeItemData = active.data.current;
    if (!activeItemData) return;

    // --- Badge Drag Logic ---
    if (activeItemData.type === 'badge') {
        const badge = activeItemData.badge as Badge;
        const sourceCollectionId = activeItemData.collectionId;
        const targetCollectionId = over.data.current?.type === 'collection'
            ? over.data.current.collection.id
            : over.data.current?.collectionId;

        if (targetCollectionId) {
            const targetCollection = allBadgeCollections.find(c => c.id === targetCollectionId);
            if(targetCollection && targetCollection.owner.id === viewAsUser.userId) {
                deleteBadge(badge.id, sourceCollectionId);
                updateBadgeCollection(targetCollection.id, {
                    badgeIds: [badge.id, ...targetCollection.badgeIds]
                });
            }
        } else if (over.id === `duplicate-badge-zone-${sourceCollectionId}`) {
            addBadge(sourceCollectionId, badge);
        }
        return;
    }

    // --- Card Drag Logic ---
    const allItems = [...appSettings.pages, ...teams, ...allBadgeCollections, ...calendars];
    const activeItem = allItems.find(i => i.id === active.id);
    if (!activeItem) return;

    const entityType = 
        'path' in activeItem ? 'page' : 
        'members' in activeItem ? 'team' :
        'badgeIds' in activeItem ? 'collection' :
        'googleCalendarId' in activeItem ? 'calendar' :
        null;
        
    if (!entityType) return;
    
    // Handle duplication
    if (over.id === `duplicate-${entityType}-zone`) {
        if (entityType === 'page') addPage(activeItem);
        if (entityType === 'team') addTeam(activeItem);
        if (entityType === 'collection') addBadgeCollection(viewAsUser, activeItem);
        if (entityType === 'calendar') addCalendar(activeItem);
        toast({ title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Duplicated` });
        return;
    }
    
    // Handle sharing/unlinking
    if (over.id === `shared-${entityType}-panel`) {
        if (activeItem.owner?.id === viewAsUser.userId) {
            const isNowShared = !activeItem.isShared;
            if (entityType === 'page') updatePage(activeItem.id, { isShared: isNowShared });
            if (entityType === 'team') updateTeam(activeItem.id, { isShared: isNowShared });
            if (entityType === 'collection') updateBadgeCollection(activeItem.id, { isShared: isNowShared });
            if (entityType === 'calendar') updateCalendar(activeItem.id, { isShared: isNowShared });
            toast({ title: isNowShared ? 'Item Shared' : 'Item Unshared' });
        } else {
            // Unlink from personal board
             if (entityType === 'page') updateUser(viewAsUser.userId, { linkedPageIds: (viewAsUser.linkedPageIds || []).filter(id => id !== activeItem.id) });
             if (entityType === 'team') updateUser(viewAsUser.userId, { linkedTeamIds: (viewAsUser.linkedTeamIds || []).filter(id => id !== activeItem.id) });
             if (entityType === 'collection') updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: (viewAsUser.linkedBadgeCollectionIds || []).filter(id => id !== activeItem.id) });
             if (entityType === 'calendar') updateUser(viewAsUser.userId, { linkedCalendarIds: (viewAsUser.linkedCalendarIds || []).filter(id => id !== activeItem.id) });
            toast({ title: 'Item Unlinked' });
        }
        return;
    }
    
    // Handle linking from shared panel
    if (activeItemData.isSharedPreview) {
        if (over.id === 'collections-list' || over.data.current?.type === `${entityType}-card`) {
             if (entityType === 'page') updateUser(viewAsUser.userId, { linkedPageIds: [...(viewAsUser.linkedPageIds || []), activeItem.id] });
             if (entityType === 'team') updateUser(viewAsUser.userId, { linkedTeamIds: [...(viewAsUser.linkedTeamIds || []), activeItem.id] });
             if (entityType === 'collection') updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: [...(viewAsUser.linkedBadgeCollectionIds || []), activeItem.id] });
             if (entityType === 'calendar') updateUser(viewAsUser.userId, { linkedCalendarIds: [...(viewAsUser.linkedCalendarIds || []), activeItem.id] });
            toast({ title: 'Item Linked' });
        }
        return;
    }
    
    // Handle reordering
    if (over.id && active.id !== over.id && !activeItemData.isSharedPreview) {
        const itemSet = 
            entityType === 'page' ? appSettings.pages :
            entityType === 'team' ? teams :
            entityType === 'collection' ? allBadgeCollections :
            calendars;
            
        const reorderFn = 
            entityType === 'page' ? reorderPages :
            entityType === 'team' ? reorderTeams :
            entityType === 'collection' ? reorderBadgeCollections :
            reorderCalendars;

        const oldIndex = itemSet.findIndex(item => item.id === active.id);
        const newIndex = itemSet.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            reorderFn(arrayMove(itemSet, oldIndex, newIndex));
        }
    }
  };
  
  const renderDragOverlay = () => {
    if (!activeDragItem) return null;
    
    if ('badgeIds' in activeDragItem) { // BadgeCollection
        return <GoogleSymbol name={activeDragItem.icon} style={{color: activeDragItem.color, fontSize: '48px'}} />;
    }
    if ('ownerCollectionId' in activeDragItem) { // Badge
        return (
            <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card shadow-lg" style={{ borderColor: activeDragItem.color }}>
                <GoogleSymbol name={activeDragItem.icon} style={{ fontSize: '28px', color: activeDragItem.color }} weight={100} />
            </div>
        );
    }
    if ('members' in activeDragItem) { // Team
        return <GoogleSymbol name={activeDragItem.icon} style={{color: activeDragItem.color, fontSize: '48px'}} />;
    }
    if ('googleCalendarId' in activeDragItem) { // SharedCalendar
        return <GoogleSymbol name={activeDragItem.icon} style={{color: activeDragItem.color, fontSize: '48px'}} />;
    }
     if ('path' in activeDragItem) { // AppPage
        return <GoogleSymbol name={activeDragItem.icon} style={{color: activeDragItem.color, fontSize: '48px'}} />;
    }
     if ('email' in activeDragItem) { // User
        return (
            <Avatar className="h-12 w-12">
                <AvatarImage src={activeDragItem.avatarUrl} alt={activeDragItem.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{activeDragItem.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
        )
    }

    return null;
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    
    const activeComponentKey = pageTabs.find(t => t.id === activeTabValue)?.componentKey;
    const isManagementPage = activeComponentKey && managementComponentKeys.has(activeComponentKey);
    
    const handleReorderPageTabs = (reorderedPageTabs: AppTab[]) => {
      const newTabIds = reorderedPageTabs.map(tab => tab.id);
      updatePage(page.id, { associatedTabs: newTabIds });
    };

    const renderTabContent = (tab: AppTab) => {
      const Component = componentMap[tab.componentKey as keyof typeof componentMap];
      if (!Component) return null;
      
      const props = {
        tab: tab,
        page: page,
        team: teamContext,
        isSingleTabPage: pageTabs.length === 1,
        isActive: activeTabValue === tab.id,
        isDragging: !!activeDragItem
      };

      if (isManagementPage && (Component === CalendarManagement || Component === TeamManagement || Component === BadgeManagement || Component === PagesManagement)) {
        return <Component {...props} />;
      }
      
      return <Component {...props} />;
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
         <div className="flex-1 pt-6 min-h-0">
            {pageTabs.map(tab => (
                <TabsContent 
                    key={tab.id} 
                    value={tab.id} 
                    className="mt-0 h-full"
                >
                  <div className="h-full overflow-hidden">
                    {renderTabContent(tab)}
                  </div>
                </TabsContent>
            ))}
        </div>
      </Tabs>
    )
  }
  
  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={pointerWithin}>
        <div className="h-full flex flex-col gap-6">
           {!seamlessPageIds.includes(page.id) && (
                <PageTitle 
                  title={page.displayTitle || page.name}
                  icon={page.icon}
                  iconColor={page.color}
                  onSave={(newTitle) => updatePage(page.id, { displayTitle: newTitle })}
                  disabled={!viewAsUser.isAdmin}
                />
           )}
           <div className="flex-1 min-h-0">
               {renderContent()}
           </div>
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {renderDragOverlay()}
        </DragOverlay>
    </DndContext>
  )
}
