
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';

interface CompactSearchInputProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CompactSearchInput({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search...", 
  className 
}: CompactSearchInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearching) {
      inputRef.current?.focus();
    }
  }, [isSearching]);

  if (isSearching) {
    return (
      <div className="flex items-center gap-1 border-b">
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

  return (
    <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className="text-muted-foreground">
      <GoogleSymbol name="search" weight={100} />
    </Button>
  );
}
