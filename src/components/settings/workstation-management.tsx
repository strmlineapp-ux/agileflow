

'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';

export function WorkstationManagement({ team }: { team: Team }) {
  const { updateTeam } = useUser();
  const { toast } = useToast();

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [workstationToEdit, setWorkstationToEdit] = useState<string | null>(null);
  const [workstationToDelete, setWorkstationToDelete] = useState<string | null>(null);
  const [newWorkstationName, setNewWorkstationName] = useState('');
  
  const [isTitleEditDialogOpen, setIsTitleEditDialogOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const teamWorkstations = team.workstations || [];

  const handleUpdateTeamWorkstations = (newWorkstations: string[]) => {
    updateTeam(team.id, { workstations: newWorkstations.sort() });
  };
  
  const openTitleEditDialog = (currentTitle: string) => {
    setTempTitle(currentTitle);
    setIsTitleEditDialogOpen(true);
  };
  
  const handleSaveTitle = () => {
    if (!tempTitle.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Title cannot be empty.' });
        return;
    }
    updateTeam(team.id, { workstationsLabel: tempTitle });
    toast({ title: 'Success', description: 'Section title updated.' });
    setIsTitleEditDialogOpen(false);
  };

  const openAddDialog = () => {
    setWorkstationToEdit(null);
    setNewWorkstationName('');
    setIsAddOrEditDialogOpen(true);
  };

  const openEditDialog = (workstation: string) => {
    setWorkstationToEdit(workstation);
    setNewWorkstationName(workstation);
    setIsAddOrEditDialogOpen(true);
  };

  const handleSave = () => {
    const trimmedName = newWorkstationName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workstation name cannot be empty.' });
      return;
    }
    if (teamWorkstations.includes(trimmedName) && trimmedName !== workstationToEdit) {
      toast({ variant: 'destructive', title: 'Error', description: `Workstation "${trimmedName}" already exists.` });
      return;
    }

    if (workstationToEdit) { // Editing existing
      const updatedWorkstations = teamWorkstations.map(ws => ws === workstationToEdit ? trimmedName : ws);
      handleUpdateTeamWorkstations(updatedWorkstations);
      toast({ title: "Workstation Updated", description: `"${workstationToEdit}" has been changed to "${trimmedName}".` });
    } else { // Adding new
      const updatedWorkstations = [...teamWorkstations, trimmedName];
      handleUpdateTeamWorkstations(updatedWorkstations);
      toast({ title: "Workstation Added", description: `"${trimmedName}" has been added.` });
    }
    setIsAddOrEditDialogOpen(false);
  };

  const handleDelete = () => {
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
              <CardTitle className="flex items-center gap-2">
                  {team.workstationsLabel || 'Manage Workstations'}
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openTitleEditDialog(team.workstationsLabel || 'Manage Workstations')}>
                      <GoogleSymbol name="edit" className="text-lg" />
                      <span className="sr-only">Edit section title</span>
                  </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                    <GoogleSymbol name="add_circle" className="text-xl" />
                    <span className="sr-only">Add New Workstation</span>
                  </Button>
              </CardTitle>
              <CardDescription>
                Add, edit, or delete workstations and edit machines for this team. These will be available as bookable locations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
            {teamWorkstations.length > 0 ? teamWorkstations.map(ws => (
              <Badge key={ws} variant="secondary" className="group text-base py-1 pl-3 pr-1 rounded-full">
                 <span className="font-medium cursor-pointer" onClick={() => openEditDialog(ws)}>{ws}</span>
                 <button
                    type="button"
                    className="ml-1 h-4 w-4 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center"
                    onClick={() => setWorkstationToDelete(ws)}
                  >
                    <GoogleSymbol name="cancel" className="text-sm" />
                    <span className="sr-only">Delete {ws}</span>
                  </button>
              </Badge>
            )) : (
              <p className="text-sm text-muted-foreground w-full text-center">No workstations defined for this team.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent>
           <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Save</span>
              </Button>
          </div>
          <DialogHeader>
            <DialogTitle>{workstationToEdit ? 'Edit Workstation' : 'Add New Workstation'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="workstation-name"
              value={newWorkstationName}
              onChange={(e) => setNewWorkstationName(e.target.value)}
              placeholder="e.g., Edit Suite 1 or VFX-PC-05"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isTitleEditDialogOpen} onOpenChange={setIsTitleEditDialogOpen}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveTitle}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Save title</span>
                </Button>
            </div>
          <DialogHeader>
            <DialogTitle>Edit Section Title</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <Input 
                id="section-title" 
                value={tempTitle} 
                onChange={(e) => setTempTitle(e.target.value)} 
                className="col-span-4"
              />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
