
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServiceDeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Service Delivery Management</h1>
      <Tabs defaultValue="calendars">
        <TabsList>
            <TabsTrigger value="calendars">Calendar Management</TabsTrigger>
            <TabsTrigger value="locations" disabled>Location Management</TabsTrigger>
        </TabsList>
        <TabsContent value="calendars" className="mt-4">
            <CalendarManagement />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
            {/* Location management component will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
