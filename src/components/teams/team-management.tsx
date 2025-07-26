
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getOwnershipContext } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { CardDescription } from '../ui/card';
import { googleSymbolNames } from '@/lib/google-symbols';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { useRouter, usePathname } from 'next/navigation';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function DraggableUserCard({ user, onRemove, isTeamAdmin, onSetAdmin, canManage, memberCount, teamId }: { 
    user: User;
    onRemove: () => void;
    isTeamAdmin: boolean;
    onSetAdmin: () => void;
    canManage: boolean;
    memberCount: number;
    teamId: string;
}) {
  const { isDragModifierPressed } = useUser();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `user-sort:${teamId}:${user.userId}`,
    data: { type: 'user', user, teamId },
    disabled: !isDragModifierPressed,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div 
            className={cn(
                "group relative flex items-center gap-2 p-1 rounded-md transition-colors",
                canManage && !isDragModifierPressed && "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
            )}
            onClick={(e) => { 
                if (canManage && !isDragModifierPressed) {
                    e.stopPropagation();
                    onSetAdmin(); 
                }
            }}
            onKeyDown={(e) => { if(canManage && !isDragModifierPressed && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSetAdmin();}}}
            tabIndex={canManage && !isDragModifierPressed ? 0 : -1}
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
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center bg-primary text-primary-foreground">
                                    <GoogleSymbol name="key" style={{fontSize: '10px'}} opticalSize={20} />
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
                                className={cn("absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity", isDragModifierPressed && "hidden")}
                                onClick={(e) => { e.stopPropagation(); onRemove();}}
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag from starting
                            >
                                <GoogleSymbol name="cancel" className="text-lg" weight={100} opticalSize={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Remove User</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    </div>
  );
}


