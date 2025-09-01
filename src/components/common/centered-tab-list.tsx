
'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export function CenteredTabList({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("center-and-scroll no-scrollbar", className)}>
      {children}
    </div>
  );
}
