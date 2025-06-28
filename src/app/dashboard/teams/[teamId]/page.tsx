

'use client';

import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkstationManagement } from '@/components/settings/workstation-management';

export default function TeamPage() {
  const { teamId } = useParams();
  const { viewAsUser, teams } = useUser();

  const team = teams.find(t => t.id === teamId);
  const isSdm = viewAsUser.roles?.includes('Service Delivery Manager') || viewAsUser.roles?.includes('Admin');
  
  if (!team) {
    // This can happen if the teamId is invalid or data is loading.
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
  
  const isTeamManager = team.managers?.includes(viewAsUser.userId);
  const canViewPage = isSdm || isTeamManager;

  // This check must happen after all hooks are called.
  if (!canViewPage) {
     return null; // Navigation is filtered, so this prevents direct URL access.
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">{team.name} Team Management</h1>
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="locations">Pinned Locations</TabsTrigger>
            <TabsTrigger value="workstations">Workstations</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-4">
          <TeamMembersView team={team} />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <TeamRoleManagement team={team} />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
            <PinnedLocationManagement team={team} />
        </TabsContent>
        <TabsContent value="workstations" className="mt-4">
            <WorkstationManagement team={team} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
