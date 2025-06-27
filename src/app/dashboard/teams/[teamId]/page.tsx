
'use client';

import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamPage() {
  const { teamId } = useParams();
  const { teams } = useUser();

  const team = teams.find(t => t.id === teamId);

  if (!team) {
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
