
"use client";

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';

export function PinnedLocationManagement({ team }: { team: Team }) {
  const { viewAsUser, locations, updateTeam } = useUser();
  const { toast } = useToast();
  const [locationToAdd, setLocationToAdd] = useState('');

  const pinnedLocations = team.pinnedLocations || [];

  // A user with 'Production Team Admin' can ONLY manage this on the 'Production' page.
  const isProdAdmin = viewAsUser.roles?.includes('Production Team Admin');
  const canManage = !isProdAdmin || team.name === 'Production';

  const handleUpdatePinnedLocations = (newPinnedLocations: string[]) => {
      updateTeam(team.id, { pinnedLocations: newPinnedLocations.sort() });
  };

  const handleAddLocation = () => {
    if (locationToAdd && !pinnedLocations.includes(locationToAdd)) {
      handleUpdatePinnedLocations([...pinnedLocations, locationToAdd]);
      setLocationToAdd('');
      toast({ title: 'Location Pinned', description: `"${locationToAdd}" has been pinned for the ${team.name} team.` });
    }
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    handleUpdatePinnedLocations(pinnedLocations.filter(loc => loc !== locationToRemove));
    toast({ title: 'Location Unpinned', description: `"${locationToRemove}" has been unpinned.` });
  };
  
  const availableLocations = locations.filter(loc => !pinnedLocations.includes(loc.name));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinned Schedule Locations</CardTitle>
        <CardDescription>
          Select which locations are permanently pinned as rows on the Production Schedule view timeline for the {team.name} team.
          {!canManage && isProdAdmin && (
            <span className="block mt-1 text-sm text-yellow-600">You can only manage pinned locations from the 'Production' team page.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
              {pinnedLocations.length > 0 ? pinnedLocations.map(loc => (
                <Badge key={loc} variant="secondary" className="text-base py-1 pl-3 pr-1">
                  {loc}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-5 w-5 hover:bg-destructive/20"
                    onClick={() => handleRemoveLocation(loc)}
                    disabled={!canManage}
                  >
                    <GoogleSymbol name="close" className="text-sm" />
                    <span className="sr-only">Unpin {loc}</span>
                  </Button>
                </Badge>
              )) : (
                <p className="text-sm text-muted-foreground w-full text-center">No locations pinned.</p>
              )}
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <Select value={locationToAdd} onValueChange={setLocationToAdd}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a location to pin" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleAddLocation} disabled={!locationToAdd}>
                    <GoogleSymbol name="add_circle" className="mr-2" />
                    Pin Location
                </Button>
            </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
