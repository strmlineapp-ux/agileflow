
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompactSearchInputProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
  tooltipText?: string;
}

export function CompactSearchInput({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search...", 
  className,
  inputRef: externalInputRef,
  autoFocus = false,
  tooltipText,
}: CompactSearchInputProps) {
  const [isSearching, setIsSearching] = useState(autoFocus || !!searchTerm);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const [initialFocusDone, setInitialFocusDone] = useState(false);

  useEffect(() => {
    if (autoFocus && !initialFocusDone) {
      setIsSearching(true);
      setInitialFocusDone(true);
    }
  }, [autoFocus, initialFocusDone, inputRef]);
  
  useEffect(() => {
    if (isSearching) {
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearching, inputRef]);


  if (isSearching) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <GoogleSymbol name="search" className="text-muted-foreground" weight={100} />
        <input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => { if (!searchTerm) setIsSearching(false); }}
          className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
        />
      </div>
    );
  }

  const searchButton = (
    <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className="text-muted-foreground">
      <GoogleSymbol name="search" weight={100} />
    </Button>
  );

  if (tooltipText) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{searchButton}</TooltipTrigger>
                <TooltipContent><p>{tooltipText}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  }

  return searchButton;
}