function TeamCard({ 
    team, 
    users,
    onUpdate, 
    onDelete,
    onRemoveUser,
    onAddUser,
    onSetAdmin,
    isSharedPreview = false,
    ...props
}: { 
    team: Team; 
    users: User[];
    onUpdate: (id: string, data: Partial<Team>) => void;
    onDelete: (team: Team) => void;
    onRemoveUser: (teamId: string, userId: string) => void;
    onAddUser: (teamId: string, userId: string) => void;
    onSetAdmin: (teamId: string, userId: string) => void;
    isSharedPreview?: boolean;
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
    isDragging?: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    [key: string]: any;
}) {
    const { viewAsUser, isDragModifierPressed } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const { isEditingName, setIsEditingName, isDragging, isExpanded, onToggleExpand } = props;
    
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [color, setColor] = useState(team.color);
    const [isAddUserPopoverOpen, setIsAddUserPopoverOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const addUserSearchInputRef = useRef<HTMLInputElement>(null);
    
    const { setNodeRef: setUsersDroppableRef, isOver: isUsersDroppableOver } = useDroppable({
        id: `team-users:${team.id}`,
        data: { type: 'user-list', teamId: team.id },
    });

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
    const availableUsersToAdd = useMemo(() => users.filter(u => !team.members.includes(u.userId) && u.displayName.toLowerCase().includes(userSearch.toLowerCase())), [users, team.members, userSearch]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    
    if (team.owner.id === viewAsUser.userId && team.isShared) {
        shareIcon = 'change_circle';
        shareIconTitle = `Owned & Shared by You`;
    } else if (team.owner.id !== viewAsUser.userId && !isSharedPreview) { // Is a linked team on main board
        shareIcon = 'link';
        shareIconTitle = `Owned by ${ownerName}`;
    }

    useEffect(() => {
        if (isAddUserPopoverOpen) {
            setTimeout(() => addUserSearchInputRef.current?.focus(), 100);
        } else {
            setUserSearch('');
        }
    }, [isAddUserPopoverOpen]);
    
     const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== team.name) {
            onUpdate(team.id, { name: newName });
        }
        setIsEditingName(false);
    }, [team.id, team.name, onUpdate, setIsEditingName]);

    useEffect(() => {
        if (!isEditingName) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                handleSaveName();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);

    useEffect(() => {
        if (isIconPopoverOpen) {
            setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };

    return (
        <Card className="flex flex-col h-full bg-transparent relative" {...props}>
            <CardHeader className="group p-2" {...props.dragHandleProps}>
                 {!isSharedPreview && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10", isDragModifierPressed && "hidden")}
                                    onPointerDown={(e) => { e.stopPropagation(); onDelete(team); }}
                                >
                                    <GoogleSymbol name="cancel" className="text-lg" weight={100} opticalSize={20} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{canManageTeam ? "Delete Team" : "Unlink Team"}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} disabled={!canManageTeam || isDragModifierPressed}>
                                                <Button variant="ghost" className="h-10 w-12 flex items-center justify-center p-0">
                                                    <GoogleSymbol name={team.icon} opticalSize={20} grade={-25} style={{ fontSize: '36px' }} weight={100} />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Icon</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 p-2 border-b">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} opticalSize={20} />
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
                                            <Button variant={team.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(team.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} className="text-4xl" weight={100} opticalSize={20} /></Button>
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
                                            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} disabled={!canManageTeam || isDragModifierPressed}>
                                                <button className={cn("absolute -bottom-0 -right-3 h-4 w-4 rounded-full border-0", canManageTeam && !isDragModifierPressed && "cursor-pointer", isDragModifierPressed && "hidden")} style={{ backgroundColor: team.color }} />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
                                    <div className="space-y-4">
                                        <HexColorPicker color={color} onChange={setColor} className="!w-full" />
                                        <div className="flex items-center gap-2">
                                            <span className="p-2 border rounded-md" style={{ backgroundColor: color }} />
                                            <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
                                        </div>
                                        <div className="grid grid-cols-8 gap-1">
                                            {predefinedColors.map(c => (
                                                <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(team.id, { color: c }); setIsColorPopoverOpen(false);}}></button>
                                            ))}
                                        </div>
                                        <Button onClick={() => { onUpdate(team.id, { color }); setIsColorPopoverOpen(false); }} className="w-full bg-primary">Set Color</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {shareIcon && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div 
                                                className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                                style={{ backgroundColor: ownerColor }}
                                            >
                                                <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}} opticalSize={20} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div onPointerDown={(e) => { if (!isDragModifierPressed) { e.stopPropagation() }; }} className="flex-1 min-w-0">
                            {isEditingName && canManageTeam ? (
                                <Input
                                    ref={nameInputRef}
                                    defaultValue={team.name}
                                    onBlur={handleSaveName}
                                    onKeyDown={handleNameKeyDown}
                                    className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                />
                            ) : (
                                <CardTitle className={cn("font-headline text-xl font-thin truncate", canManageTeam && !isDragModifierPressed && "cursor-pointer")} onClick={() => { if (canManageTeam && !isDragModifierPressed) setIsEditingName(true); }}>
                                    {team.name}
                                </CardTitle>
                            )}
                        </div>
                    </div>
                    <div className={cn("flex items-center", isDragModifierPressed && "hidden")} onPointerDown={(e) => e.stopPropagation()}>
                        {canManageTeam && !isSharedPreview && (
                            <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!canManageTeam || isDragModifierPressed} onPointerDown={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-muted-foreground hover:text-primary", isDragModifierPressed && "hidden")}><GoogleSymbol name="group_add" weight={100} opticalSize={20} /></Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Add User</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-64 p-0" onPointerDown={(e) => e.stopPropagation()}>
                                    <div className="p-2 border-b">
                                        <div className="flex items-center gap-1 w-full">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} opticalSize={20} />
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
                                                <div key={user.userId} onPointerDown={() => {onAddUser(team.id, user.userId); setIsAddUserPopoverOpen(false);}} className="flex items-center gap-2 p-2 rounded-md hover:text-primary cursor-pointer">
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
                    </div>
                </div>
            </CardHeader>
            {!isDragging && isExpanded && (
                <CardContent className="flex-grow p-2 pt-0 flex flex-col min-h-0">
                    <ScrollArea className="max-h-48 pr-2 flex-grow">
                        <SortableContext items={teamMembers.map(m => `user-sort:${team.id}:${m.userId}`)} strategy={verticalListSortingStrategy}>
                            <div ref={setUsersDroppableRef} className={cn("min-h-[60px] rounded-md p-2 -m-2 space-y-1 transition-colors", isUsersDroppableOver && "ring-1 ring-border ring-inset")}>
                                {teamMembers.map((user) => (
                                <DraggableUserCard 
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
                            </div>
                        </SortableContext>
                    </ScrollArea>
                </CardContent>
            )}
             <div className={cn("absolute -bottom-1 right-0", isDragModifierPressed && "hidden")}>
                <Button variant="ghost" size="icon" onClick={onToggleExpand} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                    <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} opticalSize={20} />
                </Button>
            </div>
        </Card>
    );
}

function SortableTeamCard({team, ...props}: {team: Team, [key: string]: any}) {
    const { isDragModifierPressed } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: team.id,
        data: { type: 'team-card', team, isSharedPreview: props.isSharedPreview },
        disabled: isEditingName || !isDragModifierPressed,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} className={cn(
            "p-2 flex-grow-0 flex-shrink-0 transition-all duration-300",
            props.isSharedPreview 
              ? "w-full"
              : "basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)]",
            isDragging && "opacity-80 z-50"
        )}>
            <TeamCard 
                team={team} 
                {...props} 
                isEditingName={isEditingName} 
                setIsEditingName={setIsEditingName} 
                dragHandleProps={{...attributes, ...listeners}} 
                isDragging={isDragging} 
            />
        </div>
    )
}

