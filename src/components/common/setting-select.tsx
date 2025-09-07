
'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';

interface SettingSelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SettingSelectProps {
  value: string;
  onSave: (newValue: string) => void;
  options: SettingSelectOption[];
  triggerIcon: string;
  tooltip: string;
  disabled?: boolean;
}

export function SettingSelect({
  value,
  onSave,
  options,
  triggerIcon,
  tooltip,
  disabled = false,
}: SettingSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = options.find(opt => opt.value === value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-foreground font-emphasis" 
                            disabled={disabled}
                            enableReset={true}
                            onReset={() => onSave(options[0].value)}
                        >
                            <GoogleSymbol name={triggerIcon} />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}: <span className="font-semibold">{currentOption?.label}</span>. Modifier+Click to reset.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <PopoverContent 
            className="w-auto p-1" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            {options.map(option => (
            <Button
                key={option.value}
                variant="ghost"
                className={cn(
                    "font-emphasis h-auto",
                    option.icon ? "flex-col p-2" : "justify-start px-2 h-8",
                    option.value === value && "font-emphasized"
                )}
                onClick={() => {
                  onSave(option.value);
                  setIsOpen(false);
                }}
            >
                {option.icon && <GoogleSymbol name={option.icon} className="mb-1 text-lg" />}
                {option.label}
            </Button>
            ))}
      </PopoverContent>
    </Popover>
  );
}
