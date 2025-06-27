
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function TeamPage() {
  const { teamId } = useParams();
  const { viewAsUser, teams } = useUser();
  const router = useRouter();

  const team = teams.find(t => t.id === teamId);
  const isSdm = viewAsUser.roles?.includes('Service Delivery Manager') || viewAsUser.roles?.includes('Admin');
  const isTeamManager = team?.managers?.includes(viewAsUser.userId);

  // Added authorization check with redirect
  useEffect(() => {
    // If teams are loaded, and the team exists, but the user is not authorized, redirect.
    if (teams.length > 0 && team && !isSdm && !isTeamManager) {
      router.push('/dashboard/calendar');
    }
  }, [teams, team, isSdm, isTeamManager, router]);

  if (!team || (!isSdm && !isTeamManager)) {
    // Show skeleton while loading or before redirecting.
    return (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-semibold">{team.name} Team Management</h1>
      <TeamRoleManagement team={team} />
      <PinnedLocationManagement team={team} />
    </div>
  );
}
