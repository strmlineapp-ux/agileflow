

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User, type AppTab } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { googleSymbolNames } from '@/lib/google-symbols';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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


const AddMemberToTeamButton = ({ usersToAdd, onAdd, teamName }: { usersToAdd: User[], onAdd: (user: User) => void, teamName: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
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
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <GoogleSymbol name="add_circle" className="text-xl" />
                  <span className="sr-only">Assign member to {teamName}</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Assign Member</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="p-0 w-80">
        <div className="flex items-center gap-1 p-2 border-b">
          {!isSearching ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearching(true)}>
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

const MemberCard = ({ user, index, onRemove, onSetAdmin, isTeamAdmin }: { user: User; index: number; onRemove: (userId: string) => void; onSetAdmin: (userId: string) => void; isTeamAdmin: boolean }) => {
    return (
        <Draggable draggableId={`user-${user.userId}`} index={index} type="user-card">
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cn(snapshot.isDragging && "opacity-80")}
            >
            <Card
                tabIndex={0}
                role="button"
                onClick={() => onSetAdmin(user.userId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSetAdmin(user.userId); } }}
                className={cn(
                "transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
                isTeamAdmin && "ring-1 ring-primary"
                )}
            >
                <CardContent className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-sm">{user.displayName}</p>
                    </div>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemove(user.userId); }} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                <GoogleSymbol name="cancel" className="text-sm" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Remove from team</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                </CardContent>
            </Card>
            </div>
        )}
        </Draggable>
    );
};

function TeamCard({ 
    team, 
    allUsers, 
    onUpdate, 
    onDelete, 
}: { 
    team: Team, 
    allUsers: User[], 
    onUpdate: (id: string, data: Partial<Team>) => void, 
    onDelete: (team: Team) => void,
}) {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    
    const teamMembers = team.members.map(id => allUsers.find(u => u.userId === id)).filter(Boolean) as User[];
    
     useEffect(() => {
        if (!isIconPopoverOpen) {
            setIsSearchingIcons(false);
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    useEffect(() => {
        if (isSearchingIcons) iconSearchInputRef.current?.focus();
    }, [isSearchingIcons]);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

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

    const handleAdminToggle = (userId: string) => {
        const currentAdmins = team.teamAdmins || [];
        const newAdmins = currentAdmins.includes(userId)
            ? currentAdmins.filter(id => id !== userId)
            : [...currentAdmins, userId];
        onUpdate(team.id, { teamAdmins: newAdmins });
    };

    const handleMemberToggle = (userId: string) => {
        const newMembers = team.members.filter(id => id !== userId);
        const newAdmins = (team.teamAdmins || []).filter(id => id !== userId);
        onUpdate(team.id, { members: newMembers, teamAdmins: newAdmins });
    }
    
    const unassignedUsers = useMemo(() => {
        const memberIds = new Set(team.members);
        return allUsers.filter(u => !memberIds.has(u.userId));
    }, [allUsers, team.members]);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl">
                                        <GoogleSymbol name={team.icon} />
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
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={team.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(team.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: team.color }} />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                    <div className="grid grid-cols-8 gap-1">
                                        {predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(team.id, { color: c }); setIsColorPopoverOpen(false);}}/>))}
                                        <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={team.color} onChange={(e) => onUpdate(team.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            {isEditingName ? (
                                <Input
                                    ref={nameInputRef}
                                    defaultValue={team.name}
                                    onBlur={handleSaveName}
                                    onKeyDown={handleNameKeyDown}
                                    className="h-auto p-0 text-xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            ) : (
                                <CardTitle className="text-xl cursor-pointer truncate" onClick={() => setIsEditingName(true)}>
                                    {team.name}
                                </CardTitle>
                            )}
                            <AddMemberToTeamButton usersToAdd={unassignedUsers} onAdd={(user) => onUpdate(team.id, { members: [...team.members, user.userId]})} teamName={team.name} />
                        </div>
                    </div>
                     <StrictModeDroppable droppableId={`delete-user-dropzone-${team.id}`} type="user-card">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                    "rounded-full transition-all p-0.5",
                                    snapshot.isDraggingOver && "ring-1 ring-destructive"
                                )}
                            >
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(team)}>
                                        <GoogleSymbol name="delete" className="text-lg"/>
                                        <span className="sr-only">Delete Team or Drop User to Remove</span>
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{snapshot.isDraggingOver ? `Drop to remove user` : 'Delete Team'}</p></TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Members (click to toggle admin status)</p>
                 <StrictModeDroppable droppableId={`team-members-${team.id}`} type="user-card">
                    {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            "space-y-2 rounded-md p-1 min-h-[50px]",
                            snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                        )}
                    >
                        {teamMembers.map((user, index) => (
                        <MemberCard
                            key={user.userId}
                            user={user}
                            index={index}
                            onRemove={(userId) => handleMemberToggle(userId)}
                            onSetAdmin={(userId) => handleAdminToggle(userId)}
                            isTeamAdmin={(team.teamAdmins || []).includes(user.userId)}
                        />
                        ))}
                        {provided.placeholder}
                        {teamMembers.length === 0 && <p className="text-sm text-muted-foreground italic text-center p-4">No members assigned.</p>}
                    </div>
                    )}
                </StrictModeDroppable>
            </CardContent>
        </Card>
    );
}

