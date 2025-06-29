

'use client';

import { useState } from 'react';
import { type User, type Team } from '@/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function TeamMemberCard({ member, team }: { member: User, team: Team }) {
  const { viewAsUser, updateUser, allBadges, appSettings } = useUser();
  const { toast } = useToast();
  
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [tempRoles, setTempRoles] = useState<string[]>([]);

  const canManageRoles = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);

  const teamBadgeNames = team.badgeCollections.flatMap(c => c.badges.map(b => b.name));
  const otherRolesForMember = (member.roles || []).filter(roleName => !teamBadgeNames.includes(roleName));

  const handleOpenRolesDialog = () => {
    setTempRoles(member.roles || []);
    setIsRolesDialogOpen(true);
  };

  const closeRolesDialog = () => {
    setIsRolesDialogOpen(false);
  };
  
  const handleToggleRole = (roleToToggle: string) => {
    setTempRoles(prev => {
        const newRoles = new Set(prev);
        if (newRoles.has(roleToToggle)) {
            newRoles.delete(roleToToggle);
        } else {
            newRoles.add(roleToToggle);
        }
        return Array.from(newRoles);
    });
  };
  
  const handleSaveRoles = async () => {
    const nonTeamRoles = (member.roles || []).filter(role => !teamBadgeNames.includes(role));
    const newTeamRoles = tempRoles.filter(role => teamBadgeNames.includes(role));

    const finalRoles = [...new Set([...nonTeamRoles, ...newTeamRoles])];

    await updateUser(member.userId, { roles: finalRoles });
    toast({
        title: 'Badges Updated',
        description: `Badges for ${member.displayName} have been updated.`
    });
    closeRolesDialog();
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
            <div className="flex items-center gap-1">
                <h4 className="text-sm font-medium">Team Badges</h4>
                {canManageRoles && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenRolesDialog}>
                        <GoogleSymbol name="edit" className="text-base" />
                        <span className="sr-only">Edit badges for {member.displayName}</span>
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-1 min-h-[24px]">
              {(member.roles && member.roles.length > 0) ? (
                (member.roles || []).map(roleName => {
                    const roleInfo = allBadges.find(r => r.name === roleName) || appSettings.customAdminRoles.find(r => r.name === roleName);
                    return (
                        <Badge
                            key={roleName}
                            variant="outline"
                            style={roleInfo ? { color: roleInfo.color, borderColor: roleInfo.color } : {}}
                            className={cn(
                                "rounded-full gap-1.5 pl-2",
                                !roleInfo && "opacity-50"
                            )}
                        >
                            {roleInfo && <GoogleSymbol name={roleInfo.icon} className="text-sm" />}
                            <span>{roleName}</span>
                        </Badge>
                    )
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">No badges assigned.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isRolesDialogOpen} onOpenChange={(isOpen) => !isOpen && closeRolesDialog()}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveRoles}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Save Roles</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle>Edit Badges for {member.displayName}</DialogTitle>
                <DialogDescription>Assign or remove badges specific to the {team.name} team.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-2 min-h-[56px]">
                    {team.badgeCollections.flatMap(c => c.badges).map(badge => {
                        const isAssigned = tempRoles.includes(badge.name);
                        return (
                        <Badge
                            key={badge.name}
                            variant={'outline'}
                            style={isAssigned ? { color: badge.color, borderColor: badge.color } : {}}
                            className={cn(
                                'gap-1.5 p-1 px-3 cursor-pointer rounded-full text-sm',
                                isAssigned ? 'border-2' : 'border-dashed'
                            )}
                            onClick={() => handleToggleRole(badge.name)}
                        >
                            <GoogleSymbol name={badge.icon} className="text-base" />
                            {badge.name}
                        </Badge>
                        );
                    })}

                    {team.badgeCollections.flatMap(c => c.badges).length > 0 && otherRolesForMember.length > 0 && (
                        <div className="w-full my-1 border-t"></div>
                    )}

                    {otherRolesForMember.map(role => (
                        <TooltipProvider key={role}>
                            <Tooltip>
                                <TooltipTrigger>
                                     <Badge
                                        variant={'outline'}
                                        className={cn('gap-1.5 p-1 px-3 rounded-full text-sm opacity-50 cursor-not-allowed')}
                                    >
                                        {role}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>This role is managed by another team or is a system role.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground text-right pr-2 mt-2">
                    Click a pill to toggle the badge.
                </p>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
