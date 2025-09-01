
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '../icons/google-symbol';

interface DuplicateZoneProps {
  id: string;
  onAdd: () => void;
  tooltipText?: string;
  isOverTooltipText?: string;
}

export function DuplicateZone({ id, onAdd, tooltipText = 'Add New', isOverTooltipText = 'Drop to Duplicate' }: DuplicateZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all p-0.5",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="rounded-full p-0" onClick={onAdd} onPointerDown={(e) => e.stopPropagation()}>
              <GoogleSymbol name="add_circle" className="text-4xl text-foreground" weight={100} />
              <span className="sr-only">{tooltipText} or Drop to Duplicate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOver ? isOverTooltipText : tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
