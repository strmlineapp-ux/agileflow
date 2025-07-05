

'use client';

import { useUser } from '@/context/user-context';
import { type Team, type AppTab } from '@/types';
import { TeamMemberCard } from './team-member-card';
import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TeamMembersView({ team, tab }: { team: Team; tab: AppTab }) {
    const { users, updateAppTab } = useUser();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const teamMembers = users.filter(u => team.members.includes(u.userId));

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

    return (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => (
                    <TeamMemberCard key={member.userId} member={member} team={team} />
                ))}
            </div>
        </div>
    );
}
