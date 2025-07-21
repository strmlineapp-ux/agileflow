
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { CompactSearchInput } from './compact-search-input';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompactSearchIconPickerProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: string;
  onUpdateIcon: (icon: string) => void;
  disabled?: boolean;
  buttonClassName?: string;
  iconClassName?: string;
  weight?: number;
  grade?: number;
}

export function CompactSearchIconPicker({
  icon,
  onUpdateIcon,
  disabled,
  buttonClassName,
  iconClassName,
  weight,
  grade,
  ...props
}: CompactSearchIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => iconSearchInputRef.current?.focus(), 100);
    } else {
      setIconSearch('');
    }
  }, [isOpen]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild disabled={disabled} onPointerDown={(e) => e.stopPropagation()}>
              <Button variant="ghost" className={buttonClassName} {...props}>
                <GoogleSymbol name={icon} className={iconClassName} weight={weight} grade={grade} />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Change Icon</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 p-2 border-b">
          <CompactSearchInput
            searchTerm={iconSearch}
            setSearchTerm={setIconSearch}
            placeholder="Search icons..."
            inputRef={iconSearchInputRef}
            autoFocus={true}
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.slice(0, 300).map((iconName) => (
              <TooltipProvider key={iconName}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={icon === iconName ? "default" : "ghost"}
                      size="icon"
                      onClick={() => {
                        onUpdateIcon(iconName);
                        setIsOpen(false);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{iconName}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
