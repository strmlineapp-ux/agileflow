
'use client';

import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getHueFromHsl, isHueInRange } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompactSearchInput } from './compact-search-input';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/context/user-context';

type Item = {
  id: string;
  name: string;
  icon: string;
  iconType: 'symbol' | 'avatar';
  color?: string;
};

export type ItemSelectionTab = {
  value: string;
  label: string;
  items: Item[];
  selectedIds: string[];
};

interface ItemSelectionPopoverProps {
  tabs: ItemSelectionTab[];
  onSelectionChange: (type: string, id: string) => void;
  trigger: React.ReactNode;
  tooltip: string;
  showColorFilter?: boolean;
}

const ItemDisplay = ({ item, isSelected }: { item: Item, isSelected: boolean }) => {
    const { viewAsUser } = useUser();
    
    return (
        <div
            className={cn(
                "font-emphasis flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer",
                isSelected ? "text-primary" : "text-foreground"
            )}
        >
            {item.iconType === 'avatar' ? (
                <Avatar className="h-7 w-7">
                    <AvatarImage src={item.icon} alt={item.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{item.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
            ) : (
                <GoogleSymbol name={item.icon} style={{ color: item.color || 'hsl(var(--foreground))' }} />
            )}
            <span>{item.name}</span>
        </div>
    );
}


export function ItemSelectionPopover({
  tabs,
  onSelectionChange,
  trigger,
  tooltip,
  showColorFilter = false,
}: ItemSelectionPopoverProps) {
  const { viewAsUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const baseWeight = viewAsUser?.fontWeight || 400;

  const filteredItems = useMemo(() => {
    const currentTab = tabs.find(t => t.value === activeTab);
    if (!currentTab) return [];
    
    let results = currentTab.items;
    if (searchTerm) {
      results = results.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (colorFilter && showColorFilter) {
      const targetHue = getHueFromHsl(colorFilter);
      if (targetHue !== null) {
        results = results.filter(item => {
          if (!item.color) return false;
          const itemHue = getHueFromHsl(item.color);
          return itemHue !== null && isHueInRange(targetHue, itemHue);
        });
      }
    }
    return results;
  }, [tabs, activeTab, searchTerm, colorFilter, showColorFilter]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    setColorFilter(null);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
              {trigger}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent><p>{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-0 flex flex-col max-h-96" onPointerDownCapture={(e) => e.stopPropagation()}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col flex-1 min-h-0">
          {tabs.length > 1 && (
            <TabsList className="grid w-full grid-cols-2">
              {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
            </TabsList>
          )}

          <div className="p-2 border-b">
            <CompactSearchInput
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder={`Search ${activeTab}...`}
              isActive={isOpen}
              autoFocus={true}
              showColorFilter={showColorFilter}
              onColorSelect={setColorFilter}
              activeColorFilter={colorFilter}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-1 space-y-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const isSelected = tabs.find(t => t.value === activeTab)?.selectedIds.includes(item.id) || false;
                    
                    return (
                      <div key={item.id} onClick={() => onSelectionChange(activeTab, item.id)}>
                          <ItemDisplay item={item} isSelected={isSelected} />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-foreground p-4">No {activeTab} found.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
