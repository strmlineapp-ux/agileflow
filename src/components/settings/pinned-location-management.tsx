

"use client";

import { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PinnedLocationManagement({ team }: { team: Team }) {
  const { viewAsUser, locations, updateTeam } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const pinnedLocationNames = team.pinnedLocations || [];
  const checkLocationNames = new Set(team.checkLocations || []);
  const canManage = viewAsUser.roles?.includes('Admin') || team.managers?.includes(viewAsUser.userId);

  const availableToPin = useMemo(() => {
    return locations
      .filter(loc => !pinnedLocationNames.includes(loc.name))
      .filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [locations, pinnedLocationNames, searchTerm]);
  
  const handlePinLocation = (locationName: string) => {
    if (!canManage) return;

    const newPinnedLocations = [...pinnedLocationNames, locationName];
    updateTeam(team.id, { pinnedLocations: newPinnedLocations.sort() });
    toast({
      title: `Location Pinned`,
      description: `"${locationName}" has been pinned for the ${team.name} team.`,
    });
    // Close popover after selection
    setIsPopoverOpen(false);
    setSearchTerm('');
  };

  const handleUnpinLocation = (locationNameToRemove: string) => {
    if (!canManage) return;
    const newPinnedLocations = pinnedLocationNames.filter(loc => loc !== locationNameToRemove);
    const newCheckLocations = (team.checkLocations || []).filter(loc => loc !== locationNameToRemove);
    updateTeam(team.id, { 
      pinnedLocations: newPinnedLocations.sort(),
      checkLocations: newCheckLocations.sort() 
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <GoogleSymbol name="push_pin" />
            Pinned & Check Locations
        </CardTitle>
        <CardDescription>
          Manage locations pinned to this team's schedule. Click a pinned location to toggle it as a "check location".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
            {pinnedLocationNames.length > 0 ? pinnedLocationNames.map(name => (
              <Badge 
                key={name}
                variant={checkLocationNames.has(name) ? "default" : "secondary"}
                className={cn(
                  "rounded-full group text-base py-1 pl-1 pr-3 cursor-pointer",
                  checkLocationNames.has(name) && "shadow-md"
                )}
                onClick={() => handleToggleCheckLocation(name)}
                >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleUnpinLocation(name); }}
                  className="mr-1 h-5 w-5 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center"
                  aria-label={`Unpin ${name}`}
                >
                  <GoogleSymbol name="close" className="text-sm" />
                </button>
                <span className="font-medium">{name}</span>
              </Badge>
            )) : (
              <p className="text-sm text-muted-foreground w-full text-center">No locations pinned.</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={!canManage}>
                  <GoogleSymbol name="add" className="mr-2"/>
                  Add Pinned Location
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
            <p className="text-xs text-muted-foreground">Click a pill to toggle its "check" status.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
