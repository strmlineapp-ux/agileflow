'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

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

  const handleDelete = () => {
    if (!editingTeam) return;
    deleteTeam(editingTeam.id);
    toast({ title: 'Success', description: `Team "${editingTeam.name}" has been deleted.` });
    setIsDeleteDialogOpen(false);
    closeForm(); // Also close form dialog if it was open
  };

  return (
    <>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">Manage Teams</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                    <GoogleSymbol name="add_circle" className="text-xl" />
                    <span className="sr-only">New Team</span>
                </Button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
                const teamAdmins = (team.teamAdmins || []).map(id => users.find(u => u.userId === id)).filter(Boolean) as User[];
                const teamMembers = team.members.filter(m => !(team.teamAdmins || []).includes(m)).map(id => users.find(u => u.userId === id)).filter(Boolean) as User[];

                return (
                    <Card key={team.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <GoogleSymbol name={team.icon} className="text-3xl" style={{ color: team.color }} />
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {team.name}
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(team)}>
                                            <GoogleSymbol name="edit" className="text-lg"/>
                                            <span className="sr-only">Edit Team</span>
                                        </Button>
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Team Admins</p>
                                <div className="flex flex-wrap gap-2 min-h-[34px]">
                                {teamAdmins.length > 0 ? (
                                    teamAdmins.map(user => (
                                        <Badge key={user.userId} variant="secondary" className="gap-1.5 p-1 pl-2 rounded-full">
                                            <Avatar className="h-5 w-5"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </Badge>
                                    ))
                                ) : <p className="text-sm text-muted-foreground italic px-2">No admins assigned.</p>}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Team Members</p>
                                 <div className="flex flex-wrap gap-2 min-h-[34px]">
                                {teamMembers.length > 0 ? (
                                    teamMembers.map(user => (
                                        <Badge key={user.userId} variant="secondary" className="gap-1.5 p-1 pl-2 rounded-full">
                                            <Avatar className="h-5 w-5"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </Badge>
                                    ))
                                ) : <p className="text-sm text-muted-foreground italic px-2">No other members.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
    const [color, setColor] = useState<string>(team?.color || '#64748B');
    const [members, setMembers] = useState<string[]>(team?.members || []);
    const [teamAdmins, setTeamAdmins] = useState<string[]>(team?.teamAdmins || []);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [iconSearch, setIconSearch] = useState('');
    const { toast } = useToast();

    const handleMemberToggleInPopover = (userId: string, isChecked: boolean) => {
        setMembers(prev => {
            const updatedMembers = isChecked ? [...prev, userId] : prev.filter(id => id !== userId);
            // If a user is removed from members, also remove them from admins
            if (!isChecked) {
                setTeamAdmins(currentAdmins => currentAdmins.filter(id => id !== userId));
            }
            return updatedMembers;
        });
    };

    const handleAdminToggle = (userId: string) => {
        setTeamAdmins(prev => 
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

        const teamData = {
            name,
            icon,
            color,
            members,
            teamAdmins,
        };

        if (team) { // Editing
            updateTeam(team.id, teamData);
            toast({ title: "Success", description: `Team "${name}" updated.` });
        } else { // Creating
            addTeam({
                ...teamData,
                locationCheckManagers: [],
                allBadges: [],
                badgeCollections: [],
                pinnedLocations: [],
                checkLocations: [],
                locationAliases: {},
                workstations: [],
                eventTemplates: [],
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
            <DialogContent className="max-w-md">
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
                <DialogHeader>
                    <DialogTitle>{team ? 'Edit Team' : 'New Team'}</DialogTitle>
                    <DialogDescription>Manage the team's name, icon, and members.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9"
                                    style={{ color }}
                                >
                                    <GoogleSymbol name={icon} className="text-2xl" />
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
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: color }} />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">
                                    {predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {setColor(c); setIsColorPopoverOpen(false);}}/>))}
                                    <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                        <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                    </div>
                                </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        
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
                                    const isAdmin = teamAdmins.includes(userId);
                                    return (
                                    <Badge 
                                        key={user.userId} 
                                        variant={isAdmin ? 'default' : 'secondary'}
                                        className={cn("gap-1.5 p-1 pl-2 cursor-pointer rounded-full", isAdmin && "shadow-md")}
                                        onClick={() => handleAdminToggle(userId)}
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
                         <p className="text-xs text-muted-foreground text-right pr-2">Click member pills to toggle Team Admin status.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
