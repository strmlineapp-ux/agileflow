'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type CustomAdminRole, type LinkGroup, type AppPage, type AppTab, type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

// #region Helper Components and Constants
const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

// Wrapper to fix issues with react-beautiful-dnd and React 18 Strict Mode
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

// #endregion

// #region Roles Management Tab
const UserRoleCard = ({ user, onRemove, isTeamAdmin, onSetTeamAdmin }: { user: User; onRemove: (user: User) => void; isTeamAdmin: boolean; onSetTeamAdmin: (user: User) => void; }) => {
  return (
    <Card 
        className={cn("transition-all", isTeamAdmin && "ring-2 ring-primary")}
        onClick={() => onSetTeamAdmin(user)}
    >
      <CardContent className="p-4 flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
            <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onRemove(user); }} 
            aria-label={`Remove role from ${user.displayName}`}
            className="text-muted-foreground hover:text-destructive"
        >
          <GoogleSymbol name="cancel" />
        </Button>
      </CardContent>
    </Card>
  );
};

const AddUserToRoleButton = ({ usersToAdd, onAdd, roleName }: { usersToAdd: User[], onAdd: (user: User) => void, roleName: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (user: User) => {
    onAdd(user);
    setIsOpen(false);
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <GoogleSymbol name="add_circle" className="text-2xl" />
            <span className="sr-only">Assign {roleName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80">
        <ScrollArea className="h-64">
           <div className="p-1">
            {usersToAdd.length > 0 ? usersToAdd.map(user => (
              <div key={user.userId} onClick={() => handleSelect(user)} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-sm text-muted-foreground p-4">All users are assigned.</p>
            )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function CustomRoleCard({ 
  role,
  rank,
  users, 
  canLink,
  onUpdate, 
  onDelete, 
  onLink,
  linkGroup,
  onUpdateLinkGroup,
  onUnlink,
  isLinking
}: { 
  role: CustomAdminRole; 
  rank: number;
  users: User[]; 
  canLink: boolean;
  onUpdate: (updatedRole: CustomAdminRole) => void;
  onDelete: () => void;
  onLink: (roleId: string) => void;
  linkGroup: LinkGroup | null;
  onUpdateLinkGroup: (groupId: string, newGroup: LinkGroup) => void;
  onUnlink: (roleId: string) => void;
  isLinking: boolean;
}) {
    const { toast } = useToast();
    const { updateUser } = useUser();
    
    // Popover States
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
    const [isLinkIconPopoverOpen, setIsLinkIconPopoverOpen] = useState(false);
    const [isLinkColorPopoverOpen, setIsLinkColorPopoverOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const [iconSearch, setIconSearch] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
    }, [isEditingName]);

    const handleSaveName = () => {
        const input = nameInputRef.current;
        if (!input || !input.value.trim()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Display name cannot be empty.' });
          setIsEditingName(false);
          return;
        }
        if (input.value.trim() !== role.name) {
            onUpdate({ ...role, name: input.value.trim() });
            toast({ title: 'Success', description: 'Role name updated.' });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleSaveName();
        } else if (e.key === 'Escape') {
          setIsEditingName(false);
        }
    };
    
    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    const assignedUsers = useMemo(() => users.filter(u => u.roles?.includes(role.name)), [users, role.name]);
    const unassignedUsers = useMemo(() => users.filter(u => !u.roles?.includes(role.name)), [users, role.name]);

    const handleRoleToggle = (user: User) => {
        const currentRoles = user.roles || [];
        const hasRole = currentRoles.includes(role.name);
        const newRoles = hasRole
            ? currentRoles.filter(r => r !== role.name)
            : [...currentRoles, role.name];

        updateUser(user.userId, { roles: newRoles });
        toast({ title: 'Success', description: `${user.displayName}'s role has been updated.` });
    };

    const handleSetTeamAdmin = (userToUpdate: User) => {
        const currentAdmins = role.teamAdmins || [];
        const isAlreadyAdmin = currentAdmins.includes(userToUpdate.userId);
        const newAdmins = isAlreadyAdmin
            ? currentAdmins.filter(id => id !== userToUpdate.userId)
            : [...currentAdmins, userToUpdate.userId];
        onUpdate({ ...role, teamAdmins: newAdmins });
    };


    return (
        <>
        <Card className={cn(isLinking && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="relative">
                  {linkGroup && (
                    <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div 
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full border-2 border-card cursor-pointer flex items-center justify-center z-10" 
                                style={{ backgroundColor: linkGroup.color }}
                                aria-label="Edit link group"
                            >
                                <GoogleSymbol name={linkGroup.icon} style={{ fontSize: '14px', color: getContrastColor(linkGroup.color) }}/>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Popover open={isLinkIconPopoverOpen} onOpenChange={setIsLinkIconPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl text-muted-foreground hover:text-foreground">
                                                <GoogleSymbol name={linkGroup.icon} />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0">
                                            <div className="p-2 border-b">
                                                <Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} />
                                            </div>
                                            <ScrollArea className="h-64">
                                                <div className="grid grid-cols-6 gap-1 p-2">
                                                    {filteredIcons.slice(0, 300).map((iconName) => (
                                                        <Button
                                                            key={iconName}
                                                            variant={linkGroup.icon === iconName ? "default" : "ghost"}
                                                            size="icon"
                                                            onClick={() => { onUpdateLinkGroup(role.linkGroupId!, { ...linkGroup, icon: iconName }); setIsLinkIconPopoverOpen(false); }}
                                                            className="text-2xl"
                                                        >
                                                            <GoogleSymbol name={iconName} />
                                                        </Button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                    <Popover open={isLinkColorPopoverOpen} onOpenChange={setIsLinkColorPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-popover cursor-pointer" aria-label="Change link group color">
                                                <div className="h-full w-full rounded-full" style={{ backgroundColor: linkGroup.color }}/>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2">
                                            <div className="grid grid-cols-8 gap-1">
                                                {predefinedColors.map(color => (
                                                    <button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => { onUpdateLinkGroup(role.linkGroupId!, { ...linkGroup, color: color }); setIsLinkColorPopoverOpen(false); }}/>
                                                ))}
                                                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                                    <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                                    <Input type="color" value={linkGroup.color} onChange={(e) => onUpdateLinkGroup(role.linkGroupId!, { ...linkGroup, color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0" aria-label="Custom color picker"/>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => { onUnlink(role.id); setIsLinkPopoverOpen(false); }}>
                                    <GoogleSymbol name="link_off" className="text-2xl" />
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                  )}
                  <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl text-muted-foreground hover:text-foreground">
                            <GoogleSymbol name={role.icon} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                            <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={role.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate({ ...role, icon: iconName }); setIsIconPopoverOpen(false); }} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div 
                                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card cursor-pointer flex items-center justify-center" 
                                aria-label="Change service admin color"
                                style={{ backgroundColor: role.color }}
                            >
                                <span className="text-xs font-bold" style={{ color: getContrastColor(role.color) }}>
                                    {rank}
                                </span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-8 gap-1">
                            {predefinedColors.map(color => (<button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => { onUpdate({ ...role, color: color }); setIsColorPopoverOpen(false); }} aria-label={`Set color to ${color}`}/>))}
                            <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                            <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={role.color} onChange={(e) => onUpdate({ ...role, color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0" aria-label="Custom color picker"/>
                            </div>
                        </div>
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex-1">
                    {isEditingName ? (<Input ref={nameInputRef} defaultValue={role.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="font-body h-auto p-0 text-2xl font-semibold leading-none tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>) : (<CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{role.name}</CardTitle>)}
                </div>
                <div className="flex items-center gap-0">
                    <TooltipProvider>
                        <Tooltip><TooltipTrigger asChild><AddUserToRoleButton usersToAdd={unassignedUsers} onAdd={handleRoleToggle} roleName={role.name} /></TooltipTrigger><TooltipContent>Assign User</TooltipContent></Tooltip>
                        {canLink && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onLink(role.id)}><GoogleSymbol name="link" /></Button></TooltipTrigger><TooltipContent>Link Role</TooltipContent></Tooltip>}
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}><GoogleSymbol name="delete" /></Button></TooltipTrigger><TooltipContent>Delete Role</TooltipContent></Tooltip>
                    </TooltipProvider>
                </div>
              </div>
              <CardDescription>Assign or revoke {role.name} privileges for managing app-wide settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedUsers.map(user => (
                <UserRoleCard 
                    key={user.userId} 
                    user={user} 
                    onRemove={handleRoleToggle}
                    isTeamAdmin={(role.teamAdmins || []).includes(user.userId)}
                    onSetTeamAdmin={handleSetTeamAdmin}
                />
              ))}
            </CardContent>
          </Card>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the "{role.name}" role level and unassign all users.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
    );
}

const RolesManagement = () => {
  const { toast } = useToast();
  const { users, updateUser, appSettings, updateAppSettings } = useUser();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [linkingState, setLinkingState] = useState<{ roleId: string } | null>(null);
  
  const canLinkRoles = appSettings.customAdminRoles.length > 1;

  const roleRanks = useMemo(() => {
    const ranks = new Map<string, number>();
    const computedRanks: number[] = [];
    let currentRank = 1;
    appSettings.customAdminRoles.forEach(role => {
        let rank;
        if (role.linkGroupId) {
            if (ranks.has(role.linkGroupId)) {
                rank = ranks.get(role.linkGroupId)!;
            } else {
                rank = currentRank;
                ranks.set(role.linkGroupId, rank);
                currentRank++;
            }
        } else {
            rank = currentRank;
            currentRank++;
        }
        computedRanks.push(rank);
    });
    return computedRanks;
  }, [appSettings.customAdminRoles]);

  const adminUsers = useMemo(() => users.filter(u => u.isAdmin), [users]);
  const nonAdminUsers = useMemo(() => users.filter(u => !u.isAdmin), [users]);

  const handleAdminToggle = (user: User) => {
    const action = () => {
      updateUser(user.userId, { isAdmin: !user.isAdmin });
      toast({ title: 'Success', description: `${user.displayName}'s admin status has been updated.` });
    };
    setOn2faSuccess(() => action);
    setIs2faDialogOpen(true);
  };

  const handleVerify2fa = () => {
    if (twoFactorCode === '123456') {
      on2faSuccess?.();
      close2faDialog();
    } else {
      toast({ variant: 'destructive', title: 'Verification Failed', description: 'The provided 2FA code is incorrect. Please try again.' });
      setTwoFactorCode('');
    }
  };

  const close2faDialog = () => {
    setIs2faDialogOpen(false);
    setTwoFactorCode('');
    setOn2faSuccess(null);
  };

  const handleAddCustomRole = () => {
    const newRoleName = `Service Admin${'+'.repeat(appSettings.customAdminRoles.length)}`;
    const newRole: CustomAdminRole = {
        id: crypto.randomUUID(),
        name: newRoleName,
        icon: 'add_moderator',
        color: predefinedColors[appSettings.customAdminRoles.length % predefinedColors.length],
        teamAdmins: [],
    };
    updateAppSettings({ customAdminRoles: [...appSettings.customAdminRoles, newRole] });
    toast({ title: 'New Level Added', description: `"${newRoleName}" has been created.` });
  };

  const handleUpdateCustomRole = (updatedRole: CustomAdminRole) => {
      const newRoles = appSettings.customAdminRoles.map(r => r.id === updatedRole.id ? updatedRole : r);
      updateAppSettings({ customAdminRoles: newRoles });
  }

  const handleDeleteCustomRole = (roleId: string) => {
      const roleToUpdate = appSettings.customAdminRoles.find(r => r.id === roleId);
      if (roleToUpdate?.linkGroupId) {
        handleUnlinkRole(roleId, true);
      }
      const newRoles = appSettings.customAdminRoles.filter(r => r.id !== roleId);
      updateAppSettings({ customAdminRoles: newRoles });
      toast({ title: 'Success', description: 'Role level deleted.' });
  }

  const handleLinkClick = (roleId: string) => {
    if (!linkingState) {
        setLinkingState({ roleId });
        return;
    }
    if (linkingState.roleId === roleId) {
        setLinkingState(null);
        return;
    }
    const rolesWithUpdatedLinks = appSettings.customAdminRoles.map(r => ({ ...r }));
    let linkGroupsToUpdate = { ...appSettings.linkGroups };
    const sourceRole = rolesWithUpdatedLinks.find(r => r.id === linkingState.roleId)!;
    const targetRole = rolesWithUpdatedLinks.find(r => r.id === roleId)!;

    if (!sourceRole.linkGroupId && !targetRole.linkGroupId) {
        const newGroupId = crypto.randomUUID();
        sourceRole.linkGroupId = newGroupId;
        targetRole.linkGroupId = newGroupId;
        linkGroupsToUpdate[newGroupId] = { icon: 'link', color: '#64748B' };
    } else if (sourceRole.linkGroupId && !targetRole.linkGroupId) {
        targetRole.linkGroupId = sourceRole.linkGroupId;
    } else if (!sourceRole.linkGroupId && targetRole.linkGroupId) {
        sourceRole.linkGroupId = targetRole.linkGroupId;
    } else if (sourceRole.linkGroupId !== targetRole.linkGroupId) {
        const targetGroupId = targetRole.linkGroupId!;
        const sourceGroupId = sourceRole.linkGroupId!;
        rolesWithUpdatedLinks.forEach(r => {
            if (r.linkGroupId === targetGroupId) {
                r.linkGroupId = sourceGroupId;
            }
        });
        delete linkGroupsToUpdate[targetGroupId];
    }
    
    const reorderedRoles: CustomAdminRole[] = [];
    const processedRoleIds = new Set<string>();
    rolesWithUpdatedLinks.forEach(role => {
        if (processedRoleIds.has(role.id)) return;
        if (role.linkGroupId) {
            const groupRoles = rolesWithUpdatedLinks.filter(r => r.linkGroupId === role.linkGroupId);
            groupRoles.forEach(groupRole => {
                reorderedRoles.push(groupRole);
                processedRoleIds.add(groupRole.id);
            });
        } else {
            reorderedRoles.push(role);
            processedRoleIds.add(role.id);
        }
    });

    updateAppSettings({ customAdminRoles: reorderedRoles, linkGroups: linkGroupsToUpdate });
    setLinkingState(null);
  };
  
  const handleUnlinkRole = (roleId: string, isDeleting = false) => {
    const roleToUnlink = appSettings.customAdminRoles.find(r => r.id === roleId);
    if (!roleToUnlink || !roleToUnlink.linkGroupId) return;

    const groupId = roleToUnlink.linkGroupId;
    const rolesInGroup = appSettings.customAdminRoles.filter(r => r.linkGroupId === groupId);

    const rolesToUpdate = appSettings.customAdminRoles.map(r => r.id === roleId ? { ...r, linkGroupId: undefined } : r);
    let linkGroupsToUpdate = { ...appSettings.linkGroups };

    if (rolesInGroup.length <= 2) {
        rolesInGroup.forEach(r => {
            const role = rolesToUpdate.find(ru => ru.id === r.id);
            if (role) role.linkGroupId = undefined;
        });
        delete linkGroupsToUpdate[groupId];
    }
    
    updateAppSettings({ customAdminRoles: rolesToUpdate, linkGroups: linkGroupsToUpdate });
    if (!isDeleting) toast({ title: 'Role Unlinked', description: `"${roleToUnlink.name}" has been unlinked from its group.` });
  };

  const handleUpdateLinkGroup = (groupId: string, newGroup: LinkGroup) => {
    const newLinkGroups = { ...appSettings.linkGroups, [groupId]: newGroup };
    updateAppSettings({ linkGroups: newLinkGroups });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || destination.index === 0) return;

    const sourceIndex = source.index - 1;
    const destinationIndex = destination.index - 1;
    
    if (sourceIndex === destinationIndex) return;

    const reorderedRoles = Array.from(appSettings.customAdminRoles);
    const [movedRole] = reorderedRoles.splice(sourceIndex, 1);
    reorderedRoles.splice(destinationIndex, 0, movedRole);

    updateAppSettings({ customAdminRoles: reorderedRoles });
  };

  return (
    <>
        <div className="flex items-center gap-2 mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Roles</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleAddCustomRole}>
                <GoogleSymbol name="add_circle" className="text-xl" />
                <span className="sr-only">Add New Level</span>
            </Button>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="admin-roles-list">
              {(provided) => (
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <Draggable draggableId="admins-card-static" index={0} isDragDisabled={true}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CardTitle>Admins</CardTitle>
                              <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild><AddUserToRoleButton usersToAdd={nonAdminUsers} onAdd={handleAdminToggle} roleName="Admin" /></TooltipTrigger>
                                    <TooltipContent>Assign User</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <CardDescription>Assign or revoke Admin privileges. This is the highest level of access.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {adminUsers.map(user => (
                              <UserRoleCard key={user.userId} user={user} onRemove={handleAdminToggle} isTeamAdmin={false} onSetTeamAdmin={() => {}} />
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                  
                  {appSettings.customAdminRoles.map((role, index) => (
                    <Draggable key={role.id} draggableId={role.id} index={index + 1}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <CustomRoleCard
                            role={role}
                            rank={roleRanks[index]}
                            users={users}
                            canLink={canLinkRoles}
                            onUpdate={handleUpdateCustomRole}
                            onDelete={() => handleDeleteCustomRole(role.id)}
                            onLink={handleLinkClick}
                            linkGroup={role.linkGroupId ? appSettings.linkGroups[role.linkGroupId] : null}
                            onUpdateLinkGroup={handleUpdateLinkGroup}
                            onUnlink={handleUnlinkRole}
                            isLinking={linkingState?.roleId === role.id}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
          <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
            <DialogContent className="sm:max-w-md">
            <div className="absolute top-4 right-4"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVerify2fa}><GoogleSymbol name="check" className="text-xl" /><span className="sr-only">Verify & Change</span></Button></div>
            <DialogHeader><DialogTitle>Two-Factor Authentication</DialogTitle><DialogDescription>Enter the code from your authenticator app and click the checkmark to confirm the role change.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4"><Input id="2fa-code" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="123456" onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}/></div>
            </DialogContent>
        </Dialog>
    </>
  );
}
// #endregion

// #region Pages Management Tab

function PageAccessControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
    const { users, teams, appSettings } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("users");

    const access = page.access;

    const handleToggle = (type: 'users' | 'teams' | 'roles', id: string) => {
        const currentIds = new Set(access[type] || []);
        if (currentIds.has(id)) {
            currentIds.delete(id);
        } else {
            currentIds.add(id);
        }
        onUpdate({ access: { ...access, [type]: Array.from(currentIds) } });
    };

    const filteredUsers = useMemo(() => users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
    const filteredTeams = useMemo(() => teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [teams, searchTerm]);
    const filteredRoles = useMemo(() => appSettings.customAdminRoles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())), [appSettings.customAdminRoles, searchTerm]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><GoogleSymbol name="group_add" /></Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Manage Page Access</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="roles">Roles</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="users" className="m-0">
                        {filteredUsers.length > 5 && (
                          <div className="p-2 border-b">
                            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                          </div>
                        )}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredUsers.map(user => {
                          const isSelected = access.users.includes(user.userId);
                          return (
                            <div key={user.userId} className={cn("flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer", !isSelected && "text-muted-foreground")} style={{ color: isSelected ? 'hsl(var(--primary))' : undefined }} onClick={() => handleToggle('users', user.userId)}>
                              <Avatar className="h-7 w-7"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                              <span className="font-medium">{user.displayName}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                    <TabsContent value="teams" className="m-0">
                        {filteredTeams.length > 7 && (
                           <div className="p-2 border-b">
                             <Input placeholder="Search teams..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                           </div>
                        )}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredTeams.map(team => {
                          const isSelected = access.teams.includes(team.id);
                          return (
                            <div key={team.id} className={cn("flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer", !isSelected && "text-muted-foreground")} style={{ color: isSelected ? team.color : undefined }} onClick={() => handleToggle('teams', team.id)}>
                              <GoogleSymbol name={team.icon} className="text-xl" />
                              <span className="font-medium">{team.name}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                    <TabsContent value="roles" className="m-0">
                        {filteredRoles.length > 7 && (
                          <div className="p-2 border-b">
                            <Input placeholder="Search roles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                          </div>
                        )}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredRoles.map(role => {
                          const isSelected = access.roles.includes(role.name);
                          return (
                            <div key={role.id} className={cn("flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer", !isSelected && "text-muted-foreground")} style={{ color: isSelected ? role.color : undefined }} onClick={() => handleToggle('roles', role.name)}>
                              <GoogleSymbol name={role.icon} className="text-xl" />
                              <span className="font-medium">{role.name}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}

function PageTabsControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
  const { appSettings } = useUser();
  
  const handleToggle = (tabId: string) => {
    const currentIds = new Set(page.associatedTabs || []);
    if (currentIds.has(tabId)) {
        currentIds.delete(tabId);
    } else {
        currentIds.add(tabId);
    }
    onUpdate({ associatedTabs: Array.from(currentIds) });
  };
  
  return (
    <Popover>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><GoogleSymbol name="layers" /></Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Manage Associated Tabs</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      <PopoverContent className="w-80 p-0">
        <div className="p-2 border-b"><Label>Associated Tabs</Label></div>
        <ScrollArea className="h-64">
          <div className="p-1 space-y-1">
            {appSettings.tabs.map(tab => {
              const isAssociated = (page.associatedTabs || []).includes(tab.id);
              return (
                <div 
                    key={tab.id} 
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer",
                        !isAssociated && "text-muted-foreground"
                    )}
                    style={{ color: isAssociated ? tab.color : undefined }}
                    onClick={() => handleToggle(tab.id)}
                >
                    <GoogleSymbol name={tab.icon} className="text-xl" />
                    <span className="font-medium">{tab.name}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}


function PageCard({ page, onUpdate, onDelete }: { page: AppPage; onUpdate: (id: string, data: Partial<AppPage>) => void; onDelete: (id: string) => void; }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== page.name) {
            onUpdate(page.id, { name: newName });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl">
                                        <GoogleSymbol name={page.icon} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                  <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                                  <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={page.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(page.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                              <PopoverTrigger asChild>
                                  <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: page.color }} />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                  <div className="grid grid-cols-8 gap-1">
                                      {predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => { onUpdate(page.id, { color: c }); setIsColorPopoverOpen(false); }}/>))}
                                      <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                          <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={page.color} onChange={(e) => onUpdate(page.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                      </div>
                                  </div>
                              </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-1">
                            {isEditingName ? (
                                <Input ref={nameInputRef} defaultValue={page.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{page.name}</CardTitle>
                            )}
                            <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                            <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                        </div>
                    </div>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(page.id)}>
                                    <GoogleSymbol name="delete" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Page</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium text-sm mb-2">Details</h4>
                    <CardDescription>
                        When associated with a Team, only Team Admins of that team can access the page.
                        When associated with a Service Admin role, only users designated as Team Admins for that role can access it.
                    </CardDescription>
                    <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                        <Badge variant="outline">{page.path}</Badge>
                        {page.isDynamic && <Badge variant="outline">Dynamic</Badge>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const PagesManagement = () => {
    const { appSettings, updateAppSettings } = useUser();
    const { toast } = useToast();

    const handleUpdatePage = useCallback((pageId: string, data: Partial<AppPage>) => {
        const newPages = appSettings.pages.map(p => p.id === pageId ? { ...p, ...data } : p);
        updateAppSettings({ pages: newPages });
    }, [appSettings.pages, updateAppSettings]);

    const handleAddPage = () => {
        const newPage: AppPage = {
            id: crypto.randomUUID(),
            name: `New Page ${appSettings.pages.length + 1}`,
            icon: 'web',
            color: '#64748B',
            path: '/dashboard/new-page',
            isDynamic: false,
            associatedTabs: [],
            access: { users: [], teams: [], roles: [] }
        };
        updateAppSettings({ pages: [...appSettings.pages, newPage] });
    };

    const handleDeletePage = (pageId: string) => {
        updateAppSettings({ pages: appSettings.pages.filter(p => p.id !== pageId) });
        toast({ title: 'Page Deleted' });
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        
        // Handle duplication
        if (destination.droppableId === 'duplicate-page-zone') {
            const pageToDuplicate = appSettings.pages.find(p => p.id === draggableId);
            if (pageToDuplicate) {
                const newName = `${pageToDuplicate.name} (Copy)`;
                const newPath = `/dashboard/${newName.toLowerCase().replace(/[\s()]+/g, '-').replace(/^-+|-+$/g, '')}`;
                const newPage: AppPage = {
                    ...JSON.parse(JSON.stringify(pageToDuplicate)), // Deep copy
                    id: crypto.randomUUID(),
                    name: newName,
                    path: newPath,
                };
                // Insert the new page right after the original one
                const originalIndex = appSettings.pages.findIndex(p => p.id === draggableId);
                const newPages = [...appSettings.pages];
                newPages.splice(originalIndex + 1, 0, newPage);
                updateAppSettings({ pages: newPages });
                toast({ title: 'Page Duplicated', description: `A copy of "${pageToDuplicate.name}" was created.` });
            }
            return;
        }

        // Handle reordering
        if (source.droppableId === 'pages-list' && destination.droppableId === 'pages-list') {
            if (source.index === destination.index) return;

            const reorderedPages = Array.from(appSettings.pages);
            const [movedPage] = reorderedPages.splice(source.index, 1);
            reorderedPages.splice(destination.index, 0, movedPage);
            updateAppSettings({ pages: reorderedPages });
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">Pages</h2>
                    <StrictModeDroppable droppableId="duplicate-page-zone">
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps}
                                className={cn(
                                    "rounded-full transition-all p-0.5",
                                    snapshot.isDraggingOver && "ring-2 ring-primary ring-offset-2 bg-accent"
                                )}
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleAddPage}>
                                                <GoogleSymbol name="add_circle" className="text-xl" />
                                                <span className="sr-only">Add New Page</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Page'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
                <StrictModeDroppable droppableId="pages-list">
                    {(provided) => (
                        <div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {appSettings.pages.map((page, index) => (
                                <Draggable key={page.id} draggableId={page.id} index={index}>
                                    {(provided) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps}
                                        >
                                            <PageCard
                                                page={page}
                                                onUpdate={handleUpdatePage}
                                                onDelete={handleDeletePage}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </div>
        </DragDropContext>
    );
};
// #endregion

// #region Tabs Management Tab
function TabItem({ tab, onUpdate }: { tab: AppTab; onUpdate: (id: string, data: Partial<AppTab>) => void; }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription) descriptionTextareaRef.current?.focus();
    }, [isEditingDescription]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== tab.name) {
            onUpdate(tab.id, { name: newName });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    const handleSaveDescription = () => {
        const newDescription = descriptionTextareaRef.current?.value.trim();
        if (newDescription !== tab.description) {
            onUpdate(tab.id, { description: newDescription });
        }
        setIsEditingDescription(false);
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveDescription();
        } else if (e.key === 'Escape') {
            setIsEditingDescription(false);
        }
    };

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

    return (
        <div className="flex items-start p-3 gap-4">
            <div className="relative mt-1">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-xl" style={{ color: tab.color }}>
                            <GoogleSymbol name={tab.icon} />
                        </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-80 p-0">
                        <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                        <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={tab.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(tab.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                    </PopoverContent>
                </Popover>
                <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <PopoverTrigger asChild>
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: tab.color }} />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-8 gap-1">
                            {predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => { onUpdate(tab.id, { color: c }); setIsColorPopoverOpen(false); }}/>))}
                            <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={tab.color} onChange={(e) => onUpdate(tab.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                     {isEditingName ? (
                        <Input ref={nameInputRef} defaultValue={tab.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                    ) : (
                        <span className="font-semibold cursor-pointer" onClick={() => setIsEditingName(true)}>{tab.name}</span>
                    )}
                    <Badge variant="outline">{tab.componentKey}</Badge>
                </div>
                {isEditingDescription ? (
                    <Textarea 
                        ref={descriptionTextareaRef}
                        defaultValue={tab.description}
                        onBlur={handleSaveDescription}
                        onKeyDown={handleDescriptionKeyDown}
                        className="text-sm"
                        placeholder="Click to add a description."
                    />
                ) : (
                    <p className="text-sm text-muted-foreground cursor-text min-h-[20px]" onClick={() => setIsEditingDescription(true)}>
                        {tab.description || 'Click to add a description.'}
                    </p>
                )}
            </div>
        </div>
    );
}

const TabsManagement = () => {
    const { appSettings, updateAppSettings } = useUser();

    const handleUpdateTab = useCallback((tabId: string, data: Partial<AppTab>) => {
        const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...data } : t);
        updateAppSettings({ tabs: newTabs });
    }, [appSettings.tabs, updateAppSettings]);

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold tracking-tight">Tabs</h2>
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {appSettings.tabs.map(tab => (
                            <TabItem key={tab.id} tab={tab} onUpdate={handleUpdateTab} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
// #endregion

export default function AdminPage() {
  const { viewAsUser, loading } = useUser();
  
  if (loading) {
    return <AdminPageSkeleton />;
  }

  if (!viewAsUser.isAdmin) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-semibold">Admin Management</h1>
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="tabs">Tabs</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="mt-6">
          <RolesManagement />
        </TabsContent>
        <TabsContent value="pages" className="mt-6">
            <PagesManagement />
        </TabsContent>
        <TabsContent value="tabs" className="mt-6">
            <TabsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AdminPageSkeleton = () => (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
);
