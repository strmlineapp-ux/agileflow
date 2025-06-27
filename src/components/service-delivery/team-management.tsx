
"use client";

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User } from '@/types';
import { type IconName, iconNames } from '@/components/icons/dynamic-icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TeamManagement() {
  const { users, teams, addTeam, updateTeam, deleteTeam } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const openAddDialog = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setEditingTeam(team);
    setIsDeleteDialogOpen(true);
  };
  
  const closeForm = () => {
      setIsFormOpen(false);
      setEditingTeam(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Teams</CardTitle>
              <CardDescription>Add, edit, or delete teams and their members.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={openAddDialog}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Add New Team</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
              {teams.map(team => (
                <Button key={team.id} variant="outline" className="h-auto" onClick={() => openEditDialog(team)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
          <TeamFormDialog 
            isOpen={isFormOpen}
            onClose={closeForm}
            team={editingTeam}
            allUsers={users}
            addTeam={addTeam}
            updateTeam={updateTeam}
            onDelete={openDeleteDialog}
          />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => !isOpen && setIsDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{editingTeam?.name}" team and all of its associated roles and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if(editingTeam) deleteTeam(editingTeam.id);
                setIsDeleteDialogOpen(false);
                closeForm();
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type TeamFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    allUsers: User[];
    addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
    updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
    onDelete: (team: Team) => void;
};

function TeamFormDialog({ isOpen, onClose, team, allUsers, addTeam, updateTeam, onDelete }: TeamFormDialogProps) {
    const [name, setName] = useState(team?.name || '');
    const [icon, setIcon] = useState<IconName>(team?.icon as IconName || 'Users');
    const [members, setMembers] = useState<string[]>(team?.members || []);
    const { toast } = useToast();

    const handleMemberToggle = (userId: string, isChecked: boolean) => {
        setMembers(prev => isChecked ? [...prev, userId] : prev.filter(id => id !== userId));
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Team name cannot be empty." });
            return;
        }

        if (team) { // Editing
            updateTeam(team.id, { name, icon, members });
            toast({ title: "Success", description: `Team "${name}" updated.` });
        } else { // Creating
            addTeam({
                name,
                icon,
                members,
                roles: [],
                pinnedLocations: []
            });
             toast({ title: "Success", description: `Team "${name}" created.` });
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{team ? `Edit ${team.name}` : 'Create New Team'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team-name" className="text-right">Name</Label>
                        <Input id="team-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team-icon" className="text-right">Icon</Label>
                        <Select value={icon} onValueChange={(val) => setIcon(val as IconName)}>
                            <SelectTrigger id="team-icon" className="col-span-3">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                                {iconNames.map(iconName => (
                                    <SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Members</Label>
                        <ScrollArea className="h-48 col-span-3 rounded-md border p-2">
                            <div className="space-y-2">
                                {allUsers.map(user => (
                                    <div key={user.userId} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`member-${user.userId}`} 
                                            checked={members.includes(user.userId)}
                                            onCheckedChange={(checked) => handleMemberToggle(user.userId, !!checked)}
                                        />
                                        <Label htmlFor={`member-${user.userId}`} className="font-normal">{user.displayName}</Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                 <DialogFooter>
                    {team && (
                        <Button variant="destructive" className="mr-auto" onClick={() => onDelete(team)}>
                            Delete Team
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

