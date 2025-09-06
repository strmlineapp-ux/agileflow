

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { ManagementGrid } from './management-grid';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

interface SharedItemsPanelProps<T extends { id: string, name: string, icon: string, color: string }> {
  isOpen: boolean;
  type: string;
  title: string;
  description: string;
  items: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  colorFilter: string | null;
  onColorFilterChange: (color: string | null) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  onDrop: (event: DragEndEvent) => void;
}

export function SharedItemsPanel<T extends { id: string, name: string, icon: string, color: string }>({
  isOpen,
  type,
  title,
  description,
  items,
  searchTerm,
  setSearchTerm,
  colorFilter,
  onColorFilterChange,
  renderItem,
  onDrop,
}: SharedItemsPanelProps<T>) {
  
  const { setNodeRef, isOver } = useDroppable({ id: `shared-${type}-panel`, data: { type: `${type}-panel` } });

  return (
    <div className={cn( "h-full flex-shrink-0 transition-all duration-300", isOpen ? "w-96 p-2" : "w-0 p-0" )}>
      <div 
          ref={setNodeRef} 
          className={cn(
              "h-full transition-all duration-300",
              isOpen ? "opacity-100" : "opacity-0 invisible"
      )}>
          <Card className={cn(
              "h-full flex flex-col shadow-lg ring-1 ring-border/20 transition-all", 
              isOver && "ring-1 ring-border ring-inset"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <CompactSearchInput 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm} 
                  placeholder="Search shared..." 
                  tooltipText={`Search Shared ${title}`} 
                  showColorFilter={true}
                  onColorSelect={onColorFilterChange}
                  activeColorFilter={colorFilter}
                />
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {items.length > 0 ? (
                  <ManagementGrid
                    items={items}
                    setItems={() => {}}
                    renderItem={renderItem}
                    onDragEnd={onDrop}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center p-4">{emptyMessage}</p>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
