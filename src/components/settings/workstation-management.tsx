

'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function WorkstationManagement({ team, tab }: { team: Team, tab: AppTab }) {
  const { updateTeam, updateAppTab } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [workstationToDelete, setWorkstationToDelete] = useState<string | null>(null);
  const [newWorkstationName, setNewWorkstationName] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [editingWorkstation, setEditingWorkstation] = useState<string | null>(null);
  const workstationInputRef = useRef<HTMLInputElement>(null);

  const teamWorkstations = team.workstations || [];
  
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (editingWorkstation && workstationInputRef.current) {
        workstationInputRef.current.focus();
        workstationInputRef.current.select();
    }
  }, [editingWorkstation]);
  
  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== tab.name) {
      updateAppTab(tab.id, { name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

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

  const handleSaveEdit = () => {
    if (!editingWorkstation || !workstationInputRef.current) return;
    const newName = workstationInputRef.current.value.trim();
    if (newName && newName !== editingWorkstation) {
      if (teamWorkstations.includes(newName)) {
        toast({ variant: 'destructive', title: 'Error', description: `Workstation "${newName}" already exists.` });
        setEditingWorkstation(null);
        return;
      }
      const updatedWorkstations = teamWorkstations.map(ws => ws === editingWorkstation ? newName : ws);
      handleUpdateTeamWorkstations(updatedWorkstations);
      toast({ title: "Workstation Updated" });
    }
    setEditingWorkstation(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') setEditingWorkstation(null);
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
        {isEditingTitle ? (
            <Input
                ref={titleInputRef}
                defaultValue={tab.name}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        ) : (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                    </TooltipTrigger>
                    {tab.description && (
                        <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        )}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                  Workstation List
                   <Button variant="ghost" size="icon" className="p-0" onClick={() => setIsAddDialogOpen(true)}>
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
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
                {editingWorkstation === ws ? (
                    <Input
                        ref={workstationInputRef}
                        defaultValue={ws}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="h-5 p-0 bg-transparent text-sm font-headline font-thin border-0 shadow-none focus-visible:ring-0"
                    />
                ) : (
                    <span className="font-medium text-sm cursor-text" onClick={() => setEditingWorkstation(ws)}>
                        {ws}
                    </span>
                )}
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
        <DialogContent>
           <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="p-0" onClick={handleSaveNew}>
                  <GoogleSymbol name="check" className="text-4xl" weight={100} />
                  <span className="sr-only">Save</span>
              </Button>
          </div>
          <DialogHeader>
            <DialogTitle>Add New Workstation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="workstation-name"
              value={newWorkstationName}
              onChange={(e) => setNewWorkstationName(e.target.value)}
              placeholder="e.g., Edit Suite 1 or VFX-PC-05"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!workstationToDelete} onOpenChange={(isOpen) => !isOpen && setWorkstationToDelete(null)}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="p-0 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                    <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                    <span className="sr-only">Delete Workstation</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle>Delete Workstation?</DialogTitle>
                <DialogDescription>
                    This will permanently delete the workstation "{workstationToDelete}". This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
