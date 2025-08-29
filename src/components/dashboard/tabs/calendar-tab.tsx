
'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, getWeek, isToday, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EventForm } from '@/components/calendar/new-event-form';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event, type AppPage } from '@/types';
import { EventDetailsDialog } from '@/components/calendar/event-details-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function CalendarPageContent({ tab: pageConfig }: { tab: AppPage }) {
  const { viewAsUser, calendars, fetchEvents, addEvent, updateEvent, deleteEvent } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'production-schedule'>(viewAsUser.defaultCalendarView || 'day');
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'fit'>('normal');
  const [dayViewAxis, setDayViewAxis] = useState<'standard' | 'reversed'>('standard');
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [initialEventData, setInitialEventData] = useState<Partial<Omit<Event, 'eventId'>> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [triggerScroll, setTriggerScroll] = useState(0);
  const [viewEvents, setViewEvents] = useState<Event[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const viewContainerRef = useRef<HTMLDivElement>(null);
  
  const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars);

  useEffect(() => {
    let start: Date;
    let end: Date;
    switch (view) {
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case 'week':
      case 'production-schedule':
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = addDays(start, 7);
        break;
      case 'day':
      default:
        start = startOfDay(currentDate);
        end = addDays(start, 1);
        break;
    }
    
    setIsDataLoading(true);
    fetchEvents(start, end).then(events => {
        setViewEvents(events);
        setIsDataLoading(false);
    });

  }, [currentDate, view, fetchEvents]);
  
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
    const today = new Date();
    if (!isToday(currentDate)) {
        setCurrentDate(today);
    }
    setTriggerScroll(prev => prev + 1);
  }, [currentDate]);

  const handleEasyBooking = useCallback((data: { startTime: Date; location?: string }) => {
    if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

    const endTime = new Date(data.startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour

    setInitialEventData({
        startTime: data.startTime,
        endTime: endTime,
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

  const handleEventMutation = useCallback(async (mutationType: 'add' | 'update' | 'delete', eventData: any) => {
    let updatedEvents: Event[];

    switch (mutationType) {
      case 'add':
        updatedEvents = await addEvent(viewEvents, eventData);
        setInitialEventData(null); // Reset form for next new event
        break;
      case 'update':
        const { eventId, ...updateData } = eventData;
        updatedEvents = await updateEvent(viewEvents, eventId, updateData);
        break;
      case 'delete':
        updatedEvents = await deleteEvent(viewEvents, eventData.eventId);
        break;
      default:
        return;
    }
    setViewEvents(updatedEvents);
  }, [addEvent, updateEvent, deleteEvent, viewEvents]);

  const closeDialogs = useCallback(() => {
    setIsNewEventOpen(false);
    setSelectedEvent(null);
    setInitialEventData(null);
  }, []);

  const onEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);

  const renderCurrentView = () => {
    if (isDataLoading) return <div className="flex-1 flex items-center justify-center"><GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-muted-foreground" /></div>;

    switch (view) {
        case 'month':
            return <MonthView date={currentDate} events={viewEvents} containerRef={viewContainerRef} onEventClick={onEventClick} />;
        case 'week':
            return <WeekView date={currentDate} events={viewEvents} containerRef={viewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        case 'day':
            return <DayView date={currentDate} events={viewEvents} containerRef={viewContainerRef} zoomLevel={zoomLevel} axisView={dayViewAxis} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        case 'production-schedule':
            return <ProductionScheduleView date={currentDate} events={viewEvents} containerRef={viewContainerRef} zoomLevel={zoomLevel} onEasyBooking={handleEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        default:
            return null;
    }
  };
  
  return (
    <>
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {userCanCreateEvent && (
              <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                <DialogTrigger asChild>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="circle" size="icon">
                          <GoogleSymbol name="add_circle" className="text-4xl" />
                          <span className="sr-only">New Event</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>New Event</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <EventForm 
                    onFinished={closeDialogs} 
                    initialData={initialEventData} 
                    onAdd={(data) => handleEventMutation('add', data)}
                  />
                </DialogContent>
              </Dialog>
            )}
             <div className="flex items-center gap-1 border-r pr-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}><GoogleSymbol name="chevron_left" /></Button>
                <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
                <Button variant="ghost" size="icon" onClick={handleNext}><GoogleSymbol name="chevron_right" /></Button>
            </div>
            <p className="text-muted-foreground text-sm font-normal">{dateRange}</p>
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
                    <TooltipContent>{zoomLevel === 'normal' ? 'Fit to view (8am-8pm)' : 'Reset view'}</TooltipContent>
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
        <div className="flex-1 overflow-auto flex flex-col" ref={viewContainerRef}>
            {renderCurrentView()}
        </div>
      </div>
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
        onUpdate={(eventId, eventData) => handleEventMutation('update', { eventId, ...eventData })}
        onDelete={(eventId) => handleEventMutation('delete', { eventId })}
      />
    </>
  );
}
