
'use client';

import { useUser } from '@/context/user-context';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServiceDeliveryPage() {
  const { pageConfigs } = useUser();
  const sdmConfig = pageConfigs.find(p => p.id === 'service-delivery');
  const pageTitle = sdmConfig?.name || 'Service Delivery Management';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">{pageTitle}</h1>
      <Tabs defaultValue="calendars">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendars">Calendar Management</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
        </TabsList>
        <TabsContent value="calendars" className="mt-4">
            <CalendarManagement />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
            <TeamManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
