
"use client";

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User } from '@/types';
import { type IconName, iconNames, DynamicIcon } from '@/components/icons/dynamic-icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function TeamManagement() {
  const { users, teams, addTeam, updateTeam, deleteTeam } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const openAddDialog = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setEditingTeam(team);
    setIsDeleteDialogOpen(true);
  };
  
  const closeForm = () => {
      setIsFormOpen(false);
      setEditingTeam(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Teams</CardTitle>
              <CardDescription>Add, edit, or delete teams and their members.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={openAddDialog}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Add New Team</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
              {teams.map(team => (
                <Button key={team.id} variant="outline" className="h-auto font-medium" onClick={() => openEditDialog(team)}>
                    {team.name}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
          <TeamFormDialog 
            isOpen={isFormOpen}
            onClose={closeForm}
            team={editingTeam}
            allUsers={users}
            addTeam={addTeam}
            updateTeam={updateTeam}
            onDelete={openDeleteDialog}
          />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => !isOpen && setIsDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{editingTeam?.name}" team and all of its associated roles and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if(editingTeam) deleteTeam(editingTeam.id);
                setIsDeleteDialogOpen(false);
                closeForm();
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type TeamFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    allUsers: User[];
    addTeam: (teamData: Omit<Team, 'id'>) => Promise<void>;
    updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
    onDelete: (team: Team) => void;
};

function TeamFormDialog({ isOpen, onClose, team, allUsers, addTeam, updateTeam, onDelete }: TeamFormDialogProps) {
    const [name, setName] = useState(team?.name || '');
    const [icon, setIcon] = useState<IconName>(team?.icon as IconName || 'Users');
    const [members, setMembers] = useState<string[]>(team?.members || []);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const { toast } = useToast();

    const handleMemberToggle = (userId: string, isChecked: boolean) => {
        setMembers(prev => isChecked ? [...prev, userId] : prev.filter(id => id !== userId));
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Team name cannot be empty." });
            return;
        }

        if (team) { // Editing
            updateTeam(team.id, { name, icon, members });
            toast({ title: "Success", description: `Team "${name}" updated.` });
        } else { // Creating
            addTeam({
                name,
                icon,
                members,
                roles: [],
                pinnedLocations: []
            });
             toast({ title: "Success", description: `Team "${name}" created.` });
        }
        onClose();
    };

    const filteredUsers = useMemo(() => {
        if (!memberSearch) return allUsers;
        return allUsers.filter(user =>
            user.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(memberSearch.toLowerCase())
        );
    }, [allUsers, memberSearch]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <div className="grid gap-6 py-4">
                    <div className="relative">
                        <Input
                            id="team-name"
                            placeholder="Team Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pr-12 text-lg font-semibold"
                        />
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                            >
                                <DynamicIcon name={icon} className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-5 gap-2">
                                    {iconNames.map((iconName) => (
                                    <Button
                                        key={iconName}
                                        variant={icon === iconName ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => {
                                        setIcon(iconName);
                                        setIsIconPopoverOpen(false);
                                        }}
                                    >
                                        <DynamicIcon name={iconName} />
                                    </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <div className="flex min-h-[40px] flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-2">
                            {members.length > 0 ? (
                            members.map(userId => {
                                const user = allUsers.find(u => u.userId === userId);
                                if (!user) return null;
                                return (
                                <Badge key={user.userId} variant="secondary" className="gap-1.5 p-1 pl-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.displayName}</span>
                                    <button
                                    type="button"
                                    className="rounded-full p-0.5 hover:bg-background/50"
                                    onClick={() => handleMemberToggle(user.userId, false)}
                                    >
                                    <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                                );
                            })
                            ) : (
                            <p className="w-full text-center text-sm text-muted-foreground">No members yet.</p>
                            )}
                        </div>
                        <Popover open={isMemberPopoverOpen} onOpenChange={setIsMemberPopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-center">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add/Remove Members
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                            <div className="p-2">
                                <Input
                                placeholder="Search users..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-48">
                                <div className="p-1">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.userId}
                                        onClick={() => handleMemberToggle(user.userId, !members.includes(user.userId))}
                                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent"
                                    >
                                    <Checkbox
                                        checked={members.includes(user.userId)}
                                        readOnly
                                    />
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <DialogFooter>
                    {team && (
                        <Button variant="destructive" className="mr-auto" onClick={() => onDelete(team)}>
                            Delete Team
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