export function TeamManagement({ tab }: { tab: AppTab }) {
  const { users, teams, addTeam, updateTeam, deleteTeam, updateAppTab, appSettings } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const title = appSettings.teamManagementLabel || tab.name;

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

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

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
  };

  const handleUpdate = async (teamId: string, data: Partial<Team>) => {
    await updateTeam(teamId, data);
  };

  const handleDelete = () => {
    if (!teamToDelete) return;
    deleteTeam(teamToDelete.id);
    toast({ title: 'Success', description: `Team "${teamToDelete.name}" has been deleted.` });
    setTeamToDelete(null);
  };
  
  const handleDuplicateTeam = (sourceTeam: Team) => {
      const newName = `${sourceTeam.name} (Copy)`;
      if (teams.some(t => t.name === newName)) {
          toast({ variant: 'destructive', title: 'Error', description: `A team named "${newName}" already exists.` });
          return;
      }
      const newTeamData: Omit<Team, 'id'> = {
          ...JSON.parse(JSON.stringify(sourceTeam)),
          name: newName,
      };
      addTeam(newTeamData);
      toast({ title: 'Success', description: `Team "${newName}" created.` });
  };
  
  const onDragEnd = (result: DropResult) => {
      const { source, destination, draggableId, type } = result;
      if (!destination) return;
  
      if (type === 'team-card' && destination.droppableId === 'duplicate-team-zone') {
          const teamToDuplicate = teams.find(t => t.id === draggableId);
          if (teamToDuplicate) {
            handleDuplicateTeam(teamToDuplicate);
          }
          return;
      }
      
      if (type === 'team-card') {
          if (source.droppableId !== destination.droppableId) return;
          const reorderedTeams = Array.from(teams);
          const [movedItem] = reorderedTeams.splice(source.index, 1);
          reorderedTeams.splice(destination.index, 0, movedItem);
          // In a real app, we would persist this new order. For now, it's just a visual reorder in local state.
          // Note: reorderTeams is not a function in context, so this is just a placeholder for a state update.
          toast({ title: "Reordering teams is not implemented yet." });
          return;
      }
      
      if (type === 'user-card') {
        const userId = draggableId.replace('user-', '');
        const user = users.find(u => u.userId === userId);
        if (!user) return;
        
        const sourceTeamId = source.droppableId.replace('team-members-', '');
        const destDroppableId = destination.droppableId;
        
        // Handle drop on another team card
        if (destDroppableId.startsWith('team-members-')) {
            const destTeamId = destDroppableId.replace('team-members-', '');
            if (sourceTeamId === destTeamId) return; // Dropped on the same team

            const destTeam = teams.find(t => t.id === destTeamId);
            if (!destTeam) return;

            if (destTeam.members.includes(userId)) {
                toast({ title: 'Already a member', description: `${user.displayName} is already in the ${destTeam.name} team.` });
                return;
            }

            const newMembers = [...destTeam.members, userId];
            updateTeam(destTeamId, { members: newMembers });
            toast({ title: 'User Added', description: `${user.displayName} has been added to the ${destTeam.name} team.` });
        }
        
        // Handle drop on delete icon
        if (destDroppableId.startsWith('delete-user-dropzone-')) {
            const destTeamId = destDroppableId.replace('delete-user-dropzone-', '');
            if (sourceTeamId !== destTeamId) {
                return;
            }
            
            const team = teams.find(t => t.id === destTeamId);
            if (!team) return;

            const newMembers = team.members.filter(id => id !== userId);
            const newAdmins = (team.teamAdmins || []).filter(id => id !== userId);
            updateTeam(destTeamId, { members: newMembers, teamAdmins: newAdmins });
            toast({ title: 'User Removed', description: `${user.displayName} has been removed from the ${team.name} team.` });
        }
      }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex items-center gap-2 mb-6">
            {isEditingTitle ? (
              <Input ref={titleInputRef} defaultValue={title} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <h2 className="text-2xl font-semibold tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{title}</h2>
                        </TooltipTrigger>
                        {tab.description && (
                            <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            )}
            <StrictModeDroppable droppableId="duplicate-team-zone" type="team-card">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            "rounded-full transition-all p-0.5",
                            snapshot.isDraggingOver && "ring-1 ring-border"
                        )}
                    >
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                                        <GoogleSymbol name="add_circle" className="text-xl" />
                                        <span className="sr-only">New Team or Drop to Duplicate</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Team'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </StrictModeDroppable>
        </div>
        <StrictModeDroppable droppableId="teams-list" type="team-card">
            {(provided) => (
                 <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {teams.map((team, index) => (
                         <Draggable key={team.id} draggableId={team.id} index={index}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    <TeamCard 
                                        team={team} 
                                        allUsers={users} 
                                        onUpdate={handleUpdate} 
                                        onDelete={openDeleteDialog}
                                    />
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </StrictModeDroppable>

      {isAddDialogOpen && (
          <AddTeamDialog 
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            allUsers={users}
            addTeam={addTeam}
          />
      )}

      <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                    <GoogleSymbol name="delete" className="text-xl" />
                    <span className="sr-only">Delete Team</span>
                </Button>
            </div>
            <DialogHeader>
                <UIDialogTitle>Delete "{teamToDelete?.name}"?</UIDialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the team, its badge collections, and all associated settings.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}

type AddTeamDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    allUsers: User[];
    addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
};

function AddTeamDialog({ isOpen, onClose, allUsers, addTeam }: AddTeamDialogProps) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState<string>('group');
    const [color, setColor] = useState<string>('#64748B');
    const [members, setMembers] = useState<string[]>([]);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [iconSearch, setIconSearch] = useState('');
    const [isSearchingIcons, setIsSearchingIcons] = useState(false);
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isIconPopoverOpen) {
            setIsSearchingIcons(false);
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    useEffect(() => {
        if (isSearchingIcons) iconSearchInputRef.current?.focus();
    }, [isSearchingIcons]);

    const handleMemberToggleInPopover = (userId: string, isChecked: boolean) => {
        setMembers(prev => isChecked ? [...prev, userId] : prev.filter(id => id !== userId));
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Team name cannot be empty." });
            return;
        }

        const teamData = {
            name,
            icon,
            color,
            members,
            teamAdmins: [],
            locationCheckManagers: [],
            allBadges: [],
            badgeCollections: [],
            pinnedLocations: [],
            checkLocations: [],
            locationAliases: {},
            workstations: [],
            eventTemplates: [],
        };
        addTeam(teamData);
        toast({ title: "Success", description: `Team "${name}" created.` });
        onClose();
    };

    const filteredUsers = useMemo(() => {
        if (!memberSearch) return allUsers;
        return allUsers.filter(user =>
            user.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(memberSearch.toLowerCase())
        );
    }, [allUsers, memberSearch]);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                 <div className="absolute top-4 right-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={handleSave}
                    >
                        <GoogleSymbol name="check" className="text-xl" />
                        <span className="sr-only">Save Changes</span>
                    </Button>
                </div>
                <DialogHeader>
                    <UIDialogTitle>New Team</UIDialogTitle>
                    <DialogDescription>Create a new team and assign its initial members.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-2xl"
                                    style={{ color }}
                                >
                                    <GoogleSymbol name={icon} />
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
                                    <ScrollArea className="h-64">
                                    <div className="grid grid-cols-6 gap-1 p-2">
                                        {filteredIcons.slice(0, 300).map((iconName) => (
                                        <Button
                                            key={iconName}
                                            variant={icon === iconName ? "default" : "ghost"}
                                            size="icon"
                                            onClick={() => {
                                            setIcon(iconName);
                                            setIsIconPopoverOpen(false);
                                            }}
                                            className="text-2xl"
                                        >
                                            <GoogleSymbol name={iconName} />
                                        </Button>
                                        ))}
                                    </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: color }} />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {setColor(c); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        <Input
                            id="team-name"
                            placeholder="Team Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg font-semibold flex-1"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Popover open={isMemberPopoverOpen} onOpenChange={setIsMemberPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    <GoogleSymbol name="group_add" className="mr-2" />
                                    {members.length > 0 ? `${members.length} members selected` : 'Select Members'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <div className="p-2">
                                    <Input
                                    placeholder="Search users..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-48">
                                    <div className="p-1">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user.userId}
                                            onClick={() => handleMemberToggleInPopover(user.userId, !members.includes(user.userId))}
                                            className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent"
                                        >
                                            <div className={cn("w-4 h-4 rounded-sm border border-primary flex items-center justify-center", members.includes(user.userId) && "bg-primary text-primary-foreground")}>
                                                {members.includes(user.userId) && <GoogleSymbol name="check" className="text-xs" />}
                                            </div>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{user.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
