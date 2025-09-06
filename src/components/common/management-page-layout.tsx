

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { type User, type Team, type SharedCalendar, type BadgeCollection, type AppPage } from '@/types';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, sortableKeyboardCoordinates, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { CompactSearchInput } from './compact-search-input';
import { SharedItemsPanel } from './shared-items-panel';
import { GoogleSymbol } from '../icons/google-symbol';
import { useToast } from '@/hooks/use-toast';
import { DuplicateZone } from './duplicate-zone';
import { getHueFromHsl, isHueInRange, cn } from '@/lib/utils';
import { PageTitle } from './page-title';
import { DraggableGrid } from './draggable-grid';

type TEntity = (Team | SharedCalendar | BadgeCollection | AppPage) & { id: string, name: string, icon: string, color: string, owner?: {id: string}, isShared?: boolean };

interface ManagementPageLayoutProps<T extends TEntity> {
  pageTitle: string;
  onPageTitleSave: (newTitle: string) => void;
  onPageTitleReset?: (e: React.MouseEvent) => void;
  canManagePage: boolean;
  
  entityType: 'team' | 'calendar' | 'collection' | 'page';
  
  // All items for the grid (owned and linked)
  allItems: T[];
  
  // All shared items from other users
  allSharedItems: T[];

  // CRUD and state management functions
  onAddItem: (sourceItem?: T) => void;
  onUpdateItem: (itemId: string, data: Partial<T>) => void;
  onDeleteItem: (item: T) => void;
  onReorderItems: (reorderedItems: T[]) => void;
  onLinkItem: (itemId: string) => void;

  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  
  isActive: boolean; // For auto-focusing search
  customDragEnd?: (event: DragEndEvent) => void; // Allow custom drag end logic
}

export function ManagementPageLayout<T extends TEntity>({
  pageTitle,
  onPageTitleSave,
  onPageTitleReset,
  canManagePage,
  entityType,
  allItems,
  allSharedItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onLinkItem,
  renderItem,
  isActive,
  customDragEnd,
}: ManagementPageLayoutProps<T>) {
  const { viewAsUser } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [sharedSearchTerm, setSharedSearchTerm] = useState('');
  const [sharedColorFilter, setSharedColorFilter] = useState<string | null>(null);
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
  
  const displayedItems = useMemo(() => {
    let filtered = allItems;
    if (searchTerm) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (colorFilter) {
      const targetHue = getHueFromHsl(colorFilter);
      if (targetHue !== null) {
        filtered = filtered.filter(item => {
          const itemHue = item.color ? getHueFromHsl(item.color) : null;
          return itemHue !== null && isHueInRange(targetHue, itemHue);
        });
      }
    }
    return filtered;
  }, [allItems, searchTerm, colorFilter]);

  const sharedItems = useMemo(() => {
    let filtered = allSharedItems;
    if (sharedSearchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(sharedSearchTerm.toLowerCase())
      );
    }
    if (sharedColorFilter) {
      const targetHue = getHueFromHsl(sharedColorFilter);
      if (targetHue !== null) {
        filtered = filtered.filter(item => {
          const itemHue = item.color ? getHueFromHsl(item.color) : null;
          return itemHue !== null && isHueInRange(targetHue, itemHue);
        });
      }
    }
    return filtered;
  }, [allSharedItems, sharedSearchTerm, sharedColorFilter]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    if (customDragEnd) {
      customDragEnd(event);
      return;
    }

    const { active, over } = event;
    if (!over) return;

    const activeItem = allItems.find(i => i.id === active.id) || allSharedItems.find(i => i.id === active.id);
    if (!activeItem || !viewAsUser) return;

    // Handle dropping on duplicate zone
    if (over.id === `duplicate-${entityType}-zone`) {
      onAddItem(activeItem as T);
      return;
    }
    
    // Handle dropping on shared panel
    if (over.id === `shared-${entityType}-panel`) {
      if (activeItem.owner?.id === viewAsUser.userId) { // If owned, toggle share status
        onUpdateItem(activeItem.id, { isShared: !activeItem.isShared } as Partial<T>);
        toast({ title: activeItem.isShared ? `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Unshared` : `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Shared` });
      } else { // If linked, unlink it
        onDeleteItem(activeItem as T);
      }
      return;
    }
    
    // Handle linking from shared panel
    const isSharedPreview = active.data.current?.isSharedPreview;
    if (isSharedPreview && over.id === `collections-list`) { // Use a static ID for the main board droppable area
        onLinkItem(active.id as string);
        return;
    }

    // Handle reordering
    const overIsCard = over.data.current?.type === `${entityType}-card` || over.data.current?.type === 'collection-card';
    if (overIsCard && active.id !== over.id) {
        const oldIndex = displayedItems.findIndex(item => item.id === active.id);
        const newIndex = displayedItems.findIndex(item => item.id === over.id);
        if (oldIndex > -1 && newIndex > -1) {
            onReorderItems(arrayMove(displayedItems, oldIndex, newIndex));
        }
    }
  };
  
  const entityTitle = entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's';
  
  const gridClassName = cn(
    "gap-4",
    isSharedPanelOpen
      ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4"
      : "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
  );

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <PageTitle
              title={pageTitle}
              onSave={onPageTitleSave}
              onReset={onPageTitleReset}
              disabled={!canManagePage}
            />
            <DuplicateZone id={`duplicate-${entityType}-zone`} onAdd={() => onAddItem()} isDragging={false} />
          </div>
          <div className="flex items-center gap-1">
            <CompactSearchInput
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder={`Search ${entityType}s...`}
              autoFocus={isActive}
              showColorFilter={true}
              onColorSelect={setColorFilter}
              activeColorFilter={colorFilter}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                    <GoogleSymbol name="dynamic_feed" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Show Shared {entityTitle}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="h-full overflow-y-auto">
          <DraggableGrid
              id="collections-list"
              items={displayedItems}
              setItems={onReorderItems}
              onDragEnd={handleDragEnd}
              className={gridClassName}
              renderItem={renderItem}
          >
            {displayedItems.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No {entityType}s to display.</p>}
          </DraggableGrid>
        </div>
      </div>
      <div className={cn(
          "transition-all duration-300", 
          isSharedPanelOpen ? "w-96" : "w-0"
      )}>
          <SharedItemsPanel
            isOpen={isSharedPanelOpen}
            type={entityType}
            title={`Shared ${entityTitle}`}
            description={`Drag a ${entityType} you own here to share it. Drag a ${entityType} to your board to link it.`}
            items={sharedItems}
            searchTerm={sharedSearchTerm}
            setSearchTerm={setSharedSearchTerm}
            colorFilter={sharedColorFilter}
            onColorFilterChange={setSharedColorFilter}
            renderItem={renderItem}
            onDrop={handleDragEnd}
          />
      </div>
    </div>
  );
}
