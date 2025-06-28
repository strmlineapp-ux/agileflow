

'use client';

import { useUser } from '@/context/user-context';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyManagement } from '@/components/service-delivery/strategy-management';

export default function AppManagementPage() {
  const { viewAsUser } = useUser();
  const isAdmin = viewAsUser.roles?.includes('Admin');

  if (!isAdmin) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">App Management</h1>
      <Tabs defaultValue="calendars">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendars">Calendar Management</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>
        <TabsContent value="calendars" className="mt-4">
            <CalendarManagement />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
            <TeamManagement />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
            <StrategyManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
