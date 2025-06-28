
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';

export function WorkstationManagement({ team }: { team: Team }) {
  const { updateTeam } = useUser();
  const { toast } = useToast();

  const [newWorkstationName, setNewWorkstationName] = useState('');
  const [workstationToDelete, setWorkstationToDelete] = useState<string | null>(null);

  const teamWorkstations = team.workstations || [];

  const handleUpdateTeamWorkstations = (newWorkstations: string[]) => {
      updateTeam(team.id, { workstations: newWorkstations.sort() });
  };

  const handleAddWorkstation = () => {
    const trimmedName = newWorkstationName.trim();
    if (trimmedName && !teamWorkstations.includes(trimmedName)) {
      const updatedWorkstations = [...teamWorkstations, trimmedName];
      handleUpdateTeamWorkstations(updatedWorkstations);
      toast({ title: "Workstation Added", description: `"${trimmedName}" has been added to ${team.name}.` });
      setNewWorkstationName('');
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Workstation "${trimmedName}" already exists or is invalid.` });
    }
  };

  const handleDeleteWorkstation = () => {
    if (!workstationToDelete) return;
    const updatedWorkstations = teamWorkstations.filter(r => r !== workstationToDelete);
    handleUpdateTeamWorkstations(updatedWorkstations);
    toast({ title: "Workstation Deleted", description: `"${workstationToDelete}" has been deleted.` });
    setWorkstationToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Workstations</CardTitle>
              <CardDescription>
                  Add or delete workstations and edit machines for this team. These will be available as bookable locations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                 <div className="space-y-2">
                    <h4 className="font-medium text-sm">Existing Workstations</h4>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
                        {teamWorkstations.length > 0 ? teamWorkstations.map(ws => (
                        <div key={ws} className="flex items-center gap-1 p-1 px-2 text-sm bg-background border rounded-md">
                            <span>{ws}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-destructive/20"
                                onClick={() => setWorkstationToDelete(ws)}
                            >
                                <GoogleSymbol name="close" className="text-sm" />
                                <span className="sr-only">Delete {ws}</span>
                            </Button>
                        </div>
                        )) : (
                        <p className="text-sm text-muted-foreground w-full text-center">No workstations defined for this team.</p>
                        )}
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-medium text-sm">Add New Workstation</h4>
                    <div className="flex items-center gap-2">
                        <Input
                        placeholder="e.g., Edit Suite 1 or VFX-PC-05"
                        value={newWorkstationName}
                        onChange={(e) => setNewWorkstationName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWorkstation()}
                        />
                        <Button onClick={handleAddWorkstation} disabled={!newWorkstationName.trim()}>
                        <GoogleSymbol name="add_circle" className="mr-2" />
                        Add Workstation
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!workstationToDelete} onOpenChange={(isOpen) => !isOpen && setWorkstationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workstation "{workstationToDelete}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkstation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
