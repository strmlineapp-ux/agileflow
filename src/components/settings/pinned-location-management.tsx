
"use client";

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PinnedLocationManagement({ teamTitle }: { teamTitle: string }) {
  const { viewAsUser, locations, pinnedLocations, setPinnedLocations } = useUser();
  const { toast } = useToast();
  const [locationToAdd, setLocationToAdd] = useState('');

  // A user with 'Production Team Admin' can ONLY manage this on the 'Production' page.
  // The 'Service Delivery' page is for SDMs, who should have full control.
  const isProdAdmin = viewAsUser.roles?.includes('Production Team Admin');
  const canManage = teamTitle === 'Service Delivery' || !isProdAdmin || teamTitle === 'Production';

  const handleAddLocation = () => {
    if (locationToAdd && !pinnedLocations.includes(locationToAdd)) {
      setPinnedLocations([...pinnedLocations, locationToAdd].sort());
      setLocationToAdd('');
      toast({ title: 'Location Pinned', description: `"${locationToAdd}" has been pinned to the schedule.` });
    }
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    setPinnedLocations(pinnedLocations.filter(loc => loc !== locationToRemove));
    toast({ title: 'Location Unpinned', description: `"${locationToRemove}" has been unpinned.` });
  };
  
  const availableLocations = locations.filter(loc => !pinnedLocations.includes(loc.name));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinned Schedule Locations</CardTitle>
        <CardDescription>
          Select which locations are permanently pinned as rows on the Production Schedule view timeline.
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
                    <X className="h-3 w-3" />
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
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Pin Location
                </Button>
            </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
