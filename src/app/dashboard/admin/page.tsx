
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
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
const UserAssignmentCard = ({ user, onRemove, isGroupAdmin, onSetGroupAdmin, canRemove = true }: { user: User; onRemove: (user: User) => void; isGroupAdmin: boolean; onSetGroupAdmin?: (user: User) => void; canRemove?: boolean; }) => {
  return (
    <Card 
        className={cn(
            "transition-all", 
            onSetGroupAdmin && isGroupAdmin && "ring-2 ring-primary",
            onSetGroupAdmin && "cursor-pointer"
        )}
        onClick={onSetGroupAdmin ? () => onSetGroupAdmin(user) : undefined}
    >
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
        {canRemove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); onRemove(user); }} 
                    aria-label={`Remove user`}
                    className="text-muted-foreground hover:text-destructive"
                >
                  <GoogleSymbol name="cancel" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Remove user</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

const AddUserToGroupButton = ({ usersToAdd, onAdd, groupName }: { usersToAdd: User[], onAdd: (user: User) => void, groupName: string }) => {
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
            <span className="sr-only">Assign user to {groupName}</span>
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

function AdminGroupCard({ 
  group,
  rank,
  users, 
  onUpdate, 
  onDelete
}: { 
  group: AdminGroup; 
  rank: number;
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
          toast({ variant: 'destructive', title: 'Error', description: 'Display name cannot be empty.' });
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
        <>
        <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl text-muted-foreground hover:text-foreground">
                            <GoogleSymbol name={group.icon} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                            <div className="flex items-center gap-1 p-2 border-b">
                                {!isSearchingIcons ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
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
                            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={group.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate({ ...group, icon: iconName }); setIsIconPopoverOpen(false); }} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div 
                                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card cursor-pointer flex items-center justify-center" 
                                aria-label="Change service admin color"
                                style={{ backgroundColor: group.color }}
                            >
                                <span className="text-xs font-bold" style={{ color: getContrastColor(group.color) }}>
                                    {rank}
                                </span>
                            </div>
                        </PopoverTrigger>
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
                </div>
                <div className="flex-1">
                    {isEditingName ? (<Input ref={nameInputRef} defaultValue={group.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-2xl font-semibold leading-none tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>) : (<CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{group.name}</CardTitle>)}
                </div>
                <div className="flex items-center">
                    <TooltipProvider>
                        <Tooltip><TooltipTrigger asChild><AddUserToGroupButton usersToAdd={unassignedUsers} onAdd={handleGroupToggle} groupName={group.name} /></TooltipTrigger><TooltipContent>Assign User</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}><GoogleSymbol name="delete" /></Button></TooltipTrigger><TooltipContent>Delete Group</TooltipContent></Tooltip>
                    </TooltipProvider>
                </div>
              </div>
              <CardDescription>Click a member to promote them to Group Admin for this group. Group Admins have elevated permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedUsers.map(user => (
                <UserAssignmentCard 
                    key={user.userId} 
                    user={user} 
                    onRemove={handleGroupToggle}
                    isGroupAdmin={(group.groupAdmins || []).includes(user.userId)}
                    onSetGroupAdmin={handleSetGroupAdmin}
                />
              ))}
            </CardContent>
          </Card>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{group.name}" group and unassign all users. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
    );
}

