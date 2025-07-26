
'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

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
    const { viewAsUser, users, updateAppTab, updateTeam, isDragModifierPressed, allBadges, updateUser } = useUser();
    const [activeDragItem, setActiveDragItem] = useState<{type: string, id: string} | null>(null);
    
    // Safeguard to prevent rendering if team data is not available.
    if (!team) {
      return null;
    }

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isEditingAdminsLabel, setIsEditingAdminsLabel] = useState(false);
    const [isEditingMembersLabel, setIsEditingMembersLabel] = useState(false);
    const adminsLabelInputRef = useRef<HTMLInputElement>(null);
    const membersLabelInputRef = useRef<HTMLInputElement>(null);

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
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: {
            distance: 8,
          },
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
          onActivation: ({ event }) => {
            if (isDragModifierPressed) {
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
    
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over || active.id === over.id) {
            return;
        }

        if (active.data.current?.type === 'assigned-badge') {
            const memberId = active.data.current.memberId;
            const member = teamMembers.find(m => m.userId === memberId);
            if (!member || !member.roles) return;
            
            const oldIndex = member.roles.findIndex(roleName => allBadges.find(b => b.name === roleName)?.id === active.id);
            const newIndex = member.roles.findIndex(roleName => allBadges.find(b => b.name === roleName)?.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newRoles = arrayMove(member.roles, oldIndex, newIndex);
                updateUser(memberId, { roles: newRoles });
            }
            return;
        }

        // Logic for reordering members
        const activeList = adminIds.includes(active.id as string) ? 'admins' : 'members';
        const overList = adminIds.includes(over.id as string) ? 'admins' : 'members';

        if (activeList !== overList) {
            return;
        }
        
        const list = activeList === 'admins' ? admins : members;
        const oldIndex = list.findIndex(item => item.userId === active.id);
        const newIndex = list.findIndex(item => item.userId === over.id);
        
        const reorderedList = arrayMove(list, oldIndex, newIndex);
        const newAdmins = activeList === 'admins' ? reorderedList : admins;
        const newMembers = activeList === 'members' ? reorderedList : members;
        const newMemberIds = [...newAdmins, ...newMembers].map(m => m.userId);

        updateTeam(team.id, { members: newMemberIds });
    };

    const onDragStart = (event: DragEndEvent) => {
        const { active } = event;
        setActiveDragItem({ type: active.data.current?.type, id: active.id as string });
    }

    const activeBadge = activeDragItem?.type === 'assigned-badge' ? allBadges.find(b => b.id === activeDragItem.id) : null;

    return (
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
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
            
            <div className="flex flex-col lg:flex-row gap-6">
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
        <DragOverlay modifiers={[snapCenterToCursor]}>
            {activeBadge ? (
                <div
                    className='h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card'
                    style={{ borderColor: activeBadge.color }}
                >
                    <GoogleSymbol
                        name={activeBadge.icon}
                        style={{ fontSize: '28px', color: activeBadge.color }}
                        weight={100}
                    />
                </div>
            ) : null}
        </DragOverlay>
      </DndContext>
    );
}
