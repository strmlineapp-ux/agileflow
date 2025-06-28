

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
import { LocationCheckManagerManagement } from '../teams/location-check-manager-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';

export function PinnedLocationManagement({ team }: { team: Team }) {
  const { viewAsUser, locations, updateTeam } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [isAliasDialogOpen, setIsAliasDialogOpen] = useState(false);
  const [editingLocationName, setEditingLocationName] = useState<string | null>(null);
  const [tempAlias, setTempAlias] = useState('');

  const pinnedLocationNames = team.pinnedLocations || [];
  const checkLocationNames = new Set(team.checkLocations || []);
  const canManage = viewAsUser.roles?.includes('Admin') || team.managers?.includes(viewAsUser.userId);

  const availableToPin = useMemo(() => {
    return locations
      .filter(loc => !pinnedLocationNames.includes(loc.name))
      .filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [locations, pinnedLocationNames, searchTerm]);

  const handleOpenAliasDialog = (locationName: string) => {
    if (!canManage) return;
    setEditingLocationName(locationName);
    setTempAlias(team.locationAliases?.[locationName] || '');
    setIsAliasDialogOpen(true);
  };

  const handleSaveAlias = () => {
    if (!editingLocationName) return;

    const newAliases = { ...(team.locationAliases || {}) };
    if (tempAlias.trim()) {
      newAliases[editingLocationName] = tempAlias.trim();
    } else {
      delete newAliases[editingLocationName];
    }

    updateTeam(team.id, { locationAliases: newAliases });
    toast({
      title: 'Alias Updated',
      description: `Display name for "${editingLocationName}" has been updated.`,
    });
    setIsAliasDialogOpen(false);
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
      <LocationCheckManagerManagement team={team} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <GoogleSymbol name="push_pin" />
              Pinned & Check Locations
          </CardTitle>
          <CardDescription>
            Manage locations pinned to this team's schedule. Click a pill to toggle its "check" status. Use the edit icon to set a custom display name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-2 border rounded-md bg-muted/50">
              {pinnedLocationNames.length > 0 && pinnedLocationNames.map(name => {
                const alias = team.locationAliases?.[name];
                return (
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
                      className="mr-1 h-4 w-4 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center"
                      aria-label={`Unpin ${name}`}
                    >
                      <GoogleSymbol name="cancel" className="text-sm" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenAliasDialog(name); }}
                      className="mr-1 h-4 w-4 hover:bg-primary/20 rounded-full inline-flex items-center justify-center"
                      aria-label={`Edit alias for ${name}`}
                    >
                      <GoogleSymbol name="edit" className="text-sm" />
                    </button>

                    <span className="font-medium" title={alias ? name : undefined}>
                      {alias || name}
                    </span>
                  </Badge>
                );
              })}
              <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={!canManage}>
                    <GoogleSymbol name="add_circle" className="text-xl" />
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
            <p className="text-xs text-muted-foreground text-right">Click a pill to toggle its "check" status.</p>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isAliasDialogOpen} onOpenChange={setIsAliasDialogOpen}>
        <DialogContent>
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveAlias}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Save alias</span>
                </Button>
            </div>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Set a custom display name for <strong>{editingLocationName}</strong> for this team.
              </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alias" className="text-right">Alias</Label>
              <Input 
                id="alias" 
                value={tempAlias} 
                onChange={(e) => setTempAlias(e.target.value)} 
                className="col-span-3"
                placeholder="Leave blank to use default"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
