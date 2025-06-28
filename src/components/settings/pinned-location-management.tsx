
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
  const canManage = viewAsUser.roles?.includes('Admin') || viewAsUser.roles?.includes('Service Delivery Manager') || team.managers?.includes(viewAsUser.userId);

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
    updateTeam(team.id, { pinnedLocations: newPinnedLocations.sort() });
    toast({
      title: `Location Unpinned`,
      description: `"${locationNameToRemove}" has been unpinned for the ${team.name} team.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <GoogleSymbol name="push_pin" />
            Pinned Schedule Locations
        </CardTitle>
        <CardDescription>
          Add or remove locations that are permanently pinned as rows on the Production Schedule view for the {team.name} team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
          {pinnedLocationNames.length > 0 ? pinnedLocationNames.map(name => (
            <Badge key={name} variant="secondary" className="rounded-full group text-base py-1 pl-1 pr-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-1 h-5 w-5 hover:bg-destructive/20 rounded-full" 
                onClick={() => handleUnpinLocation(name)}
              >
                <GoogleSymbol name="close" className="text-sm" />
                <span className="sr-only">Unpin {name}</span>
              </Button>
              <span className="font-medium">{name}</span>
            </Badge>
          )) : (
            <p className="text-sm text-muted-foreground w-full text-center">No locations pinned.</p>
          )}
        </div>
        <div className="mt-4">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={!canManage}>
                <GoogleSymbol name="add" className="mr-2"/>
                Add Location
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
        </div>
      </CardContent>
    </Card>
  );
}
