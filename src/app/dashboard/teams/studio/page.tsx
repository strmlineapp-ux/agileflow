import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { TeamRoleManagement } from '@/components/settings/team-role-management';

export default function StudioTeamPage() {
  return (
    <div className="space-y-8">
      <TeamRoleManagement teamTitle="Studio Productions" />
      <PinnedLocationManagement teamTitle="Studio Productions" />
    </div>
  );
}
