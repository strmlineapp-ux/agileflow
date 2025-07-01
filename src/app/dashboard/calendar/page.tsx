
'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, getWeek } from 'date-fns';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EventForm } from '@/components/calendar/new-event-form';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event } from '@/types';
import { EventDetailsDialog } from '@/components/calendar/event-details-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CalendarPage() {
  const { realUser, viewAsUser, calendars, appSettings } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'production-schedule'>(realUser.defaultCalendarView || 'day');
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'fit'>('normal');
  const [dayViewAxis, setDayViewAxis] = useState<'standard' | 'reversed'>('standard');
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [initialEventData, setInitialEventData] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const monthViewContainerRef = useRef<HTMLDivElement>(null);
  const dayViewContainerRef = useRef<HTMLDivElement>(null);
  const weekViewContainerRef = useRef<HTMLDivElement>(null);
  const productionScheduleViewContainerRef = useRef<HTMLDivElement>(null);
  
  const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars, appSettings.customAdminRoles);

  const handlePrev = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate(d => subMonths(d, 1));
        break;
      case 'week':
      case 'production-schedule':
        setCurrentDate(d => subWeeks(d, 1));
        break;
      case 'day':
        setCurrentDate(d => subDays(d, 1));
        break;
    }
  }, [view]);

  const handleNext = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate(d => addMonths(d, 1));
        break;
      case 'week':
      case 'production-schedule':
        setCurrentDate(d => addWeeks(d, 1));
        break;
      case 'day':
        setCurrentDate(d => addDays(d, 1));
        break;
    }
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    if (view === 'production-schedule' || view === 'day' || view === 'week') {
      setZoomLevel('normal');
    }
  }, [view]);

  const handleEasyBooking = useCallback((data: { startTime: Date; location?: string }) => {
    if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

    const endTime = new Date(data.startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour

    setInitialEventData({
        date: data.startTime,
        startTime: format(data.startTime, 'HH:mm'),
        endTime: format(endTime, 'HH:mm'),
        location: data.location,
    });
    setIsNewEventOpen(true);
  }, [userCanCreateEvent, viewAsUser.easyBooking]);
  
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

  const closeNewEventDialog = useCallback(() => {
    setIsNewEventOpen(false);
    setInitialEventData(null);
  }, []);

  const onEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);

  return (
    <>
      <Tabs defaultValue={realUser.defaultCalendarView || 'day'} value={view} onValueChange={(v) => setView(v as any)} className="flex h-full flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handlePrev}><GoogleSymbol name="chevron_left" /></Button>
                <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                <Button variant="outline" size="icon" onClick={handleNext}><GoogleSymbol name="chevron_right" /></Button>
            </div>
            <h1 className="font-headline text-2xl font-semibold ml-4 flex items-baseline gap-3">{title}</h1>
            {userCanCreateEvent && (
              <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <GoogleSymbol name="add_circle" className="text-2xl" />
                    <span className="sr-only">New Event</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <EventForm onFinished={closeNewEventDialog} initialData={initialEventData} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center gap-2">
              <TooltipProvider>
                {(view === 'production-schedule' || view === 'day' || view === 'week') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'fit' : 'normal')}>
                          {zoomLevel === 'normal' ? <GoogleSymbol name="close_fullscreen" /> : <GoogleSymbol name="open_in_full" />}
                          <span className="sr-only">{zoomLevel === 'normal' ? 'Fit to view' : 'Reset view'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{zoomLevel === 'normal' ? 'Fit to view' : 'Reset view'}</TooltipContent>
                  </Tooltip>
                )}
                {view === 'day' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setDayViewAxis(dayViewAxis === 'standard' ? 'reversed' : 'standard')}>
                            <GoogleSymbol name="swap_horiz" />
                            <span className="sr-only">{dayViewAxis === 'standard' ? 'Switch to reversed axis view' : 'Switch to standard view'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{dayViewAxis === 'standard' ? 'Reversed axis view' : 'Standard view'}</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
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
        onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
      />
    </>
  );
}
