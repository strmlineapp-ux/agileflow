
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

function TeamCard({ 
    team, 
    onUpdate, 
    onDelete, 
    isDragging
}: { 
    team: Team, 
    onUpdate: (id: string, data: Partial<Team>) => void, 
    onDelete: (team: Team) => void,
    isDragging?: boolean,
}) {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    
     useEffect(() => {
        if (isIconPopoverOpen) {
             setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

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

    return (
        <Card className={cn("flex flex-col h-full bg-transparent group relative", isDragging && "shadow-xl")}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
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
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={team.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(team.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} className="text-4xl" weight={100} /></Button>))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: team.color }} />
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-2">
                                    <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(team.id, { color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={team.color} onChange={(e) => onUpdate(team.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
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
                                    className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                />
                            ) : (
                                <CardTitle className="font-headline text-xl font-thin cursor-pointer truncate" onClick={() => setIsEditingName(true)}>
                                    {team.name}
                                </CardTitle>
                            )}
                        </div>
                    </div>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => onDelete(team)}>
                                    <GoogleSymbol name="delete" className="text-lg" weight={100} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Delete Team</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{team.members.length} member(s)</p>
            </CardContent>
        </Card>
    );
}

export function TeamManagement({ tab }: { tab: AppTab }) {
  const { users, teams, addTeam, updateTeam, deleteTeam, reorderTeams, updateAppTab, appSettings } = useUser();
  const { toast } = useToast();

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
  
  const handleAddTeam = () => {
    const teamCount = teams.length;
    const newTeamData: Omit<Team, 'id'> = {
        name: `New Team ${teamCount + 1}`,
        icon: 'group',
        color: predefinedColors[teamCount % predefinedColors.length],
        members: [],
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
    addTeam(newTeamData);
    toast({ title: 'Success', description: `Team "${newTeamData.name}" created.` });
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
      const { source, destination, draggableId } = result;
      if (!destination) return;
  
      if (destination.droppableId === 'duplicate-team-zone') {
          const teamToDuplicate = teams.find(t => t.id === draggableId);
          if (teamToDuplicate) {
            handleDuplicateTeam(teamToDuplicate);
          }
          return;
      }
      
      if (source.droppableId === 'teams-list' && destination.droppableId === 'teams-list') {
          const reordered = Array.from(teams);
          const [movedItem] = reordered.splice(source.index, 1);
          reordered.splice(destination.index, 0, movedItem);
          reorderTeams(reordered);
      }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex items-center gap-2 mb-6">
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
                        className={cn(
                            "rounded-full transition-all p-0.5",
                            snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                        )}
                    >
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={handleAddTeam}>
                                        <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
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
        <StrictModeDroppable droppableId="teams-list" type="team-card" isDropDisabled={false} isCombineEnabled={false}>
            {(provided) => (
                 <div 
                    className="flex flex-wrap -m-3"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {teams.map((team, index) => (
                         <Draggable key={team.id} draggableId={team.id} index={index} ignoreContainerClipping={false}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                     className="p-3 basis-full md:basis-1/2 lg:basis-1/3"
                                >
                                    <TeamCard 
                                        team={team} 
                                        onUpdate={handleUpdate} 
                                        onDelete={openDeleteDialog}
                                        isDragging={snapshot.isDragging}
                                    />
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </StrictModeDroppable>
      <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 p-0" onClick={handleDelete}>
                    <GoogleSymbol name="delete" className="text-4xl" weight={100} />
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