function TeamManagementDropZone({id, type, children, className}: {id: string, type: string, children: React.ReactNode, className?: string}) {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type } });
    
    return (
        <div ref={setNodeRef} className={cn(className, isOver && "ring-1 ring-border ring-inset", "transition-all rounded-lg")}>
            {children}
        </div>
    )
}

function DuplicateZone({ id, onAdd }: { id: string; onAdd: () => void; }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all p-0.5",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={onAdd} onPointerDown={(e) => e.stopPropagation()}>
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} opticalSize={20} />
                    <span className="sr-only">New Team or Drop to Duplicate</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{isOver ? 'Drop to Duplicate' : 'Add New Team'}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function TeamManagement({ tab, page, isSingleTabPage = false }: { tab: AppTab; page: AppPage; isSingleTabPage?: boolean }) {
    const { viewAsUser, users, teams, appSettings, addTeam, updateTeam, deleteTeam, reorderTeams, updateAppTab, updateUser, isDragModifierPressed } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDragItem, setActiveDragItem] = useState<{type: string, data: any} | null>(null);
    
    const pageTitle = page.isDynamic && teams.find(t => t.id === page.path.split('/')[2]) ? `${teams.find(t => t.id === page.path.split('/')[2])?.name} ${page.name}` : page.name;
    const tabTitle = appSettings.teamManagementLabel || tab.name;
    const finalTitle = isSingleTabPage ? pageTitle : tabTitle;
    
    const onToggleExpand = useCallback((teamId: string) => {
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

    const canManageTeam = useCallback((team: Team) => {
        if (!viewAsUser) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [viewAsUser]);

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

    const handleAddTeam = (sourceTeam?: Team) => {
        const owner = getOwnershipContext(page, viewAsUser);
        let newTeamData: Omit<Team, 'id'>;

        if (sourceTeam) {
            newTeamData = {
                ...JSON.parse(JSON.stringify(sourceTeam)),
                name: `${sourceTeam.name} (Copy)`,
                owner,
                isShared: false,
                members: sourceTeam.members,
                teamAdmins: sourceTeam.teamAdmins,
            };
        } else {
             newTeamData = {
                name: `New Team ${teams.length + 1}`,
                icon: 'group',
                color: predefinedColors[teams.length % predefinedColors.length],
                owner: owner,
                isShared: false,
                members: [],
                teamAdmins: [],
                locationCheckManagers: [],
                activeBadgeCollections: [],
            };
        }
        
        addTeam(newTeamData);
    };

    const handleUpdate = (teamId: string, data: Partial<Team>) => updateTeam(teamId, data);
    
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
        
        const currentAdmins = new Set(team.teamAdmins || []);
        if (currentAdmins.has(userId)) {
            currentAdmins.delete(userId);
        } else {
            currentAdmins.add(userId);
        }
        updateTeam(teamId, { teamAdmins: Array.from(currentAdmins) });
    }, [teams, updateTeam, canManageTeam, toast]);

    const handleRemoveUserFromTeam = useCallback((userId: string) => {
        const team = teams.find(t => t.id === page.path.split('/')[2]);
        if (!team) return;

        if (!canManageTeam(team)) {
             toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot remove users from this team.' });
            return;
        }
        
        const updatedMembers = team.members.filter(id => id !== userId);
        const newTeamAdmins = (team.teamAdmins || []).filter(id => id !== userId);
        updateTeam(team.id, { members: updatedMembers, teamAdmins: newTeamAdmins });
        toast({ title: 'User Removed' });

        if (viewAsUser.userId === userId) {
            // Check if user will lose access to the current page. The page path for dynamic team pages is like /dashboard/teams/[teamId]
            const currentPageId = page.path.split('/')[2];
            if (team.id === currentPageId) {
                router.push('/dashboard/notifications');
            }
        }
    }, [teams, updateTeam, toast, canManageTeam, viewAsUser.userId, page.path, router]);

    const confirmDelete = () => {
        if (!teamToDelete) return;
        deleteTeam(teamToDelete.id, router, pathname);
        setTeamToDelete(null);
    };
    
    const displayedTeams = useMemo(() => {
        if (viewAsUser.isAdmin) {
            return teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return teams
            .filter(t => 
                canManageTeam(t) || 
                (viewAsUser.linkedTeamIds || []).includes(t.id) ||
                (viewAsUser.memberOfTeamIds || []).includes(t.id)
            )
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [teams, viewAsUser, searchTerm, canManageTeam]);

    const sharedTeams = useMemo(() => {
        const displayedIds = new Set(displayedTeams.map(c => c.id));
        return teams
            .filter(team => team.isShared && team.owner.id !== viewAsUser.userId && !displayedIds.has(team.id))
            .filter(t => t.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [teams, displayedTeams, viewAsUser.userId, sharedSearchTerm]);

    const onDragEnd = (result: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = result;
        if (!over) return;
        
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
        
        // Handle dragging a user card
        if (activeType === 'user') {
            const user = active.data.current?.user as User;
            const destTeamId = over.data.current?.teamId;
            if (destTeamId && user) {
                handleAddUserToTeam(destTeamId, user.userId);
            }
            return;
        }

        if (activeType === 'team-card') {
             if (over.id === 'shared-teams-panel') {
                const teamToDrop = teams.find(t => t.id === active.id) as Team;
                if (!teamToDrop) return;

                const isOwner = teamToDrop.owner.id === viewAsUser.userId;
                if (isOwner) {
                    // Unshare an owned team
                    updateTeam(teamToDrop.id, { isShared: !teamToDrop.isShared });
                    toast({ title: teamToDrop.isShared ? 'Team Unshared' : 'Team Shared' });
                } else { // Unlink a linked team
                    const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== teamToDrop.id);
                    updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
                    toast({ title: "Team Unlinked", description: `"${teamToDrop.name}" has been unlinked.`});
                }
                return;
            }

            if(active.data.current?.isSharedPreview && over.id === 'teams-list') {
                 updateUser(viewAsUser.userId, { 
                    linkedTeamIds: Array.from(new Set([...(viewAsUser.linkedTeamIds || []), active.id as string]))
                });
                toast({ title: 'Team Linked' });
                return;
            }
            
            if (over.id === 'duplicate-team-zone') {
                 const teamToDuplicate = displayedTeams.find(t => t.id === active.id) || sharedTeams.find(t => t.id === active.id);
                 if(teamToDuplicate) {
                    handleAddTeam(teamToDuplicate);
                    const wasLinked = (viewAsUser.linkedTeamIds || []).includes(teamToDuplicate.id);
                    if (wasLinked) {
                        const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== teamToDuplicate.id);
                        updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
                        toast({ title: 'Team Copied', description: 'A new, independent team has been created.' });
                    }
                }
                return;
            }

            if (active.id !== over.id) {
                const oldIndex = displayedTeams.findIndex(t => t.id === active.id);
                const newIndex = displayedTeams.findIndex(t => t.id === over.id);
                if (oldIndex > -1 && newIndex > -1) {
                  reorderTeams(arrayMove(displayedTeams, oldIndex, newIndex));
                }
            }
        }
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            onActivation: ({ event }) => {
                if (!isDragModifierPressed) {
                    return false;
                }
                return true;
            },
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
          onActivation: ({ event }) => {
            if (!isDragModifierPressed) {
                return false;
            }
            return true;
          }
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        const { type, ...data } = event.active.data.current || {};
        setActiveDragItem({ type, data });
    }
    
    const teamIds = useMemo(() => displayedTeams.map(t => t.id), [displayedTeams]);
    const sharedTeamIds = useMemo(() => sharedTeams.map(t => t.id), [sharedTeams]);

    return (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex gap-4 h-full">
                 <div className="flex-1 overflow-hidden">
                    <div className="flex flex-col gap-6 h-full">
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
                                <DuplicateZone id="duplicate-team-zone" onAdd={() => handleAddTeam()} />
                            </div>
                            <div className="flex items-center gap-1">
                                <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search teams..." />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                                <GoogleSymbol name="dynamic_feed" weight={100} opticalSize={20} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Show Shared Teams</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="h-full overflow-y-auto">
                            <TeamManagementDropZone id="teams-list" type="team-card" className="flex flex-wrap -m-2">
                                <SortableContext items={teamIds} strategy={rectSortingStrategy}>
                                    {displayedTeams.map((team) => (
                                        <SortableTeamCard
                                            key={team.id}
                                            team={team} 
                                            users={users}
                                            onUpdate={handleUpdate} 
                                            onDelete={handleDelete}
                                            onRemoveUser={handleRemoveUserFromTeam}
                                            onAddUser={handleAddUserToTeam}
                                            onSetAdmin={handleSetAdmin}
                                            isExpanded={expandedTeams.has(team.id)}
                                            onToggleExpand={() => onToggleExpand(team.id)}
                                        />
                                    ))}
                                </SortableContext>
                            </TeamManagementDropZone>
                        </div>
                    </div>
                 </div>
                 <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96 p-2" : "w-0 p-0")}>
                    <TeamManagementDropZone id="shared-teams-panel" type="team-card" className="h-full">
                        <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-headline font-thin text-xl">Shared Teams</CardTitle>
                                    <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." tooltipText="Search Shared Teams" />
                                </div>
                                <CardDescription>Drag a team you own here to share it. Drag a team to your board to link it.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-2 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <SortableContext items={sharedTeamIds} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {sharedTeams.map((team) => (
                                                <SortableTeamCard
                                                    key={team.id}
                                                    team={team}
                                                    users={users}
                                                    onUpdate={handleUpdate}
                                                    onDelete={handleDelete}
                                                    onRemoveUser={handleRemoveUserFromTeam}
                                                    onAddUser={handleAddUserToTeam}
                                                    onSetAdmin={handleSetAdmin}
                                                    isSharedPreview={true}
                                                    isExpanded={expandedTeams.has(team.id)}
                                                    onToggleExpand={() => onToggleExpand(team.id)}
                                                />
                                            ))}
                                            {sharedTeams.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No other teams are currently shared.</p>}
                                        </div>
                                    </SortableContext>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TeamManagementDropZone>
                </div>
            </div>
            <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeDragItem?.type === 'team-card' && activeDragItem?.data?.team ? (
                    <GoogleSymbol
                        name={activeDragItem.data.team.icon}
                        style={{ color: activeDragItem.data.team.color, fontSize: '48px' }}
                        weight={100}
                        grade={-25}
                        opticalSize={48}
                    />
                ) : activeDragItem?.type === 'user' && activeDragItem?.data?.user ? (
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={activeDragItem.data.user.avatarUrl} alt={activeDragItem.data.user.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{activeDragItem.data.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ) : null}
            </DragOverlay>
            <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="text-destructive p-0" onClick={confirmDelete}>
                                        <GoogleSymbol name="delete" className="text-4xl" weight={100} opticalSize={20} />
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
