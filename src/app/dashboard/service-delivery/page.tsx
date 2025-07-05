

'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useUser } from '@/context/user-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab, type AppPage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


// This is a mapping from the componentKey in our AppTab model to the actual component to render.
const componentMap: Record<string, React.ComponentType<{ tab: AppTab }>> = {
  calendars: CalendarManagement,
  teams: TeamManagement,
};

// Define a unique identifier for this page
const PAGE_ID = 'page-service-delivery';

export default function ServiceDeliveryPage() {
  const { appSettings, updateAppSettings, loading } = useUser();

  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);
  
  // Header Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  const updatePage = (data: Partial<AppPage>) => {
    if (!pageConfig) return;
    const newPages = appSettings.pages.map(p => p.id === PAGE_ID ? { ...p, ...data } : p);
    updateAppSettings({ pages: newPages });
  };

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && pageConfig && newName !== pageConfig.name) {
      updatePage({ name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

  if (loading || !pageConfig) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-16 w-16 text-6xl shrink-0">
              <GoogleSymbol name={pageConfig.icon} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="flex items-center gap-1 p-2 border-b">
                {!isSearchingIcons ? ( <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}> <GoogleSymbol name="search" /> </Button> ) : (
                    <div className="flex items-center gap-1 w-full">
                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                        <input ref={iconSearchInputRef} placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} onBlur={() => !iconSearch && setIsSearchingIcons(false)} className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0" />
                    </div>
                )}
            </div>
            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={pageConfig.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { updatePage({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
          </PopoverContent>
        </Popover>
        {isEditingTitle ? (
          <Input ref={titleInputRef} defaultValue={pageConfig.name} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' ? handleSaveTitle() : e.key === 'Escape' && setIsEditingTitle(false)} className="h-auto p-0 font-headline text-3xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
        ) : (
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="font-headline text-3xl font-thin cursor-pointer border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{pageConfig.name}</h1>
                </TooltipTrigger>
                {pageConfig.description && (
                  <TooltipContent><p className="max-w-xs">{pageConfig.description}</p></TooltipContent>
                )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className="flex w-full">
          {pageTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
              <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
              <span>{tab.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
