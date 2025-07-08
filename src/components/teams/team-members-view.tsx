
'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';

// Wrapper to fix issues with react-beautiful-dnd and React 18 Strict Mode
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};


export function TeamMembersView({ team, tab }: { team: Team; tab: AppTab }) {
    const { users, updateAppTab, updateTeam } = useUser();
    
    // States for inline editing page tab title
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    // States for inline editing sub-headers
    const [isEditingAdminsLabel, setIsEditingAdminsLabel] = useState(false);
    const [isEditingMembersLabel, setIsEditingMembersLabel] = useState(false);
    const adminsLabelInputRef = useRef<HTMLInputElement>(null);
    const membersLabelInputRef = useRef<HTMLInputElement>(null);

    const teamAdminsLabel = team.teamAdminsLabel || 'Team Admins';
    const membersLabel = team.membersLabel || 'Members';
    
    // Derive members directly from context/props to ensure a single source of truth.
    const teamMembers = useMemo(() => {
        return team.members
            .map(id => users.find(u => u.userId === id))
            .filter((u): u is User => !!u);
    }, [users, team.members]);

    const admins = useMemo(() => teamMembers.filter(m => team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);
    const members = useMemo(() => teamMembers.filter(m => !team.teamAdmins?.includes(m.userId)), [teamMembers, team.teamAdmins]);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
        if (isEditingAdminsLabel) adminsLabelInputRef.current?.focus();
        if (isEditingMembersLabel) membersLabelInputRef.current?.focus();
    }, [isEditingTitle, isEditingAdminsLabel, isEditingMembersLabel]);

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
    
    const handleSaveAdminsLabel = useCallback(() => {
        const newLabel = adminsLabelInputRef.current?.value.trim();
        if (newLabel && newLabel !== teamAdminsLabel) {
            updateTeam(team.id, { teamAdminsLabel: newLabel });
        }
        setIsEditingAdminsLabel(false);
    }, [team.id, teamAdminsLabel, updateTeam]);

    const handleAdminsLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveAdminsLabel();
        else if (e.key === 'Escape') setIsEditingAdminsLabel(false);
    };
    
    const handleSaveMembersLabel = useCallback(() => {
        const newLabel = membersLabelInputRef.current?.value.trim();
        if (newLabel && newLabel !== membersLabel) {
            updateTeam(team.id, { membersLabel: newLabel });
        }
        setIsEditingMembersLabel(false);
    }, [team.id, membersLabel, updateTeam]);

    const handleMembersLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveMembersLabel();
        else if (e.key === 'Escape') setIsEditingMembersLabel(false);
    };
    
    const onDragEnd = (result: DropResult) => {
      const { source, destination } = result;
      if (!destination || source.droppableId !== destination.droppableId) {
        return;
      }

      const isAdminList = source.droppableId === 'admins-list';
      const listToReorder = isAdminList ? admins : members;
      
      const reorderedList = Array.from(listToReorder);
      const [movedItem] = reorderedList.splice(source.index, 1);
      reorderedList.splice(destination.index, 0, movedItem);

      // Reconstruct the full ordered list of IDs
      const newAdmins = isAdminList ? reorderedList : admins;
      const newMembers = !isAdminList ? reorderedList : members;
      
      // Combine the two lists to get the new full `members` order for the team
      const newMemberIds = [...newAdmins, ...newMembers].map(m => m.userId);

      updateTeam(team.id, { members: newMemberIds });
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                {isEditingTitle ? (
                  <Input ref={titleInputRef} defaultValue={tab.name} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                        </TooltipTrigger>
                         {tab.description && (
                            <TooltipContent>
                                <p className="max-w-xs">{tab.description}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                  </TooltipProvider>
                )}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3 lg:max-w-sm space-y-4">
                    {isEditingAdminsLabel ? (
                        <Input
                            ref={adminsLabelInputRef}
                            defaultValue={teamAdminsLabel}
                            onBlur={handleSaveAdminsLabel}
                            onKeyDown={handleAdminsLabelKeyDown}
                            className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    ) : (
                         <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => setIsEditingAdminsLabel(true)}>
                            {teamAdminsLabel}
                         </h3>
                    )}
                    {admins.length > 0 ? (
                        <StrictModeDroppable droppableId="admins-list">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                    {admins.map((member, index) => (
                                        <Draggable key={member.userId} draggableId={`admin-${member.userId}`} index={index} ignoreContainerClipping={false}>
                                        {(provided, snapshot) => (
                                            <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(snapshot.isDragging && "opacity-80 shadow-xl")}
                                            >
                                            <TeamMemberCard member={member} team={team} />
                                            </div>
                                        )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">No team admins assigned.</div>
                    )}
                </div>

                <div className="flex-1 space-y-4">
                     {isEditingMembersLabel ? (
                        <Input
                            ref={membersLabelInputRef}
                            defaultValue={membersLabel}
                            onBlur={handleSaveMembersLabel}
                            onKeyDown={handleMembersLabelKeyDown}
                            className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    ) : (
                         <h3 className="font-headline font-thin text-xl cursor-text" onClick={() => setIsEditingMembersLabel(true)}>
                            {membersLabel}
                         </h3>
                    )}
                    {members.length > 0 && (
                        <StrictModeDroppable droppableId="members-list">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap -m-3">
                                {members.map((member, index) => (
                                    <Draggable key={member.userId} draggableId={`member-${member.userId}`} index={index} ignoreContainerClipping={false}>
                                    {(provided, snapshot) => (
                                        <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn("p-3 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0", snapshot.isDragging && "opacity-80 shadow-xl")}
                                        >
                                        <TeamMemberCard member={member} team={team} />
                                        </div>
                                    )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    )}
                </div>
            </div>
        </div>
      </DragDropContext>
    );
}
