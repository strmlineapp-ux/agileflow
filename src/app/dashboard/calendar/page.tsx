'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, getWeek } from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('day');
  const monthViewContainerRef = useRef<HTMLDivElement>(null);
  const dayViewContainerRef = useRef<HTMLDivElement>(null);
  const weekViewContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const getTitle = () => {
    if (view === 'day') return format(currentDate, 'MMMM d, yyyy');
    if (view === 'week') {
      const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      let dateRange;

      if (format(start, 'MMMM yyyy') === format(end, 'MMMM yyyy')) {
          if(format(start, 'MMMM') === format(end, 'MMMM')) {
            dateRange = `${format(start, 'd')} – ${format(end, 'd MMMM, yyyy')}`;
          } else {
            dateRange = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
          }
      } else {
        dateRange = `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
      }
      return `Week ${weekNumber}: ${dateRange}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <Tabs defaultValue="day" value={view} onValueChange={(v) => setView(v as any)} className="flex h-full flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 shrink-0">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <h1 className="font-headline text-2xl font-semibold ml-4">{getTitle()}</h1>
        </div>
        <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 relative">
        <TabsContent value="month" ref={monthViewContainerRef} className="absolute inset-0 overflow-y-auto">
            <MonthView date={currentDate} containerRef={monthViewContainerRef} />
        </TabsContent>
        <TabsContent value="week" ref={weekViewContainerRef} className="absolute inset-0 overflow-y-auto">
            <WeekView date={currentDate} containerRef={weekViewContainerRef} />
        </TabsContent>
        <TabsContent value="day" ref={dayViewContainerRef} className="absolute inset-0 overflow-auto">
            <DayView date={currentDate} containerRef={dayViewContainerRef} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
