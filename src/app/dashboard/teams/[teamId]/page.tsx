

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { BadgeManagement } from '@/components/teams/badge-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkstationManagement } from '@/components/settings/workstation-management';
import { EventTemplateManagement } from '@/components/teams/event-template-management';
import { Input } from '@/components/ui/input';
import { AppTab } from '@/types';

const componentMap: Record<string, React.ComponentType<{ team: any, tab: AppTab }>> = {
  team_members: TeamMembersView,
  badges: BadgeManagement,
  locations: PinnedLocationManagement,
  workstations: WorkstationManagement,
  templates: EventTemplateManagement,
};

const PAGE_ID = 'page-team-management';

export default function TeamPage() {
  const { teamId } = useParams();
  const { viewAsUser, teams, appSettings, updateTeam } = useUser();
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const team = teams.find(t => t.id === teamId);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    if (team && nameInputRef.current) {
        const newName = nameInputRef.current.value.trim();
        if (newName && newName !== team.name) {
            updateTeam(team.id, { name: newName });
        }
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSaveName();
    } else if (e.key === 'Escape') {
        setIsEditingName(false);
    }
  };

  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);
  
  if (!team || !pageConfig) {
    return (
      <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    );
  }
  
  const isTeamAdmin = team.teamAdmins?.includes(viewAsUser.userId);
  const isServiceAdmin = appSettings.adminGroups.some(group => viewAsUser.roles?.includes(group.name));
  const canViewPage = viewAsUser.isAdmin || isServiceAdmin || isTeamAdmin;

  if (!canViewPage) {
     return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
        {isEditingName ? (
            <Input
                ref={nameInputRef}
                defaultValue={team.name}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="h-auto p-0 font-headline text-3xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        ) : (
            <h1 className="font-headline text-3xl font-semibold cursor-pointer" onClick={() => setIsEditingName(true)}>
                {team.name} Team Management
            </h1>
        )}
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className={`grid w-full grid-cols-${pageTabs.length}`}>
            {pageTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>{tab.name}</TabsTrigger>
            ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {ContentComponent ? <ContentComponent team={team} tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
