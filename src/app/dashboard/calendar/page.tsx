import { Button } from '@/components/ui/button';
import { CalendarView } from '@/components/calendar/calendar-view';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Calendar</h1>
        <div className="flex gap-2 items-center">
            <Tabs defaultValue="day">
                <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Event
            </Button>
        </div>
      </div>
      <div className="flex-1">
        <CalendarView />
      </div>
    </div>
  );
}
