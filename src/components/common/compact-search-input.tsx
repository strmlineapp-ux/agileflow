
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';

interface CompactSearchInputProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

export function CompactSearchInput({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search...", 
  className,
  inputRef: externalInputRef,
  autoFocus = false,
}: CompactSearchInputProps) {
  const [isSearching, setIsSearching] = useState(autoFocus || !!searchTerm);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  useEffect(() => {
    if (autoFocus || isSearching) {
      setIsSearching(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearching, autoFocus, inputRef]);

  if (isSearching) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <GoogleSymbol name="search" className="text-muted-foreground" weight={100} />
        <input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => { if (!searchTerm && !autoFocus) setIsSearching(false); }}
          className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
        />
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className="text-muted-foreground">
      <GoogleSymbol name="search" weight={100} />
    </Button>
  );
}
