
"use client";

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn } from '@/lib/utils';

export function PinnedLocationManagement({ team }: { team: Team }) {
  const { viewAsUser, locations, updateTeam } = useUser();
  const { toast } = useToast();

  const pinnedLocations = team.pinnedLocations || [];

  const canManage = viewAsUser.roles?.includes('Admin') || viewAsUser.roles?.includes('Service Delivery Manager') || team.managers?.includes(viewAsUser.userId);

  const handleToggleLocation = (locationName: string) => {
    if (!canManage) return;

    const newPinnedLocations = pinnedLocations.includes(locationName)
      ? pinnedLocations.filter(loc => loc !== locationName)
      : [...pinnedLocations, locationName];
    
    updateTeam(team.id, { pinnedLocations: newPinnedLocations.sort() });

    toast({
      title: `Location ${pinnedLocations.includes(locationName) ? 'Unpinned' : 'Pinned'}`,
      description: `"${locationName}" has been updated for the ${team.name} team.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <GoogleSymbol name="push_pin" />
            Pinned Schedule Locations
        </CardTitle>
        <CardDescription>
          Select which locations are permanently pinned as rows on the Production Schedule view timeline for the {team.name} team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
          {locations.length > 0 ? locations.map(loc => {
            const isPinned = pinnedLocations.includes(loc.name);
            return (
              <Badge
                key={loc.id}
                variant={isPinned ? 'default' : 'secondary'}
                className={cn('text-base py-1 px-3 cursor-pointer', isPinned && 'shadow-md')}
                onClick={() => handleToggleLocation(loc.name)}
              >
                {loc.name}
              </Badge>
            );
          }) : (
            <p className="text-sm text-muted-foreground w-full text-center">No locations available to pin.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-right pr-2 mt-2">Click location pills to toggle their pinned status.</p>
      </CardContent>
    </Card>
  );
}
