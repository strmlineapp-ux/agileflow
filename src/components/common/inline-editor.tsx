
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InlineEditorProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function InlineEditor({
  value,
  onSave,
  className,
  placeholder,
  disabled = false,
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);
  
  const handleSave = useCallback(() => {
    if (currentValue.trim() && currentValue.trim() !== value) {
      onSave(currentValue.trim());
    }
    setIsEditing(false);
  }, [currentValue, value, onSave]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isEditing, handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCurrentValue(value); // Revert to original value
      setIsEditing(false);
    }
  };

  const handleDisplayClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={cn(
          "h-auto p-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words",
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={handleDisplayClick}
      className={cn(className, !disabled && "cursor-text", !value && "italic")}
    >
      {value || placeholder || "Click to edit"}
    </span>
  );
}
