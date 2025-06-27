"use client";

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function TeamRoleManagement({ teamTitle }: { teamTitle: string }) {
  const { roleCategories, updateRoleCategories, allRoles } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [roleToEdit, setRoleToEdit] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const rolesForThisTeam = roleCategories[teamTitle] || [];

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

  const handleAddRole = () => {
    const trimmedName = newRoleName.trim();
    if (trimmedName && !allRoles.includes(trimmedName)) {
      const updatedTeamRoles = [...rolesForThisTeam, trimmedName].sort();
      const updatedCategories = { ...roleCategories, [teamTitle]: updatedTeamRoles };
      updateRoleCategories(updatedCategories);
      toast({ title: "Role Added", description: `"${trimmedName}" has been added to ${teamTitle}.` });
      setIsAddDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Role "${trimmedName}" already exists or is invalid.` });
    }
  };

  const handleEditRole = () => {
    const trimmedName = newRoleName.trim();
    if (trimmedName && roleToEdit && !allRoles.includes(trimmedName)) {
      const updatedTeamRoles = rolesForThisTeam.map(r => (r === roleToEdit ? trimmedName : r)).sort();
      const updatedCategories = { ...roleCategories, [teamTitle]: updatedTeamRoles };
      updateRoleCategories(updatedCategories);
      toast({ title: "Role Updated", description: `"${roleToEdit}" has been changed to "${trimmedName}".` });
      setIsEditDialogOpen(false);
    } else {
        toast({ variant: 'destructive', title: "Error", description: `Role "${trimmedName}" already exists or is invalid.` });
    }
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    const updatedTeamRoles = rolesForThisTeam.filter(r => r !== roleToDelete);
    const updatedCategories = { ...roleCategories, [teamTitle]: updatedTeamRoles };
    updateRoleCategories(updatedCategories);
    toast({ title: "Role Deleted", description: `"${roleToDelete}" has been deleted.` });
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-semibold">{teamTitle} Roles</h1>
            <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Role
            </Button>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Manage Roles for {teamTitle}</CardTitle>
            <CardDescription>
                Add, edit, or delete roles available for assignment to this team.
            </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rolesForThisTeam.map(role => (
                    <TableRow key={role}>
                    <TableCell className="font-medium">{role}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Role Actions</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteDialog(role)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>
      
      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add New Role to {teamTitle}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-role-name">Role Name</Label>
            <Input id="new-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole}>Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="edit-role-name">Role Name</Label>
            <Input id="edit-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{roleToDelete}" role and remove it from all users who have it.
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
