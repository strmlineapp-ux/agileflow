
'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, getWeek } from 'date-fns';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NewEventForm } from '@/components/calendar/new-event-form';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event } from '@/types';
import { EventDetailsDialog } from '@/components/calendar/event-details-dialog';

export default function CalendarPage() {
  const { realUser, viewAsUser, calendars } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'production-schedule'>(realUser.defaultCalendarView || 'day');
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'fit'>('normal');
  const [dayViewAxis, setDayViewAxis] = useState<'standard' | 'reversed'>('standard');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [initialEventData, setInitialEventData] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const monthViewContainerRef = useRef<HTMLDivElement>(null);
  const dayViewContainerRef = useRef<HTMLDivElement>(null);
  const weekViewContainerRef = useRef<HTMLDivElement>(null);
  const productionScheduleViewContainerRef = useRef<HTMLDivElement>(null);
  
  const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars);

  const handlePrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
      case 'production-schedule':
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
      case 'production-schedule':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (view === 'production-schedule' || view === 'day' || view === 'week') {
      setZoomLevel('normal');
    }
  };

  const handleEasyBooking = (startTime: Date) => {
    if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour

    setInitialEventData({
        date: startTime,
        startTime: format(startTime, 'HH:mm'),
        endTime: format(endTime, 'HH:mm'),
    });
    setIsPopoverOpen(true);
  };
  
  const title = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    
    // Logic for 'week' and 'production-schedule'
    const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    let dateRange;

    if (format(start, 'yyyy') !== format(end, 'yyyy')) {
      dateRange = `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
    } else if (format(start, 'MMMM') !== format(end, 'MMMM')) {
      dateRange = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    } else {
      dateRange = `${format(start, 'd')}–${format(end, 'd')} ${format(end, 'MMMM, yyyy')}`;
    }
    
    return (
      <>
        <span>Week {weekNumber}</span>
        <span className="text-xl text-muted-foreground">{dateRange}</span>
      </>
    );
  }, [view, currentDate]);

  const closePopover = () => {
    setIsPopoverOpen(false);
    setInitialEventData(null);
  };

  const onEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <>
      <Tabs defaultValue={realUser.defaultCalendarView || 'day'} value={view} onValueChange={(v) => setView(v as any)} className="flex h-full flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 shrink-0">
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToToday}>Today</Button>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                  <GoogleSymbol name="chevron_left" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                  <GoogleSymbol name="chevron_right" />
              </Button>
              <h1 className="font-headline text-2xl font-semibold ml-4 flex items-baseline gap-3">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
              {userCanCreateEvent && (
                <Popover open={isPopoverOpen} onOpenChange={(isOpen) => !isOpen ? closePopover() : setIsPopoverOpen(true)}>
                  <PopoverTrigger asChild>
                    <Button>
                      <GoogleSymbol name="add_circle" className="mr-2" />
                      New Event
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-4" align="end">
                    <NewEventForm onFinished={closePopover} initialData={initialEventData} />
                  </PopoverContent>
                </Popover>
              )}
              {(view === 'production-schedule' || view === 'day' || view === 'week') && (
                  <Button variant="outline" size="icon" onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'fit' : 'normal')}>
                      {zoomLevel === 'normal' ? <GoogleSymbol name="close_fullscreen" /> : <GoogleSymbol name="open_in_full" />}
                      <span className="sr-only">{zoomLevel === 'normal' ? 'Fit to view' : 'Reset view'}</span>
                  </Button>
              )}
              {view === 'day' && (
                  <Button variant="outline" size="icon" onClick={() => setDayViewAxis(dayViewAxis === 'standard' ? 'reversed' : 'standard')}>
                      <GoogleSymbol name="swap_horiz" />
                      <span className="sr-only">{dayViewAxis === 'standard' ? 'Switch to reversed axis view' : 'Switch to standard view'}</span>
                  </Button>
              )}
              <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="production-schedule">Production Schedule</TabsTrigger>
              </TabsList>
          </div>
        </div>
        <div className="flex-1 relative">
          <TabsContent value="month" ref={monthViewContainerRef} className="absolute inset-0 overflow-y-auto">
              <MonthView date={currentDate} containerRef={monthViewContainerRef} onEventClick={onEventClick} />
          </TabsContent>
          <TabsContent value="week" ref={weekViewContainerRef} className="absolute inset-0 overflow-y-auto">
              <WeekView date={currentDate} containerRef={weekViewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />
          </TabsContent>
          <TabsContent value="day" ref={dayViewContainerRef} className="absolute inset-0 overflow-auto">
              <DayView date={currentDate} containerRef={dayViewContainerRef} zoomLevel={zoomLevel} axisView={dayViewAxis} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />
          </TabsContent>
          <TabsContent value="production-schedule" ref={productionScheduleViewContainerRef} className="absolute inset-0 overflow-auto">
              <ProductionScheduleView date={currentDate} containerRef={productionScheduleViewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />
          </TabsContent>
        </div>
      </Tabs>
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      />
    </>
  );
}
