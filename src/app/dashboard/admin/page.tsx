

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team } from '@/types';
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
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps, type DraggableLocation } from 'react-beautiful-dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

// #region Admin Groups Management Tab
const UserAssignmentCard = ({ user, index, onRemove, isGroupAdmin, onSetGroupAdmin, canRemove = true, isDraggable = false }: { user: User; index?: number; onRemove: (user: User) => void; isGroupAdmin: boolean; onSetGroupAdmin?: (user: User) => void; canRemove?: boolean; isDraggable?: boolean }) => {
  const cardContent = (
    <Card 
        tabIndex={onSetGroupAdmin ? 0 : -1}
        role={onSetGroupAdmin ? "button" : undefined}
        className={cn(
            "transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 bg-card group relative",
            onSetGroupAdmin && "cursor-pointer"
        )}
        onClick={onSetGroupAdmin ? () => onSetGroupAdmin(user) : undefined}
        onKeyDown={onSetGroupAdmin ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSetGroupAdmin(user); } } : undefined}
    >
      <CardContent className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar>
              <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isGroupAdmin && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center bg-primary text-primary-foreground">
                  <GoogleSymbol name="key" style={{fontSize: '10px'}}/>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
       {canRemove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); onRemove(user); }} 
                    aria-label={`Remove user`}
                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GoogleSymbol name="cancel" className="text-lg" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remove user</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
    </Card>
  );

  if (isDraggable && index !== undefined) {
    return (
      <Draggable draggableId={`user-${user.userId}`} index={index} type="user-card">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(snapshot.isDragging && "shadow-lg opacity-80")}
          >
            {cardContent}
          </div>
        )}
      </Draggable>
    );
  }

  return cardContent;
};

