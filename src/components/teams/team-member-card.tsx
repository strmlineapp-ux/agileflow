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
import { getContrastColor } from '@/lib/utils';

export function TeamMemberCard({ member, team }: { member: User, team: Team }) {
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [tempRoles, setTempRoles] = useState<string[]>([]);

  const canManageRoles = viewAsUser.roles?.includes('Admin') || team.managers?.includes(viewAsUser.userId);

  const teamRoleNames = team.roles.map(r => r.name);
  const memberTeamRoles = (member.roles || []).filter(roleName => teamRoleNames.includes(roleName));
  const otherTeamRolesForMember = (member.roles || []).filter(roleName => !teamRoleNames.includes(roleName) && roleName !== 'Admin');


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
    const nonTeamRoles = (member.roles || []).filter(role => !teamRoleNames.includes(role));
    const newTeamRoles = tempRoles.filter(role => teamRoleNames.includes(role));

    const finalRoles = [...new Set([...nonTeamRoles, ...newTeamRoles])];

    await updateUser(member.userId, { roles: finalRoles });
    toast({
        title: 'Roles Updated',
        description: `Roles for ${member.displayName} have been updated.`
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
                <h4 className="text-sm font-medium">Team Roles</h4>
                {canManageRoles && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenRolesDialog}>
                        <GoogleSymbol name="edit" className="text-base" />
                        <span className="sr-only">Edit roles for {member.displayName}</span>
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-1 min-h-[24px]">
              {(member.roles || []).filter(r => r !== 'Admin').length > 0 ? (
                (member.roles || []).filter(r => r !== 'Admin').map(roleName => {
                    const roleInfo = team.roles.find(r => r.name === roleName);
                    return (
                        <Badge 
                            key={roleName} 
                            style={roleInfo ? { backgroundColor: roleInfo.color, color: getContrastColor(roleInfo.color) } : {}}
                            variant={roleInfo ? "default" : "secondary"}
                            className={cn(
                                "rounded-full gap-1.5 pl-2",
                                !roleInfo && "opacity-50",
                                roleInfo && "border-transparent"
                            )}
                        >
                            {roleInfo && <GoogleSymbol name={roleInfo.icon} className="text-sm" />}
                            <span>{roleName}</span>
                        </Badge>
                    )
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">No roles assigned.</p>
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
                <DialogTitle>Edit Roles for {member.displayName}</DialogTitle>
                <DialogDescription>Assign or remove roles specific to the {team.name} team.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-2 min-h-[56px]">
                    {team.roles.map(role => {
                        const isAssigned = tempRoles.includes(role.name);
                        return (
                        <Badge
                            key={role.name}
                            variant={isAssigned ? 'default' : 'secondary'}
                            style={isAssigned ? { backgroundColor: role.color, color: getContrastColor(role.color) } : {}}
                            className={cn(
                                'gap-1.5 p-1 px-3 cursor-pointer rounded-full text-sm', 
                                isAssigned && 'shadow-md border-transparent'
                            )}
                            onClick={() => handleToggleRole(role.name)}
                        >
                            <GoogleSymbol name={role.icon} className="text-base" />
                            {role.name}
                        </Badge>
                        );
                    })}

                    {team.roles.length > 0 && otherTeamRolesForMember.length > 0 && (
                        <div className="w-full my-1 border-t"></div>
                    )}

                    {otherTeamRolesForMember.map(role => (
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
                                    <p>This role is managed by another team.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground text-right pr-2 mt-2">
                    Click a pill to toggle the role.
                </p>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
