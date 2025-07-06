

'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useMemo } from 'react';
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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
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
    
    const onDragEnd = (result: DropResult) => {
      const { source, destination } = result;
      if (!destination || source.droppableId !== destination.droppableId) {
        return;
      }

      // Use the derived lists directly from `useMemo`
      const listToReorder = source.droppableId === 'admins-list' ? admins : members;
      const reorderedList = Array.from(listToReorder);
      const [movedItem] = reorderedList.splice(source.index, 1);
      reorderedList.splice(destination.index, 0, movedItem);

      // Reconstruct the full ordered list of IDs
      const newAdmins = source.droppableId === 'admins-list' ? reorderedList : admins;
      const newMembers = source.droppableId === 'members-list' ? reorderedList : members;
      const newMemberIds = [...newAdmins, ...newMembers].map(m => m.userId);

      // Update the single source of truth in the context
      updateTeam(team.id, { members: newMemberIds });
    };

    const renderMemberList = (userList: User[], droppableId: string, idPrefix: string) => (
      <StrictModeDroppable droppableId={droppableId} isDropDisabled={false}>
        {(provided) => (
          <div 
            ref={provided.innerRef} 
            {...provided.droppableProps} 
            className="flex flex-wrap -m-3"
          >
            {userList.map((member, index) => (
              <Draggable key={member.userId} draggableId={`${idPrefix}-${member.userId}`} index={index} ignoreContainerClipping={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn("p-3 basis-full md:basis-1/2 lg:basis-1/3", snapshot.isDragging && "opacity-80 shadow-xl")}
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
    );

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
                            <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
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
            
            <div className="space-y-4">
              <h3 className="font-headline font-thin text-xl">Team Admins</h3>
              {admins.length > 0 ? renderMemberList(admins, 'admins-list', 'admin') : (
                <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">No team admins assigned.</div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-headline font-thin text-xl">Members</h3>
              {members.length > 0 ? renderMemberList(members, 'members-list', 'member') : (
                <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">No other members in this team.</div>
              )}
            </div>
        </div>
      </DragDropContext>
    );
}
