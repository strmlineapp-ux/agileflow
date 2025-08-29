

'use client';

import React from 'react';
import {
  type DragEndEvent,
} from '@dnd-kit/core';
import { DraggableGrid } from './draggable-grid';
import { GoogleSymbol } from '../icons/google-symbol';

// This is the main template component.
export function ManagementGrid<T extends { id: string }>({
  items,
  setItems,
  onDragEnd,
  renderItem,
  children,
  className,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const renderDragOverlay = (item: any) => {
    return (
        <GoogleSymbol
            name={item.icon || 'drag_indicator'}
            style={{
                fontSize: '48px',
                color: item.color || '#64748B',
            }}
        />
    )
  };

  return (
    <DraggableGrid
        items={items}
        setItems={setItems}
        onDragEnd={onDragEnd}
        renderItem={renderItem}
        renderDragOverlay={renderDragOverlay}
        className={className}
    >
        {children}
    </DraggableGrid>
  );
}
