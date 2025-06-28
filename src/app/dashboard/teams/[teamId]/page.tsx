

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeamPage() {
  const { teamId } = useParams();
  const { viewAsUser, teams } = useUser();
  const router = useRouter();

  const team = teams.find(t => t.id === teamId);
  const isSdm = viewAsUser.roles?.includes('Service Delivery Manager') || viewAsUser.roles?.includes('Admin');
  const isTeamManager = team?.managers?.includes(viewAsUser.userId);

  useEffect(() => {
    // Redirect if data has loaded and user doesn't have permissions.
    // The `teams.length > 0` and `team` checks prevent premature redirection.
    if (teams.length > 0 && team && !isSdm && !isTeamManager) {
      router.push('/dashboard/calendar');
    }
  }, [teams, team, isSdm, isTeamManager, router]);

  const canViewPage = team && (isSdm || isTeamManager);

  return (
    <div className="flex flex-col gap-6">
      {canViewPage ? (
        <>
          <h1 className="font-headline text-3xl font-semibold">{team.name} Team Management</h1>
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="roles">Role Management</TabsTrigger>
                <TabsTrigger value="locations">Pinned Locations</TabsTrigger>
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
          </Tabs>
        </>
      ) : (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
      )}
    </div>
  );
}
