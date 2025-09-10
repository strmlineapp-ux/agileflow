
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hasAccess } from '@/lib/permissions';
import { type AppTab, type Team, type AppPage, type SharedCalendar, type User } from '@/types';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, pointerWithin, type DragStartEvent, type DragEndEvent, type Active, type Over } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useToast } from '@/hooks/use-toast';
import { useDataQueries } from '@/hooks/use-data-queries';

import { Tabs, TabsTrigger, TabsContent, SortableTabsList } from '@/components/ui/tabs';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { PageTitle } from '@/components/common/page-title';
import { ManagementPageLayout } from '@/components/common/management-page-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DuplicateZone } from '@/components/common/duplicate-zone';
import { SharedItemsPanel } from '@/components/common/shared-items-panel';
import { cn } from '@/lib/utils';

export function DynamicPageClient({ page: initialPage, teamContext: initialTeamContext, componentMap, params, user }: {
    page: AppPage;
    teamContext: Team | null;
    componentMap: any;
    params: { page: string[] };
    user: User | null;
}) {
  const { viewAsUser, loading } = useUser();
  const { useFetchAppSettings, useUpdatePage } = useDataQueries();
  const { toast } = useToast();
  
  const [activeTabValue, setActiveTabValue] = useState<string | undefined>();
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [teamContext, setTeamContext] = useState(initialTeamContext);

  const { data: appSettings } = useFetchAppSettings(viewAsUser?.workspaceId);
  const updatePageMutation = useUpdatePage();

  useEffect(() => {
    setPage(initialPage);
    setTeamContext(initialTeamContext);
  }, [initialPage, initialTeamContext]);

  useEffect(() => {
    const tabs = appSettings?.tabs;
    if (page && page.associatedTabs.length > 0 && Array.isArray(tabs)) {
      const firstTabId = page.associatedTabs[0];
      const firstTab = tabs.find((t: AppTab) => t.id === firstTabId);
      if(firstTab) {
        setActiveTabValue(firstTab.id);
      }
    }
  }, [page, appSettings]);
  
  const onDragStart = (event: DragStartEvent) => {
    const itemData = event.active.data.current;
    setActiveDragItem(itemData);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;
  };

  const renderDragOverlay = () => {
    if (!activeDragItem) return null;
    // Drag overlay logic can be implemented here if needed
    return null;
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const effectiveUser = viewAsUser || user;

  if (loading || !effectiveUser) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
      </div>
    );
  }
  
  if (!page || !hasAccess(effectiveUser, page)) {
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
  
  const renderTabContent = (tab: AppTab) => {
    const Component = componentMap[tab.componentKey as keyof typeof componentMap];
    if (!Component) return null;
    
    const props = {
      tab: tab,
      page: page,
      team: teamContext,
      isSingleTabPage: (page.associatedTabs || []).length === 1,
      isActive: activeTabValue === tab.id,
      isSharedPanelOpen,
      setIsSharedPanelOpen,
      isDragging: !!activeDragItem,
    };
    
    return <Component {...props} />;
  };

  const renderContent = () => {
    const tabs = appSettings?.tabs;
    if (!Array.isArray(tabs)) {
      return (
         <div className="text-center text-muted-foreground">
           <p>Error: Application tabs are not configured. Please contact support.</p>
         </div>
       );
    }

    const pageTabs = page.associatedTabs
        .map(tabId => tabs.find((t: AppTab) => t.id === tabId))
        .filter((t): t is AppTab => !!t);

    if (pageTabs.length === 0) {
       return (
          <div className="text-center text-muted-foreground">
            <p>This page has no content tabs configured.</p>
          </div>
        );
    }
    
    const isManagementPage = pageTabs.some(t => ['calendars', 'teams', 'badges', 'pages'].includes(t.componentKey));
    
    const handleReorderPageTabs = (reorderedPageTabs: AppTab[]) => {
      const newTabIds = reorderedPageTabs.map(tab => tab.id);
      updatePageMutation.mutate({ pageId: page.id, data: { associatedTabs: newTabIds }});
    };

    return (
       <Tabs value={activeTabValue} onValueChange={setActiveTabValue} className="flex flex-col h-full">
          <CenteredTabList>
            <SortableTabsList
                items={pageTabs}
                onReorder={handleReorderPageTabs}
                disabled={!effectiveUser.isAdmin}
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
                  <div className={cn("h-full flex flex-col", isManagementPage && "overflow-hidden")}>
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
                  onSave={(newTitle) => updatePageMutation.mutate({ pageId: page.id, data: { displayTitle: newTitle } })}
                  disabled={!effectiveUser.isAdmin}
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
