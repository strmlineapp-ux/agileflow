
"use client";

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function LocationManagement() {
  const { locations, addLocation, deleteLocation } = useUser();
  const { toast } = useToast();
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  const handleAddLocation = () => {
    if (newLocationName.trim()) {
      addLocation(newLocationName.trim());
      setNewLocationName('');
      toast({ title: "Success", description: "Location added successfully." });
    }
  };

  const handleDeleteLocation = () => {
    if (locationToDelete) {
      deleteLocation(locationToDelete);
      setLocationToDelete(null);
      toast({ title: "Success", description: "Location removed." });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Bookable Locations</CardTitle>
          <CardDescription>
            Add or remove locations available for event booking across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Existing Locations</h4>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
                {locations.length > 0 ? (
                  locations.map(loc => (
                    <div key={loc.id} className="flex items-center gap-1 p-1 px-2 text-sm bg-background border rounded-md">
                      <span>{loc.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-destructive/20"
                        onClick={() => setLocationToDelete(loc.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Delete {loc.name}</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground w-full text-center">No locations defined.</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Add New Location</h4>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g., Conference Room A"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                />
                <Button onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!locationToDelete} onOpenChange={(isOpen) => !isOpen && setLocationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the location and it will no longer be bookable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
