
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User, type AppTab, type AppPage, type AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getOwnershipContext } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

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

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function UserCard({ 
    user, 
    onRemove, 
    isTeamAdmin,
    onSetAdmin,
    canManageAdmins,
}: { 
    user: User; 
    onRemove: () => void; 
    isTeamAdmin: boolean;
    onSetAdmin: () => void;
    canManageAdmins: boolean;
}) {
  return (
      <div 
        className={cn(
            "group relative flex items-center gap-2 p-1 rounded-md transition-colors",
            canManageAdmins && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
        )}
        onClick={(e) => { e.stopPropagation(); if (canManageAdmins) onSetAdmin(); }}
        onKeyDown={(e) => { if(canManageAdmins && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSetAdmin();}}}
        tabIndex={canManageAdmins ? 0 : -1}
      >
          <div className="relative">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
             {isTeamAdmin && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center bg-primary text-primary-foreground">
                                <GoogleSymbol name="key" style={{fontSize: '10px'}}/>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Team Admin</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          <div>
              <p className="font-medium text-sm">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.title}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onRemove();}}
                    >
                        <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Remove User</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
  );
}

function TeamCard({ 
    team, 
    users,
    onUpdate, 
    onDelete,
    onToggleShare,
    onRemoveUser,
    onAddUser,
    onSetAdmin,
    dragHandleProps,
    isSharedPreview = false,
    isExpanded,
    onToggleExpand,
}: { 
    team: Team, 
    users: User[],
    onUpdate: (id: string, data: Partial<Team>) => void, 
    onDelete: (team: Team) => void,
    onToggleShare: (team: Team) => void,
    onRemoveUser: (teamId: string, userId: string) => void;
    onAddUser: (teamId: string, userId: string) => void;
    onSetAdmin: (teamId: string, userId: string) => void;
    dragHandleProps?: any,
    isSharedPreview?: boolean,
    isExpanded: boolean,
    onToggleExpand: () => void;
}) {
    const { viewAsUser, teams, appSettings } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isAddUserPopoverOpen, setIsAddUserPopoverOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const addUserSearchInputRef = useRef<HTMLInputElement>(null);
    
    const isOwned = useMemo(() => {
        if (isSharedPreview || !viewAsUser) return false;
        if(viewAsUser.isAdmin) return true;
        
        const owner = team.owner || { type: 'team', id: team.id }; // Fallback for older data

        switch (owner.type) {
            case 'team':
                const ownerTeam = teams.find(t => t.id === owner.id);
                return ownerTeam?.teamAdmins?.includes(viewAsUser.userId) || false;
            case 'admin_group':
                return (viewAsUser.roles || []).includes(owner.name);
            case 'user':
                return owner.id === viewAsUser.userId
            default:
                return false;
        }
    }, [team.owner, teams, viewAsUser, isSharedPreview]);

    const canManageAdmins = isOwned || (team.teamAdmins || []).includes(viewAsUser.userId);

    const teamMembers = useMemo(() => team.members.map(id => users.find(u => u.userId === id)).filter((u): u is User => !!u), [team.members, users]);
    const availableUsersToAdd = useMemo(() => users.filter(u => !team.members.includes(u.userId) && u.displayName.toLowerCase().includes(userSearch.toLowerCase())), [users, team.members, userSearch]);

    useEffect(() => {
        if (isAddUserPopoverOpen) {
            setTimeout(() => addUserSearchInputRef.current?.focus(), 100);
        } else {
            setUserSearch('');
        }
    }, [isAddUserPopoverOpen]);
    
    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== team.name) {
            onUpdate(team.id, { name: newName });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor: string | undefined = '#64748B';

    if (team.isShared) {
        const owner = team.owner || { type: 'team', id: team.id };
        if(owner.type === 'team' && owner.id === team.id) { // Self-owned and shared
            shareIcon = 'upload';
            shareIconTitle = `Owned by this team and shared`;
            shareIconColor = team.color;
        } else if (owner.type !== 'team' || owner.id !== team.id) { // Owned by someone else
            shareIcon = 'downloading';
            if(owner.type === 'team') {
                const ownerTeam = teams.find(t => t.id === owner.id);
                shareIconTitle = `Shared from ${ownerTeam?.name || 'another team'}`;
                shareIconColor = ownerTeam?.color;
            } else if (owner.type === 'admin_group') {
                const ownerGroup = appSettings.adminGroups.find(g => g.name === owner.name);
                shareIconTitle = `Shared from ${ownerGroup?.name || 'an admin group'}`;
                shareIconColor = ownerGroup?.color;
            } else if (owner.type === 'user') {
                const ownerUser = users.find(u => u.userId === owner.id);
                shareIconTitle = `Shared by ${ownerUser?.displayName || 'a user'}`;
                shareIconColor = ownerUser?.primaryColor;
            }
        }
    }

    return (
        <Card className={cn("flex flex-col h-full bg-transparent group relative")}>
            <div {...dragHandleProps}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button onClick={(e) => e.stopPropagation()} className="h-12 w-12 flex items-center justify-center">
                                                <GoogleSymbol name={team.icon} className="text-6xl" weight={100} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Team Icon</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()} disabled={!isOwned}>
                                                    <button className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background", isOwned && "cursor-pointer")} style={{ backgroundColor: team.color }} />
                                                </PopoverTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Change Color</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-auto p-2">
                                    <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(team.id, { color: c }); setIsColorPopoverOpen(false);}}></button>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={team.color} onChange={(e) => onUpdate(team.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                                    </PopoverContent>
                                </Popover>
                                {shareIcon && team.isShared && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center text-white"
                                                style={{ backgroundColor: shareIconColor }}
                                            >
                                                <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}}/>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            </div>
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                {isEditingName && isOwned ? (
                                    <Input
                                        ref={nameInputRef}
                                        defaultValue={team.name}
                                        onBlur={handleSaveName}
                                        onKeyDown={handleNameKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                    />
                                ) : (
                                    <CardTitle className={cn("font-headline text-xl font-thin truncate", isOwned && "cursor-pointer")} onClick={(e) => {e.stopPropagation(); if (isOwned) setIsEditingName(true)}}>
                                        {team.name}
                                    </CardTitle>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
                                            <GoogleSymbol name={isExpanded ? 'unfold_less' : 'unfold_more'} weight={100} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isExpanded ? 'Collapse' : 'Expand'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!isOwned} onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><GoogleSymbol name="group_add" weight={100} /></Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Add User</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
                                     <div className="p-2 border-b">
                                        <div className="flex items-center gap-1 w-full">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                            <input
                                                ref={addUserSearchInputRef}
                                                placeholder="Search..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="h-64">
                                        <div className="p-2 space-y-1">
                                            {availableUsersToAdd.map(user => (
                                                <div key={user.userId} onClick={() => {onAddUser(team.id, user.userId); setIsAddUserPopoverOpen(false);}} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                                                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                                                    <p className="font-medium text-sm">{user.displayName}</p>
                                                </div>
                                            ))}
                                            {availableUsersToAdd.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No users found.</p>}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                             <DropdownMenu>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <DropdownMenuTrigger asChild disabled={!isOwned} onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" weight={100} /></Button></DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>More Options</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => onToggleShare(team)}>
                                        <GoogleSymbol name={team.isShared ? 'share_off' : 'share'} className="mr-2 text-lg"/>
                                        {team.isShared ? 'Unshare Team' : 'Share Team'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(team)} className="text-destructive focus:text-destructive">
                                        <GoogleSymbol name="delete" className="mr-2 text-lg"/>
                                        Delete Team
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
            </div>
             {isExpanded && (
                <CardContent className="flex-grow pt-0">
                    <ScrollArea className="max-h-48 pr-2">
                        <StrictModeDroppable droppableId={team.id} type="user-card" isDropDisabled={!isOwned}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "min-h-[60px] rounded-md p-2 -m-2 space-y-1 transition-colors",
                                        snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                                    )}>
                                    {teamMembers.map((user, index) => (
                                        <Draggable key={user.userId} draggableId={`user-${team.id}-${user.userId}`} index={index} isDragDisabled={!isOwned}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn(snapshot.isDragging && "opacity-50 shadow-lg")}
                                                >
                                                <UserCard 
                                                    user={user} 
                                                    onRemove={() => onRemoveUser(team.id, user.userId)}
                                                    isTeamAdmin={(team.teamAdmins || []).includes(user.userId)}
                                                    onSetAdmin={() => onSetAdmin(team.id, user.userId)}
                                                    canManageAdmins={canManageAdmins}
                                                />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    );
}

export function TeamManagement({ tab, page }: { tab: AppTab; page: AppPage }) {
    const { viewAsUser, users, teams, appSettings, addTeam, updateTeam, deleteTeam, reorderTeams, updateAppTab } = useUser();
    const { toast } = useToast();

    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const title = appSettings.teamManagementLabel || tab.name;

    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    const toggleTeamExpansion = useCallback((teamId: string) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    }, []);

    const handleSaveTitle = () => {
        const newName = titleInputRef.current?.value.trim();
        if (newName && newName !== title) {
            updateAppTab(tab.id, { name: newName });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        else if (e.key === 'Escape') setIsEditingTitle(false);
    };

    const handleAddTeam = () => {
        const owner = getOwnershipContext(page, viewAsUser, teams, appSettings.adminGroups);
        const newTeam: Omit<Team, 'id'> = {
            name: `New Team ${teams.length + 1}`,
            icon: 'group',
            color: predefinedColors[teams.length % predefinedColors.length],
            owner: owner,
            isShared: false,
            members: [],
            teamAdmins: [],
            locationCheckManagers: [],
            allBadges: [],
            badgeCollections: [],
        };
        addTeam(newTeam);
    };

    const handleUpdate = (teamId: string, data: Partial<Team>) => updateTeam(teamId, data);
    
    const handleToggleShare = (team: Team) => {
        updateTeam(team.id, { isShared: !team.isShared });
        toast({ title: team.isShared ? 'Team Unshared' : 'Team Shared' });
    };

    const handleDelete = (team: Team) => setTeamToDelete(team);
    
    const handleAddUserToTeam = (teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || team.members.includes(userId)) return;
        const updatedMembers = [...team.members, userId];
        updateTeam(teamId, { members: updatedMembers });
        toast({ title: "User Added" });
    };
    
    const handleSetAdmin = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;
        
        const currentAdmins = team.teamAdmins || [];
        const isAlreadyAdmin = currentAdmins.includes(userId);
        
        const newAdmins = isAlreadyAdmin
            ? currentAdmins.filter(id => id !== userId)
            : [...currentAdmins, userId];
            
        updateTeam(teamId, { teamAdmins: newAdmins });
    }, [teams, updateTeam]);

    const handleRemoveUserFromTeam = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;
        
        const updatedMembers = team.members.filter(id => id !== userId);
        
        if (updatedMembers.length === 0) {
            deleteTeam(teamId);
            toast({ title: 'Team Deleted', description: `Team "${team.name}" was automatically deleted as the last member was removed.` });
        } else {
            const newTeamAdmins = (team.teamAdmins || []).filter(id => id !== userId);
            updateTeam(teamId, { members: updatedMembers, teamAdmins: newTeamAdmins });
            toast({ title: 'User Removed' });
        }
    }, [teams, deleteTeam, updateTeam, toast]);

    const confirmDelete = () => {
        if (!teamToDelete) return;
        deleteTeam(teamToDelete.id);
        toast({ title: 'Success', description: `Team "${teamToDelete.name}" has been deleted.` });
        setTeamToDelete(null);
    };
    
    const ownedTeams = useMemo(() => teams.filter(team => {
        if(viewAsUser.isAdmin) return true;
        const owner = team.owner || { type: 'team', id: team.id };
        if(owner.type === 'user') return owner.id === viewAsUser.userId;
        if(owner.type === 'admin_group') return (viewAsUser.roles || []).includes(owner.name);
        if(owner.type === 'team') {
            const ownerTeam = teams.find(t => t.id === owner.id);
            return (ownerTeam?.teamAdmins || []).includes(viewAsUser.userId);
        }
        return false;
    }), [teams, viewAsUser]);

    const ownedTeamIds = new Set(ownedTeams.map(t => t.id));
    const sharedTeams = teams.filter(team => team.isShared && !ownedTeamIds.has(t.id));

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId, type } = result;
        if (!destination) return;

        if (type === 'team-card' && destination.droppableId === 'shared-teams-panel') {
            const teamToShare = teams.find(t => t.id === draggableId);
            if (teamToShare && !teamToShare.isShared) {
                handleToggleShare(teamToShare);
            }
            return;
        }

        if (type === 'team-card' && destination.droppableId === 'duplicate-team-zone') {
            const teamToDuplicate = teams.find(t => t.id === draggableId);
            if(teamToDuplicate) {
                const owner = getOwnershipContext(page, viewAsUser, teams, appSettings.adminGroups);
                const newTeam = {
                    ...JSON.parse(JSON.stringify(teamToDuplicate)),
                    id: crypto.randomUUID(),
                    name: `${teamToDuplicate.name} (Copy)`,
                    owner,
                    isShared: false,
                };
                addTeam(newTeam);
                toast({ title: 'Team Copied' });
            }
            return;
        }
        
        if (type === 'team-card' && source.droppableId === 'teams-list' && destination.droppableId === 'teams-list') {
            const reorderedOwnedTeams = Array.from(ownedTeams);
            const [movedItem] = reorderedOwnedTeams.splice(source.index, 1);
            reorderedOwnedTeams.splice(destination.index, 0, movedItem);
            
            const currentOwnedTeamIds = new Set(reorderedOwnedTeams.map(t => t.id));
            const otherTeams = teams.filter(t => !currentOwnedTeamIds.has(t.id));

            reorderTeams([...reorderedOwnedTeams, ...otherTeams]);
            return;
        }
        
        if (type === 'user-card') {
            const destTeamId = destination.droppableId;
            const userId = draggableId.split('-').pop();
            if (!userId) return;
            handleAddUserToTeam(destTeamId, userId);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4">
                <div className="flex-1 transition-all duration-300 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isEditingTitle ? (
                              <Input ref={titleInputRef} defaultValue={title} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                            ) : (
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{title}</h2>
                                      </TooltipTrigger>
                                      {tab.description && (
                                          <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                                      )}
                                  </Tooltip>
                              </TooltipProvider>
                            )}
                            <StrictModeDroppable droppableId="duplicate-team-zone" type="team-card" isDropDisabled={false} isCombineEnabled={false}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn("rounded-full transition-all p-0.5", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={handleAddTeam}>
                                                        <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                                        <span className="sr-only">New Team or Drop to Duplicate</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Team'}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </StrictModeDroppable>
                        </div>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                        <GoogleSymbol name="dynamic_feed" weight={100} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Show Shared Teams</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <StrictModeDroppable droppableId="teams-list" type="team-card" isDropDisabled={false} isCombineEnabled={false}>
                        {(provided, snapshot) => (
                             <div className={cn("flex flex-wrap -m-3", snapshot.isDraggingOver && "ring-1 ring-border ring-inset rounded-lg")} ref={provided.innerRef} {...provided.droppableProps}>
                                {ownedTeams.map((team, index) => (
                                     <Draggable key={team.id} draggableId={team.id} index={index} ignoreContainerClipping={false}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={cn(
                                                    "p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0",
                                                    isSharedPanelOpen ? "lg:basis-full" : "lg:basis-1/3"
                                                )}
                                            >
                                                <TeamCard 
                                                    team={team} 
                                                    users={users}
                                                    onUpdate={handleUpdate} 
                                                    onDelete={handleDelete}
                                                    onToggleShare={handleToggleShare}
                                                    onRemoveUser={handleRemoveUserFromTeam}
                                                    onAddUser={handleAddUserToTeam}
                                                    onSetAdmin={handleSetAdmin}
                                                    dragHandleProps={provided.dragHandleProps}
                                                    isExpanded={expandedTeams.has(team.id)}
                                                    onToggleExpand={() => toggleTeamExpansion(team.id)}
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
                
                <div className={cn(
                    "transition-all duration-300",
                    isSharedPanelOpen ? "w-96 p-2" : "w-0"
                )}>
                    <StrictModeDroppable droppableId="shared-teams-panel" type="team-card">
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className={cn("h-full rounded-lg transition-all", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                            >
                                <Card className={cn("transition-opacity duration-300 h-full bg-transparent", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                                    <CardHeader>
                                        <CardTitle>Shared Teams</CardTitle>
                                        <CardDescription>Drag an owned team here to share it with everyone.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {sharedTeams.map((team, index) => {
                                                return (
                                                    <Draggable key={team.id} draggableId={team.id} index={index} ignoreContainerClipping={false}>
                                                        {(provided, snapshot) => (
                                                            <div 
                                                                ref={provided.innerRef} 
                                                                {...provided.draggableProps} 
                                                                className={cn("w-full cursor-grab", snapshot.isDragging && "shadow-xl opacity-80")}
                                                            >
                                                                <TeamCard 
                                                                    dragHandleProps={provided.dragHandleProps}
                                                                    team={team} 
                                                                    users={users}
                                                                    onUpdate={handleUpdate} 
                                                                    onDelete={handleDelete}
                                                                    onToggleShare={handleToggleShare}
                                                                    onRemoveUser={handleRemoveUserFromTeam}
                                                                    onAddUser={handleAddUserToTeam}
                                                                    onSetAdmin={handleSetAdmin}
                                                                    isSharedPreview={true}
                                                                    isExpanded={expandedTeams.has(team.id)}
                                                                    onToggleExpand={() => toggleTeamExpansion(team.id)}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                            {sharedTeams.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No teams are being shared.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                                {provided.placeholder}
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
            </div>
            <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 p-0" onClick={confirmDelete}>
                                        <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                                        <span className="sr-only">Delete Team</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Team</p></TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    </div>
                    <DialogHeader>
                        <UIDialogTitle>Delete "{teamToDelete?.name}"?</UIDialogTitle>
                        <DialogDescription>This action cannot be undone. This will permanently delete the team and all of its associated data.</DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </DragDropContext>
    );
}
