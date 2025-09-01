

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { DraggableGrid } from './draggable-grid';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '../ui/scroll-area';

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
    <div ref={setNodeRef} className={cn(
        "transition-all duration-300", 
        isOpen ? "w-96 p-2" : "w-0 p-0"
    )}>
        <Card className={cn(
            "transition-opacity duration-300 h-full flex flex-col shadow-lg ring-1 ring-border/20", 
            isOpen ? "opacity-100" : "opacity-0",
            isOver && "ring-1 ring-border ring-inset"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search shared..." tooltipText={`Search Shared ${title}`} />
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-hidden">
            <ScrollArea className="h-full">
              <DraggableGrid
                items={items}
                setItems={() => {}}
                renderItem={renderItem}
                renderDragOverlay={renderDragOverlay}
              >
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">{emptyMessage}</p>}
              </DraggableGrid>
            </ScrollArea>
          </CardContent>
        </Card>
    </div>
  );
}
