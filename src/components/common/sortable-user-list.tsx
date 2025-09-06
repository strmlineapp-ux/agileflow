

'use client';

import React from 'react';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface SortableUserListProps {
  id: string;
  items: string[];
  children: React.ReactNode;
  className?: string;
}

export function SortableUserList({ id, items, children, className }: SortableUserListProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list-container', id } });

  return (
    <div ref={setNodeRef} className={cn("transition-colors rounded-md", className, isOver ? "ring-1 ring-border ring-inset" : "bg-transparent")}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}
