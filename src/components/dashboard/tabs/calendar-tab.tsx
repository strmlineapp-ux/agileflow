

'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, getWeek, isToday } from 'date-fns';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EventForm } from '@/components/calendar/new-event-form';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event, type AppTab } from '@/types';
import { EventDetailsDialog } from '@/components/calendar/event-details-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getDb } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

function CalendarLinkPrompt() {
  const { googleLogin, realUser } = useUser();
  if (!realUser) return null;

  return (
    <div className="flex-1 flex items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Connect Your Google Calendar</CardTitle>
          <CardDescription>
            To view and manage events, you need to connect your Google Calendar. This will allow AgileFlow to sync your events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={googleLogin}>
            <GoogleSymbol name="link" className="mr-2" />
            Connect Google Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function CalendarPageContent({ tab }: { tab: AppTab }) {
  const { viewAsUser, calendars } = useUser();
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
    if (!viewAsUser?.workspaceId || !viewAsUser.googleCalendarLinked) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    const db = getDb();
    const eventsQuery = query(
      collection(db, "events"),
      where("workspaceId", "==", viewAsUser.workspaceId)
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          eventId: doc.id,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
        } as Event;
      });
      setViewEvents(allEvents);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching events in real-time:", error);
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [viewAsUser?.workspaceId, viewAsUser.googleCalendarLinked]);

  const addEvent = useCallback(async (newEventData: Omit<Event, 'eventId'>) => {
    if (!viewAsUser) return;
    const db = getDb();
    const eventWithWorkspace = { 
        ...newEventData,
        startTime: Timestamp.fromDate(newEventData.startTime),
        endTime: Timestamp.fromDate(newEventData.endTime),
        workspaceId: viewAsUser.workspaceId 
    };
    await addDoc(collection(db, "events"), eventWithWorkspace);
  }, [viewAsUser]);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Omit<Event, 'eventId'>>) => {
      const db = getDb();
      const dataToUpdate: Record<string, any> = { ...eventData, lastUpdated: new Date() };
      if (eventData.startTime) dataToUpdate.startTime = Timestamp.fromDate(eventData.startTime);
      if (eventData.endTime) dataToUpdate.endTime = Timestamp.fromDate(eventData.endTime);
      await updateDoc(doc(db, 'events', eventId), dataToUpdate);
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    const db = getDb();
    await deleteDoc(doc(db, 'events', eventId));
  }, []);
  
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
      range = `${''}${format(start, 'MMM d, yyyy')} – ${''}${format(end, 'MMM d, yyyy')}`;
    } else if (format(start, 'MMMM') !== format(end, 'MMMM')) {
      range = `${''}${format(start, 'MMM d')} – ${''}${format(end, 'MMM d, yyyy')}`;
    } else {
      range = `${''}${format(start, 'd')}–${''}${format(end, 'd')} ${''}${format(end, 'MMMM, yyyy')}`;
    }
    return `Week ${''}${weekNumber} · ${''}${range}`;
  }, [view, currentDate]);

  const handleAddEvent = async (data: Omit<Event, 'eventId'>) => {
    await addEvent(data);
    setInitialEventData(null);
  };
  
  const handleUpdateEvent = async (eventId: string, data: Partial<Omit<Event, 'eventId'>>) => {
    await updateEvent(eventId, data);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };
  
  const closeDialogs = useCallback(() => {
    setIsNewEventOpen(false);
    setSelectedEvent(null);
    setInitialEventData(null);
  }, []);

  const onEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);
  
  const pageShouldScroll = view === 'month' || view === 'production-schedule';

  const renderCurrentView = () => {
    if (isDataLoading) return <div className="flex-1 flex items-center justify-center"><GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-muted-foreground" /></div>;
    
    if (!viewAsUser.googleCalendarLinked) {
      return <CalendarLinkPrompt />;
    }

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
                        <Button variant="default" size="icon" >
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
                    onAdd={handleAddEvent}
                  />
                </DialogContent>
              </Dialog>
            )}
             <div className="flex items-center gap-1 pr-2">
                <Button variant="default" size="icon" onClick={handlePrev}><GoogleSymbol name="chevron_left" /></Button>
                <Button variant="default" size="sm" onClick={goToToday}>Today</Button>
                <Button variant="default" size="icon" onClick={handleNext}><GoogleSymbol name="chevron_right" /></Button>
            </div>
            <p className="text-muted-foreground text-sm font-normal">{dateRange}</p>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2 flex-1">
              <TooltipProvider>
                {(view === 'production-schedule' || view === 'day' || view === 'week') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="default" size="icon" onClick={() => setZoomLevel(zoomLevel === 'normal' ? 'fit' : 'normal')}>
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
                        <Button variant="default" size="icon" onClick={() => setDayViewAxis(dayViewAxis === 'standard' ? 'reversed' : 'standard')}>
                            <GoogleSymbol name="swap_horiz" />
                            <span className="sr-only">{dayViewAxis === 'standard' ? 'Switch to reversed axis view' : 'Switch to standard view'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{dayViewAxis === 'standard' ? 'Reversed axis view' : 'Standard view'}</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
              <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
                <CenteredTabList>
                  <TabsList>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="production-schedule">Production Schedule</TabsTrigger>
                  </TabsList>
                </CenteredTabList>
              </Tabs>
          </div>
        </div>
        <div className={cn("flex-1 min-h-0", pageShouldScroll ? "overflow-y-auto hide-scrollbar" : "overflow-hidden flex flex-col")} ref={viewContainerRef}>
            {renderCurrentView()}
        </div>
      </div>
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </>
  );
}
