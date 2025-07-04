

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, startOfWeek, getWeek } from 'date-fns';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EventForm } from '@/components/calendar/new-event-form';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event, type AppPage } from '@/types';
import { EventDetailsDialog } from '@/components/calendar/event-details-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function CalendarPageContent({ tab: pageConfig }: { tab: AppPage }) {
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
  
  const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars, appSettings.adminGroups);

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
  
  const dateRange = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    let range;

    if (format(start, 'yyyy') !== format(end, 'yyyy')) {
      range = `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
    } else if (format(start, 'MMMM') !== format(end, 'MMMM')) {
      range = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    } else {
      range = `${format(start, 'd')}–${format(end, 'd')} ${format(end, 'MMMM, yyyy')}`;
    }
    return `Week ${weekNumber} · ${range}`;
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
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <GoogleSymbol name={pageConfig.icon} className="text-3xl" />
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
                    </TooltipTrigger>
                    {pageConfig.description && (
                      <TooltipContent>
                        <p className="max-w-xs">{pageConfig.description}</p>
                      </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            </div>
            {userCanCreateEvent && (
              <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                <DialogTrigger asChild>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <GoogleSymbol name="add_circle" className="text-2xl" />
                          <span className="sr-only">New Event</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>New Event</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <EventForm onFinished={closeNewEventDialog} initialData={initialEventData} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border-r pr-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}><GoogleSymbol name="chevron_left" /></Button>
                <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
                <Button variant="ghost" size="icon" onClick={handleNext}><GoogleSymbol name="chevron_right" /></Button>
            </div>
            <p className="text-muted-foreground text-sm font-medium">{dateRange}</p>
          </div>
          <div className="flex items-center gap-2">
              <TooltipProvider>
                {(view === 'production-schedule' || view === 'day' || view === 'week') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'fit' : 'normal')}>
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
                        <Button variant="ghost" size="icon" onClick={() => setDayViewAxis(dayViewAxis === 'standard' ? 'reversed' : 'standard')}>
                            <GoogleSymbol name="swap_horiz" />
                            <span className="sr-only">{dayViewAxis === 'standard' ? 'Switch to reversed axis view' : 'Switch to standard view'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{dayViewAxis === 'standard' ? 'Reversed axis view' : 'Standard view'}</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
              <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
                  <TabsList>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="production-schedule">Production Schedule</TabsTrigger>
                  </TabsList>
              </Tabs>
          </div>
        </div>
        <div className="flex-1 relative">
            <div className={view === 'month' ? 'absolute inset-0 overflow-y-auto' : 'hidden'} ref={monthViewContainerRef}>
                {view === 'month' && <MonthView date={currentDate} containerRef={monthViewContainerRef} onEventClick={onEventClick} />}
            </div>
            <div className={view === 'week' ? 'absolute inset-0 overflow-y-auto' : 'hidden'} ref={weekViewContainerRef}>
                {view === 'week' && <WeekView date={currentDate} containerRef={weekViewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />}
            </div>
            <div className={view === 'day' ? 'absolute inset-0 overflow-auto' : 'hidden'} ref={dayViewContainerRef}>
                {view === 'day' && <DayView date={currentDate} containerRef={dayViewContainerRef} zoomLevel={zoomLevel} axisView={dayViewAxis} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />}
            </div>
            <div className={view === 'production-schedule' ? 'absolute inset-0 overflow-auto' : 'hidden'} ref={productionScheduleViewContainerRef}>
                {view === 'production-schedule' && <ProductionScheduleView date={currentDate} containerRef={productionScheduleViewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} />}
            </div>
        </div>
      </div>
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
      />
    </>
  );
}
