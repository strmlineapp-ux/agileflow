

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import { pointerWithin } from '@dnd-kit/core';

interface DraggableGridProps<T extends { id: string }> {
  items: T[];
  setItems: (items: T[]) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  renderDragOverlay?: (item: T) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export function DraggableGrid<T extends { id: string }>({
  items,
  setItems,
  onDragEnd,
  onDragStart,
  renderItem,
  renderDragOverlay,
  children,
  className,
  id
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
  
  const { setNodeRef } = useDroppable({ id: id || 'draggable-grid' });
  const itemIds = React.useMemo(() => items.map(item => item.id), [items]);

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
      <div ref={setNodeRef} className={className}>
        <SortableContext items={itemIds}>
            {children}
            {items.map(item => renderItem(item, activeItem?.id === item.id))}
        </SortableContext>
      </div>
       {renderDragOverlay && (
        <DragOverlay modifiers={[snapCenterToCursor]}>
            {activeItem ? renderDragOverlay(activeItem) : null}
        </DragOverlay>
       )}
    </DndContext>
  );
}
