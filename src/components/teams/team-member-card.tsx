
'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { type User, type Team, type Badge } from '@/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge as UiBadge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, useSensors, useSensor, PointerSensor, KeyboardSensor, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useDroppable } from '@dnd-kit/core';

function SortableAssignedBadge({ badge, canManageRoles, member }: { badge: Badge, canManageRoles: boolean, member: User }) {
    const { isDragModifierPressed } = useUser();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: badge.id,
        disabled: !isDragModifierPressed,
        data: {
            type: 'assigned-badge',
            badge: badge,
            member: member,
        },
     });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <button
                        className={cn(
                        'h-7 w-7 rounded-full border flex items-center justify-center bg-transparent',
                        canManageRoles && isDragModifierPressed ? 'cursor-grabbing' : 'cursor-default'
                        )}
                        style={{ borderColor: badge.color }}
                    >
                        <GoogleSymbol
                        name={badge.icon}
                        style={{ fontSize: '20px', color: badge.color }}
                        weight={100}
                        />
                    </button>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>{badge.name}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export function TeamMemberCard({ member, team, isViewer, onSetAdmin, canManage }: { member: User, team: Team, isViewer: boolean, onSetAdmin: () => void, canManage: boolean }) {
  const { viewAsUser, updateUser, updateTeam, allBadges, allBadgeCollections, isDragModifierPressed } = useUser();
  const { toast } = useToast();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);

  const canManageRoles = !isViewer && (viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId));
  const teamBadgesLabel = team.userBadgesLabel || 'Team Badges';

  const { setNodeRef, isOver } = useDroppable({
    id: `member-card-${member.userId}`,
    data: {
        type: 'member-card',
        member: member,
    }
  });

  const userAssignableBadges = useMemo(() => {
    const activeAndApplicableCollections = allBadgeCollections.filter(
      (c) =>
        (team.activeBadgeCollections || []).includes(c.id) &&
        c.applications?.includes('team members')
    );

    const badgeIds = new Set(activeAndApplicableCollections.flatMap(c => c.badgeIds));

    return allBadges.filter(badge => badgeIds.has(badge.id));
  }, [team.activeBadgeCollections, allBadgeCollections, allBadges]);

  const teamBadgeNames = useMemo(() => new Set(userAssignableBadges.map(b => b.name)), [userAssignableBadges]);

  const assignedBadges = useMemo(() => {
    return (member.roles || [])
      .map(roleName => userAssignableBadges.find(b => b.name === roleName))
      .filter((b): b is Badge => !!b);
  }, [member.roles, userAssignableBadges]);

  const groupedBadges = useMemo(() => {
    const groups: { [collectionId: string]: { collectionName: string; badges: Badge[] } } = {};
    assignedBadges.forEach(badge => {
        const collectionId = badge.ownerCollectionId;
        if (!groups[collectionId]) {
            const collection = allBadgeCollections.find(c => c.id === collectionId);
            groups[collectionId] = {
                collectionName: collection?.name || "Other Badges",
                badges: [],
            };
        }
        groups[collectionId].badges.push(badge);
    });
    return Object.values(groups);
  }, [assignedBadges, allBadgeCollections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleBadgeDragStart = (event: DragStartEvent) => {
    setActiveBadge(event.active.data.current?.badge);
  }

  const handleBadgeDragEnd = (event: DragEndEvent) => {
    setActiveBadge(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
        return;
    }

    const oldIndex = assignedBadges.findIndex(b => b.id === active.id);
    const newIndex = assignedBadges.findIndex(b => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
        const newBadgeOrder = arrayMove(assignedBadges, oldIndex, newIndex);
        const newRoles = newBadgeOrder.map(b => b.name);
        const nonTeamRoles = (member.roles || []).filter(role => !teamBadgeNames.has(role));
        const finalRoles = [...new Set([...nonTeamRoles, ...newRoles])];
        updateUser(member.userId, { roles: finalRoles });
    }
  }

  const handleSaveLabel = useCallback(() => {
    if (!canManageRoles) return;
    const newLabel = labelInputRef.current?.value.trim();
    if (newLabel && newLabel !== teamBadgesLabel) {
        updateTeam(team.id, { userBadgesLabel: newLabel });
    }
    setIsEditingLabel(false);
  }, [canManageRoles, team.id, teamBadgesLabel, updateTeam]);

  useEffect(() => {
    if (!isEditingLabel) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (labelInputRef.current && !labelInputRef.current.contains(event.target as Node)) {
        handleSaveLabel();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    labelInputRef.current?.focus();
    labelInputRef.current?.select();

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isEditingLabel, handleSaveLabel]);
  
  const isTeamAdmin = (team.teamAdmins || []).includes(member.userId);

  return (
    <>
      <Card ref={setNodeRef} className={cn("bg-transparent", isOver && "ring-2 ring-primary ring-inset")}>
        <CardHeader>
          <div className="flex items-center gap-4">
             <div 
                className={cn("relative", canManage && !isDragModifierPressed && "cursor-pointer")}
                onClick={(e) => { 
                    if (canManage && !isDragModifierPressed) {
                        e.stopPropagation();
                        onSetAdmin(); 
                    }
                }}
            >
                <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatarUrl} alt={member.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
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
              <CardTitle className="text-lg font-headline font-thin">{member.displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">{member.title}</p>
            </div>
          </div>
        </CardHeader>
        {!isViewer && (
            <CardContent>
            <div className="mt-4 space-y-2">
                <h4 className="text-sm font-normal">
                    {isEditingLabel && canManageRoles ? (
                        <Input
                            ref={labelInputRef}
                            defaultValue={teamBadgesLabel}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveLabel();
                            else if (e.key === 'Escape') setIsEditingLabel(false);
                            }}
                            className="h-auto p-0 text-sm font-normal font-headline font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    ) : (
                        <span
                            className={cn(canManageRoles && "cursor-text border-b border-transparent hover:border-dashed hover:border-muted-foreground")}
                            onClick={() => canManageRoles && setIsEditingLabel(true)}
                        >
                            {teamBadgesLabel}
                        </span>
                    )}
                </h4>
                <DndContext sensors={sensors} onDragStart={handleBadgeDragStart} onDragEnd={handleBadgeDragEnd} collisionDetection={closestCenter}>
                <div className="flex flex-col gap-2 min-h-[24px] rounded-md border p-2 bg-muted/20">
                {assignedBadges.length > 0 ? (
                    <>
                       {groupedBadges.map(({ collectionName, badges }) => (
                            <div key={collectionName}>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{collectionName}</p>
                                <SortableContext items={badges.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-wrap gap-1.5">
                                    {badges.map(badge => (
                                        <SortableAssignedBadge key={badge.id} badge={badge} canManageRoles={canManageRoles} member={member} />
                                    ))}
                                </div>
                                </SortableContext>
                            </div>
                        ))}
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground italic w-full text-center">Drag badges from the pool to assign.</p>
                )}
                </div>
                <DragOverlay modifiers={[snapCenterToCursor]}>
                    {activeBadge ? (
                        <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card" style={{ borderColor: activeBadge.color }}>
                            <GoogleSymbol name={activeBadge.icon} style={{ fontSize: '28px', color: activeBadge.color }} weight={100} />
                        </div>
                    ) : null}
                </DragOverlay>
                </DndContext>
            </div>
            </CardContent>
        )}
      </Card>
    </>
  );
}
