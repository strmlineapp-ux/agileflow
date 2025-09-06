
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
  
  entityType: string;
  
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

  onDragEnd?: (event: DragEndEvent) => void;

  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  
  isActive: boolean;
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
  onDragEnd,
  renderItem,
  isActive,
}: ManagementPageLayoutProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [sharedSearchTerm, setSharedSearchTerm] = useState('');
  const [sharedColorFilter, setSharedColorFilter] = useState<string | null>(null);
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const displayedItems = useMemo(() => {
    if (!allItems) return [];
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
  
  const entityTitle = entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's' : '';
  
  const gridClassName = cn(
    "gap-4",
    isSharedPanelOpen
      ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4"
      : "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
  );
  
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(event);
    } else {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          const oldIndex = allItems.findIndex(item => item.id === active.id);
          const newIndex = allItems.findIndex(item => item.id === over.id);
          if (oldIndex > -1 && newIndex > -1) {
              onReorderItems(arrayMove(allItems, oldIndex, newIndex));
          }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <PageTitle
            title={pageTitle}
            onSave={onPageTitleSave}
            onReset={onPageTitleReset}
            disabled={!canManagePage}
          />
           <DuplicateZone id={`duplicate-${entityType}-zone`} onAdd={() => onAddItem()} isDragging={isDragging} />
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DraggableGrid
            id={`${entityType}-list`}
            items={displayedItems}
            setItems={onReorderItems}
            onDragEnd={handleDragEnd}
            className={gridClassName}
        >
          {displayedItems.map(item => renderItem(item, isDragging))}
        </DraggableGrid>
      </div>
    </div>
  );
}
