
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { getHueFromHsl } from '@/lib/utils';

interface CompactSearchInputProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  tooltipText?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  showColorFilter?: boolean;
  onColorSelect?: (color: string | null) => void;
  activeColorFilter?: string | null;
  isActive?: boolean;
}

export function CompactSearchInput({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search...", 
  className,
  autoFocus,
  tooltipText,
  inputRef: passedInputRef,
  showColorFilter,
  onColorSelect,
  activeColorFilter,
  isActive = false
}: CompactSearchInputProps) {
  const [isSearching, setIsSearching] = useState(!!autoFocus || isActive);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = passedInputRef || internalInputRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);

  useEffect(() => {
    if (autoFocus || isActive) {
      setIsSearching(true);
    }
  }, [autoFocus, isActive]);

  useEffect(() => {
    if (isSearching && inputRef.current) {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }
  }, [isSearching]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isActive) return;

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!searchTerm && !isColorPopoverOpen) {
          setIsSearching(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, isColorPopoverOpen, containerRef, isActive]);

  const handleColorPopoverChange = (isOpen: boolean) => {
      setIsColorPopoverOpen(isOpen);
      if (!isOpen && !searchTerm) {
          setIsSearching(false);
      }
  }

  const handleToggle = () => {
    setIsSearching(prev => !prev);
  }
  
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onColorSelect) {
        const hue = e.target.value;
        onColorSelect(`hsl(${hue}, 100%, 50%)`);
    }
  };
  
  const handleClearColorFilter = () => {
    if(onColorSelect) {
      onColorSelect(null);
    }
    setIsColorPopoverOpen(false);
  }

  const currentHue = getHueFromHsl(activeColorFilter) || 0;

  if (isSearching) {
    return (
      <div 
        ref={containerRef}
        className={cn("flex items-center gap-1 w-full rounded-full h-8 px-2 text-sm bg-muted/50", className)}
      >
        <GoogleSymbol name="search" className="text-muted-foreground" />
        <input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 w-full h-full p-0 bg-transparent border-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
        />
        {showColorFilter && onColorSelect && (
            <Popover open={isColorPopoverOpen} onOpenChange={handleColorPopoverChange}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <GoogleSymbol name={activeColorFilter ? "radio_button_checked" : "radio_button_unchecked"} style={{ color: activeColorFilter || 'hsl(var(--muted-foreground))' }} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" onPointerDownCapture={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={currentHue}
                            onChange={handleHueChange}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)'
                            }}
                        />
                        <Button
                          variant="ghost" 
                          size="icon" 
                          className="w-auto h-auto text-muted-foreground"
                          onClick={handleClearColorFilter}
                        >
                            <GoogleSymbol name="cancel" />
                            <span className="sr-only">Clear Color Filter</span>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        )}
      </div>
    );
  }

  const searchButton = (
    <Button variant="ghost" size="icon" onClick={handleToggle} className="text-muted-foreground">
      <GoogleSymbol name="search" />
    </Button>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {searchButton}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return searchButton;
}
