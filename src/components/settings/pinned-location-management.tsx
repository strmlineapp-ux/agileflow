

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationCheckManagerManagement } from '../teams/location-check-manager-management';

export function PinnedLocationManagement({ team, tab }: { team: Team, tab: AppTab }) {
  const { viewAsUser, locations, updateTeam, updateAppTab } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const aliasInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const pinnedLocationNames = team.pinnedLocations || [];
  const checkLocationNames = new Set(team.checkLocations || []);
  const canManage = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (editingAlias && aliasInputRef.current) {
      aliasInputRef.current.focus();
      aliasInputRef.current.select();
    }
  }, [editingAlias]);

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== tab.name) {
      updateAppTab(tab.id, { name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const availableToPin = useMemo(() => {
    return locations
      .filter(loc => !pinnedLocationNames.includes(loc.name))
      .filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [locations, pinnedLocationNames, searchTerm]);
  
  const handleSaveAlias = () => {
    if (!editingAlias) return;

    const newAlias = aliasInputRef.current?.value || '';

    const newAliases = { ...(team.locationAliases || {}) };
    if (newAlias.trim()) {
      newAliases[editingAlias] = newAlias.trim();
    } else {
      delete newAliases[editingAlias];
    }

    updateTeam(team.id, { locationAliases: newAliases });
    toast({
      title: 'Alias Updated',
      description: `Display name for "${editingAlias}" has been updated.`,
    });
    setEditingAlias(null);
  };

  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveAlias();
    else if (e.key === 'Escape') setEditingAlias(null);
  };
  
  const handlePinLocation = (locationName: string) => {
    if (!canManage) return;

    const newPinnedLocations = [...pinnedLocationNames, locationName];
    updateTeam(team.id, { pinnedLocations: newPinnedLocations.sort() });
    toast({
      title: `Location Pinned`,
      description: `"${locationName}" has been pinned for the ${team.name} team.`,
    });
    setIsAddPopoverOpen(false);
    setSearchTerm('');
  };

  const handleUnpinLocation = (locationNameToRemove: string) => {
    if (!canManage) return;
    const newPinnedLocations = pinnedLocationNames.filter(loc => loc !== locationNameToRemove);
    const newCheckLocations = (team.checkLocations || []).filter(loc => loc !== locationNameToRemove);
    const newAliases = { ...(team.locationAliases || {}) };
    delete newAliases[locationNameToRemove];

    updateTeam(team.id, { 
      pinnedLocations: newPinnedLocations.sort(),
      checkLocations: newCheckLocations.sort(),
      locationAliases: newAliases,
    });
    toast({
      title: `Location Unpinned`,
      description: `"${locationNameToRemove}" has been unpinned for the ${team.name} team.`,
    });
  }

  const handleToggleCheckLocation = (locationName: string) => {
    if (!canManage) return;
    const currentCheckLocations = new Set(team.checkLocations || []);
    if (currentCheckLocations.has(locationName)) {
      currentCheckLocations.delete(locationName);
    } else {
      currentCheckLocations.add(locationName);
    }
    updateTeam(team.id, { checkLocations: Array.from(currentCheckLocations).sort() });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
          {isEditingTitle ? (
              <Input
                  ref={titleInputRef}
                  defaultValue={tab.name}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
          ) : (
              <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>
                  {tab.name}
              </h2>
          )}
      </div>
      <LocationCheckManagerManagement team={team} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <GoogleSymbol name="push_pin" />
              Pinned & Check Locations
               <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" disabled={!canManage}>
                    <GoogleSymbol name="add_circle" className="text-xl" />
                    <span className="sr-only">Pin a location</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-48">
                    {availableToPin.length > 0 ? availableToPin.map(loc => (
                      <div 
                        key={loc.id} 
                        className="p-2 hover:bg-accent cursor-pointer text-sm"
                        onClick={() => handlePinLocation(loc.name)}
                      >
                        {loc.name}
                      </div>
                    )) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">No matching locations.</p>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
          </CardTitle>
          <CardDescription>
            Manage locations pinned to this team's schedule. Click a pill to toggle its "check" status. Click the text to set a custom display name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-2 border rounded-md bg-muted/50">
              {pinnedLocationNames.length > 0 ? pinnedLocationNames.map(name => {
                const alias = team.locationAliases?.[name];
                return (
                  <div 
                    key={name}
                    className={cn(
                      "group relative flex items-center gap-2 text-sm rounded-full border p-1 pl-3",
                      checkLocationNames.has(name) ? "border-primary text-primary-foreground bg-primary" : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {editingAlias === name ? (
                      <Input
                        ref={aliasInputRef}
                        defaultValue={alias || name}
                        onBlur={handleSaveAlias}
                        onKeyDown={handleAliasKeyDown}
                        className="h-5 p-0 bg-transparent border-0 shadow-none focus-visible:ring-0"
                      />
                    ) : (
                      <span className="cursor-pointer" onClick={() => canManage && setEditingAlias(name)} title={alias ? name : undefined}>
                        {alias || name}
                      </span>
                    )}

                    <div className='flex items-center gap-0.5'>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-5 w-5 rounded-full shrink-0", checkLocationNames.has(name) ? 'hover:bg-primary-foreground/20' : 'hover:bg-secondary-foreground/10' )}
                        onClick={() => canManage && handleToggleCheckLocation(name)}
                      >
                        <GoogleSymbol name={checkLocationNames.has(name) ? 'check_circle' : 'circle'} className="text-sm" />
                        <span className="sr-only">Toggle Check Location</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-5 w-5 rounded-full shrink-0", checkLocationNames.has(name) ? 'hover:bg-primary-foreground/20' : 'hover:bg-secondary-foreground/10' )}
                        onClick={() => canManage && handleUnpinLocation(name)}
                      >
                        <GoogleSymbol name="cancel" className="text-sm" />
                        <span className="sr-only">Unpin Location</span>
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <p className="p-2 text-sm text-muted-foreground w-full text-center">No locations pinned.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-right">Click a location to toggle its "check" status.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
