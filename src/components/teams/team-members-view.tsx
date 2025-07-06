

'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab, type User } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect, useCallback } from 'react';
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
    
    const [teamMembers, setTeamMembers] = useState<User[]>([]);

    useEffect(() => {
      setTeamMembers(users.filter(u => team.members.includes(u.userId)));
    }, [users, team.members]);

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
        if (!destination) return;
        
        const reorderedMembers = Array.from(teamMembers);
        const [movedItem] = reorderedMembers.splice(source.index, 1);
        reorderedMembers.splice(destination.index, 0, movedItem);
        
        setTeamMembers(reorderedMembers);
        const newMemberIds = reorderedMembers.map(m => m.userId);
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
            <StrictModeDroppable droppableId="team-members-list" isDropDisabled={false}>
                {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className="flex flex-wrap -m-3"
                    >
                        {teamMembers.map((member, index) => (
                            <Draggable key={member.userId} draggableId={member.userId} index={index} ignoreContainerClipping={false}>
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
        </div>
      </DragDropContext>
    );
}

    