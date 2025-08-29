

'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditor } from '../common/inline-editor';

export function WorkstationManagement({ team, tab }: { team: Team, tab: AppTab }) {
  if (!team) {
    return null;
  }
  
  const { updateTeam, updateAppTab } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [workstationToDelete, setWorkstationToDelete] = useState<string | null>(null);
  const [newWorkstationName, setNewWorkstationName] = useState('');

  const teamWorkstations = team.workstations || [];

  const handleUpdateTeamWorkstations = (newWorkstations: string[]) => {
    updateTeam(team.id, { workstations: newWorkstations.sort() });
  };

  const handleSaveNew = () => {
    const trimmedName = newWorkstationName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Workstation name cannot be empty.' });
      return;
    }
    if (teamWorkstations.includes(trimmedName)) {
      toast({ variant: 'destructive', title: 'Error', description: `Workstation "${trimmedName}" already exists.` });
      return;
    }
    
    const updatedWorkstations = [...teamWorkstations, trimmedName];
    handleUpdateTeamWorkstations(updatedWorkstations);
    toast({ title: "Workstation Added", description: `"${trimmedName}" has been added.` });
    setIsAddDialogOpen(false);
    setNewWorkstationName('');
  };

  const handleSaveEdit = (oldName: string, newName: string) => {
    if (newName && newName !== oldName) {
      if (teamWorkstations.includes(newName)) {
        toast({ variant: 'destructive', title: 'Error', description: `Workstation "${newName}" already exists.` });
        return;
      }
      const updatedWorkstations = teamWorkstations.map(ws => ws === oldName ? newName : ws);
      handleUpdateTeamWorkstations(updatedWorkstations);
      toast({ title: "Workstation Updated" });
    }
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
      <div className="flex items-center gap-2 mb-6">
        <InlineEditor
            value={tab.name}
            onSave={(newValue) => updateAppTab(tab.id, { name: newValue })}
            className="h-auto p-0 font-headline text-2xl font-thin tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                  Workstation List
                   <Button variant="circle" size="icon" onClick={() => setIsAddDialogOpen(true)}>
                    <GoogleSymbol name="add_circle" />
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
              <div key={ws} className="group relative flex items-center gap-2 rounded-full border-2 p-1 pl-2 bg-muted text-muted-foreground">
                <InlineEditor
                  value={ws}
                  onSave={(newValue) => handleSaveEdit(ws, newValue)}
                  className="font-medium text-sm"
                />
                 <button
                    type="button"
                    className="ml-1 h-5 w-5 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => setWorkstationToDelete(ws)}
                  >
                    <GoogleSymbol name="close" className="text-xs" />
                    <span className="sr-only">Delete {ws}</span>
                  </button>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground w-full text-center">No workstations defined for this team.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
           <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveNew}>
                <GoogleSymbol name="check" />
                <span className="sr-only">Save New Workstation</span>
              </Button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-muted-foreground">Add New Workstation</DialogTitle>
            <DialogDescription>Enter the name for the new workstation or machine.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 pt-4">
            <Input
              id="workstation-name"
              value={newWorkstationName}
              onChange={(e) => setNewWorkstationName(e.target.value)}
              placeholder="e.g., Edit Suite 1 or VFX-PC-05"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!workstationToDelete} onOpenChange={(isOpen) => !isOpen && setWorkstationToDelete(null)}>
        <DialogContent className="max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={handleDelete}>
                    <GoogleSymbol name="delete" />
                    <span className="sr-only">Delete Workstation</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle className="text-muted-foreground">Delete Workstation?</DialogTitle>
                <DialogDescription>
                    This will permanently delete the workstation "{workstationToDelete}". This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