const AdminGroupsManagement = ({ tab }: { tab: AppTab }) => {
  const { toast } = useToast();
  const { users, updateUser, appSettings, updateAppSettings, updateAppTab } = useUser();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
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
    const { source, destination } = result;
    if (!destination || destination.index === 0) return;

    const sourceIndex = source.index - 1;
    const destinationIndex = destination.index - 1;
    
    if (sourceIndex === destinationIndex) return;

    const reorderedGroups = Array.from(appSettings.adminGroups);
    const [movedGroup] = reorderedGroups.splice(sourceIndex, 1);
    reorderedGroups.splice(destinationIndex, 0, movedGroup);

    updateAppSettings({ adminGroups: reorderedGroups });
  };

  return (
    <>
        <div className="flex items-center gap-2 mb-8">
            {isEditingTitle ? (
              <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
            ) : (
              <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleAddAdminGroup}>
                <GoogleSymbol name="add_circle" className="text-xl" />
                <span className="sr-only">Add New Group</span>
            </Button>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="admin-groups-list">
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
                                    <TooltipTrigger asChild><AddUserToGroupButton usersToAdd={nonAdminUsers} onAdd={handleAdminToggle} groupName="Admin" /></TooltipTrigger>
                                    <TooltipContent>Assign User</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <CardDescription>Assign or revoke Admin privileges. This is the highest level of access.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {adminUsers.map(user => (
                              <UserAssignmentCard 
                                key={user.userId} 
                                user={user} 
                                onRemove={handleAdminToggle}
                                isGroupAdmin={false}
                                canRemove={adminUsers.length > 1}
                              />
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                  
                  {appSettings.adminGroups.map((group, index) => (
                    <Draggable key={group.id} draggableId={group.id} index={index + 1}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <AdminGroupCard
                            group={group}
                            rank={index + 1}
                            users={users}
                            onUpdate={handleUpdateAdminGroup}
                            onDelete={() => handleDeleteAdminGroup(group.id)}
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
          <AlertDialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Two-Factor Authentication</AlertDialogTitle>
                <AlertDialogDescription>Enter the code from your authenticator app to confirm the role change.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4"><Input id="2fa-code" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="123456" onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}/></div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleVerify2fa}>Verify & Change</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearching(true)}>
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

  const calendarTabId = appSettings.tabs.find(t => t.componentKey === 'calendars')?.id;
  const teamsTabId = appSettings.tabs.find(t => t.componentKey === 'teams')?.id;
  const isServiceDeliveryPage = page.id === 'page-service-delivery';
  
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
              const isLockedTab = isServiceDeliveryPage && (tab.id === calendarTabId || tab.id === teamsTabId);
              const finalIsAssociated = isLockedTab || isAssociated;

              return (
                <div 
                    key={tab.id} 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md text-sm",
                      !isLockedTab && "cursor-pointer",
                      isLockedTab && "cursor-not-allowed opacity-75"
                    )}
                    style={{ color: finalIsAssociated ? tab.color : undefined }}
                    onClick={!isLockedTab ? () => handleToggle(tab.id) : undefined}
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


function PageCard({ page, onUpdate, onDelete, isLocked = false }: { page: AppPage; onUpdate: (id: string, data: Partial<AppPage>) => void; onDelete: (id: string) => void; isLocked?: boolean; }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    // Icon Search State
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    
    const controlsHidden = ['page-calendar', 'page-notifications', 'page-settings'].includes(page.id);

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
                                    <div className="flex items-center gap-1 p-2 border-b">
                                        {!isSearchingIcons ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
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
                                <Input ref={nameInputRef} defaultValue={page.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-2xl font-semibold leading-none tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{page.name}</CardTitle>
                            )}
                            {!isLocked && !controlsHidden && (
                                <>
                                    <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                                    <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                                </>
                            )}
                        </div>
                    </div>
                    {!isLocked && (
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
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Details</h4>
                  <CardDescription>
                      When associated with a Team, page access is granted to Team Admins, or all members if no Admins are set.
                      When associated with an Admin Group, page access is granted to Group Admins, or all members if no Admins are set.
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

const PagesManagement = ({ tab }: { tab: AppTab }) => {
    const { appSettings, updateAppSettings, updateAppTab } = useUser();
    const { toast } = useToast();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const lockedPageIds = ['page-admin-management'];
    const pinnedPageIds = ['page-notifications', 'page-settings'];

    const { adminPageConfig, unpinnedPages, pinnedPages } = useMemo(() => {
        const adminPageConfig = appSettings.pages.find(p => p.id === 'page-admin-management');
        const otherPages = appSettings.pages.filter(p => p.id !== 'page-admin-management');
        const pinnedPages = otherPages.filter(p => pinnedPageIds.includes(p.id)).sort((a, b) => pinnedPageIds.indexOf(a.id) - pinnedPageIds.indexOf(b.id));
        const unpinnedPages = otherPages.filter(p => !pinnedPageIds.includes(p.id));
        return { adminPageConfig, unpinnedPages, pinnedPages };
    }, [appSettings.pages]);

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
        const newPage: AppPage = {
            id: crypto.randomUUID(),
            name: `New Page ${appSettings.pages.length + 1}`,
            icon: 'web',
            color: '#64748B',
            path: '/dashboard/new-page',
            isDynamic: false,
            associatedTabs: [],
            access: { users: [], teams: [], adminGroups: [] }
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
            
            const reorderablePages = appSettings.pages.filter(p => !lockedPageIds.includes(p.id) && !pinnedPageIds.includes(p.id));
            const [movedPage] = reorderablePages.splice(source.index, 1);
            reorderablePages.splice(destination.index, 0, movedPage);

            const lockedPages = appSettings.pages.filter(p => lockedPageIds.includes(p.id));
            const finalPinnedPages = appSettings.pages.filter(p => pinnedPageIds.includes(p.id)).sort((a, b) => pinnedPageIds.indexOf(a.id) - pinnedPageIds.indexOf(b.id));
            updateAppSettings({ pages: [...lockedPages, ...reorderablePages, ...finalPinnedPages] });
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-8">
                <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                        <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                    ) : (
                        <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                    )}
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminPageConfig && (
                        <PageCard
                            page={adminPageConfig}
                            onUpdate={handleUpdatePage}
                            onDelete={handleDeletePage}
                            isLocked
                        />
                    )}
                    <StrictModeDroppable droppableId="pages-list">
                        {(provided) => (
                            <div 
                                className="contents"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {unpinnedPages.map((page, index) => (
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
                    {pinnedPages.map((page) => (
                        <PageCard
                            key={page.id}
                            page={page}
                            onUpdate={handleUpdatePage}
                            onDelete={handleDeletePage}
                            isLocked
                        />
                    ))}
                </div>
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
        <div className="flex items-start p-3 gap-4">
            <div className="relative mt-1">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-xl" style={{ color: tab.color }}>
                            <GoogleSymbol name={tab.icon} />
                        </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-80 p-0">
                        <div className="flex items-center gap-1 p-2 border-b">
                            {!isSearchingIcons ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
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
                        <Input ref={nameInputRef} defaultValue={tab.name} onBlur={handleSaveName} onKeyDown={handleKeyDown} className="h-auto p-0 font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
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
                        className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
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

const TabsManagement = ({ tab }: { tab: AppTab }) => {
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

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                  <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
              ) : (
                  <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
              )}
            </div>
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
        <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
        <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
      </div>
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className="flex w-full">
          {pageTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
              <GoogleSymbol name={tab.icon} className="text-lg" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
);

    