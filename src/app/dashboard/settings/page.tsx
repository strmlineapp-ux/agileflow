import { UserManagement } from '@/components/settings/user-management';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Settings & User Management</h1>
      <UserManagement />
    </div>
  );
}
