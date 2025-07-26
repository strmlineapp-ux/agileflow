
'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User, type Badge } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent, useDraggable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CompactSearchInput } from '../common/compact-search-input';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Badge as UiBadge } from '../ui/badge';
import { useDroppable } from '@dnd-kit/core';

function DraggableBadgeFromPool({ badge, canManage }: { badge: Badge, canManage: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `pool-badge-${badge.id}`,
        data: {
            type: 'pool-badge',
            badge: badge,
        },
        disabled: !canManage,
    });

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "opacity-50")}>
                        <UiBadge
                            variant={'outline'}
                            style={{ color: badge.color, borderColor: badge.color }}
                            className={cn(
                                'flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8 font-thin',
                                canManage && 'cursor-grab'
                            )}
                        >
                            <GoogleSymbol name={badge.icon} style={{ fontSize: '20px' }} weight={100} />
                            <span>{badge.name}</span>
                        </UiBadge>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{badge.description || badge.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function SortableTeamMember({ member, team, isViewer }: { member: User, team: Team, isViewer: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.userId, disabled: isViewer });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "shadow-xl", "rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50")}>
      <TeamMemberCard member={member} team={team} isViewer={isViewer} />
    </div>
  );
}


export function TeamMembersView({ team, tab }: { team: Team; tab: AppTab }) {
    const { viewAsUser, users, updateAppTab, updateTeam, isDragModifierPressed, allBadges, updateUser, allBadgeCollections } = useUser();
    const [activeDragItem, setActiveDragItem] = useState<{type: string, id: string, data: any} | null>(null);
    
    if (!team) {
      return null;
    }

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isEditingAdminsLabel, setIsEditingAdminsLabel] = useState(false);
    const [isEditingMembersLabel, setIsEditingMembersLabel] = useState(false);
    const adminsLabelInputRef = useRef<HTMLInputElement>(null);
    const membersLabelInputRef = useRef<HTMLInputElement>(null);

    const [isBadgePoolOpen, setIsBadgePoolOpen] = useState(false);
    const [badgePoolSearch, setBadgePoolSearch] = useState('');

    const teamAdminsLabel = team.teamAdminsLabel || 'Team Admins';
    const membersLabel = team.membersLabel || 'Members';
    
    const isViewer = useMemo(() => {
        if (viewAsUser.isAdmin) return false;
        if (!team.teamAdmins?.length) return !team.members.includes(viewAsUser.userId);
        return !team.teamAdmins.includes(viewAsUser.userId);
    }, [viewAsUser, team]);

    const teamMembers = useMemo(() => {
        return team.members
            .map(id => users.find(u => u.userId === id))
            .filter((u): u is User => !!u);
    }, [users, team.members]);

    const admins = useMemo(() => teamMembers.filter(m => team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);
    const members = useMemo(() => teamMembers.filter(m => !team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);

    const adminIds = useMemo(() => admins.map(a => a.userId), [admins]);
    const memberIds = useMemo(() => members.map(m => m.userId), [members]);
    
    const userAssignableBadges = useMemo(() => {
        const activeAndApplicableCollections = allBadgeCollections.filter(
          (c) =>
            (team.activeBadgeCollections || []).includes(c.id) &&
            c.applications?.includes('team members')
        );
        const badgeIds = new Set(activeAndApplicableCollections.flatMap(c => c.badgeIds));
        return allBadges.filter(badge => badgeIds.has(badge.id) && badge.name.toLowerCase().includes(badgePoolSearch.toLowerCase()));
    }, [team.activeBadgeCollections, allBadgeCollections, allBadges, badgePoolSearch]);
    
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

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    const handleSaveTitle = useCallback(() => {
        const newName = titleInputRef.current?.value.trim();
        if (newName && newName !== tab.name) {
            updateAppTab(tab.id, { name: newName });
        }
        setIsEditingTitle(false);
    }, [tab.id, tab.name, updateAppTab]);

    useEffect(() => {
        if (!isEditingTitle) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (titleInputRef.current && !titleInputRef.current.contains(event.target as Node)) {
                handleSaveTitle();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingTitle, handleSaveTitle]);

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        else if (e.key === 'Escape') setIsEditingTitle(false);
    };
    
    const handleSaveAdminsLabel = useCallback(() => {
        const newLabel = adminsLabelInputRef.current?.value.trim();
        if (newLabel && newLabel !== teamAdminsLabel) {
            updateTeam(team.id, { teamAdminsLabel: newLabel });
        }
        setIsEditingAdminsLabel(false);
    }, [team.id, teamAdminsLabel, updateTeam]);

    useEffect(() => {
        if (!isEditingAdminsLabel) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (adminsLabelInputRef.current && !adminsLabelInputRef.current.contains(event.target as Node)) {
                handleSaveAdminsLabel();
            }
        };
        adminsLabelInputRef.current?.focus();
        adminsLabelInputRef.current?.select();
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingAdminsLabel, handleSaveAdminsLabel]);


    const handleAdminsLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveAdminsLabel();
        else if (e.key === 'Escape') setIsEditingAdminsLabel(false);
    };
    
    const handleSaveMembersLabel = useCallback(() => {
        const newLabel = membersLabelInputRef.current?.value.trim();
        if (newLabel && newLabel !== membersLabel) {
            updateTeam(team.id, { membersLabel: newLabel });
        }
        setIsEditingMembersLabel(false);
    }, [team.id, membersLabel, updateTeam]);

    useEffect(() => {
        if (!isEditingMembersLabel) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (membersLabelInputRef.current && !membersLabelInputRef.current.contains(event.target as Node)) {
                handleSaveMembersLabel();
            }
        };
        membersLabelInputRef.current?.focus();
        membersLabelInputRef.current?.select();
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingMembersLabel, handleSaveMembersLabel]);

    const handleMembersLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveMembersLabel();
        else if (e.key === 'Escape') setIsEditingMembersLabel(false);
    };
    
    const handleBadgeAssignment = (badge: Badge, memberId: string) => {
        const member = users.find(u => u.userId === memberId);
        if (!member || isViewer) return;
        
        const currentRoles = new Set(member.roles || []);
        if (currentRoles.has(badge.name)) return; // Already has it

        const updatedRoles = [...currentRoles, badge.name];
        updateUser(memberId, { roles: updatedRoles });
        toast({ title: "Badge Assigned", description: `"${badge.name}" assigned to ${member.displayName}.` });
    };

    const handleBadgeUnassignment = (badge: Badge, memberId: string) => {
        const member = users.find(u => u.userId === memberId);
        if (!member || isViewer) return;

        const updatedRoles = (member.roles || []).filter(r => r !== badge.name);
        updateUser(memberId, { roles: updatedRoles });
        toast({ title: "Badge Unassigned", description: `"${badge.name}" unassigned from ${member.displayName}.` });
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);
    
        if (!over) return;
    
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
    
        // Case 1: Dragging a badge from the pool to a member card
        if (activeType === 'pool-badge' && overType === 'member-card') {
            const badge = active.data.current?.badge as Badge;
            const member = over.data.current?.member as User;
            if (badge && member) {
                handleBadgeAssignment(badge, member.userId);
            }
            return;
        }
        
        // Case 2: Dragging an assigned badge to the pool to unassign
        if (activeType === 'assigned-badge' && over.id === 'badge-pool') {
            const badge = active.data.current?.badge as Badge;
            const sourceMember = active.data.current?.member as User;
             if (badge && sourceMember) {
                 handleBadgeUnassignment(badge, sourceMember.userId);
             }
            return;
        }
    
        // Case 3: Reordering member cards (existing logic)
        if (active.data.current?.type === 'member' && over.data.current?.type === 'member') {
            if (active.id === over.id) return;
            const activeList = adminIds.includes(active.id as string) ? 'admins' : 'members';
            const overList = adminIds.includes(over.id as string) ? 'admins' : 'members';
    
            if (activeList !== overList) return;
            
            const list = activeList === 'admins' ? admins : members;
            const oldIndex = list.findIndex(item => item.userId === active.id);
            const newIndex = list.findIndex(item => item.userId === over.id);
            
            const reorderedList = arrayMove(list, oldIndex, newIndex);
            const newAdmins = activeList === 'admins' ? reorderedList : admins;
            const newMembers = activeList === 'members' ? reorderedList : members;
            const newMemberIds = [...newAdmins, ...newMembers].map(m => m.userId);
    
            updateTeam(team.id, { members: newMemberIds });
        }
    };

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem({ type: active.data.current?.type, id: active.id as string, data: active.data.current });
    }
    
    const activeMember = activeDragItem?.type === 'member' ? users.find(u => u.userId === activeDragItem.id) : null;
    const activeBadge = activeDragItem?.type?.includes('badge') ? activeDragItem.data.badge : null;
    
    const { setNodeRef: badgePoolRef, isOver: isBadgePoolOver } = useDroppable({
        id: 'badge-pool',
    });

    return (
      <div className="flex h-full gap-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        {isEditingTitle ? (
                        <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                        ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                                </TooltipTrigger>
                                {tab.description && (
                                    <TooltipContent>
                                        <p className="max-w-xs">{tab.description}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                        )}
                    </div>
                    {!isViewer && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsBadgePoolOpen(!isBadgePoolOpen)}>
                                        <GoogleSymbol name="style" weight={100} opticalSize={20} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Show Assignable Badges</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className={cn("flex flex-col gap-6", admins.length > 0 && "lg:flex-row")}>
                        {admins.length > 0 && (
                            <div className="lg:w-1/3 lg:max-w-sm space-y-4">
                                {isEditingAdminsLabel ? (
                                    <Input
                                        ref={adminsLabelInputRef}
                                        defaultValue={teamAdminsLabel}
                                        onBlur={handleSaveAdminsLabel}
                                        onKeyDown={handleAdminsLabelKeyDown}
                                        className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                ) : (
                                    <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => setIsEditingAdminsLabel(true)}>
                                        {teamAdminsLabel}
                                    </h3>
                                )}
                                <SortableContext items={adminIds} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {admins.map((member) => (
                                            <SortableTeamMember key={member.userId} member={member} team={team} isViewer={isViewer} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        )}

                        <div className="flex-1 space-y-4">
                            {isEditingMembersLabel ? (
                                <Input
                                    ref={membersLabelInputRef}
                                    defaultValue={membersLabel}
                                    onBlur={handleSaveMembersLabel}
                                    onKeyDown={handleMembersLabelKeyDown}
                                    className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            ) : (
                                <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => setIsEditingMembersLabel(true)}>
                                    {membersLabel}
                                </h3>
                            )}
                            {members.length > 0 && (
                                <SortableContext items={memberIds} strategy={verticalListSortingStrategy}>
                                    <div className="flex flex-wrap -m-3">
                                    {members.map((member) => (
                                        <div key={member.userId} className="p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0">
                                            <SortableTeamMember member={member} team={team} isViewer={isViewer} />
                                        </div>
                                    ))}
                                    </div>
                                </SortableContext>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeMember ? (
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={activeMember.avatarUrl} alt={activeMember.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{activeMember.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ) : activeBadge ? (
                     <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card" style={{ borderColor: activeBadge.color }}>
                        <GoogleSymbol name={activeBadge.icon} style={{ fontSize: '28px', color: activeBadge.color }} weight={100} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
        <div className={cn("transition-all duration-300", isBadgePoolOpen ? "w-96" : "w-0")}>
            <div className={cn("h-full rounded-lg transition-all", isBadgePoolOpen ? "p-2" : "p-0")}>
                <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isBadgePoolOpen ? "opacity-100" : "opacity-0")}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-headline font-thin text-xl">Assignable Badges</CardTitle>
                             <CompactSearchInput searchTerm={badgePoolSearch} setSearchTerm={setBadgePoolSearch} placeholder="Search badges..." />
                        </div>
                        <CardDescription>Drag a badge onto a team member to assign it.</CardDescription>
                    </CardHeader>
                    <CardContent ref={badgePoolRef} className={cn("flex-1 p-2 overflow-hidden min-h-0 rounded-md", isBadgePoolOver && "ring-1 ring-destructive ring-inset")}>
                        <ScrollArea className="h-full">
                            <div className="flex flex-wrap gap-2">
                                {userAssignableBadges.map(badge => (
                                    <DraggableBadgeFromPool key={badge.id} badge={badge} canManage={!isViewer} />
                                ))}
                                {userAssignableBadges.length === 0 && <p className="text-xs text-muted-foreground text-center p-4 w-full">No badges available to assign. Activate badge collections in the "Badges" tab.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
}
