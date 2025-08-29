

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type Team, type User, type AppTab, type AppPage, type AppSettings, type BadgeCollectionOwner } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn, getHueFromHsl, isHueInRange } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { DraggableGrid } from '../common/draggable-grid';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { TeamCard } from './team-card';
import { SortableItem } from '../common/sortable-item';


function TeamManagementDropZone({id, type, children, className}: {id: string, type: string, children: React.ReactNode, className?: string}) {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type } });
    
    return (
        <div ref={setNodeRef} className={cn(className, isOver && "ring-1 ring-border ring-inset", "transition-all rounded-lg")}>
            {children}
        </div>
    )
}

function DuplicateZone({ id, onAdd }: { id: string; onAdd: () => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all p-0.5",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={onAdd} onPointerDown={(e) => e.stopPropagation()}>
                    <GoogleSymbol name="add_circle" className="text-4xl" />
                    <span className="sr-only">New Team or Drop to Duplicate</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{isOver ? 'Drop to Duplicate' : 'Add New Team'}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function TeamManagement({ tab, page, isSingleTabPage = false }: { tab: AppTab; page: AppPage; isSingleTabPage?: boolean }) {
    const { viewAsUser, users, teams, appSettings, addTeam, updateTeam, deleteTeam, reorderTeams, updateAppTab, updateUser } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    
    const [searchTerm, setSearchTerm] = useState('');
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    
    const pageTitle = page.isDynamic && teams.find(t => t.id === page.path.split('/')[2]) ? `${teams.find(t => t.id === page.path.split('/')[2])?.name} ${page.name}` : page.name;
    const tabTitle = appSettings.teamManagementLabel || tab.name;
    const finalTitle = isSingleTabPage ? pageTitle : tabTitle;
    
    const onToggleExpand = useCallback((teamId: string) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    }, []);

    const canManageTeam = useCallback((team: Team) => {
        if (!viewAsUser) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [viewAsUser]);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    const handleSaveTitle = () => {
        const newName = titleInputRef.current?.value.trim();
        if (newName && newName !== tab.name) {
            updateAppTab(tab.id, { name: newName });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        else if (e.key === 'Escape') setIsEditingTitle(false);
    };

    const handleAddTeam = (sourceTeam?: Team) => {
        const owner: BadgeCollectionOwner = { type: 'user', id: viewAsUser!.userId };
        let newTeamData: Omit<Team, 'id'>;

        if (sourceTeam) {
            newTeamData = {
                ...JSON.parse(JSON.stringify(sourceTeam)),
                name: `${sourceTeam.name} (Copy)`,
                owner,
                isShared: false,
                members: sourceTeam.members,
                teamAdmins: sourceTeam.teamAdmins,
            };
        } else {
             newTeamData = {
                name: `New Team ${teams.length + 1}`,
                icon: 'group',
                color: '#64748B',
                owner: owner,
                isShared: false,
                members: [],
                teamAdmins: [],
                locationCheckManagers: [],
                activeBadgeCollections: [],
            };
        }
        
        addTeam(newTeamData);
    };

    const handleUpdate = (teamId: string, data: Partial<Team>) => updateTeam(teamId, data);
    
    const handleDelete = (team: Team) => {
        if (canManageTeam(team)) {
            setTeamToDelete(team);
        } else {
            const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== team.id);
            updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
            toast({ title: "Team Unlinked", description: `"${team.name}" has been unlinked from your board.`});
        }
    };
    
    const handleAddUserToTeam = (teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || team.members.includes(userId)) return;
        if (!canManageTeam(team)) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to manage this team.' });
            return;
        }
        const updatedMembers = [...team.members, userId];
        updateTeam(teamId, { members: updatedMembers });
        toast({ title: "User Added" });
    };
    
    const handleSetAdmin = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team || !canManageTeam(team)) return;
        
        const currentAdmins = new Set(team.teamAdmins || []);
        if (currentAdmins.has(userId)) {
            currentAdmins.delete(userId);
        } else {
            currentAdmins.add(userId);
        }
        updateTeam(teamId, { teamAdmins: Array.from(currentAdmins) });
    }, [teams, updateTeam, canManageTeam, toast]);

    const handleRemoveUserFromTeam = useCallback((teamId: string, userId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        if (!canManageTeam(team)) {
             toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot remove users from this team.' });
            return;
        }
        
        const updatedMembers = team.members.filter(id => id !== userId);
        const newTeamAdmins = (team.teamAdmins || []).filter(id => id !== userId);
        updateTeam(teamId, { members: updatedMembers, teamAdmins: newTeamAdmins });
        toast({ title: 'User Removed' });

        if (viewAsUser.userId === userId) {
            const currentPageId = page.path.split('/')[2];
            if (teamId === currentPageId) {
                router.push('/dashboard/notifications');
            }
        }
    }, [teams, updateTeam, toast, canManageTeam, viewAsUser.userId, page.path, router]);

    const confirmDelete = () => {
        if (!teamToDelete) return;
        deleteTeam(teamToDelete.id, router, pathname);
        setTeamToDelete(null);
    };
    
    const displayedTeams = useMemo(() => {
        if (!viewAsUser) return [];

        const teamIdSet = new Set([
            ...(viewAsUser.memberOfTeamIds || []),
            ...teams.filter(t => t.owner.id === viewAsUser.userId).map(t => t.id),
            ...(viewAsUser.linkedTeamIds || [])
        ]);

        let filtered = Array.from(teamIdSet)
            .map(id => teams.find(t => t.id === id))
            .filter((t): t is Team => !!t)
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

        if (colorFilter) {
            const targetHue = getHueFromHsl(colorFilter);
            if (targetHue !== null) {
                filtered = filtered.filter(t => {
                    const itemHue = getHueFromHsl(t.color);
                    return itemHue !== null && isHueInRange(targetHue, itemHue);
                });
            }
        }
        return filtered;
    }, [teams, viewAsUser, searchTerm, colorFilter]);

    const sharedTeams = useMemo(() => {
        const displayedIds = new Set(displayedTeams.map(c => c.id));
        return teams
            .filter(team => team.isShared && team.owner.id !== viewAsUser.userId && !displayedIds.has(team.id))
            .filter(t => t.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [teams, displayedTeams, viewAsUser.userId, sharedSearchTerm]);

    const onDragEnd = (result: DragEndEvent) => {
        const { active, over } = result;
        if (!over) return;
        
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
        
        if (activeType === 'user') {
            const user = active.data.current?.user as User;
            const destTeamId = over.data.current?.teamId;
            if (destTeamId && user) {
                handleAddUserToTeam(destTeamId, user.userId);
            }
            return;
        }

        if (activeType === 'team-card') {
             if (over.id === 'shared-teams-panel') {
                const teamToDrop = teams.find(t => t.id === active.id) as Team;
                if (!teamToDrop) return;

                const isOwner = teamToDrop.owner.id === viewAsUser.userId;
                if (isOwner) {
                    updateTeam(teamToDrop.id, { isShared: !teamToDrop.isShared });
                    toast({ title: teamToDrop.isShared ? 'Team Unshared' : 'Team Shared' });
                } else { 
                    const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== teamToDrop.id);
                    updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
                    toast({ title: "Team Unlinked", description: `"${teamToDrop.name}" has been unlinked.`});
                }
                return;
            }

            if(active.data.current?.isSharedPreview && over.id === 'teams-list') {
                 updateUser(viewAsUser.userId, { 
                    linkedTeamIds: Array.from(new Set([...(viewAsUser.linkedTeamIds || []), active.id as string]))
                });
                toast({ title: 'Team Linked' });
                return;
            }
            
            if (over.id === 'duplicate-team-zone') {
                 const teamToDuplicate = displayedTeams.find(t => t.id === active.id) || sharedTeams.find(t => t.id === active.id);
                 if(teamToDuplicate) {
                    handleAddTeam(teamToDuplicate);
                    const wasLinked = (viewAsUser.linkedTeamIds || []).includes(teamToDuplicate.id);
                    if (wasLinked) {
                        const updatedLinkedTeamIds = (viewAsUser.linkedTeamIds || []).filter(id => id !== teamToDuplicate.id);
                        updateUser(viewAsUser.userId, { linkedTeamIds: updatedLinkedTeamIds });
                        toast({ title: 'Team Copied', description: 'A new, independent team has been created.' });
                    }
                }
                return;
            }

            const overIsCard = over.data.current?.type === 'team-card';
            if (overIsCard && active.id !== over.id) {
                const oldIndex = displayedTeams.findIndex(t => t.id === active.id);
                const newIndex = displayedTeams.findIndex(t => t.id === over.id);
                if (oldIndex > -1 && newIndex > -1) {
                  reorderTeams(arrayMove(displayedTeams, oldIndex, newIndex));
                }
            }
        }
    };
    
    const renderTeamCard = (team: Team) => (
      <SortableItem key={team.id} id={team.id} data={{ type: 'team-card', team, isSharedPreview: false }}>
        {(isDragging) => (
          <TeamCard
            team={team}
            users={users}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onRemoveUser={handleRemoveUserFromTeam}
            onAddUser={handleAddUserToTeam}
            onSetAdmin={handleSetAdmin}
            isDragging={isDragging}
            isExpanded={expandedTeams.has(team.id)}
            onToggleExpand={() => onToggleExpand(team.id)}
          />
        )}
      </SortableItem>
    );

    const renderSharedTeamCard = (team: Team) => (
      <SortableItem key={team.id} id={team.id} data={{ type: 'team-card', team, isSharedPreview: true }}>
         {(isDragging) => (
          <TeamCard
            team={team}
            users={users}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onRemoveUser={handleRemoveUserFromTeam}
            onAddUser={handleAddUserToTeam}
            onSetAdmin={handleSetAdmin}
            isSharedPreview={true}
            isDragging={isDragging}
            isExpanded={expandedTeams.has(team.id)}
            onToggleExpand={() => onToggleExpand(team.id)}
          />
        )}
      </SortableItem>
    );
    
    const renderDragOverlay = (item: Team | User) => {
        if ('members' in item) { // It's a Team
            return <GoogleSymbol name={item.icon} style={{ color: item.color, fontSize: '48px' }} />;
        }
        // It's a User
        return (
            <Avatar className="h-12 w-12">
                <AvatarImage src={item.avatarUrl} alt={item.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{item.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
        );
    };

    return (
        <div className="flex gap-4 h-full">
            <DraggableGrid
                items={displayedTeams}
                onDragEnd={onDragEnd}
                renderItem={renderTeamCard}
                renderDragOverlay={renderDragOverlay}
                setItems={reorderTeams}
                className="flex-1"
            >
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        {isEditingTitle ? (
                            <Input ref={titleInputRef} defaultValue={finalTitle} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <h2 className="tracking-tight cursor-pointer" onClick={() => setIsEditingTitle(true)}>{finalTitle}</h2>
                                    </TooltipTrigger>
                                    {tab.description && (
                                        <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <DuplicateZone id="duplicate-team-zone" onAdd={() => handleAddTeam()} />
                    </div>
                    <div className="flex items-center gap-1">
                        <CompactSearchInput
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          placeholder="Search teams..."
                          showColorFilter={true}
                          onColorSelect={setColorFilter}
                          activeColorFilter={colorFilter}
                        />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                        <GoogleSymbol name="dynamic_feed" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Show Shared Teams</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </DraggableGrid>
            <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96 p-2" : "w-0 p-0")}>
                <TeamManagementDropZone id="shared-teams-panel" type="team-card" className="h-full">
                    <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Shared Teams</CardTitle>
                                <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." tooltipText="Search Shared Teams" />
                            </div>
                            <CardDescription>Drag a team you own here to share it. Drag a team to your board to link it.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-2 overflow-hidden">
                            <DraggableGrid
                                items={sharedTeams}
                                onDragEnd={onDragEnd}
                                renderItem={renderSharedTeamCard}
                                renderDragOverlay={renderDragOverlay}
                                setItems={() => {}}
                            >
                                {sharedTeams.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No other teams are currently shared.</p>}
                            </DraggableGrid>
                        </CardContent>
                    </Card>
                </TeamManagementDropZone>
            </div>
            <Dialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
                <DialogContent className="max-w-md">
                    <div className="absolute top-4 right-4">
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="text-destructive p-0" onClick={confirmDelete}>
                                        <GoogleSymbol name="delete" className="text-4xl" />
                                        <span className="sr-only">Delete Team</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Team</p></TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                    </div>
                    <DialogHeader>
                        <UIDialogTitle className="font-headline font-thin">Delete "{teamToDelete?.name}"?</UIDialogTitle>
                        <DialogDescription>This action cannot be undone. This will permanently delete the team and all of its associated data.</DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}
