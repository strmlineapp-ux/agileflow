

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

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

export function TeamRoleManagement({ team }: { team: Team }) {
  const { updateTeam, teams, realUser, notifications, setNotifications } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [roleToDelete, setRoleToDelete] = useState<TeamRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleIcon, setNewRoleIcon] = useState('engineering');
  const [newRoleColor, setNewRoleColor] = useState('#64748B');
  const [isAddColorPopoverOpen, setIsAddColorPopoverOpen] = useState(false);


  const [roleToAdd, setRoleToAdd] = useState('');
  const [conflictingTeams, setConflictingTeams] = useState<string[]>([]);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  const [iconSearch, setIconSearch] = useState('');
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);

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
  
  const handleUpdateRole = (roleToUpdate: TeamRole, newValues: Partial<TeamRole>) => {
    const updatedRoles = rolesForThisTeam.map(r => r.name === roleToUpdate.name ? { ...r, ...newValues } : r);
    handleUpdateTeamRoles(updatedRoles);
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

  const EditRolePopover = ({ role, children }: { role: TeamRole, children: React.ReactNode }) => {
    const [name, setName] = useState(role.name);
    const [color, setColor] = useState(role.color);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);

    const handleUpdate = (field: keyof TeamRole, value: string) => {
        if (role[field] !== value) {
            handleUpdateRole(role, { [field]: value });
        }
    };

    return (
      <Popover onOpenChange={(isOpen) => !isOpen && setEditingRole(null)}>
        <PopoverTrigger asChild onClick={() => setEditingRole(role)}>
            {children}
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-semibold leading-none tracking-tight">Edit Role</h3>
          </div>
             <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2 border rounded-md px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                                    <Button key={iconName} variant={role.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => handleUpdate('icon', iconName)} className="text-2xl">
                                    <GoogleSymbol name={iconName} />
                                    </Button>
                                ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Input 
                        id="edit-role-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        onBlur={() => handleUpdate('name', name)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-9"
                    />
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div
                                className="h-6 w-6 rounded-full shrink-0 cursor-pointer border"
                                style={{ backgroundColor: color }}
                            />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">
                                {predefinedColors.map(c => (
                                <button
                                    key={c}
                                    className="h-6 w-6 rounded-full border"
                                    style={{ backgroundColor: c }}
                                    onClick={() => {
                                        setColor(c);
                                        handleUpdate('color', c);
                                        setIsColorPopoverOpen(false);
                                    }}
                                    aria-label={`Set color to ${c}`}
                                />
                                ))}
                                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                <Input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                      setColor(e.target.value)
                                      handleUpdate('color', e.target.value)
                                    }}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                    aria-label="Custom color picker"
                                />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Manage Roles for {team.name}
                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                    <GoogleSymbol name="add_circle" className="text-xl" />
                    <span className="sr-only">Add New Role</span>
                </Button>
              </CardTitle>
              <CardDescription>
                  Add roles or click a role to edit it. Use the 'x' to remove a role.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {rolesForThisTeam.length > 0 ? rolesForThisTeam.map(role => (
              <EditRolePopover key={role.name} role={role}>
                <Badge 
                    variant="outline"
                    style={{ color: role.color, borderColor: role.color }}
                    className="group text-base py-1 pl-3 pr-1 rounded-full cursor-pointer"
                >
                    <GoogleSymbol name={role.icon} className="mr-2 text-lg" />
                    <span className="font-medium">{role.name}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(role); }}
                        className="ml-1 h-5 w-5 rounded-full hover:bg-black/20"
                        style={{ color: role.color }}
                    >
                        <GoogleSymbol name="cancel" className="text-sm" />
                        <span className="sr-only">Remove {role.name}</span>
                    </Button>
                </Badge>
              </EditRolePopover>
            )) : (
              <p className="text-sm text-muted-foreground">No custom roles defined for this team.</p>
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
              <Popover open={isAddColorPopoverOpen} onOpenChange={setIsAddColorPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div
                      className="h-6 w-6 rounded-full shrink-0 cursor-pointer border"
                      style={{ backgroundColor: newRoleColor }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-8 gap-1">
                      {predefinedColors.map(c => (
                        <button
                          key={c}
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            setNewRoleColor(c);
                            setIsAddColorPopoverOpen(false);
                          }}
                          aria-label={`Set color to ${c}`}
                        />
                      ))}
                      <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                        <GoogleSymbol name="colorize" className="text-muted-foreground" />
                        <Input
                          type="color"
                          value={newRoleColor}
                          onChange={(e) => setNewRoleColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                          aria-label="Custom color picker"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
