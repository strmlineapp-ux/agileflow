
'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User, type Badge } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core';
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

function DraggableBadgeFromPool({ badge, canManage }: { badge: Badge; canManage: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
        id: `badge-pool:${badge.id}`,
        data: { type: 'badge', badge: badge, context: 'pool' },
        disabled: !canManage,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <UiBadge
                variant={'outline'}
                style={{ color: badge.color, borderColor: badge.color }}
                className={cn('flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8 font-thin', canManage && 'cursor-grab')}
            >
                <GoogleSymbol name={badge.icon} style={{ fontSize: '20px' }} weight={100} />
                <span>{badge.name}</span>
            </UiBadge>
        </div>
    );
}


function SortableTeamMember({ member, team, isViewer, onSetAdmin, onRemoveUser }: { member: User, team: Team, isViewer: boolean, onSetAdmin: () => void, onRemoveUser: () => void }) {
  const { isDragModifierPressed } = useUser();
  
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: `member:${member.userId}`,
    data: { type: 'member-card', member: member },
    disabled: isViewer || !isDragModifierPressed
  });
  
  const { isOver, setNodeRef: droppableSetNodeRef } = useDroppable({
    id: `member-card:${member.userId}`,
    data: { type: 'member-card', memberId: member.userId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const canManage = !isViewer;

  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    droppableSetNodeRef(node);
  };

  return (
    <div ref={combinedRef} style={style} className={cn("relative rounded-md", isDragging && "shadow-xl")}>
      <div {...attributes} {...listeners} className="relative group">
        <TeamMemberCard member={member} team={team} isViewer={isViewer} onSetAdmin={onSetAdmin} isOver={isOver} />
        {canManage && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity", isDragModifierPressed && "hidden")}
                            onClick={(e) => { e.stopPropagation(); onRemoveUser();}}
                            onPointerDown={(e) => e.stopPropagation()}
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

function DroppableUserList({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list-container' } });
    return (
        <div ref={setNodeRef} className={cn(className, "transition-colors rounded-md", isOver && "bg-primary/5")}>
            {children}
        </div>
    )
}

export function TeamMembersView({ team, tab }: { team: Team; tab: AppTab }) {
    const { viewAsUser, users, updateAppTab, updateTeam, isDragModifierPressed, allBadges, handleBadgeAssignment, handleBadgeUnassignment, allBadgeCollections } = useUser();
    const [activeDragItem, setActiveDragItem] = useState<{type: string, id: string, data: any} | null>(null);

    if (!team) return null;

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
    
    const canManage = !isViewer;

    const teamMembers = useMemo(() => {
        return team.members
            .map(id => users.find(u => u.userId === id))
            .filter((u): u is User => !!u);
    }, [users, team.members]);

    const admins = useMemo(() => teamMembers.filter(m => team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);
    const members = useMemo(() => teamMembers.filter(m => !team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);

    const adminIds = useMemo(() => admins.map(a => `member:${a.userId}`), [admins]);
    const memberIds = useMemo(() => members.map(m => `member:${m.userId}`), [members]);
    
    const userAssignableBadges = useMemo(() => {
        const activeAndApplicableCollections = allBadgeCollections.filter(
          (c) =>
            (team.activeBadgeCollections || []).includes(c.id) &&
            c.applications?.includes('team members')
        );
        const badgeIds = new Set(activeAndApplicableCollections.flatMap(c => c.badgeIds));
        return allBadges.filter(badge => badgeIds.has(badge.id) && badge.name.toLowerCase().includes(badgePoolSearch.toLowerCase()));
    }, [team.activeBadgeCollections, allBadgeCollections, allBadges, badgePoolSearch]);

    const groupedAssignableBadges = useMemo(() => {
        const groups: { [collectionName: string]: Badge[] } = {};
        userAssignableBadges.forEach(badge => {
            const collection = allBadgeCollections.find(c => c.badgeIds.includes(badge.id) && (team.activeBadgeCollections || []).includes(c.id));
            const collectionName = collection?.name || "Other Badges";
            if (!groups[collectionName]) {
                groups[collectionName] = [];
            }
            groups[collectionName].push(badge);
        });
        return Object.entries(groups).map(([collectionName, badges]) => ({ collectionName, badges }));
    }, [userAssignableBadges, allBadgeCollections, team.activeBadgeCollections]);
    
    const { setNodeRef: badgePoolRef, isOver: isBadgePoolOver } = useDroppable({
        id: 'badge-pool',
        data: { type: 'badge-pool' }
    });

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
            document.removeEventListener("mousedown", handleSaveMembersLabel);
        };
    }, [isEditingMembersLabel, handleSaveMembersLabel]);

    const handleMembersLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveMembersLabel();
        else if (e.key === 'Escape') setIsEditingMembersLabel(false);
    };

    const handleSetAdmin = useCallback((teamId: string, userId: string) => {
        if (isViewer) return;
        
        const currentAdmins = new Set(team.teamAdmins || []);
        if (currentAdmins.has(userId)) {
            currentAdmins.delete(userId);
        } else {
            currentAdmins.add(userId);
        }
        updateTeam(teamId, { teamAdmins: Array.from(currentAdmins) });
    }, [isViewer, users, updateTeam, team]);
    
    const handleRemoveUser = useCallback((userId: string) => {
        if (isViewer) return;
        const newMembers = team.members.filter(id => id !== userId);
        const newAdmins = (team.teamAdmins || []).filter(id => id !== userId);
        updateTeam(team.id, { members: newMembers, teamAdmins: newAdmins });
        toast({ title: 'User Removed from Team' });
    }, [isViewer, team, updateTeam, toast]);
    
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);
    
        if (!over || !canManage) return;
    
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
    
        if (activeType === 'badge') {
            const badge = active.data.current?.badge as Badge;
            const sourceContext = active.data.current?.context;
            const sourceMemberId = active.data.current?.memberId;

            if (!badge) return;
    
            if (overType === 'member-card') {
                const targetMemberId = over.data.current?.memberId;
                if (!targetMemberId) return;

                if (sourceContext === 'member' && sourceMemberId && sourceMemberId !== targetMemberId) {
                    handleBadgeUnassignment(badge, sourceMemberId);
                }
                handleBadgeAssignment(badge, targetMemberId);
                return;
            }
            
            if (overType === 'badge-pool' && sourceContext === 'member' && sourceMemberId) {
                handleBadgeUnassignment(badge, sourceMemberId);
                return;
            }
            return;
        }
    
        if (activeType === 'member-card') {
            const user = active.data.current?.member as User;
            const sourceList = adminIds.includes(`member:${user.userId}`) ? 'admins' : 'members';
            const destinationList = over.id === 'admins' ? 'admins' : 'members';

            if (sourceList !== destinationList) {
                handleSetAdmin(team.id, user.userId);
            } else {
                if (active.id === over.id) return;

                const list = sourceList === 'admins' ? admins : members;
                const oldIndex = list.findIndex(item => `member:${item.userId}` === active.id);
                const overItem = over.data.current?.member as User | undefined;
                if (!overItem) return;
                const newIndex = list.findIndex(item => item.userId === overItem.userId);
    
                if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderedList = arrayMove(list, oldIndex, newIndex);
                    const newAdmins = sourceList === 'admins' ? reorderedList : admins;
                    const newMembers = sourceList !== 'admins' ? reorderedList : members;
                    const newMemberIds = [...newAdmins, ...newMembers].map(m => m.userId);
                    updateTeam(team.id, { members: newMemberIds });
                }
            }
        }
    };
    
    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem({ type: active.data.current?.type, id: active.id as string, data: active.data.current });
    }

    const activeBadge = (activeDragItem?.type === 'badge') ? activeDragItem.data.badge : null;
    const assignableBadgeIds = useMemo(() => userAssignableBadges.map(b => `badge-pool:${b.id}`), [userAssignableBadges]);

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
                    {canManage && (
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
                                    <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => canManage && setIsEditingAdminsLabel(true)}>
                                        {teamAdminsLabel}
                                    </h3>
                                )}
                                <DroppableUserList id="admins" className="space-y-4">
                                    <SortableContext items={adminIds} strategy={verticalListSortingStrategy}>
                                        {admins.map((member) => (
                                            <SortableTeamMember key={member.userId} member={member} team={team} isViewer={isViewer} onSetAdmin={() => handleSetAdmin(team.id, member.userId)} onRemoveUser={() => handleRemoveUser(member.userId)} />
                                        ))}
                                    </SortableContext>
                                </DroppableUserList>
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
                                <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => canManage && setIsEditingMembersLabel(true)}>
                                    {membersLabel}
                                </h3>
                            )}
                            {members.length > 0 && (
                                <DroppableUserList id="members">
                                    <SortableContext items={memberIds} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-wrap -m-3">
                                        {members.map((member) => (
                                            <div key={member.userId} className="p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0">
                                                <SortableTeamMember member={member} team={team} isViewer={isViewer} onSetAdmin={() => handleSetAdmin(team.id, member.userId)} onRemoveUser={() => handleRemoveUser(member.userId)} />
                                            </div>
                                        ))}
                                        </div>
                                    </SortableContext>
                                </DroppableUserList>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeDragItem?.type === 'member-card' && activeDragItem?.data?.member ? (
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={activeDragItem.data.member.avatarUrl} alt={activeDragItem.data.member.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{activeDragItem.data.member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ) : activeBadge ? (
                     <div className="h-7 w-7 rounded-full border-2 flex items-center justify-center bg-card" style={{ borderColor: activeBadge.color }}>
                        <GoogleSymbol name={activeBadge.icon} style={{ fontSize: '20px', color: activeBadge.color }} weight={100} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
        <div className={cn("transition-all duration-300", isBadgePoolOpen ? "w-96" : "w-0")}>
            <div className={cn("h-full rounded-lg transition-all", isBadgePoolOpen ? "p-2" : "p-0")}>
                <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
                 <Card ref={badgePoolRef} className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isBadgePoolOpen ? "opacity-100" : "opacity-0", isBadgePoolOver && 'ring-1 ring-border ring-inset')}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-headline font-thin text-xl">Assignable Badges</CardTitle>
                             <CompactSearchInput searchTerm={badgePoolSearch} setSearchTerm={setBadgePoolSearch} placeholder="Search badges..." />
                        </div>
                        <CardDescription>Drag a badge onto a team member to assign it.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-hidden min-h-0 rounded-md">
                        <SortableContext items={assignableBadgeIds}>
                            <ScrollArea className="h-full">
                                <div className="space-y-4">
                                    {groupedAssignableBadges.map(({ collectionName, badges }) => (
                                        <div key={collectionName}>
                                            <p className="text-xs tracking-wider mb-2">{collectionName}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {badges.map(badge => (
                                                    <DraggableBadgeFromPool key={badge.id} badge={badge} canManage={canManage} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {userAssignableBadges.length === 0 && <p className="text-xs text-muted-foreground text-center p-4 w-full">No badges available to assign. Activate badge collections in the "Badges" tab.</p>}
                                </div>
                            </ScrollArea>
                        </SortableContext>
                    </CardContent>
                </Card>
                 <DragOverlay modifiers={[snapCenterToCursor]}>
                    {activeBadge ? (
                        <div className="h-7 w-7 rounded-full border-2 flex items-center justify-center bg-card" style={{ borderColor: activeBadge.color }}>
                            <GoogleSymbol name={activeBadge.icon} style={{ fontSize: '20px', color: activeBadge.color }} weight={100} />
                        </div>
                    ) : null}
                </DragOverlay>
                </DndContext>
            </div>
        </div>
      </div>
    );
}
