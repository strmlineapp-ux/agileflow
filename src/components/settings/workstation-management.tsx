
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type AppTab, type AppPage } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditor } from '../common/inline-editor';
import { PageTitle } from '../common/page-title';
import { TeamSelection } from '../common/team-selection';

function WorkstationContent({ team }: { team: Team }) {
  const { updateTeam, viewAsUser } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [workstationToDelete, setWorkstationToDelete] = useState<string | null>(null);
  const [newWorkstationName, setNewWorkstationName] = useState('');
  
  const canManage = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                  Workstation List
                   <Button variant="circle" size="icon" onClick={() => setIsAddDialogOpen(true)} disabled={!canManage}>
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
                  disabled={!canManage}
                />
                 <button
                    type="button"
                    className="ml-1 h-5 w-5 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => canManage && setWorkstationToDelete(ws)}
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
              <Button variant="default" size="icon" className="h-8 w-8" onClick={handleSaveNew}>
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
                <Button variant="default" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={handleDelete}>
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


export function WorkstationManagement({ team: teamFromProps, tab, page }: { team?: Team | null; tab: AppTab; page: AppPage }) {
    const { viewAsUser, teams, updatePage } = useUser();
    const { toast } = useToast();
    const [selectedTeam, setSelectedTeam] = useState<Team | null | undefined>(teamFromProps);

    useEffect(() => {
        setSelectedTeam(teamFromProps);
    }, [teamFromProps]);
    
    const canManagePage = viewAsUser.isAdmin;
    const title = page.displayTitle ?? tab.name;

    const handleTitleSave = (newTitle: string) => {
      updatePage(page.id, { displayTitle: newTitle });
    };

    const handleTitleReset = (e: React.MouseEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
          e.preventDefault();
          updatePage(page.id, { displayTitle: null });
          toast({title: "Title Reset", description: "The page title has been reset to its default."});
      }
    };
  
    return (
      <div className="flex flex-col h-full gap-6">
        <PageTitle 
          title={title}
          onSave={handleTitleSave}
          onReset={handleTitleReset}
          disabled={!canManagePage}
        />
        {selectedTeam ? (
            <WorkstationContent team={selectedTeam} />
        ) : (
            <TeamSelection
                teams={teams}
                onSelectTeam={(team) => setSelectedTeam(team)}
                message="Select a team to manage its workstations."
            />
        )}
      </div>
    );
}
