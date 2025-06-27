import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';

export default function LiveEventsTeamPage() {
  return (
    <div className="space-y-8">
      <TeamRoleManagement teamTitle="Live Events" />
      <PinnedLocationManagement teamTitle="Live Events" />
    </div>
  );
}
