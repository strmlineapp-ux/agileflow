

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { DraggableGrid } from './draggable-grid';
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
    <div ref={setNodeRef} className={cn("h-full transition-colors", isOpen && "p-2", isOver && "ring-1 ring-inset ring-border")}>
        <div className={cn("h-full transition-all duration-300", isOpen ? "opacity-100" : "opacity-0 invisible")}>
            <Card className="h-full flex flex-col shadow-lg ring-1 ring-border/20">
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
                      isActive={true}
                    />
                  </div>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-2 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    {items.length > 0 ? (
                      <DraggableGrid
                        id={`shared-${type}-grid`}
                        items={items}
                        setItems={() => {}}
                        renderItem={renderItem}
                        onDragEnd={onDrop}
                        className="columns-1 gap-4"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground text-center p-4">No shared items found.</p>
                    )}
                  </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
