
'use client';

import React from 'react';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { InlineEditor } from './inline-editor';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  icon?: string;
  iconColor?: string;
  onSave: (newTitle: string) => void;
  onReset?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export function PageTitle({
  title,
  icon,
  iconColor,
  onSave,
  onReset,
  disabled = false,
  className,
}: PageTitleProps) {
  return (
    <h1 className={cn("text-2xl flex items-center gap-2", className)}>
      {icon && <GoogleSymbol name={icon} style={{ color: iconColor }} />}
      <InlineEditor
        value={title}
        onSave={onSave}
        onClick={onReset}
        disabled={disabled}
      />
    </h1>
  );
}
