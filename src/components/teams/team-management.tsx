

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
import { InlineEditor } from '../common/inline-editor';
import { ScrollArea } from '../ui/scroll-area';
import { SharedItemsPanel } from '../common/shared-items-panel';
import { ManagementPageLayout } from '../common/management-page-layout';

export function TeamManagement({ tab, page, isSingleTabPage = false, isActive = false, isSharedPanelOpen, setIsSharedPanelOpen, isDragging }: { tab: AppTab; page: AppPage; isSingleTabPage?: boolean; isActive?: boolean; isSharedPanelOpen: boolean; setIsSharedPanelOpen: (isOpen: boolean) => void; isDragging: boolean; }) {
    const { viewAsUser, users, teams, addTeam, updateTeam, deleteTeam, reorderTeams, updatePage, updateUser } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const contextKey = `teams-${page.id}`;
    
    const onToggleExpand = useCallback((teamId: string) => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        const currentExpanded = new Set(currentState[contextKey] || []);
        if (currentExpanded.has(teamId)) {
            currentExpanded.delete(teamId);
        } else {
            currentExpanded.add(teamId);
        }
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: Array.from(currentExpanded) } });
    }, [viewAsUser, updateUser, contextKey]);

    const canManageTeam = useCallback((team: Team) => {
        if (!viewAsUser) return false;
        return team.owner.id === viewAsUser.userId || (team.teamAdmins || []).includes(viewAsUser.userId);
    }, [viewAsUser]);
    
    const handleUpdate = (teamId: string, data: Partial<Team>) => updateTeam(teamId, data);
    
    const handleDelete = (team: Team) => {
        const isOwner = team.owner.id === viewAsUser.userId;
        if (isOwner) {
            deleteTeam(team.id, router, pathname);
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

    }, [teams, updateTeam, toast, canManageTeam]);
    
    const handleAddTeam = (sourceTeam?: Team) => {
        addTeam(sourceTeam || {});
        toast({ title: sourceTeam ? 'Team Duplicated' : 'New Team Added' });
    };

    const handleLinkTeam = (teamId: string) => {
        const updatedLinkedIds = [...(viewAsUser.linkedTeamIds || []), teamId];
        updateUser(viewAsUser.userId, { linkedTeamIds: Array.from(new Set(updatedLinkedIds)) });
        toast({ title: 'Team Linked' });
    };

    const allTeams = useMemo(() => {
         return teams
            .filter(t => t.owner && (t.owner.id === viewAsUser.userId || (viewAsUser.linkedTeamIds || []).includes(t.id)));
    }, [teams, viewAsUser]);

    const sharedTeams = useMemo(() => {
        const displayedIds = new Set(allTeams.map(c => c.id));
        return teams.filter(c => c.isShared && c.owner && c.owner.id !== viewAsUser.userId && !displayedIds.has(c.id));
    }, [teams, allTeams, viewAsUser.userId]);

    const renderTeamCard = (team: Team, isDragging: boolean) => {
        const expandedCardIds = viewAsUser?.expandedCardState?.[contextKey] || [];
        return (
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
                isExpanded={expandedCardIds.includes(team.id)}
                onToggleExpand={() => onToggleExpand(team.id)}
              />
            )}
          </SortableItem>
    )};

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
        <ManagementPageLayout
            pageTitle={page.displayTitle ?? tab.name}
            onPageTitleSave={(newTitle) => updatePage(page.id, { displayTitle: newTitle })}
            onPageTitleReset={(e) => {
                if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
                    e.preventDefault();
                    updatePage(page.id, { displayTitle: null });
                    toast({ title: "Title Reset" });
                }
            }}
            canManagePage={viewAsUser.isAdmin}
            entityType="team"
            allItems={allTeams}
            allSharedItems={sharedTeams}
            onAddItem={handleAddTeam}
            onUpdateItem={handleUpdate}
            onDeleteItem={handleDelete}
            onReorderItems={reorderTeams}
            onLinkItem={handleLinkTeam}
            renderItem={renderTeamCard}
            renderDragOverlay={renderDragOverlay}
            isActive={isActive}
            isSharedPanelOpen={isSharedPanelOpen}
            setIsSharedPanelOpen={setIsSharedPanelOpen}
            isDragging={isDragging}
        />
    );
}
