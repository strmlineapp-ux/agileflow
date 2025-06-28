

'use client';

import { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { type Team, type Notification, type TeamRole } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';
import { getContrastColor } from '@/lib/utils';

export function TeamRoleManagement({ team }: { team: Team }) {
  const { updateTeam, teams, realUser, notifications, setNotifications } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [roleToDelete, setRoleToDelete] = useState<TeamRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleIcon, setNewRoleIcon] = useState('engineering');
  const [newRoleColor, setNewRoleColor] = useState('#64748B');

  const [roleToAdd, setRoleToAdd] = useState('');
  const [conflictingTeams, setConflictingTeams] = useState<string[]>([]);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const [iconSearch, setIconSearch] = useState('');
  const [activeIconPopover, setActiveIconPopover] = useState<string | null>(null);

  const rolesForThisTeam = team.roles || [];

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  const openAddDialog = () => {
    setNewRoleName('');
    setNewRoleIcon('engineering');
    setNewRoleColor('#64748B');
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (role: TeamRole) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateTeamRoles = (newRoles: TeamRole[]) => {
      updateTeam(team.id, { roles: newRoles.sort((a,b) => a.name.localeCompare(b.name)) });
  };
  
  const handleUpdateRoleIcon = (roleName: string, newIcon: string) => {
    const updatedRoles = rolesForThisTeam.map(r => r.name === roleName ? { ...r, icon: newIcon } : r);
    handleUpdateTeamRoles(updatedRoles);
    setActiveIconPopover(null);
  }

  const handleAddRole = () => {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: "Error", description: "Role name cannot be empty." });
      return;
    }
    if (rolesForThisTeam.some(r => r.name === trimmedName)) {
      toast({ variant: 'destructive', title: "Error", description: `This team already has the role "${trimmedName}".` });
      return;
    }

    const otherTeamsWithRole = teams.filter(t => t.id !== team.id && t.roles.some(r => r.name === trimmedName));

    if (otherTeamsWithRole.length > 0) {
      setRoleToAdd(trimmedName);
      setConflictingTeams(otherTeamsWithRole.map(t => t.name));
      setIsConflictDialogOpen(true);
      setIsAddDialogOpen(false); // Close the initial dialog
    } else {
      const updatedTeamRoles = [...rolesForThisTeam, { name: trimmedName, icon: newRoleIcon, color: newRoleColor }];
      handleUpdateTeamRoles(updatedTeamRoles);
      toast({ title: "Role Added", description: `"${trimmedName}" has been added to ${team.name}.` });
      setIsAddDialogOpen(false);
    }
  };
  
  const handleConfirmAddDuplicateRole = () => {
    if (!roleToAdd) return;

    const updatedTeamRoles = [...rolesForThisTeam, { name: roleToAdd, icon: newRoleIcon, color: newRoleColor }];
    handleUpdateTeamRoles(updatedTeamRoles);
    toast({ title: "Role Added", description: `"${roleToAdd}" has been added to ${team.name}.` });

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

    setIsConflictDialogOpen(false);
    setRoleToAdd('');
    setConflictingTeams([]);
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    const updatedTeamRoles = rolesForThisTeam.filter(r => r.name !== roleToDelete.name);
    handleUpdateTeamRoles(updatedTeamRoles);
    toast({ title: "Role Deleted", description: `"${roleToDelete.name}" has been deleted.` });
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
                  Add roles or click a role to remove it. Click the icon to change it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {rolesForThisTeam.length > 0 ? rolesForThisTeam.map(role => (
              <Badge 
                key={role.name}
                variant="secondary"
                style={{ backgroundColor: role.color, color: getContrastColor(role.color) }}
                className="group text-base py-1 pl-1.5 pr-3 rounded-full border-transparent"
              >
                <Popover open={activeIconPopover === role.name} onOpenChange={(isOpen) => setActiveIconPopover(isOpen ? role.name : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" aria-label={`Change icon for ${role.name}`}>
                      <GoogleSymbol name={role.icon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <div className="p-2 border-b">
                      <Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} />
                    </div>
                    <ScrollArea className="h-64">
                      <div className="grid grid-cols-6 gap-1 p-2">
                        {filteredIcons.slice(0, 300).map((iconName) => (
                          <Button key={iconName} variant={role.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => handleUpdateRoleIcon(role.name, iconName)} className="text-2xl">
                            <GoogleSymbol name={iconName} />
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <span className="cursor-pointer" onClick={() => openDeleteDialog(role)}>{role.name}</span>
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
            <div className="flex items-center gap-2 border rounded-md px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <GoogleSymbol name={newRoleIcon} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-2 border-b">
                    <Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-6 gap-1 p-2">
                      {filteredIcons.slice(0, 300).map((iconName) => (
                        <Button key={iconName} variant={newRoleIcon === iconName ? "default" : "ghost"} size="icon" onClick={() => setNewRoleIcon(iconName)} className="text-2xl">
                          <GoogleSymbol name={iconName} />
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <Input 
                id="new-role-name" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)} 
                placeholder="Role Name" 
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-9"
              />
            </div>
            <div className="relative h-9 w-full">
                <div
                    className="absolute inset-0 h-full w-full rounded-md border"
                    style={{ backgroundColor: newRoleColor }}
                />
                <Input
                    id="color"
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                    aria-label="Role color"
                />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{roleToDelete?.name}" role and remove it from all users who have it assigned within this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <DialogContent>
          <div className="absolute top-4 right-4 flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsConflictDialogOpen(false)}>
                <GoogleSymbol name="close" className="text-xl" />
                <span className="sr-only">Cancel</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleConfirmAddDuplicateRole}>
                <GoogleSymbol name="check" className="text-xl" />
                <span className="sr-only">Continue</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>Role Already Exists</DialogTitle>
            <DialogDescription>
              The role "{roleToAdd}" already exists in the following team(s): {conflictingTeams.join(', ')}.
              <br /><br />
              Are you sure you want to add this role to the {team.name} team as well? A notification will be sent to the managers of all involved teams.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
