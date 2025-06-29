

'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyManagement } from '@/components/service-delivery/strategy-management';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { useToast } from '@/hooks/use-toast';

export default function AppManagementPage() {
  const { viewAsUser, appSettings, updateAppSettings } = useUser();
  const { toast } = useToast();

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [tempName, setTempName] = useState(appSettings.displayName);
  const [iconSearch, setIconSearch] = useState('');

  const canAccessPage = viewAsUser.isAdmin || viewAsUser.roles?.includes('Service Admin');
  
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  if (!canAccessPage) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const handleSaveName = () => {
    if (!tempName.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Display name cannot be empty.' });
        return;
    }
    updateAppSettings({ displayName: tempName });
    toast({ title: 'Success', description: 'Service Admin display name updated.' });
    setIsNameDialogOpen(false);
  };

  const handleIconSelect = (newIcon: string) => {
    updateAppSettings({ icon: newIcon });
    setIsIconPopoverOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-3xl text-muted-foreground hover:text-foreground">
                    <GoogleSymbol name={appSettings.icon} />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                  <div className="p-2 border-b">
                      <Input
                          placeholder="Search icons..."
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                      />
                  </div>
                  <ScrollArea className="h-64">
                      <div className="grid grid-cols-6 gap-1 p-2">
                          {filteredIcons.slice(0, 300).map((iconName) => (
                              <Button
                                  key={iconName}
                                  variant={appSettings.icon === iconName ? "default" : "ghost"}
                                  size="icon"
                                  onClick={() => handleIconSelect(iconName)}
                                  className="text-2xl"
                              >
                                  <GoogleSymbol name={iconName} />
                              </Button>
                          ))}
                      </div>
                  </ScrollArea>
              </PopoverContent>
          </Popover>
          <h1 className="font-headline text-3xl font-semibold">{appSettings.displayName}</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTempName(appSettings.displayName); setIsNameDialogOpen(true); }}>
            <GoogleSymbol name="edit" className="text-xl" />
            <span className="sr-only">Edit display name</span>
          </Button>
        </div>
        <Tabs defaultValue="calendars">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendars">{appSettings.calendarManagementLabel || 'Calendar Management'}</TabsTrigger>
              <TabsTrigger value="teams">{appSettings.teamManagementLabel || 'Team Management'}</TabsTrigger>
              <TabsTrigger value="strategy">{appSettings.strategyLabel || 'Strategy'}</TabsTrigger>
          </TabsList>
          <TabsContent value="calendars" className="mt-4">
              <CalendarManagement />
          </TabsContent>
          <TabsContent value="teams" className="mt-4">
              <TeamManagement />
          </TabsContent>
          <TabsContent value="strategy" className="mt-4">
              <StrategyManagement />
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveName}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Save name</span>
                </Button>
            </div>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
            <DialogDescription>
              Change the display name for the Service Admin section.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <Input 
                id="app-mgmnt-name" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                className="col-span-4"
                placeholder="Service Admin Display Name"
              />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
