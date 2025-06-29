

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyManagement } from '@/components/service-delivery/strategy-management';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { useToast } from '@/hooks/use-toast';

export default function AppManagementPage() {
  const { viewAsUser, appSettings, updateAppSettings } = useUser();
  const { toast } = useToast();

  const serviceAdminRole = appSettings.customAdminRoles[0];

  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const canAccessPage = viewAsUser.isAdmin || appSettings.customAdminRoles.some(role => viewAsUser.roles?.includes(role.name));
  
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    const input = nameInputRef.current;
    if (!input || !input.value.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Display name cannot be empty.' });
      setIsEditingName(false);
      return;
    }
    if (input.value.trim() !== serviceAdminRole.name) {
      const newRoles = [...appSettings.customAdminRoles];
      newRoles[0] = { ...newRoles[0], name: input.value.trim() };
      updateAppSettings({ customAdminRoles: newRoles });
      toast({ title: 'Success', description: 'Display name updated.' });
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

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  if (!canAccessPage || !serviceAdminRole) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const handleIconSelect = (newIcon: string) => {
    const newRoles = [...appSettings.customAdminRoles];
    newRoles[0] = { ...newRoles[0], icon: newIcon };
    updateAppSettings({ customAdminRoles: newRoles });
    setIsIconPopoverOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-3xl text-muted-foreground hover:text-foreground">
                    <GoogleSymbol name={serviceAdminRole.icon} />
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
                                  variant={serviceAdminRole.icon === iconName ? "default" : "ghost"}
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
            {isEditingName ? (
                <Input
                    ref={nameInputRef}
                    defaultValue={serviceAdminRole.name}
                    onBlur={handleSaveName}
                    onKeyDown={handleNameKeyDown}
                    className="h-auto p-0 font-headline text-3xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            ) : (
                <h1 onClick={() => setIsEditingName(true)} className="font-headline text-3xl font-semibold cursor-pointer">
                    {serviceAdminRole.name}
                </h1>
            )}
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
    </>
  );
}
