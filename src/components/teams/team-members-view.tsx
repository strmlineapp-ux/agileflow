

'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User, type Badge, type BadgeCollection } from '@/types';
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
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useDroppable } from '@dnd-kit/core';
import { InlineEditor } from '../common/inline-editor';


function DroppableUserList({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list-container', id } });
    return (
        <div ref={setNodeRef} className={cn(className, "transition-colors rounded-md", isOver && "ring-1 ring-border ring-inset")}>
            {children}
        </div>
    )
}

function SortableTeamMember({ member, team, onSetAdmin, onRemoveUser }: { member: User, team: Team, onSetAdmin: () => void, onRemoveUser: () => void }) {
  const { isDragModifierPressed, viewAsUser } = useUser();

  const isViewer = useMemo(() => {
    if (viewAsUser.isAdmin) return false;
    if (!team.teamAdmins?.length) return !team.members.includes(viewAsUser.userId);
    return !team.teamAdmins.includes(viewAsUser.userId);
  }, [viewAsUser, team]);

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
        <TeamMemberCard member={member} team={team} onSetAdmin={onSetAdmin} isOver={isOver} />
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

export function TeamMembersView({ team, tab }: { team: Team; tab: AppTab }) {
    const { viewAsUser, users, allBadges, updateAppTab, updateTeam, isDragModifierPressed, handleBadgeAssignment, handleBadgeUnassignment } = useUser();
    const [activeDragItem, setActiveDragItem] = useState<{type: string, id: string, data: any} | null>(null);

    if (!team) return null;

    const adminsLabel = team.teamAdminsLabel || 'Team Admins';
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
    
        if (activeType === 'badge-assigned') {
            const badge = active.data.current?.badge as Badge;
            const sourceMemberId = active.data.current?.memberId;
            if (!badge || !sourceMemberId) return;
    
            if (overType === 'member-card') {
                const targetMemberId = over.data.current?.memberId;
                if (!targetMemberId) return;

                if (sourceMemberId !== targetMemberId) {
                    handleBadgeUnassignment(badge, sourceMemberId);
                    handleBadgeAssignment(badge, targetMemberId);
                }
            }
            return;
        }
    
        if (activeType === 'member-card') {
            const user = active.data.current?.member as User;
            const sourceList = adminIds.includes(`member:${user.userId}`) ? 'admins' : 'members';
            
            const overId = over.id.toString();
            let destinationListId;

            if (overId === 'admins' || overId === 'members') {
                destinationListId = overId;
            } else if (over.data.current?.type === 'member-card') {
                const overUser = over.data.current?.member as User;
                destinationListId = adminIds.includes(`member:${overUser.userId}`) ? 'admins' : 'members';
            }

            if (!destinationListId) return;

            if (sourceList !== destinationListId) {
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

    const activeBadge = (activeDragItem?.type === 'badge-assigned') ? activeDragItem.data.badge : null;
    
    return (
      <div className="flex h-full gap-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <InlineEditor
                            value={tab.name}
                            onSave={(newValue) => updateAppTab(tab.id, { name: newValue })}
                            className="h-auto p-0 font-headline text-2xl font-thin tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            disabled={!canManage}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className={cn("flex flex-col gap-6", admins.length > 0 && "lg:flex-row")}>
                        {admins.length > 0 && (
                            <div className="lg:w-1/3 lg:max-w-sm space-y-4">
                                <InlineEditor
                                    value={adminsLabel}
                                    onSave={(newValue) => updateTeam(team.id, { teamAdminsLabel: newValue })}
                                    className="font-headline font-thin text-xl"
                                    disabled={!canManage}
                                />
                                <DroppableUserList id="admins" className="space-y-4">
                                    <SortableContext items={adminIds} strategy={verticalListSortingStrategy}>
                                        {admins.map((member) => (
                                            <SortableTeamMember key={member.userId} member={member} team={team} onSetAdmin={() => handleSetAdmin(team.id, member.userId)} onRemoveUser={() => handleRemoveUser(member.userId)} />
                                        ))}
                                    </SortableContext>
                                </DroppableUserList>
                            </div>
                        )}

                        <div className="flex-1 space-y-4">
                             <InlineEditor
                                value={membersLabel}
                                onSave={(newValue) => updateTeam(team.id, { membersLabel: newValue })}
                                className="font-headline font-thin text-xl"
                                disabled={!canManage}
                             />
                            {members.length > 0 && (
                                <DroppableUserList id="members">
                                    <SortableContext items={memberIds} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-wrap -m-3">
                                        {members.map((member) => (
                                            <div key={member.userId} className="p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0">
                                                <SortableTeamMember member={member} team={team} onSetAdmin={() => handleSetAdmin(team.id, member.userId)} onRemoveUser={() => handleRemoveUser(member.userId)} />
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
                     <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card shadow-lg" style={{ borderColor: activeBadge.color }}>
                        <GoogleSymbol name={activeBadge.icon} style={{ fontSize: '28px', color: activeBadge.color }} weight={100} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
      </div>
    );
}