const AddUserToGroupButton = ({ usersToAdd, onAdd, groupName }: { usersToAdd: User[], onAdd: (user: User) => void, groupName: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset search when popover closes
      setIsSearching(false);
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  const handleSelect = (user: User) => {
    onAdd(user);
    setIsOpen(false);
  }

  const filteredUsers = useMemo(() => {
      if (!searchTerm) return usersToAdd;
      return usersToAdd.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [usersToAdd, searchTerm]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                  <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                  <span className="sr-only">Assign user to {groupName}</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Assign User</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="p-0 w-80">
        <div className="flex items-center gap-1 p-2 border-b">
          {!isSearching ? (
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSearching(true)}>
              <GoogleSymbol name="search" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 w-full">
              <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
              <input
                  ref={searchInputRef}
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => !searchTerm && setIsSearching(false)}
                  className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
              />
            </div>
          )}
        </div>
        <ScrollArea className="h-64">
           <div className="p-1">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <div key={user.userId} onClick={() => handleSelect(user)} className="flex items-center gap-2 p-2 rounded-md group cursor-pointer">
                <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-sm text-muted-foreground p-4">{searchTerm ? 'No matching users found.' : 'All users are assigned.'}</p>
            )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function AdminGroupCard({ 
  group,
  users, 
  onUpdate, 
  onDelete
}: { 
  group: AdminGroup; 
  users: User[]; 
  onUpdate: (updatedGroup: AdminGroup) => void;
  onDelete: () => void;
}) {
    const { toast } = useToast();
    const { updateUser } = useUser();
    
    // Popover States
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Icon Search State
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
    }, [isEditingName]);
    
    useEffect(() => {
        if (!isIconPopoverOpen) {
            setIsSearchingIcons(false);
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    useEffect(() => {
        if (isSearchingIcons) iconSearchInputRef.current?.focus();
    }, [isSearchingIcons]);

    const handleSaveName = () => {
        const input = nameInputRef.current;
        if (!input || !input.value.trim()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Group name cannot be empty.' });
          setIsEditingName(false);
          return;
        }
        if (input.value.trim() !== group.name) {
            onUpdate({ ...group, name: input.value.trim() });
            toast({ title: 'Success', description: 'Group name updated.' });
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

    const assignedUsers = useMemo(() => users.filter(u => u.roles?.includes(group.name)), [users, group.name]);
    const unassignedUsers = useMemo(() => users.filter(u => !u.roles?.includes(group.name)), [users, group.name]);

    const handleGroupToggle = (user: User) => {
        const currentRoles = user.roles || [];
        const hasRole = currentRoles.includes(group.name);
        const newRoles = hasRole
            ? currentRoles.filter(r => r !== group.name)
            : [...currentRoles, group.name];

        updateUser(user.userId, { roles: newRoles });
        toast({ title: 'Success', description: `${user.displayName}'s group assignment has been updated.` });
    };

    const handleSetGroupAdmin = (userToUpdate: User) => {
        const currentAdmins = group.groupAdmins || [];
        const isAlreadyAdmin = currentAdmins.includes(userToUpdate.userId);
        const newAdmins = isAlreadyAdmin
            ? currentAdmins.filter(id => id !== userToUpdate.userId)
            : [...currentAdmins, userToUpdate.userId];
        onUpdate({ ...group, groupAdmins: newAdmins });
    };

    return (
        <Card className="flex flex-col h-full group">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 text-6xl">
                                                <GoogleSymbol name={group.icon} className="text-12xl" weight={100} />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Change Icon</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <PopoverContent className="w-80 p-0">
                                <div className="flex items-center gap-1 p-2 border-b">
                                    {!isSearchingIcons ? (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
                                            <GoogleSymbol name="search" />
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-1 w-full">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                            <input
                                                ref={iconSearchInputRef}
                                                placeholder="Search icons..."
                                                value={iconSearch}
                                                onChange={(e) => setIconSearch(e.target.value)}
                                                onBlur={() => !iconSearch && setIsSearchingIcons(false)}
                                                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                            />
                                        </div>
                                    )}
                                </div>
                                <ScrollArea className="h-64">
                                  <div className="grid grid-cols-6 gap-1 p-2">
                                    {filteredIcons.slice(0, 300).map((iconName) => (
                                      <TooltipProvider key={iconName}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant={group.icon === iconName ? "default" : "ghost"}
                                              size="icon"
                                              onClick={() => { onUpdate({ ...group, icon: iconName }); setIsIconPopoverOpen(false); }}
                                              className="h-8 w-8 p-0"
                                            >
                                              <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>{iconName}</p></TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <div 
                                                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card cursor-pointer" 
                                                aria-label="Change service admin color"
                                                style={{ backgroundColor: group.color }}
                                            />
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Change Color</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">
                                {predefinedColors.map(color => (<button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => { onUpdate({ ...group, color: color }); setIsColorPopoverOpen(false); }} aria-label={`Set color to ${color}`}/>))}
                                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={group.color} onChange={(e) => onUpdate({ ...group, color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0" aria-label="Custom color picker"/>
                                </div>
                            </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1">
                        {isEditingName ? (<Input ref={nameInputRef} defaultValue={group.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-lg font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>) : (<CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer text-lg font-thin">{group.name}</CardTitle>)}
                    </div>
                    <AddUserToGroupButton usersToAdd={unassignedUsers} onAdd={handleGroupToggle} groupName={group.name} />
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <GoogleSymbol name="delete" className="text-lg" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Group</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <CardDescription>Click a member to promote them to Group Admin for this group. Group Admins have elevated permissions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <StrictModeDroppable droppableId={`group-content-${group.id}`} type="user-card" isDropDisabled={false} isCombineEnabled={false}>
                {(provided, snapshot) => (
                    <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn("space-y-4 rounded-b-lg", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                    >
                    {assignedUsers.map((user, index) => (
                        <UserAssignmentCard 
                            key={user.userId} 
                            index={index}
                            user={user} 
                            onRemove={handleGroupToggle}
                            isGroupAdmin={(group.groupAdmins || []).includes(user.userId)}
                            onSetGroupAdmin={handleSetGroupAdmin}
                            isDraggable={true}
                        />
                    ))}
                    {provided.placeholder}
                    </div>
                )}
                </StrictModeDroppable>
            </CardContent>
             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
                            <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                            <span className="sr-only">Delete Group</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Delete "{group.name}"?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the group and unassign all users. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export const AdminGroupsManagement = ({ tab }: { tab: AppTab }) => {
  const { toast } = useToast();
  const { users, updateUser, appSettings, updateAppSettings, updateAppTab } = useUser();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEditing2fa, setIsEditing2fa] = useState(false);
  const twoFactorCodeInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (isEditing2fa) twoFactorCodeInputRef.current?.focus();
  }, [isEditing2fa]);

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
  
  const adminUsers = useMemo(() => users.filter(u => u.isAdmin), [users]);
  const nonAdminUsers = useMemo(() => users.filter(u => !u.isAdmin), [users]);
  
  const handleAdminToggle = (user: User) => {
    const isLastAdmin = adminUsers.length <= 1 && user.isAdmin;
    if (isLastAdmin) {
        toast({
            variant: 'destructive',
            title: 'Cannot Remove Last Admin',
            description: 'The system must have at least one administrator.',
        });
        return;
    }

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
    setIsEditing2fa(false);
  };

  const handleAddAdminGroup = () => {
    const newGroupName = `Service Admin${'+'.repeat(appSettings.adminGroups.length)}`;
    const newGroup: AdminGroup = {
        id: crypto.randomUUID(),
        name: newGroupName,
        icon: 'add_moderator',
        color: predefinedColors[appSettings.adminGroups.length % predefinedColors.length],
        groupAdmins: [],
    };
    updateAppSettings({ adminGroups: [...appSettings.adminGroups, newGroup] });
    toast({ title: 'New Group Added', description: `"${newGroupName}" has been created.` });
  };

  const handleUpdateAdminGroup = (updatedGroup: AdminGroup) => {
      const newGroups = appSettings.adminGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
      updateAppSettings({ adminGroups: newGroups });
  }

  const handleDeleteAdminGroup = (groupId: string) => {
      const newGroups = appSettings.adminGroups.filter(g => g.id !== groupId);
      updateAppSettings({ adminGroups: newGroups });
      toast({ title: 'Success', description: 'Admin group deleted.' });
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;

    if (type === 'group-card') {
      if (destination.droppableId === 'duplicate-admin-group-zone') {
        const groupToDuplicate = appSettings.adminGroups.find(g => g.id === draggableId);
        if (groupToDuplicate) {
            const newName = `${groupToDuplicate.name} (Copy)`;
            const newGroup: AdminGroup = {
                ...JSON.parse(JSON.stringify(groupToDuplicate)), // Deep copy
                id: crypto.randomUUID(),
                name: newName,
            };

            // Find users to duplicate and update their roles
            const usersToUpdate = users.filter(u => u.roles?.includes(groupToDuplicate.name));
            usersToUpdate.forEach(user => {
                const newRoles = [...(user.roles || []), newName];
                updateUser(user.userId, { roles: newRoles });
            });
            
            const sourceGroupIndex = appSettings.adminGroups.findIndex(g => g.id === draggableId);
            const newGroups = [...appSettings.adminGroups];
            newGroups.splice(sourceGroupIndex + 1, 0, newGroup);

            updateAppSettings({ adminGroups: newGroups });
            toast({ title: 'Group Duplicated', description: `A copy of "${groupToDuplicate.name}" was created.` });
        }
        return;
      }
      
      if (source.droppableId !== destination.droppableId || source.droppableId !== 'admin-groups-list') return;
      
      const allGroups = appSettings.adminGroups;
      const [movedItem] = allGroups.splice(source.index, 1);
      allGroups.splice(destination.index, 0, movedItem);
      updateAppSettings({ adminGroups: allGroups });
      return;
    }

    if (type === 'user-card') {
      const userId = draggableId.replace('user-', '');
      const sourceDroppableId = source.droppableId;
      const destinationDroppableId = destination.droppableId;
        
      if (sourceDroppableId === destinationDroppableId) return;

      const user = users.find(u => u.userId === userId);
      if (!user) return;
        
      if (destinationDroppableId === 'admins-card-droppable') {
        if (user.isAdmin) {
          toast({ title: 'No Change', description: `${user.displayName} is already an Admin.` });
          return;
        }
            
        // When dropped into Admins, the user becomes an admin but retains their group membership.
        updateUser(user.userId, { isAdmin: true });
        toast({ title: 'Admin Promoted', description: `${user.displayName} is now an Admin.` });
        return;
      }

      if (destinationDroppableId.startsWith('group-content-')) {
        const destGroupId = destinationDroppableId.replace('group-content-', '');
        const destGroup = appSettings.adminGroups.find(g => g.id === destGroupId);
        if (!destGroup) return;

        if ((user.roles || []).includes(destGroup.name)) {
          toast({ title: 'No Change', description: `${user.displayName} is already in the "${destGroup.name}" group.` });
          return;
        }

        // Add user to the new group, keeping existing group memberships.
        const newRoles = [...(user.roles || []), destGroup.name];

        updateUser(user.userId, { roles: newRoles });
        toast({ title: 'User Added to Group', description: `${user.displayName} added to "${destGroup.name}".` });
        return;
      }
    }
  };
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <Input ref={titleInputRef} defaultValue={tab.name} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} />
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <h2 className="font-headline text-2xl font-thin tracking-tight cursor-pointer border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{tab.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                 <StrictModeDroppable droppableId="duplicate-admin-group-zone" type="group-card" isDropDisabled={false} isCombineEnabled={false}>
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={cn(
                                "rounded-full transition-all p-0.5",
                                snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                            )}
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleAddAdminGroup}>
                                            <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                            <span className="sr-only">Add New Group or Drop to Duplicate</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Group'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </StrictModeDroppable>
            </div>
            
            <StrictModeDroppable droppableId="admin-groups-list" type="group-card" isDropDisabled={false} isCombineEnabled={false}>
              {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <div className="w-full">
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                <CardTitle className="font-thin">Admins</CardTitle>
                                <AddUserToGroupButton usersToAdd={nonAdminUsers} onAdd={handleAdminToggle} groupName="Admin" />
                              </div>
                              <CardDescription>Assign or revoke Admin privileges. This is the highest level of access.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <StrictModeDroppable droppableId="admins-card-droppable" type="user-card" isDropDisabled={false} isCombineEnabled={false}>
                                {(provided, snapshot) => (
                                    <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn("space-y-4 rounded-b-lg", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                                    >
                                    {adminUsers.map(user => (
                                        <UserAssignmentCard 
                                        key={user.userId} 
                                        user={user} 
                                        onRemove={handleAdminToggle}
                                        isGroupAdmin={false}
                                        canRemove={adminUsers.length > 1}
                                        />
                                    ))}
                                    {provided.placeholder}
                                    </div>
                                )}
                                </StrictModeDroppable>
                            </CardContent>
                          </Card>
                      </div>

                    {appSettings.adminGroups.map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id} index={index} type="group-card">
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("w-full", snapshot.isDragging && "shadow-xl")}>
                            <AdminGroupCard group={group} users={users} onUpdate={handleUpdateAdminGroup} onDelete={() => handleDeleteAdminGroup(group.id)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
              )}
            </StrictModeDroppable>
          
              <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
                <DialogContent className="max-w-sm">
                    <div className="absolute top-4 right-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleVerify2fa}>
                                        <GoogleSymbol name="check" className="text-xl" />
                                        <span className="sr-only">Verify Code</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Verify Code</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Two-Factor Authentication</DialogTitle>
                        <DialogDescription>Enter the 6-digit code from your authenticator app to proceed.</DialogDescription>
                    </DialogHeader>
                    <div
                        className={cn("flex items-center gap-2 w-full text-left text-muted-foreground transition-colors p-2 h-10",
                            !isEditing2fa && "cursor-text hover:text-primary/80"
                        )}
                        onClick={() => {if (!isEditing2fa) setIsEditing2fa(true)}}
                        >
                        <GoogleSymbol name="password" className="text-xl" />
                        {isEditing2fa ? (
                            <Input
                                id="2fa-code"
                                ref={twoFactorCodeInputRef}
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                onBlur={() => { if (!twoFactorCode) setIsEditing2fa(false); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}
                                className="w-full text-center tracking-[0.5em] h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                                maxLength={6}
                                placeholder="••••••"
                            />
                        ) : (
                            <span className="flex-1 text-sm text-center tracking-[0.5em]">
                                {twoFactorCode ? '••••••' : '6-digit code'}
                            </span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </DragDropContext>
  );
}
// #endregion

// #region Pages Management Tab

function PageAccessControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
    const { users, teams, appSettings } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("users");
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearching) searchInputRef.current?.focus();
    }, [isSearching]);

    const handleBlurSearch = () => {
        if (!searchTerm) setIsSearching(false);
    }

    const access = page.access;

    const handleToggle = (type: 'users' | 'teams' | 'adminGroups', id: string) => {
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
    const filteredGroups = useMemo(() => appSettings.adminGroups.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())), [appSettings.adminGroups, searchTerm]);

    const renderSearchControl = () => (
         <div className="p-2 border-b">
            {!isSearching ? (
                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSearching(true)}>
                    <GoogleSymbol name="search" />
                </Button>
            ) : (
                <div className="flex items-center gap-1 w-full">
                  <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                  <input
                      ref={searchInputRef}
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={handleBlurSearch}
                      className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                  />
              </div>
            )}
        </div>
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon"><GoogleSymbol name="group_add" className="text-4xl" weight={100} /></Button>
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
                        <TabsTrigger value="groups">Groups</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="users" className="m-0">
                        {renderSearchControl()}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredUsers.map(user => {
                          const isSelected = access.users.includes(user.userId);
                          return (
                            <div key={user.userId} className="flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer" style={{ color: isSelected ? 'hsl(var(--primary))' : undefined }} onClick={() => handleToggle('users', user.userId)}>
                              <Avatar className="h-7 w-7"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                              <span className="font-medium">{user.displayName}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                    <TabsContent value="teams" className="m-0">
                        {renderSearchControl()}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredTeams.map(team => {
                          const isSelected = access.teams.includes(team.id);
                          return (
                            <div key={team.id} className="flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer" style={{ color: isSelected ? team.color : undefined }} onClick={() => handleToggle('teams', team.id)}>
                              <GoogleSymbol name={team.icon} className="text-xl" />
                              <span className="font-medium">{team.name}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                    <TabsContent value="groups" className="m-0">
                        {renderSearchControl()}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredGroups.map(group => {
                          const isSelected = access.adminGroups.includes(group.name);
                          return (
                            <div key={group.id} className="flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer" style={{ color: isSelected ? group.color : undefined }} onClick={() => handleToggle('adminGroups', group.name)}>
                              <GoogleSymbol name={group.icon} className="text-xl" />
                              <span className="font-medium">{group.name}</span>
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
                        <Button variant="ghost" size="icon"><GoogleSymbol name="layers" className="text-4xl" weight={100} /></Button>
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
                    className={cn("flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer")}
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


function PageCard({ page, onUpdate, onDelete, isDragging, isPinned }: { page: AppPage; onUpdate: (id: string, data: Partial<AppPage>) => void; onDelete: (id: string) => void; isDragging?: boolean, isPinned?: boolean }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const isSystemPage = useMemo(() => ['page-admin-management', 'page-notifications', 'page-settings'].includes(page.id), [page.id]);
    
    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    useEffect(() => {
        if (!isIconPopoverOpen) {
            setIsSearchingIcons(false);
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    useEffect(() => {
        if (isSearchingIcons) iconSearchInputRef.current?.focus();
    }, [isSearchingIcons]);

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
        <Card className={cn("flex flex-col h-full group", isDragging && 'shadow-xl')}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 text-6xl">
                                                <GoogleSymbol name={page.icon} className="text-12xl" weight={100} />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Change Icon</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <PopoverContent className="w-80 p-0">
                                <div className="flex items-center gap-1 p-2 border-b">
                                    {!isSearchingIcons ? (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
                                            <GoogleSymbol name="search" />
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-1 w-full">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                            <input
                                                ref={iconSearchInputRef}
                                                placeholder="Search icons..."
                                                value={iconSearch}
                                                onChange={(e) => setIconSearch(e.target.value)}
                                                onBlur={() => !iconSearch && setIsSearchingIcons(false)}
                                                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                            />
                                        </div>
                                    )}
                                </div>
                                <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                <TooltipProvider key={iconName}>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                        variant={page.icon === iconName ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => { onUpdate(page.id, { icon: iconName }); setIsIconPopoverOpen(false);}}
                                        className="h-8 w-8 p-0"
                                        >
                                        <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{iconName}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                ))}</div></ScrollArea>
                            </PopoverContent>
                        </Popover>
                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: page.color }} />
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Color</p></TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
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
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            {isEditingName ? (
                                <Input ref={nameInputRef} defaultValue={page.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-base font-headline font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => !isSystemPage && setIsEditingName(true)} className={cn("text-base break-words font-headline font-thin", !isSystemPage && "cursor-pointer")}>
                                    {page.name}
                                </CardTitle>
                            )}
                        </div>
                    </div>
                    {!isSystemPage && (
                        <>
                            <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                            <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                        </>
                    )}
                    {!isPinned && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                    >
                                        <GoogleSymbol name="delete" className="text-lg" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Page</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end pt-2">
                <p className="text-xs text-muted-foreground truncate">{page.path}</p>
            </CardContent>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(page.id)}>
                            <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                            <span className="sr-only">Delete Page</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Delete "{page.name}"?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the page and its configuration. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export const PagesManagement = ({ tab }: { tab: AppTab }) => {
    const { appSettings, updateAppSettings, updateAppTab } = useUser();
    const { toast } = useToast();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

    const pinnedIds = useMemo(() => ['page-admin-management', 'page-notifications', 'page-settings'], []);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

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

    const handleUpdatePage = useCallback((pageId: string, data: Partial<AppPage>) => {
        const newPages = appSettings.pages.map(p => p.id === pageId ? { ...p, ...data } : p);
        updateAppSettings({ pages: newPages });
    }, [appSettings.pages, updateAppSettings]);

    const handleAddPage = () => {
        const pageCount = appSettings.pages.length;
        const newName = `New Page ${pageCount + 1}`;
        const newPage: AppPage = {
            id: crypto.randomUUID(),
            name: newName,
            icon: 'web',
            color: '#64748B',
            path: `/dashboard/${newName.toLowerCase().replace(/\s/g, '-')}`,
            isDynamic: false,
            associatedTabs: [],
            access: { users: [], teams: [], adminGroups: [] }
        };
        
        const draggablePages = appSettings.pages.filter(p => !pinnedIds.includes(p.id));
        const lastDraggableIndex = appSettings.pages.findLastIndex(p => !pinnedIds.includes(p.id));

        const newPages = [...appSettings.pages];
        newPages.splice(lastDraggableIndex + 1, 0, newPage);
        
        updateAppSettings({ pages: newPages });
    };

    const handleDeletePage = (pageId: string) => {
        updateAppSettings({ pages: appSettings.pages.filter(p => p.id !== pageId) });
        toast({ title: 'Page Deleted' });
    };
    
    const onDragEnd = (result: DropResult) => {
        setDraggingItemId(null);
        const { source, destination, draggableId } = result;
    
        if (!destination) return;
    
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
                
                const sourcePageIndex = appSettings.pages.findIndex(p => p.id === draggableId);
                const newPages = [...appSettings.pages];
                newPages.splice(sourcePageIndex + 1, 0, newPage);
    
                updateAppSettings({ pages: newPages });
                toast({ title: 'Page Duplicated', description: `A copy of "${pageToDuplicate.name}" was created.` });
            }
            return;
        }
    
        if (destination.droppableId === 'pages-list' && source.droppableId === 'pages-list') {
            const pages = appSettings.pages;
            const fromIndex = source.index;
            let toIndex = destination.index;
            
            // Constraint 1: Can't drop before Admin Management (which is at index 0)
            if (toIndex === 0) {
                toIndex = 1;
            }

            // Constraint 2: Can't drop on or after the notifications page
            const notificationsIndex = pages.findIndex(p => p.id === 'page-notifications');
            if (notificationsIndex !== -1 && toIndex >= notificationsIndex) {
                toIndex = notificationsIndex;
            }

            // Reorder the array with the corrected index
            const reorderedPages = Array.from(pages);
            const [movedItem] = reorderedPages.splice(fromIndex, 1);
            
            // The destination index needs to be adjusted if the item was moved from before it
            const finalInsertionIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            
            reorderedPages.splice(finalInsertionIndex, 0, movedItem);

            updateAppSettings({ pages: reorderedPages });
        }
    };

    return (
        <DragDropContext onDragStart={(start) => setDraggingItemId(start.draggableId)} onDragEnd={onDragEnd}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isEditingTitle ? (
                            <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <h2 className="font-headline text-2xl font-thin tracking-tight cursor-pointer border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{tab.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <StrictModeDroppable droppableId="duplicate-page-zone" isDropDisabled={false} isCombineEnabled={false}>
                            {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef} 
                                    {...provided.droppableProps}
                                    className={cn(
                                        "rounded-full transition-all p-0.5",
                                        snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                                    )}
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleAddPage}>
                                                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
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
                </div>
                
                <StrictModeDroppable droppableId="pages-list" isDropDisabled={false} isCombineEnabled={false}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        >
                            {appSettings.pages.map((page, index) => {
                                const isPinned = pinnedIds.includes(page.id);
                                return (
                                    <Draggable key={page.id} draggableId={page.id} index={index} isDragDisabled={isPinned}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={cn(
                                                    "w-full",
                                                    isPinned && "opacity-70",
                                                    draggingItemId === page.id && "opacity-50"
                                                )}
                                            >
                                                <PageCard
                                                    page={page}
                                                    onUpdate={handleUpdatePage}
                                                    onDelete={handleDeletePage}
                                                    isDragging={snapshot.isDragging}
                                                    isPinned={isPinned}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                )
                            })}
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

const TabItem = React.forwardRef<HTMLDivElement, { tab: AppTab; onUpdate: (id: string, data: Partial<AppTab>) => void } & React.HTMLAttributes<HTMLDivElement>>(
    ({ tab, onUpdate, className, ...props }, ref) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    // Icon Search State
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription) descriptionTextareaRef.current?.focus();
    }, [isEditingDescription]);
    
    useEffect(() => {
        if (!isIconPopoverOpen) {
            setIsSearchingIcons(false);
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    useEffect(() => {
        if (isSearchingIcons) iconSearchInputRef.current?.focus();
    }, [isSearchingIcons]);


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
        <Card ref={ref} className={cn("cursor-grab", className)} {...props}>
            <CardContent className="p-3 flex items-center gap-4">
                <div className="relative mt-1">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" style={{ color: tab.color }} className="h-12 w-12 text-6xl">
                                            <GoogleSymbol name={tab.icon} className="text-12xl" weight={100} />
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Icon</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <PopoverContent className="w-80 p-0">
                            <div className="flex items-center gap-1 p-2 border-b">
                                {!isSearchingIcons ? (
                                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
                                        <GoogleSymbol name="search" />
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1 w-full">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                        <input
                                            ref={iconSearchInputRef}
                                            placeholder="Search icons..."
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            onBlur={() => !iconSearch && setIsSearchingIcons(false)}
                                            className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                        />
                                    </div>
                                )}
                            </div>
                            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                <TooltipProvider key={iconName}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button
                                            variant={tab.icon === iconName ? "default" : "ghost"}
                                            size="icon"
                                            onClick={() => { onUpdate(tab.id, { icon: iconName }); setIsIconPopoverOpen(false);}}
                                            className="h-8 w-8 p-0"
                                        >
                                            <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{iconName}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}</div></ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: tab.color }} />
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Color</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                            <Input ref={nameInputRef} defaultValue={tab.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-headline" />
                        ) : (
                            <span className="font-semibold cursor-pointer font-headline" onClick={() => setIsEditingName(true)}>{tab.name}</span>
                        )}
                        <Badge variant="outline">{tab.componentKey}</Badge>
                    </div>
                    {isEditingDescription ? (
                        <Textarea 
                            ref={descriptionTextareaRef}
                            defaultValue={tab.description}
                            onBlur={handleSaveDescription}
                            onKeyDown={handleDescriptionKeyDown}
                            className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                            placeholder="Click to add a description."
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground cursor-text min-h-[20px]" onClick={() => setIsEditingDescription(true)}>
                            {tab.description || 'Click to add a description.'}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});
TabItem.displayName = 'TabItem';


export const TabsManagement = ({ tab }: { tab: AppTab }) => {
    const { appSettings, updateAppSettings, updateAppTab } = useUser();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

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

    const handleUpdateTab = useCallback((tabId: string, data: Partial<AppTab>) => {
        const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...data } : t);
        updateAppSettings({ tabs: newTabs });
    }, [appSettings.tabs, updateAppSettings]);

    const onDragEnd = (result: DropResult) => {
      const { source, destination } = result;
      if (!destination || source.index === destination.index) return;

      const reorderedTabs = Array.from(appSettings.tabs);
      const [movedItem] = reorderedTabs.splice(source.index, 1);
      reorderedTabs.splice(destination.index, 0, movedItem);

      updateAppSettings({ tabs: reorderedTabs });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-8">
                <div className="flex items-center gap-2">
                {isEditingTitle ? (
                    <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{tab.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                </div>
                <StrictModeDroppable droppableId="tabs-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {appSettings.tabs.map((tab, index) => (
                                <Draggable key={tab.id} draggableId={tab.id} index={index}>
                                    {(provided) => (
                                        <TabItem
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        tab={tab}
                                        onUpdate={handleUpdateTab}
                                        />
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

const componentMap: Record<string, React.ComponentType<{ tab: AppTab }>> = {
  adminGroups: AdminGroupsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
};

const PAGE_ID = 'page-admin-management';

export default function AdminPage() {
  const { viewAsUser, loading, appSettings } = useUser();
  
  if (loading) {
    return <AdminPageSkeleton />;
  }

  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);

  if (!viewAsUser.isAdmin || !pageConfig) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <h1 className="font-headline text-3xl font-thin">{pageConfig.name}</h1>
                </TooltipTrigger>
                {pageConfig.description && (
                    <TooltipContent><p className="max-w-xs">{pageConfig.description}</p></TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className="flex w-full">
          {pageTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
              <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
              <span>{tab.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

const AdminPageSkeleton = () => (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
);
