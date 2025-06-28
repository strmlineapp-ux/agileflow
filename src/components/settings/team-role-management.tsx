
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { type Team, type Notification } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';

export function TeamRoleManagement({ team }: { team: Team }) {
  const { allTeamRoles, updateTeam, users, teams, realUser, notifications, setNotifications } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  // New state for conflict management
  const [roleToAdd, setRoleToAdd] = useState('');
  const [conflictingTeams, setConflictingTeams] = useState<string[]>([]);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const rolesForThisTeam = team.roles || [];

  const openAddDialog = () => {
    setNewRoleName('');
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (role: string) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateTeamRoles = (newRoles: string[]) => {
      updateTeam(team.id, { roles: newRoles.sort() });
  };

  const handleAddRole = () => {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: "Error", description: "Role name cannot be empty." });
      return;
    }
    if (rolesForThisTeam.includes(trimmedName)) {
      toast({ variant: 'destructive', title: "Error", description: `This team already has the role "${trimmedName}".` });
      return;
    }

    const otherTeamsWithRole = teams.filter(t => t.id !== team.id && (t.roles || []).includes(trimmedName));

    if (otherTeamsWithRole.length > 0) {
      setRoleToAdd(trimmedName);
      setConflictingTeams(otherTeamsWithRole.map(t => t.name));
      setIsConflictDialogOpen(true);
      setIsAddDialogOpen(false); // Close the initial dialog
    } else {
      // No conflict, add directly
      const updatedTeamRoles = [...rolesForThisTeam, trimmedName];
      handleUpdateTeamRoles(updatedTeamRoles);
      toast({ title: "Role Added", description: `"${trimmedName}" has been added to ${team.name}.` });
      setIsAddDialogOpen(false);
    }
  };
  
  const handleConfirmAddDuplicateRole = () => {
    if (!roleToAdd) return;

    // 1. Add the role
    const updatedTeamRoles = [...rolesForThisTeam, roleToAdd];
    handleUpdateTeamRoles(updatedTeamRoles);
    toast({ title: "Role Added", description: `"${roleToAdd}" has been added to ${team.name}.` });

    // 2. Create notification
    const allInvolvedTeams = [team, ...teams.filter(t => conflictingTeams.includes(t.name))];
    
    const newNotification: Notification = {
      id: new Date().toISOString(),
      type: 'standard',
      user: realUser,
      content: `has added the role "${roleToAdd}", which is now used by teams: ${allInvolvedTeams.map(t => t.name).join(', ')}.`,
      time: new Date(),
      read: false,
    };
    
    setNotifications([newNotification, ...notifications]);

    // 3. Reset state
    setIsConflictDialogOpen(false);
    setRoleToAdd('');
    setConflictingTeams([]);
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    const updatedTeamRoles = rolesForThisTeam.filter(r => r !== roleToDelete);
    handleUpdateTeamRoles(updatedTeamRoles);
    toast({ title: "Role Deleted", description: `"${roleToDelete}" has been deleted.` });
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Roles for {team.name}</CardTitle>
              <CardDescription>
                  Add roles or click a role to remove it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {rolesForThisTeam.length > 0 ? rolesForThisTeam.map(role => (
              <Badge 
                key={role} 
                variant="secondary" 
                className="group text-base py-1 px-3 rounded-full cursor-pointer hover:bg-destructive/20 hover:text-destructive-foreground transition-colors"
                onClick={() => openDeleteDialog(role)}
                title={`Click to delete "${role}"`}
              >
                {role}
              </Badge>
            )) : (
              <p className="text-sm text-muted-foreground">No custom roles defined for this team.</p>
            )}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={openAddDialog}>
                <GoogleSymbol name="add" className="text-xl" />
                <span className="sr-only">Add New Role</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddRole}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Add Role</span>
              </Button>
          </div>
          <DialogHeader><DialogTitle>Add New Role to {team.name}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input id="new-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role Name" onKeyDown={(e) => e.key === 'Enter' && handleAddRole()} />
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{roleToDelete}" role and remove it from all users who have it assigned within this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Role Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              The role "{roleToAdd}" already exists in the following team(s): {conflictingTeams.join(', ')}.
              <br /><br />
              Are you sure you want to add this role to the {team.name} team as well?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAddDuplicateRole}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
