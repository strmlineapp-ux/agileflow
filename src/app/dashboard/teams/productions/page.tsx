import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';

export default function ProductionsTeamPage() {
  return (
    <div className="space-y-8">
      <TeamRoleManagement teamTitle="Production" />
      <PinnedLocationManagement teamTitle="Production" />
    </div>
  );
}
