
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
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DraggableBadge({ badge, contextId, canManage }: { badge: Badge, contextId: string, canManage: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
        id: `${contextId}::${badge.id}`,
        data: {
            type: 'badge',
            badge: badge,
            contextId: contextId,
        },
        disabled: !canManage,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    ref={setNodeRef}
                    style={style}
                    {...listeners}
                    {...attributes}
                    className={cn(
                        'h-7 w-7 rounded-full border flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
                        canManage && 'cursor-grab',
                        isDragging && 'opacity-50'
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
    );
}

export function TeamMemberCard({ member, team, isViewer, onSetAdmin, isOver }: { member: User, team: Team, isViewer: boolean, onSetAdmin: () => void, isOver: boolean }) {
  const { viewAsUser, updateTeam, allBadges, allBadgeCollections, isDragModifierPressed } = useUser();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  
  const teamBadgesLabel = team.userBadgesLabel || 'Team Badges';
  const canManage = !isViewer;

  const assignedBadges = useMemo(() => {
    return (member.roles || [])
      .map(roleName => allBadges.find(b => b.name === roleName))
      .filter((b): b is Badge => !!b);
  }, [member.roles, allBadges]);

  const assignedBadgeIds = useMemo(() => assignedBadges.map(b => `member-card-droppable:${member.userId}::${b.id}`), [assignedBadges, member.userId]);
  
  const { setNodeRef: droppableRef, isOver: isDroppableOver } = useDroppable({
    id: `member-card-droppable:${member.userId}`,
    data: {
        type: 'member-card-droppable',
        memberId: member.userId,
    }
  });


  const groupedBadges = useMemo(() => {
    const groups: { [collectionName: string]: Badge[] } = {};
    assignedBadges.forEach(badge => {
        const collection = allBadgeCollections.find(c => c.badgeIds.includes(badge.id));
        const collectionName = collection?.name || "Other Badges";
        if (!groups[collectionName]) {
            groups[collectionName] = [];
        }
        groups[collectionName].push(badge);
    });
    return Object.entries(groups).map(([collectionName, badges]) => ({ collectionName, badges }));
  }, [assignedBadges, allBadgeCollections]);

  const handleSaveLabel = useCallback(() => {
    if (!canManage) return;
    const newLabel = labelInputRef.current?.value.trim();
    if (newLabel && newLabel !== teamBadgesLabel) {
        updateTeam(team.id, { userBadgesLabel: newLabel });
    }
    setIsEditingLabel(false);
  }, [canManage, team.id, teamBadgesLabel, updateTeam]);

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
      <Card>
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
                    {isEditingLabel && canManage ? (
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
                            className={cn(canManage && "cursor-text border-b border-transparent hover:border-dashed hover:border-muted-foreground")}
                            onClick={() => canManage && setIsEditingLabel(true)}
                        >
                            {teamBadgesLabel}
                        </span>
                    )}
                </h4>
                <div ref={droppableRef} className={cn("transition-colors min-h-[48px] rounded-md border p-2 bg-muted/20", isDroppableOver && "ring-1 ring-inset ring-primary")}>
                    <SortableContext items={assignedBadgeIds} strategy={verticalListSortingStrategy}>
                        {assignedBadges.length > 0 ? (
                            <>
                               {groupedBadges.map(({ collectionName, badges }) => (
                                    <div key={collectionName}>
                                        <p className="text-xs tracking-wider mb-1.5">{collectionName}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {badges.map(badge => (
                                                <DraggableBadge key={badge.id} badge={badge} contextId={`member-card-droppable:${member.userId}`} canManage={canManage} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p className="text-xs text-muted-foreground italic w-full text-center py-2">Drag badges here to assign.</p>
                        )}
                    </SortableContext>
                </div>
            </div>
            </CardContent>
        )}
      </Card>
  );
}
