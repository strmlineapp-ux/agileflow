
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDroppable, useSortable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { CardTemplate } from '@/components/common/card-template';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CompactSearchInput } from '@/components/common/compact-search-input';

function DraggableUserCard({ user, onRemove, isTeamAdmin, onSetAdmin, canManage, memberCount, teamId }: { 
    user: User;
    onRemove: () => void;
    isTeamAdmin: boolean;
    onSetAdmin: () => void;
    canManage: boolean;
    memberCount: number;
    teamId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `user-sort:${teamId}:${user.userId}`,
    data: { type: 'user', user, teamId },
    disabled: !canManage,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div 
            className="group relative flex items-center gap-2 p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
            onClick={(e) => { 
                if (canManage) {
                    e.stopPropagation();
                    onSetAdmin(); 
                }
            }}
            onKeyDown={(e) => { if(canManage && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSetAdmin();}}}
            tabIndex={canManage ? 0 : -1}
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
                                    <GoogleSymbol name="key" style={{fontSize: '10px'}} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Team Admin</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <div>
                <p className="font-normal text-sm text-muted-foreground">{user.displayName}</p>
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
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag from starting
                            >
                                <GoogleSymbol name="cancel" className="text-lg" />
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

export interface TeamCardProps {
    team: Team; 
    users: User[];
    onUpdate: (id: string, data: Partial<Team>) => void;
    onDelete: (team: Team) => void;
    onRemoveUser: (teamId: string, userId: string) => void;
    onAddUser: (teamId: string, userId: string) => void;
    onSetAdmin: (teamId: string, userId: string) => void;
    isSharedPreview?: boolean;
    isDragging?: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export function TeamCard(props: TeamCardProps) {
    const { 
        team, 
        users,
        onUpdate, 
        onDelete,
        onRemoveUser,
        onAddUser,
        onSetAdmin,
        isSharedPreview = false,
        ...otherProps
    } = props;
    const { viewAsUser } = useUser();
    const { isExpanded, onToggleExpand } = otherProps;
    
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

    const canManageTeam = useMemo(() => {
        if (isSharedPreview) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [team, viewAsUser, isSharedPreview]);

    const teamMembers = useMemo(() => team.members.map(id => users.find(u => u.userId === id)).filter((u): u is User => !!u), [team.members, users]);
    const availableUsersToAdd = useMemo(() => users.filter(u => !team.members.includes(u.userId) && u.displayName.toLowerCase().includes(userSearch.toLowerCase())), [users, team.members, userSearch]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    const shareIconColor = '#64748B';
    
    if (team.owner.id === viewAsUser.userId && team.isShared) {
        shareIcon = 'change_circle';
        shareIconTitle = `Owned & Shared by You`;
    } else if (team.owner.id !== viewAsUser.userId && !isSharedPreview) {
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

    const headerControls = (
        <>
            {canManageTeam && !isSharedPreview && (
                <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <GoogleSymbol name="group_add" />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Add User to Team</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-64 p-0" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="p-2 border-b">
                       <CompactSearchInput searchTerm={userSearch} setSearchTerm={setUserSearch} placeholder="Search users..." inputRef={addUserSearchInputRef} />
                    </div>
                    <ScrollArea className="h-64">
                        <div className="p-2 space-y-1">
                            {availableUsersToAdd.map(user => (
                                <div key={user.userId} onPointerDown={() => {onAddUser(team.id, user.userId); setIsAddUserPopoverOpen(false);}} className="flex items-center gap-2 p-2 rounded-md hover:text-primary cursor-pointer">
                                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                                    <p className="font-normal text-sm text-muted-foreground">{user.displayName}</p>
                                </div>
                            ))}
                            {availableUsersToAdd.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No users found.</p>}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
            )}
        </>
    );

    return (
        <CardTemplate
            entity={team}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canManage={canManageTeam}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            isSharedPreview={isSharedPreview}
            shareIcon={shareIcon || undefined}
            shareIconTitle={shareIconTitle}
            shareIconColor={shareIconColor}
            headerControls={headerControls}
            body={
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
            }
        />
    );
}
