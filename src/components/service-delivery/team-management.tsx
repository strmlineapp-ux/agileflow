
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { googleSymbolNames } from '@/lib/google-symbols';

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
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-semibold tracking-tight">Manage Teams</h2>
            <p className="text-muted-foreground">
                Add, edit, or delete teams and their members.
            </p>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => {
            const members = users.filter(u => team.members.includes(u.userId));
            const managers = users.filter(u => team.managers?.includes(u.userId));

            return (
              <Card 
                key={team.id} 
                className="flex flex-col"
              >
                  <CardHeader>
                      <div className="flex items-start justify-between">
                           <CardTitle className="flex items-center gap-2">
                              <GoogleSymbol name={team.icon} />
                              {team.name}
                          </CardTitle>
                          <div className="flex -mr-4 -mt-2">
                               <Button variant="ghost" size="icon" onClick={() => openEditDialog(team)}>
                                  <GoogleSymbol name="edit" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(team)}>
                                  <GoogleSymbol name="delete" />
                              </Button>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                      <div>
                          <h4 className="text-sm font-medium mb-2">Managers</h4>
                          <div className="flex items-center -space-x-2">
                              {managers.slice(0, 5).map(manager => (
                                  <Avatar key={manager.userId} className="h-8 w-8 border-2 border-card">
                                      <AvatarImage src={manager.avatarUrl} alt={manager.displayName} data-ai-hint="user avatar" />
                                      <AvatarFallback>{manager.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                              ))}
                              {managers.length > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                                      +{managers.length - 5}
                                  </div>
                              )}
                              {managers.length === 0 && <p className="text-xs text-muted-foreground">No managers</p>}
                          </div>
                      </div>
                      <div>
                           <h4 className="text-sm font-medium mb-2">Members</h4>
                          <div className="flex items-center -space-x-2">
                               {members.slice(0, 5).map(member => (
                                  <Avatar key={member.userId} className="h-8 w-8 border-2 border-card">
                                      <AvatarImage src={member.avatarUrl} alt={member.displayName} data-ai-hint="user avatar" />
                                      <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                              ))}
                              {members.length > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                                      +{members.length - 5}
                                  </div>
                              )}
                              {members.length === 0 && <p className="text-xs text-muted-foreground">No members</p>}
                          </div>
                      </div>
                  </CardContent>
              </Card>
            )
          })}
          <button
            onClick={openAddDialog}
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[220px]"
            >
             <div className="flex flex-col items-center gap-2">
                <GoogleSymbol name="add_circle" className="text-4xl" />
                <span className="font-semibold">New Team</span>
            </div>
          </button>
      </div>

      {isFormOpen && (
          <TeamFormDialog 
            isOpen={isFormOpen}
            onClose={closeForm}
            team={editingTeam}
            allUsers={users}
            addTeam={addTeam}
            updateTeam={updateTeam}
            onDeleteRequest={openDeleteDialog}
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
    onDeleteRequest: (team: Team) => void;
};

function TeamFormDialog({ isOpen, onClose, team, allUsers, addTeam, updateTeam, onDeleteRequest }: TeamFormDialogProps) {
    const [name, setName] = useState(team?.name || '');
    const [icon, setIcon] = useState<string>(team?.icon || 'group');
    const [members, setMembers] = useState<string[]>(team?.members || []);
    const [managers, setManagers] = useState<string[]>(team?.managers || []);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [iconSearch, setIconSearch] = useState('');
    const { toast } = useToast();

    const handleMemberToggleInPopover = (userId: string, isChecked: boolean) => {
        setMembers(prev => {
            const updatedMembers = isChecked ? [...prev, userId] : prev.filter(id => id !== userId);
            // If a user is removed from members, also remove them from managers
            if (!isChecked) {
                setManagers(currentManagers => currentManagers.filter(id => id !== userId));
            }
            return updatedMembers;
        });
    };

    const handleManagerToggle = (userId: string) => {
        setManagers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Team name cannot be empty." });
            return;
        }

        if (team) { // Editing
            updateTeam(team.id, { name, icon, members, managers });
            toast({ title: "Success", description: `Team "${name}" updated.` });
        } else { // Creating
            addTeam({
                name,
                icon,
                members,
                managers,
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

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                 <div className="absolute top-4 right-4 flex items-center gap-1">
                    {team && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteRequest(team)}
                        >
                            <GoogleSymbol name="delete" className="text-xl" />
                            <span className="sr-only">Delete team</span>
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={handleSave}
                    >
                        <GoogleSymbol name="check" className="text-xl" />
                        <span className="sr-only">Save Changes</span>
                    </Button>
                </div>

                <div className="grid gap-6 pt-6">
                    <div className="flex items-center gap-2">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                            >
                                <GoogleSymbol name={icon} className="text-2xl text-muted-foreground" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                                <div className="p-2 border-b">
                                    <Input 
                                        placeholder="Search icons..."
                                        value={iconSearch}
                                        onChange={(e) => setIconSearch(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-64">
                                <div className="grid grid-cols-6 gap-1 p-2">
                                    {filteredIcons.slice(0, 300).map((iconName) => ( // limit to 300 for performance
                                    <Button
                                        key={iconName}
                                        variant={icon === iconName ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => {
                                        setIcon(iconName);
                                        setIsIconPopoverOpen(false);
                                        }}
                                        className="text-2xl"
                                    >
                                        <GoogleSymbol name={iconName} />
                                    </Button>
                                    ))}
                                </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                        
                        <Input
                            id="team-name"
                            placeholder="Team Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg font-semibold flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-2">
                           
                            <Popover open={isMemberPopoverOpen} onOpenChange={setIsMemberPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-1">
                                        <GoogleSymbol name="add_circle" className="text-2xl" />
                                        <span className="sr-only">Add or remove members</span>
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
                                                onClick={() => handleMemberToggleInPopover(user.userId, !members.includes(user.userId))}
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

                            <div className="flex min-h-[40px] flex-wrap items-center gap-2 flex-1">
                                {members.length > 0 ? (
                                members.map(userId => {
                                    const user = allUsers.find(u => u.userId === userId);
                                    if (!user) return null;
                                    const isManager = managers.includes(userId);
                                    return (
                                    <Badge 
                                        key={user.userId} 
                                        variant={isManager ? 'default' : 'secondary'}
                                        className={cn("gap-1.5 p-1 pl-2 cursor-pointer", isManager && "shadow-md")}
                                        onClick={() => handleManagerToggle(userId)}
                                    >
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                            <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.displayName}</span>
                                    </Badge>
                                    );
                                })
                                ) : (
                                <p className="w-full text-center text-sm text-muted-foreground">No members yet. Click '+' to add.</p>
                                )}
                            </div>
                        </div>
                         <p className="text-xs text-muted-foreground text-right pr-2">Click member pills to toggle user manager status.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
