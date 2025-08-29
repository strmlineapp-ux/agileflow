
'use client';

import { useMemo } from 'react';
import { type User, type Team, type Badge } from '@/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function AssignedBadge({ badge, canManage, contextId }: { badge: Badge, canManage: boolean, contextId: string }) {
    const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
        id: `badge-assigned:${contextId}:${badge.id}`,
        data: {
            type: 'badge-assigned',
            badge: badge,
            context: 'member',
            memberId: contextId,
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
                        'h-7 w-7 rounded-full border flex items-center justify-center bg-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50',
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

export function TeamMemberCard({ member, team, onSetAdmin, isOver }: { member: User, team: Team, onSetAdmin: () => void, isOver: boolean }) {
  const { allBadges, viewAsUser } = useUser();
  
  const canManage = useMemo(() => {
    if (viewAsUser.isAdmin) return true;
    if (!team.teamAdmins?.length) return !team.members.includes(viewAsUser.userId);
    return team.teamAdmins.includes(viewAsUser.userId);
  }, [viewAsUser, team]);

  const assignedBadges = useMemo(() => {
    return (member.roles || [])
      .map(roleId => allBadges.find(b => b && b.id === roleId))
      .filter((b): b is Badge => !!b);
  }, [member.roles, allBadges]);
  
  const { setNodeRef } = useDroppable({
    id: `member-card:${member.userId}`,
    data: { type: 'member-card', memberId: member.userId }
  });

  const isTeamAdmin = (team.teamAdmins || []).includes(member.userId);

  return (
      <Card className={cn("transition-colors", isOver && "ring-1 ring-inset ring-primary")}>
        <CardHeader>
          <div className="flex items-center gap-4">
             <div 
                className={cn("relative", canManage && "cursor-pointer")}
                 onClick={(e) => {
                    if (canManage) {
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
        {canManage && (
            <CardContent ref={setNodeRef} className="p-2 pt-0 mt-2">
                <div className="transition-colors min-h-[48px] rounded-md border p-2 bg-muted/20 flex flex-wrap gap-1.5 items-center">
                    <SortableContext items={assignedBadges.map(b => `badge-assigned:${member.userId}:${b.id}`)} strategy={verticalListSortingStrategy}>
                        {assignedBadges.length > 0 ? (
                            assignedBadges.map(badge => (
                                <AssignedBadge key={badge.id} badge={badge} canManage={canManage} contextId={member.userId} />
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic w-full text-center py-2">Drag badges here to assign.</p>
                        )}
                    </SortableContext>
                </div>
            </CardContent>
        )}
      </Card>
  );
}
