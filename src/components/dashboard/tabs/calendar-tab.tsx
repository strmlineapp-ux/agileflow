
'use client';

import { useRef, useMemo } from 'react';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { ProductionScheduleView } from '@/components/calendar/production-schedule-view';
import { useUser } from '@/context/user-context';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Event } from '@/types';

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

interface CalendarPageContentProps {
  date: Date;
  events: Event[];
  view: 'month' | 'week' | 'day' | 'production-schedule';
  zoomLevel: 'normal' | 'fit';
  dayViewAxis: 'standard' | 'reversed';
  containerRef: React.RefObject<HTMLDivElement>;
  isDataLoading: boolean;
  onEventClick: (event: Event) => void;
  onEasyBooking: (data: { startTime: Date, location?: string }) => void;
  triggerScroll: number;
}

export function CalendarPageContent({
  date,
  events,
  view,
  zoomLevel,
  dayViewAxis,
  containerRef,
  isDataLoading,
  onEventClick,
  onEasyBooking,
  triggerScroll
}: CalendarPageContentProps) {
  const { viewAsUser } = useUser();
  
    if (isDataLoading) return <div className="flex-1 flex items-center justify-center"><GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-muted-foreground" /></div>;
    
    if (!viewAsUser.googleCalendarLinked) {
      return <CalendarLinkPrompt />;
    }

    switch (view) {
        case 'month':
            return <MonthView date={date} events={events} containerRef={containerRef} onEventClick={onEventClick} />;
        case 'week':
            return <WeekView date={date} events={events} containerRef={containerRef} zoomLevel={zoomLevel} onEasyBooking={onEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        case 'day':
            return <DayView date={date} events={events} containerRef={containerRef} zoomLevel={zoomLevel} axisView={dayViewAxis} onEasyBooking={onEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        case 'production-schedule':
            return <ProductionScheduleView date={date} events={events} containerRef={containerRef} zoomLevel={zoomLevel} onEasyBooking={onEasyBooking} onEventClick={onEventClick} triggerScroll={triggerScroll} />;
        default:
            return null;
    }
}
