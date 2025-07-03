
'use client';

import { UserManagement } from '@/components/settings/user-management';
import { type AppTab } from '@/types';

export function SettingsContent({ tab }: { tab: AppTab }) {
  // The header is now rendered by the dynamic page component.
  // This component just needs to render the user management content.
  return <UserManagement />;
}
