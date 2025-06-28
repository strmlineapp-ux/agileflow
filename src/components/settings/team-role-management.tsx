
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
import { type Team } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';

export function TeamRoleManagement({ team }: { team: Team }) {
  const { allTeamRoles, updateTeam } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [roleToEdit, setRoleToEdit] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const rolesForThisTeam = team.roles || [];

  const openAddDialog = () => {
    setNewRoleName('');
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (role: string) => {
    setRoleToEdit(role);
    setNewRoleName(role);
    setIsEditDialogOpen(true);
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
    if (trimmedName && !allTeamRoles.includes(trimmedName)) {
      const updatedTeamRoles = [...rolesForThisTeam, trimmedName];
      handleUpdateTeamRoles(updatedTeamRoles);
      toast({ title: "Role Added", description: `"${trimmedName}" has been added to ${team.name}.` });
      setIsAddDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Role "${trimmedName}" already exists or is invalid.` });
    }
  };

  const handleEditRole = () => {
    const trimmedName = newRoleName.trim();
    if (trimmedName && roleToEdit && (!allTeamRoles.includes(trimmedName) || trimmedName === roleToEdit)) {
      const updatedTeamRoles = rolesForThisTeam.map(r => (r === roleToEdit ? trimmedName : r));
      handleUpdateTeamRoles(updatedTeamRoles);
      toast({ title: "Role Updated", description: `"${roleToEdit}" has been changed to "${trimmedName}".` });
      setIsEditDialogOpen(false);
    } else {
        toast({ variant: 'destructive', title: "Error", description: `Role "${trimmedName}" already exists or is invalid.` });
    }
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
                  Add, edit, or delete roles available for assignment to this team.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={openAddDialog}>
              <GoogleSymbol name="add_circle" className="text-2xl" />
              <span className="sr-only">Add New Role</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {rolesForThisTeam.length > 0 ? rolesForThisTeam.map(role => (
              <Badge key={role} variant="secondary" className="group text-base py-1 pl-3 pr-1 rounded-full">
                <span className="font-medium cursor-pointer" onClick={() => openEditDialog(role)}>{role}</span>
                <button 
                  type="button" 
                  className="ml-1 h-4 w-4 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center" 
                  onClick={() => openDeleteDialog(role)}
                >
                  <GoogleSymbol name="cancel" className="text-sm" />
                  <span className="sr-only">Delete {role}</span>
                </button>
              </Badge>
            )) : (
              <p className="text-sm text-muted-foreground w-full text-center">No custom roles defined for this team.</p>
            )}
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
            <Input id="new-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role Name" />
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditRole}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Save Changes</span>
              </Button>
          </div>
          <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input id="edit-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role Name" />
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
    </>
  );
}
