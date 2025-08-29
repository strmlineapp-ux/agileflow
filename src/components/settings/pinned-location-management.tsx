

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
import { InlineEditor } from '../common/inline-editor';

export function PinnedLocationManagement({ team, tab }: { team: Team, tab: AppTab }) {
  if (!team) {
    return null;
  }
  
  const { viewAsUser, locations, updateTeam, updateAppTab } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);

  const pinnedLocationNames = team.pinnedLocations || [];
  const checkLocationNames = new Set(team.checkLocations || []);
  const canManage = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);

  const availableToPin = useMemo(() => {
    return locations
      .filter(loc => !pinnedLocationNames.includes(loc.name))
      .filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [locations, pinnedLocationNames, searchTerm]);
  
  const handleSaveAlias = (locationName: string, newAlias: string) => {
    const newAliases = { ...(team.locationAliases || {}) };
    if (newAlias.trim()) {
      newAliases[locationName] = newAlias.trim();
    } else {
      delete newAliases[locationName];
    }

    updateTeam(team.id, { locationAliases: newAliases });
    toast({
      title: 'Alias Updated',
      description: `Display name for "${locationName}" has been updated.`,
    });
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
          <InlineEditor
            value={tab.name}
            onSave={(newName) => updateAppTab(tab.id, {name: newName})}
            className="h-auto p-0 font-headline text-2xl font-thin tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={!canManage}
          />
      </div>
      <LocationCheckManagerManagement team={team} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <GoogleSymbol name="push_pin" />
              Pinned & Check Locations
               <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-0 text-muted-foreground" disabled={!canManage}>
                    <GoogleSymbol name="add_circle" className="text-4xl" />
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
                    <InlineEditor
                        value={alias || name}
                        onSave={(newAlias) => handleSaveAlias(name, newAlias)}
                        placeholder={name}
                        disabled={!canManage}
                        className="cursor-text"
                    />

                    <div className='flex items-center gap-0.5'>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("p-0 shrink-0", checkLocationNames.has(name) ? 'hover:bg-primary-foreground/20' : 'hover:bg-secondary-foreground/10' )}
                        onClick={() => canManage && handleToggleCheckLocation(name)}
                      >
                        <GoogleSymbol name={checkLocationNames.has(name) ? 'check_circle' : 'circle'} className="text-sm" />
                        <span className="sr-only">Toggle Check Location</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("p-0 shrink-0", checkLocationNames.has(name) ? 'hover:bg-primary-foreground/20' : 'hover:bg-secondary-foreground/10' )}
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
