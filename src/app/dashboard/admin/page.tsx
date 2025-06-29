
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type CustomAdminRole, type LinkGroup } from '@/types';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as UIAlertDialogTitle } from '@/components/ui/alert-dialog';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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


// A card to display a user with a specific role.
const UserRoleCard = ({ user, onRemove }: { user: User; onRemove: (user: User) => void }) => {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
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
        <Button variant="ghost" size="icon" onClick={() => onRemove(user)} aria-label={`Remove role from ${user.displayName}`}>
          <GoogleSymbol name="cancel" className="text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
};

// A button that opens a popover to add a user to a role.
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

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function CustomRoleCard({ 
  role,
  users, 
  onUpdate, 
  onDelete, 
  onLink,
  linkGroup,
  onUpdateLinkGroup,
  onUnlink,
  isLinking
}: { 
  role: CustomAdminRole; 
  users: User[]; 
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

    return (
        <>
        <Card className={cn(isLinking && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {linkGroup && (
                  <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Badge style={{ backgroundColor: linkGroup.color }} className="text-primary-foreground border-transparent cursor-pointer">
                        <GoogleSymbol name={linkGroup.icon} />
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="space-y-4">
                        <h4 className="font-medium">Edit Link Group</h4>
                        <div className="flex items-center gap-2">
                            <Popover open={isLinkIconPopoverOpen} onOpenChange={setIsLinkIconPopoverOpen}>
                              <PopoverTrigger asChild><Button variant="outline" size="icon"><GoogleSymbol name={linkGroup.icon} /></Button></PopoverTrigger>
                               <PopoverContent className="w-80 p-0">
                                <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                                <ScrollArea className="h-64">
                                    <div className="grid grid-cols-6 gap-1 p-2">
                                        {filteredIcons.slice(0, 300).map((iconName) => (
                                            <Button key={iconName} variant={linkGroup.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateLinkGroup(role.linkGroupId!, { ...linkGroup, icon: iconName }); setIsLinkIconPopoverOpen(false); }} className="text-2xl"><GoogleSymbol name={iconName} /></Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                            </Popover>
                            <Popover open={isLinkColorPopoverOpen} onOpenChange={setIsLinkColorPopoverOpen}>
                              <PopoverTrigger asChild>
                                <div className="h-8 w-8 rounded-md border cursor-pointer" style={{ backgroundColor: linkGroup.color }} />
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
                        <Button variant="outline" size="sm" onClick={() => { onUnlink(role.id); setIsLinkPopoverOpen(false); }}>Unlink from Group</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="relative">
                  <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-2xl text-muted-foreground hover:text-foreground">
                          <GoogleSymbol name={role.icon} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                        <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                        <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={role.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate({ ...role, icon: iconName }); setIsIconPopoverOpen(false); }} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                    </PopoverContent>
                  </Popover>
                   <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <PopoverTrigger asChild><div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card cursor-pointer" aria-label="Change service admin color"><div className="h-full w-full rounded-full" style={{ backgroundColor: role.color }}/></div></PopoverTrigger>
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
                {isEditingName ? (<Input ref={nameInputRef} defaultValue={role.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="font-body h-auto p-0 text-2xl font-semibold leading-none tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>) : (<CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{role.name}</CardTitle>)}
                <AddUserToRoleButton usersToAdd={unassignedUsers} onAdd={handleRoleToggle} roleName={role.name} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onLink(role.id)}><GoogleSymbol name="link" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}><GoogleSymbol name="delete" /></Button>
              </div>
              <CardDescription>Assign or revoke {role.name} privileges for managing app-wide settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedUsers.map(user => (<UserRoleCard key={user.userId} user={user} onRemove={handleRoleToggle} />))}
            </CardContent>
          </Card>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <UIAlertDialogTitle>Are you absolutely sure?</UIAlertDialogTitle>
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

const AdminPageSkeleton = () => (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

export default function AdminPage() {
  const { toast } = useToast();
  const { viewAsUser, users, updateUser, appSettings, updateAppSettings } = useUser();
  
  const isAdmin = useMemo(() => viewAsUser.isAdmin, [viewAsUser]);

  // Dialog & Popover States
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // State for linking roles
  const [linkingState, setLinkingState] = useState<{ roleId: string } | null>(null);


  // This check must happen after all hooks are called.
  if (!isAdmin) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

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
    // Mock 2FA code
    if (twoFactorCode === '123456') { 
      on2faSuccess?.();
      close2faDialog();
    } else {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'The provided 2FA code is incorrect. Please try again.',
      });
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
        setLinkingState(null); // Cancel linking
        return;
    }
    
    // Make mutable copies to update
    const rolesWithUpdatedLinks = appSettings.customAdminRoles.map(r => ({ ...r }));
    let linkGroupsToUpdate = { ...appSettings.linkGroups };

    const sourceRole = rolesWithUpdatedLinks.find(r => r.id === linkingState.roleId)!;
    const targetRole = rolesWithUpdatedLinks.find(r => r.id === roleId)!;

    // This part assigns the correct linkGroupId based on the interaction
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
    
    // Now, reorder the array based on the new groups
    const reorderedRoles: CustomAdminRole[] = [];
    const processedRoleIds = new Set<string>();

    rolesWithUpdatedLinks.forEach(role => {
        if (processedRoleIds.has(role.id)) {
            return; // Already processed as part of a group
        }

        if (role.linkGroupId) {
            // Find all roles in the same group
            const groupRoles = rolesWithUpdatedLinks.filter(r => r.linkGroupId === role.linkGroupId);
            groupRoles.forEach(groupRole => {
                reorderedRoles.push(groupRole);
                processedRoleIds.add(groupRole.id);
            });
        } else {
            // Role is not in a group
            reorderedRoles.push(role);
            processedRoleIds.add(role.id);
        }
    });

    // Final update with reordered and updated roles
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

    if (!destination) {
      return;
    }

    // Prevent dropping before the locked "Admins" card
    if (destination.index === 0) {
      return;
    }

    // Adjust indices because our state array (customAdminRoles) doesn't include the Admins card.
    const sourceIndex = source.index - 1;
    const destinationIndex = destination.index - 1;
    
    if (sourceIndex === destinationIndex) {
        return;
    }

    const reorderedRoles = Array.from(appSettings.customAdminRoles);
    const [movedRole] = reorderedRoles.splice(sourceIndex, 1);
    reorderedRoles.splice(destinationIndex, 0, movedRole);

    updateAppSettings({ customAdminRoles: reorderedRoles });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
            <h1 className="font-headline text-3xl font-semibold">Admin Management</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleAddCustomRole}>
                <GoogleSymbol name="add_circle" className="text-2xl" />
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
                  {/* Draggable but disabled Admins Card */}
                  <Draggable draggableId="admins-card-static" index={0} isDragDisabled={true}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CardTitle>Admins</CardTitle>
                              <AddUserToRoleButton usersToAdd={nonAdminUsers} onAdd={handleAdminToggle} roleName="Admin" />
                            </div>
                            <CardDescription>Assign or revoke Admin privileges. This is the highest level of access.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {adminUsers.map(user => (
                              <UserRoleCard key={user.userId} user={user} onRemove={handleAdminToggle} />
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                  
                  {/* Draggable Custom Role Cards */}
                  {appSettings.customAdminRoles.map((role, index) => (
                    <Draggable key={role.id} draggableId={role.id} index={index + 1}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <CustomRoleCard
                            role={role}
                            users={users}
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
      </div>

      <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVerify2fa}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Verify & Change</span>
              </Button>
          </div>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the code from your authenticator app and click the checkmark to confirm the role change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="2fa-code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    