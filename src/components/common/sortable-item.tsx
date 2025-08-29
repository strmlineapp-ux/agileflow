

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  children: (isDragging: boolean) => React.ReactNode;
  data?: Record<string, any>;
  disabled?: boolean;
}

export function SortableItem({ id, children, data, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: id,
    data,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-2 break-inside-avoid flex-grow-0 flex-shrink-0">
      {children(isDragging)}
    </div>
  );
}
