

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import { SortableItem } from './sortable-item';

interface DraggableGridProps<T extends { id: string }> {
  items: T[];
  setItems: (items: T[]) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  renderDragOverlay: (item: T) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DraggableGrid<T extends { id: string }>({
  items,
  setItems,
  onDragEnd,
  onDragStart,
  renderItem,
  renderDragOverlay,
  children,
  className
}: DraggableGridProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const active = items.find(p => p.id === event.active.id);
    if (active) {
      setActiveItem(active);
    }
    if(onDragStart) {
      onDragStart(event);
    }
  }, [items, onDragStart]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (onDragEnd) {
      onDragEnd(event);
      return;
    }
    
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        if (oldIndex > -1 && newIndex > -1) {
            setItems(arrayMove(items, oldIndex, newIndex));
        }
    }
  };
  
  const itemIds = React.useMemo(() => items.map(item => item.id), [items]);

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={rectIntersection} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
      <div className={className}>
        {children}
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="gap-4 [column-fill:_balance] columns-1 sm:columns-2 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
            {items.map(item => (
              <SortableItem key={item.id} id={item.id} data={{ type: 'item', item: item }}>
                 {(isDragging) => renderItem(item, isDragging)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </div>
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeItem ? renderDragOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}
