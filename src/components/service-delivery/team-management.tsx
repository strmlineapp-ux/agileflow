
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User, type AppTab } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

function TeamCard({ 
    team, 
    allUsers, 
    onUpdate, 
    onDelete, 
    canShare,
    onShare,
    isSharing,
}: { 
    team: Team, 
    allUsers: User[], 
    onUpdate: (id: string, data: Partial<Team>) => void, 
    onDelete: (team: Team) => void,
    canShare: boolean,
    onShare: (teamId: string) => void,
    isSharing: boolean,
}) {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    const teamMembers = team.members.map(id => allUsers.find(u => u.userId === id)).filter(Boolean) as User[];
    
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

    const isSharedWithOtherTeams = team.sharedTeamIds && team.sharedTeamIds.length > 0;

    return (
        <Card className={cn("flex flex-col", isSharing && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            {isSharedWithOtherTeams && (
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center bg-muted text-muted-foreground"
                                    title="This team shares resources with other teams"
                                >
                                    <GoogleSymbol name="change_circle" style={{ fontSize: '14px' }}/>
                                </div>
                            )}
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl">
                                        <GoogleSymbol name={team.icon} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                    <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
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
                        <div className="flex-1 min-w-0">
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
                        </div>
                    </div>
                    <div className="flex items-center">
                        {canShare && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary" onClick={() => onShare(team.id)}>
                                            <GoogleSymbol name="change_circle" className="text-lg"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share Team</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(team)}>
                                        <GoogleSymbol name="delete" className="text-lg"/>
                                        <span className="sr-only">Delete Team</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Team</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <div className="space-y-2">
                    {teamMembers.map(user => (
                        <Card 
                            key={user.userId} 
                            onClick={() => handleAdminToggle(user.userId)}
                            className={cn(
                                "p-2 cursor-pointer hover:bg-accent",
                                (team.teamAdmins || []).includes(user.userId) && "ring-2 ring-primary"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {teamMembers.length === 0 && <p className="text-sm text-muted-foreground italic text-center p-4">No members assigned.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export function TeamManagement({ tab }: { tab: AppTab }) {
  const { users, teams, addTeam, updateTeam, deleteTeam, updateAppTab } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [sharingState, setSharingState] = useState<{ teamId: string } | null>(null);
  const canShareTeams = teams.length > 1;

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

  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setEditingTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdate = async (teamId: string, data: Partial<Team>) => {
    await updateTeam(teamId, data);
  };

  const handleDelete = () => {
    if (!editingTeam) return;
    deleteTeam(editingTeam.id);
    toast({ title: 'Success', description: `Team "${editingTeam.name}" has been deleted.` });
    setIsDeleteDialogOpen(false);
    setEditingTeam(null);
  };
  
  const handleDuplicateTeam = (sourceTeam: Team) => {
      const newName = `${sourceTeam.name} (Copy)`;
      if (teams.some(t => t.name === newName)) {
          toast({ variant: 'destructive', title: 'Error', description: `A team named "${newName}" already exists.` });
          return;
      }
      const newTeamData: Omit<Team, 'id'> = {
          ...JSON.parse(JSON.stringify(sourceTeam)), // Deep copy
          sharedTeamIds: [], // Copies should not be shared
      };
      addTeam(newTeamData);
      toast({ title: 'Success', description: `Team "${newName}" created.` });
  };
  
  const handleShareClick = (teamId: string) => {
    if (!sharingState) {
        setSharingState({ teamId });
        return;
    }
    if (sharingState.teamId === teamId) {
        setSharingState(null); // Clicked the same team again, cancel sharing mode
        return;
    }

    const sourceTeam = teams.find(t => t.id === sharingState.teamId)!;
    const targetTeam = teams.find(t => t.id === teamId)!;

    // Toggle sharing status
    const sourceShared = new Set(sourceTeam.sharedTeamIds || []);
    const targetShared = new Set(targetTeam.sharedTeamIds || []);

    let isNowSharing;

    if (sourceShared.has(targetTeam.id)) {
        // Unshare
        sourceShared.delete(targetTeam.id);
        targetShared.delete(sourceTeam.id);
        isNowSharing = false;
    } else {
        // Share
        sourceShared.add(targetTeam.id);
        targetShared.add(sourceTeam.id);
        isNowSharing = true;
    }
    
    updateTeam(sourceTeam.id, { sharedTeamIds: Array.from(sourceShared) });
    updateTeam(targetTeam.id, { sharedTeamIds: Array.from(targetShared) });
    
    toast({ title: isNowSharing ? 'Teams Shared' : 'Teams Unshared', description: `Sharing status between "${sourceTeam.name}" and "${targetTeam.name}" has been updated.` });
    setSharingState(null);
  };
  
  const onDragEnd = (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
  
      if (destination.droppableId === 'duplicate-team-zone') {
          const teamToDuplicate = teams.find(t => t.id === draggableId);
          if (teamToDuplicate) {
            handleDuplicateTeam(teamToDuplicate);
          }
          return;
      }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                ) : (
                  <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                )}
                <StrictModeDroppable droppableId="duplicate-team-zone">
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
        </div>
        <StrictModeDroppable droppableId="teams-list">
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
                                        canShare={canShareTeams}
                                        onShare={handleShareClick}
                                        isSharing={sharingState?.teamId === team.id}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => !isOpen && setIsDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{editingTeam?.name}" team and all of its associated roles and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    const { toast } = useToast();

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
            sharedCollectionIds: [],
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
                    <DialogTitle>New Team</DialogTitle>
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
                                    <div className="p-2 border-b">
                                        <Input 
                                            placeholder="Search icons..."
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                        />
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
