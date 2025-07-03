
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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_ID = 'page-calendar';

export function CalendarPageContent() {
  const { realUser, viewAsUser, calendars, appSettings, updateAppSettings, loading } = useUser();
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
  
  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);
  
  // Header Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const iconSearchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const updatePage = (data: Partial<AppPage>) => {
    if (!pageConfig) return;
    const newPages = appSettings.pages.map(p => p.id === PAGE_ID ? { ...p, ...data } : p);
    updateAppSettings({ pages: newPages });
  };
  
  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && pageConfig && newName !== pageConfig.name) {
      updatePage({ name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

  if (loading || !pageConfig) {
      return <Skeleton className="h-full w-full" />
  }

  return (
    <>
      <Tabs defaultValue={realUser.defaultCalendarView || 'day'} value={view} onValueChange={(v) => setView(v as any)} className="flex h-full flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl shrink-0">
                      <GoogleSymbol name={pageConfig.icon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <div className="flex items-center gap-1 p-2 border-b">
                        {!isSearchingIcons ? ( <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}> <GoogleSymbol name="search" /> </Button> ) : (
                            <div className="flex items-center gap-1 w-full">
                                <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                <input ref={iconSearchInputRef} placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} onBlur={() => !iconSearch && setIsSearchingIcons(false)} className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0" />
                            </div>
                        )}
                    </div>
                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={pageConfig.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { updatePage({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                  </PopoverContent>
                </Popover>
                {isEditingTitle ? (
                  <Input ref={titleInputRef} defaultValue={pageConfig.name} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' ? handleSaveTitle() : e.key === 'Escape' && setIsEditingTitle(false)} className="h-auto p-0 font-headline text-3xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
                ) : (
                  <h1 className="font-headline text-3xl font-semibold cursor-pointer" onClick={() => setIsEditingTitle(true)}>{pageConfig.name}</h1>
                )}
            </div>
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
