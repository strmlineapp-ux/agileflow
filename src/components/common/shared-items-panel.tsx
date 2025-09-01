
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { DraggableGrid } from './draggable-grid';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface SharedItemsPanelProps<T extends { id: string, name: string, icon: string, color: string }> {
  isOpen: boolean;
  type: string;
  title: string;
  description: string;
  items: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  renderDragOverlay: (item: T) => React.ReactNode;
  emptyMessage: string;
}

export function SharedItemsPanel<T extends { id: string, name: string, icon: string, color: string }>({
  isOpen,
  type,
  title,
  description,
  items,
  searchTerm,
  setSearchTerm,
  renderItem,
  renderDragOverlay,
  emptyMessage,
}: SharedItemsPanelProps<T>) {
  
  const { setNodeRef, isOver } = useDroppable({ id: `shared-${type}-panel`, data: { type: `${type}-panel` } });

  return (
    <div className={cn("transition-all duration-300", isOpen ? "w-96" : "w-0")}>
      <div ref={setNodeRef} className={cn("h-full rounded-lg transition-all", isOpen ? "p-2" : "p-0", isOver && "ring-1 ring-border ring-inset")}>
        <Card className={cn("transition-opacity duration-300 h-full flex flex-col", isOpen ? "opacity-100" : "opacity-0")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search shared..." tooltipText={`Search Shared ${title}`} />
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-hidden">
            <DraggableGrid
              items={items}
              setItems={() => {}}
              renderItem={renderItem}
              renderDragOverlay={renderDragOverlay}
            >
              {items.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">{emptyMessage}</p>}
            </DraggableGrid>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
