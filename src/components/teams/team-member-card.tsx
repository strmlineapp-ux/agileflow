
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TeamMemberCard({ member, team }: { member: User, team: Team }) {
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [tempRoles, setTempRoles] = useState<string[]>([]);
  const [roleToAdd, setRoleToAdd] = useState('');

  const canManageRoles = viewAsUser.roles?.includes('Admin') || team.managers?.includes(viewAsUser.userId);

  const teamSpecificRoles = (member.roles || []).filter(role => team.roles.includes(role));

  const handleOpenRolesDialog = () => {
    setTempRoles(member.roles || []);
    setIsRolesDialogOpen(true);
  };

  const closeRolesDialog = () => {
    setIsRolesDialogOpen(false);
    setRoleToAdd('');
  };

  const handleAddRoleToTemp = () => {
    if (roleToAdd && !tempRoles.includes(roleToAdd)) {
        setTempRoles(prev => [...prev, roleToAdd]);
        setRoleToAdd('');
    }
  };

  const handleRemoveRoleFromTemp = (roleToRemove: string) => {
    setTempRoles(prev => prev.filter(role => role !== roleToRemove));
  };
  
  const handleSaveRoles = async () => {
    // We only modify the roles that are part of this team's role list.
    const nonTeamRoles = (member.roles || []).filter(role => !team.roles.includes(role));
    const newTeamRoles = tempRoles.filter(role => team.roles.includes(role));

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
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Team Roles</h4>
                {canManageRoles && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenRolesDialog}>
                        <GoogleSymbol name="edit" className="text-lg" />
                        <span className="sr-only">Edit roles for {member.displayName}</span>
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-1 min-h-[24px]">
              {teamSpecificRoles.length > 0 ? (
                teamSpecificRoles.map(role => <Badge key={role} variant="secondary">{role}</Badge>)
              ) : (
                <p className="text-xs text-muted-foreground italic">No team roles assigned.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isRolesDialogOpen} onOpenChange={(isOpen) => !isOpen && closeRolesDialog()}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Roles for {member.displayName}</DialogTitle>
                <DialogDescription>Assign or remove roles specific to the {team.name} team.</DialogDescription>
            </DialogHeader>
             <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Assigned Roles</h4>
                    <div className="p-1 max-h-48 overflow-y-auto space-y-2">
                        {tempRoles.filter(r => team.roles.includes(r)).length > 0 ? (
                            tempRoles.filter(r => team.roles.includes(r)).map(role => (
                                <div key={role} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                    <span className="text-sm">{role}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRoleFromTemp(role)}>
                                        <GoogleSymbol name="close" />
                                        <span className="sr-only">Remove {role}</span>
                                    </Button>
                                </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No team roles assigned.</p>}
                    </div>
                </div>
                    <div className="space-y-2">
                    <h4 className="font-medium text-sm">Add Role</h4>
                    <div className="flex items-center gap-2">
                        <Select value={roleToAdd} onValueChange={setRoleToAdd}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role to add" />
                            </SelectTrigger>
                            <SelectContent>
                                {team.roles.filter(r => !tempRoles.includes(r)).map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddRoleToTemp} disabled={!roleToAdd}>Add</Button>
                    </div>
                    </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={closeRolesDialog}>Cancel</Button>
                <Button onClick={handleSaveRoles}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
