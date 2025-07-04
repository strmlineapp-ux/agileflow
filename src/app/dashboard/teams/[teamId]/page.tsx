

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { BadgeManagement } from '@/components/teams/badge-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkstationManagement } from '@/components/settings/workstation-management';
import { EventTemplateManagement } from '@/components/teams/event-template-management';
import { Input } from '@/components/ui/input';
import { AppTab, type AppPage } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const componentMap: Record<string, React.ComponentType<{ team: any, tab: AppTab }>> = {
  team_members: TeamMembersView,
  badges: BadgeManagement,
  locations: PinnedLocationManagement,
  workstations: WorkstationManagement,
  templates: EventTemplateManagement,
};

const PAGE_ID = 'page-team-management';

export default function TeamPage() {
  const { teamId } = useParams();
  const { viewAsUser, teams, appSettings, updateTeam, updateAppSettings } = useUser();
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  const team = teams.find(t => t.id === teamId);
  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    if (team && nameInputRef.current) {
        const newName = nameInputRef.current.value.trim();
        if (newName && newName !== team.name) {
            updateTeam(team.id, { name: newName });
        }
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSaveName();
    } else if (e.key === 'Escape') {
        setIsEditingName(false);
    }
  };
  
  const updatePage = (data: Partial<AppPage>) => {
    if (!pageConfig) return;
    const newPages = appSettings.pages.map(p => p.id === PAGE_ID ? { ...p, ...data } : p);
    updateAppSettings({ pages: newPages });
  };
  
  const filteredIcons = React.useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);
  
  if (!team || !pageConfig) {
    return (
      <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    );
  }
  
  const isTeamAdmin = team.teamAdmins?.includes(viewAsUser.userId);
  const isServiceAdmin = appSettings.adminGroups.some(group => viewAsUser.roles?.includes(group.name));
  const canViewPage = viewAsUser.isAdmin || isServiceAdmin || isTeamAdmin;

  if (!canViewPage) {
     return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl shrink-0">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isEditingName ? (
                      <Input
                          ref={nameInputRef}
                          defaultValue={team.name}
                          onBlur={handleSaveName}
                          onKeyDown={handleNameKeyDown}
                          className="h-auto p-0 font-headline text-3xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                  ) : (
                      <h1 className="font-headline text-3xl font-semibold cursor-pointer border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingName(true)}>
                          {team.name} Team Management
                      </h1>
                  )}
                </TooltipTrigger>
                {pageConfig.description && (
                  <TooltipContent><p className="max-w-xs">{pageConfig.description}</p></TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
        </div>
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className="flex w-full">
            {pageTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
                <GoogleSymbol name={tab.icon} className="text-lg" />
                <span>{tab.name}</span>
              </TabsTrigger>
            ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {ContentComponent ? <ContentComponent team={team} tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
