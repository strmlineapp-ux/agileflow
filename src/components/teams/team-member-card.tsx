

'use client';

import { useState, useMemo } from 'react';
import { type User, type Team } from '@/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge as UiBadge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function TeamMemberCard({ member, team }: { member: User, team: Team }) {
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  
  const canManageRoles = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);
  const teamBadgeNames = team.allBadges.map(b => b.name);

  const userAssignableBadges = useMemo(() => {
    const userBadgeCollectionIds = new Set(
        team.badgeCollections.filter(c => c.applications?.includes('users')).map(c => c.id)
    );
    return team.allBadges.filter(b => userBadgeCollectionIds.has(b.ownerCollectionId));
  }, [team.badgeCollections, team.allBadges]);

  const handleToggleRole = async (badgeName: string) => {
    if (!canManageRoles) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You do not have permission to change badges for this team.'
        });
        return;
    }

    const currentBadges = new Set(member.roles?.filter(r => teamBadgeNames.includes(r)) || []);
    if (currentBadges.has(badgeName)) {
        currentBadges.delete(badgeName);
    } else {
        currentBadges.add(badgeName);
    }
    
    const nonTeamRoles = (member.roles || []).filter(role => !teamBadgeNames.includes(role));
    const finalRoles = [...new Set([...nonTeamRoles, ...Array.from(currentBadges)])];

    await updateUser(member.userId, { roles: finalRoles });
    toast({
        title: 'Badge Updated',
        description: `Badges for ${member.displayName} have been updated.`
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{member.displayName}</CardTitle>
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatarUrl} alt={member.displayName} data-ai-hint="user avatar" />
            <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{member.title}</p>
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Team Badges</h4>
            <div className="flex flex-wrap gap-1.5 min-h-[24px] rounded-md border p-2 bg-muted/20">
              {userAssignableBadges.length > 0 ? userAssignableBadges.map(badge => {
                const isAssigned = (member.roles || []).includes(badge.name);
                return (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UiBadge
                            variant={'outline'}
                            style={isAssigned ? { color: badge.color, borderColor: badge.color } : {}}
                            className={cn(
                                'gap-1.5 p-1 px-3 rounded-full text-sm',
                                isAssigned ? 'border-2' : 'border-dashed opacity-50',
                                canManageRoles && 'cursor-pointer'
                            )}
                            onClick={() => canManageRoles && handleToggleRole(badge.name)}
                        >
                            <GoogleSymbol name={badge.icon} className="text-base" />
                            {badge.name}
                        </UiBadge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canManageRoles ? (isAssigned ? 'Click to unassign' : 'Click to assign') : badge.description || badge.name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }) : (
                <p className="text-xs text-muted-foreground italic w-full text-center">No user-assignable badges configured for this team.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
