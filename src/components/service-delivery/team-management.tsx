
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User, type AppTab, type AppPage, type AppSettings, type BadgeCollectionOwner } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn, getContrastColor } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getOwnershipContext } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { CardDescription } from '../ui/card';
import { googleSymbolNames } from '@/lib/google-symbols';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    canManage,
    memberCount,
}: { 
    user: User; 
    onRemove: () => void; 
    isTeamAdmin: boolean;
    onSetAdmin: () => void;
    canManage: boolean;
    memberCount: number;
}) {
  return (
      <div 
        className={cn(
            "group relative flex items-center gap-2 p-1 rounded-md transition-colors",
            canManage && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
        )}
        onClick={(e) => { e.stopPropagation(); if (canManage) onSetAdmin(); }}
        onKeyDown={(e) => { if(canManage && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSetAdmin();}}}
        tabIndex={canManage ? 0 : -1}
      >
          <div className="relative">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
             {isTeamAdmin && memberCount > 1 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center bg-primary text-primary-foreground">
                                <GoogleSymbol name="key" style={{fontSize: '10px'}}/>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Team Admin</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          <div>
              <p className="font-normal text-sm">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.title}</p>
          </div>
          {canManage && (
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
          )}
      </div>
  );
}

function SortableUserCard({ user, teamId, onRemove, isTeamAdmin, onSetAdmin, canManage, memberCount }: {
  user: User;
  teamId: string;
  onRemove: () => void; 
  isTeamAdmin: boolean;
  onSetAdmin: () => void;
  canManage: boolean;
  memberCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `user-${teamId}-${user.userId}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "shadow-lg")}>
      <UserCard
        user={user}
        onRemove={onRemove}
        isTeamAdmin={isTeamAdmin}
        onSetAdmin={onSetAdmin}
        canManage={canManage}
        memberCount={memberCount}
      />
    </div>
  );
}

function TeamCardDroppableContent({ teamId, children, isSharedPreview }: { teamId: string, children: React.ReactNode, isSharedPreview: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: teamId, data: { type: 'user-card-droppable' }, disabled: isSharedPreview });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[60px] rounded-md p-2 -m-2 space-y-1 transition-colors",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      {children}
    </div>
  );
}

function SortableTeamCard({ team, users, onUpdate, onDelete, onToggleShare, onRemoveUser, onAddUser, onSetAdmin }: {
  team: Team;
  users: User[];
  onUpdate: (id: string, data: Partial<Team>) => void;
  onDelete: (team: Team) => void;
  onToggleShare: (team: Team) => void;
  onRemoveUser: (teamId: string, userId: string) => void;
  onAddUser: (teamId: string, userId: string) => void;
  onSetAdmin: (teamId: string, userId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
    data: { type: 'team-card' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TeamCard
        team={team}
        users={users}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggleShare={onToggleShare}
        onRemoveUser={onRemoveUser}
        onAddUser={onAddUser}
        onSetAdmin={onSetAdmin}
      />
    </div>
  )
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
    isSharedPreview = false,
}: { 
    team: Team; 
    users: User[];
    onUpdate: (id: string, data: Partial<Team>) => void;
    onDelete: (team: Team) => void;
    onToggleShare: (team: Team) => void;
    onRemoveUser: (teamId: string, userId: string) => void;
    onAddUser: (teamId: string, userId: string) => void;
    onSetAdmin: (teamId: string, userId: string) => void;
    isSharedPreview?: boolean;
}) {
    const { viewAsUser } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isAddUserPopoverOpen, setIsAddUserPopoverOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const addUserSearchInputRef = useRef<HTMLInputElement>(null);
    
    const owner = useMemo(() => {
        return users.find(u => u.userId === team.owner.id);
    }, [team.owner.id, users]);

    const ownerName = owner?.displayName || 'System';
    const ownerColor = owner?.primaryColor || '#64748B';

    const canManageTeam = useMemo(() => {
        if (isSharedPreview) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [team, viewAsUser, isSharedPreview]);

    const teamMembers = useMemo(() => team.members.map(id => users.find(u => u.userId === id)).filter((u): u is User => !!u), [team.members, users]);
    const teamMemberIds = useMemo(() => teamMembers.map(u => `user-${team.id}-${u.userId}`), [teamMembers, team.id]);

    const availableUsersToAdd = useMemo(() => users.filter(u => !team.members.includes(u.userId) && u.displayName.toLowerCase().includes(userSearch.toLowerCase())), [users, team.members, userSearch]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    
    if (team.owner.id === viewAsUser.userId && team.isShared) {
        shareIcon = 'upload';
        shareIconTitle = `Owned & Shared by You`;
    } else if (team.owner.id !== viewAsUser.userId && team.isShared) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared from ${ownerName}`;
    }

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

    useEffect(() => {
        if (isIconPopoverOpen) {
            setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

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

    return (
        <Card className="flex flex-col h-full group bg-transparent relative">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()} disabled={!canManageTeam}>
                                                <button className="h-12 w-12 flex items-center justify-center">
                                                    <GoogleSymbol name={team.icon} className="text-6xl" weight={100} />
                                                </button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Icon</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-80 p-0">
                                    <div className="flex items-center gap-1 p-2 border-b">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                        <input
                                            ref={iconSearchInputRef}
                                            placeholder="Search icons..."
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                        />
                                    </div>
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                        <TooltipProvider key={iconName}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <Button variant={team.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(team.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} className="text-4xl" weight={100} /></Button>
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
                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()} disabled={!canManageTeam}>
                                                <button className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background", canManageTeam && "cursor-pointer")} style={{ backgroundColor: team.color }} />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(team.id, { color: c }); setIsColorPopoverOpen(false);}}></button>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={team.color} onChange={(e) => onUpdate(team.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                                </PopoverContent>
                            </Popover>
                            {shareIcon && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center text-white"
                                                style={{ backgroundColor: ownerColor }}
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
                            {isEditingName && canManageTeam ? (
                                <Input
                                    ref={nameInputRef}
                                    defaultValue={team.name}
                                    onBlur={handleSaveName}
                                    onKeyDown={handleNameKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                />
                            ) : (
                                <CardTitle className={cn("font-headline text-xl font-thin truncate", canManageTeam && "cursor-pointer")} onClick={(e) => {e.stopPropagation(); if (canManageTeam) setIsEditingName(true)}}>
                                    {team.name}
                                </CardTitle>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {canManageTeam && !isSharedPreview && (
                            <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!canManageTeam} onClick={(e) => e.stopPropagation()}>
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
                                                    <p className="font-normal text-sm">{user.displayName}</p>
                                                </div>
                                            ))}
                                            {availableUsersToAdd.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No users found.</p>}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        )}
                         <DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <DropdownMenuTrigger asChild disabled={isSharedPreview} onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" weight={100} /></Button></DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>More Options</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {canManageTeam && (
                                    <DropdownMenuItem onClick={() => onToggleShare(team)} disabled={isSharedPreview}>
                                        <GoogleSymbol name={team.isShared ? 'share_off' : 'share'} className="mr-2 text-lg"/>
                                        {team.isShared ? 'Unshare Team' : 'Share Team'}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onDelete(team)} className={cn(!canManageTeam && 'text-primary focus:text-primary')}>
                                    <GoogleSymbol name={canManageTeam ? "delete" : "link_off"} className="mr-2 text-lg"/>
                                    {canManageTeam ? 'Delete Team' : 'Unlink Team'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-0 flex flex-col">
                <ScrollArea className="max-h-48 pr-2 flex-grow">
                    <TeamCardDroppableContent teamId={team.id} isSharedPreview={isSharedPreview}>
                        <SortableContext items={teamMemberIds} strategy={verticalListSortingStrategy}>
                            {teamMembers.map((user, index) => (
                                <SortableUserCard 
                                    key={user.userId}
                                    user={user} 
                                    teamId={team.id}
                                    onRemove={() => onRemoveUser(team.id, user.userId)}
                                    isTeamAdmin={(team.teamAdmins || []).includes(user.userId)}
                                    onSetAdmin={() => onSetAdmin(team.id, user.userId)}
                                    canManage={canManageTeam}
                                    memberCount={team.members.length}
                                />
                            ))}
                        </SortableContext>
                    </TeamCardDroppableContent>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function TeamManagement({ tab, page, isSingleTabPage = false }: { tab: AppTab; page: AppPage; isSingleTabPage?: boolean }) {
    const { viewAsUser, users, teams, appSettings, addTeam, updateTeam, deleteTeam, reorderTeams, updateAppTab, updateUser } = useUser();
    const { toast } = useToast();

    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const sharedSearchInputRef = useRef<HTMLInputElement>(null);
    
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const pageTitle = page.isDynamic && teams.find(t => t.id === page.path.split('/')[2]) ? `${teams.find(t => t.id === page.path.split('/')[2])?.name} ${page.name}` : page.name;
    const tabTitle = appSettings.teamManagementLabel || tab.name;
    const finalTitle = isSingleTabPage ? pageTitle : tabTitle;
    
    const canManageTeam = useCallback((team: Team) => {
        if (!viewAsUser) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [viewAsUser]);


    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    useEffect(() => {
        if (isSharedPanelOpen) {
            const timer = setTimeout(() => {
                sharedSearchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setSharedSearchTerm(''); // Clear search on close
        }
    }, [isSharedPanelOpen]);

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

    const handleAddTeam = () => {
        const owner = getOwnershipContext(page, viewAsUser);
        const newTeam: Omit<Team, 'id'> = {
            name: `New Team ${teams.length + 1}`,
            icon: 'group',
            color: predefinedColors[teams.length % predefinedColors.length],
            owner: owner,
            isShared: false,
            members: [owner.id],
            teamAdmins: [owner.id],
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
    
    const handleDelete = (team: Team) => {
        if (canManageTeam(team)) {
            setTeamToDelete(team);
        } else {
            const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== team.id);
            updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
            toast({ title: "Team Unlinked", description: `"${team.name}" has been unlinked from your board.`});
        }
    };
    
    const handleAddUserToTeam = (teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || team.members.includes(userId)) return;
        if (!canManageTeam(team)) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to manage this team.' });
            return;
        }
        const updatedMembers = [...team.members, userId];
        updateTeam(teamId, { members: updatedMembers });
        toast({ title: "User Added" });
    };
    
    const handleSetAdmin = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || !canManageTeam(team)) return;
        
        const currentAdmins = team.teamAdmins || [];
        const isAlreadyAdmin = currentAdmins.includes(userId);
        
        if (isAlreadyAdmin && currentAdmins.length === 1 && team.members.length > 1) {
            toast({ variant: 'destructive', title: 'Cannot Remove Last Admin' });
            return;
        }
        
        const newAdmins = isAlreadyAdmin
            ? currentAdmins.filter(id => id !== userId)
            : [...currentAdmins, userId];
            
        updateTeam(teamId, { teamAdmins: newAdmins });
    }, [teams, updateTeam, canManageTeam, toast]);

    const handleRemoveUserFromTeam = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || !canManageTeam(team)) {
             toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot remove users from teams you do not have permission to manage.' });
            return;
        }
        
        const updatedMembers = team.members.filter(id => id !== userId);
        
        if (updatedMembers.length === 0) {
            setTeamToDelete(team);
            return;
        }

        const newTeamAdmins = (team.teamAdmins || []).filter(id => id !== userId);
        updateTeam(teamId, { members: updatedMembers, teamAdmins: newTeamAdmins });
        toast({ title: 'User Removed' });
    }, [teams, updateTeam, toast, canManageTeam]);

    const confirmDelete = () => {
        if (!teamToDelete) return;
        deleteTeam(teamToDelete.id);
        toast({ title: 'Success', description: `Team "${teamToDelete.name}" has been deleted.` });
        setTeamToDelete(null);
    };
    
    const displayedTeams = useMemo(() => {
        return teams
            .filter(t => 
                canManageTeam(t) || 
                (viewAsUser.linkedTeamIds || []).includes(t.id) ||
                t.members.includes(viewAsUser.userId)
            )
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [teams, viewAsUser, searchTerm, canManageTeam]);


    const sharedTeams = useMemo(() => {
        const teamsOnBoard = new Set(displayedTeams.map(t => t.id));
        return teams
            .filter(t => t.isShared && !teamsOnBoard.has(t.id) && t.owner.id !== viewAsUser.userId)
            .filter(t => t.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [teams, displayedTeams, sharedSearchTerm, viewAsUser.userId]);
    
    const onDragEnd = (result: DragEndEvent) => {
        const { active, over } = result;

        if (!over) return;
        const activeId = active.id.toString();
        const overId = over.id.toString();
        
        if (active.data.current?.type === 'team-card' && over.data.current?.type === 'team-card' && activeId !== overId) {
             const oldIndex = displayedTeams.findIndex(t => t.id === activeId);
             const newIndex = displayedTeams.findIndex(t => t.id === overId);
             if (oldIndex !== -1 && newIndex !== -1) {
                 reorderTeams(arrayMove(displayedTeams, oldIndex, newIndex));
             }
             return;
        }

        if (over.data.current?.type === 'user-card-droppable') {
            const destTeamId = overId;
            const [type, sourceTeamId, userId] = activeId.split('-');

            if (type === 'user' && userId && destTeamId && sourceTeamId !== destTeamId) {
                const destTeam = teams.find(t => t.id === destTeamId);
                if (destTeam && canManageTeam(destTeam)) {
                    handleAddUserToTeam(destTeamId, userId);
                } else {
                     toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to add users to this team.' });
                }
            }
        }
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <DndContext sensors={sensors} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex gap-4">
                 <div className="flex-1 transition-all duration-300 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isEditingTitle ? (
                              <Input ref={titleInputRef} defaultValue={finalTitle} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                            ) : (
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <h2 className="font-headline text-2xl font-thin tracking-tight cursor-pointer" onClick={() => setIsEditingTitle(true)}>{finalTitle}</h2>
                                      </TooltipTrigger>
                                      {tab.description && (
                                          <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                                      )}
                                  </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={handleAddTeam}>
                                <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                <span className="sr-only">New Team</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-1">
                            {!isSearching ? (
                                <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className="text-muted-foreground">
                                    <GoogleSymbol name="search" />
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1 border-b">
                                    <GoogleSymbol name="search" className="text-muted-foreground" />
                                    <input
                                        ref={searchInputRef}
                                        placeholder="Search teams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onBlur={() => { if (!searchTerm) setIsSearching(false); }}
                                        className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                    />
                                </div>
                            )}
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
                    </div>
                    
                    <SortableContext items={displayedTeams.map(t => t.id)} strategy={rectSortingStrategy}>
                        <div className="flex flex-wrap -m-3">
                            {displayedTeams.map((team) => (
                                <div key={team.id} className={cn("p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0 transition-all duration-300", isSharedPanelOpen ? "lg:w-full" : "lg:basis-1/3")}>
                                    <SortableTeamCard 
                                        team={team} 
                                        users={users}
                                        onUpdate={handleUpdate} 
                                        onDelete={handleDelete}
                                        onToggleShare={handleToggleShare}
                                        onRemoveUser={handleRemoveUserFromTeam}
                                        onAddUser={handleAddUserToTeam}
                                        onSetAdmin={handleSetAdmin}
                                    />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </div>
                 <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96 p-2" : "w-0")}>
                    <div 
                        className={cn("h-full rounded-lg transition-all")}
                    >
                        <Card className={cn("transition-opacity duration-300 h-full bg-transparent", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-headline font-thin text-xl">Shared Teams</CardTitle>
                                    <div className="flex items-center gap-1 p-1">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-lg" />
                                        <input
                                            ref={sharedSearchInputRef}
                                            placeholder="Search shared teams..."
                                            value={sharedSearchTerm}
                                            onChange={(e) => setSharedSearchTerm(e.target.value)}
                                            className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                                <CardDescription>Drag a team you own here to share it. Drag a team to your board to link it.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-full">
                                <ScrollArea className="h-full">
                                    <div className="space-y-2">
                                        {sharedTeams.map((team, index) => (
                                            <div key={team.id} className={cn("w-full")}>
                                                <TeamCard
                                                    team={team}
                                                    users={users}
                                                    onUpdate={handleUpdate}
                                                    onDelete={handleDelete}
                                                    onToggleShare={handleToggleShare}
                                                    onRemoveUser={handleRemoveUserFromTeam}
                                                    onAddUser={handleAddUserToTeam}
                                                    onSetAdmin={handleSetAdmin}
                                                    isSharedPreview={true}
                                                />
                                            </div>
                                        ))}
                                        {sharedTeams.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No other teams are currently shared.</p>}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={confirmDelete}>
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
        </DndContext>
    );
}
