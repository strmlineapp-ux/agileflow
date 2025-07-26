
'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { type User, type Team, type Badge } from '@/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge as UiBadge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn, getContrastColor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';

export function TeamMemberCard({ member, team, isViewer }: { member: User, team: Team, isViewer: boolean }) {
  const { viewAsUser, updateUser, updateTeam, allBadges, allBadgeCollections } = useUser();
  const { toast } = useToast();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  
  const canManageRoles = !isViewer && (viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId));
  const teamBadgesLabel = team.userBadgesLabel || 'Team Badges';
  
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

  const groupedBadges = useMemo(() => {
    const assignedBadgeNames = new Set(member.roles || []);
    const groups: { [collectionId: string]: { collectionName: string; badges: Badge[] } } = {};

    userAssignableBadges
        .filter(b => assignedBadgeNames.has(b.name))
        .forEach(badge => {
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
  }, [member.roles, userAssignableBadges, allBadgeCollections]);
  
  const unassignedBadges = useMemo(() => {
    const assigned = new Set(member.roles || []);
    return userAssignableBadges.filter(badge => !assigned.has(badge.name));
  }, [userAssignableBadges, member.roles]);

  const handleToggleRole = async (badgeName: string) => {
    if (!canManageRoles) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You do not have permission to change badges for this team.'
        });
        return;
    }

    const currentBadges = new Set(member.roles?.filter(r => teamBadgeNames.has(r)) || []);
    if (currentBadges.has(badgeName)) {
        currentBadges.delete(badgeName);
    } else {
        currentBadges.add(badgeName);
    }
    
    const nonTeamRoles = (member.roles || []).filter(role => !teamBadgeNames.has(role));
    const finalRoles = [...new Set([...nonTeamRoles, ...Array.from(currentBadges)])];

    await updateUser(member.userId, { roles: finalRoles });
    toast({
        title: 'Badge Updated',
        description: `Badges for ${member.displayName} have been updated.`
    });
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

  const renderBadge = (badge: Badge, isAssigned: boolean) => (
    <TooltipProvider key={badge.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <UiBadge
            variant={'outline'}
            style={{
                borderColor: badge.color,
                color: isAssigned ? badge.color : 'hsl(var(--muted-foreground))',
                backgroundColor: 'transparent',
                borderStyle: isAssigned ? 'solid' : 'dashed',
            }}
            className={cn(
              'gap-1 p-1 pl-2 rounded-full h-7 text-sm font-thin',
              canManageRoles && 'cursor-pointer'
            )}
            onClick={() => canManageRoles && handleToggleRole(badge.name)}
          >
            <GoogleSymbol 
                name={badge.icon} 
                style={{ fontSize: '20px', color: isAssigned ? badge.color : 'hsl(var(--muted-foreground))' }} 
                weight={100} />
            {badge.name}
          </UiBadge>
        </TooltipTrigger>
        <TooltipContent>
          {canManageRoles ? (isAssigned ? 'Click to unassign' : 'Click to assign') : badge.description || badge.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <Card className="bg-transparent">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl} alt={member.displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
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
                <div className="flex flex-col gap-2 min-h-[24px] rounded-md border p-2 bg-muted/20">
                {userAssignableBadges.length > 0 ? (
                    <>
                    {groupedBadges.map(({ collectionName, badges }) => (
                        <div key={collectionName}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{collectionName}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {badges.map(badge => renderBadge(badge, true))}
                            </div>
                        </div>
                    ))}
                    {unassignedBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {unassignedBadges.map(badge => renderBadge(badge, false))}
                        </div>
                    )}
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground italic w-full text-center">No assignable badges configured for this team.</p>
                )}
                </div>
            </div>
            </CardContent>
        )}
      </Card>
    </>
  );
}
