
"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '../icons/google-symbol';
import { type Event, type Badge as BadgeType } from '@/types';
import { format, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, addDays, startOfWeek, isSameMonth } from 'date-fns';

const isHoliday = (day: Date, holidays: Date[]) => {
    return holidays.some(holiday => {
        return day.getDate() === holiday.getDate() &&
               day.getMonth() === holiday.getMonth() &&
               day.getFullYear() === holiday.getFullYear();
    });
}

export const MonthView = React.memo(({ date, events, containerRef, onEventClick }: { date: Date; events: Event[], containerRef: React.RefObject<HTMLDivElement>; onEventClick: (event: Event) => void; }) => {
    const todayRef = useRef<HTMLDivElement>(null);
    const { calendars, holidays, allBadges } = useUser();

    const getPriorityDisplay = useCallback((badgeId: string): { label: React.ReactNode, description?: string, color: string, icon?: string } | undefined => {
      if (!badgeId) return undefined;
      const badge = allBadges.find(b => b.id === badgeId);
      if (badge) return { label: badge.name, description: badge.description, color: badge.color, icon: badge.icon };
      return undefined;
    }, [allBadges]);
    
    const weekStartsOn = 1; // Monday
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = startOfWeek(addDays(monthEnd, 6), { weekStartsOn }); // Ensure we get 6 weeks
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    useEffect(() => {
        if (isSameMonth(date, new Date()) && todayRef.current && containerRef.current) {
            const container = containerRef.current;
            const todayElement = todayRef.current;
            
            const scrollTop = todayElement.offsetTop - (container.offsetHeight / 2) + (todayElement.offsetHeight / 2);
            
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });
        }
    }, [date, containerRef]);

    const getEventsForDay = useCallback((day: Date) => {
        return events.filter(event => isSameDay(event.startTime, day));
    }, [events]);

    const hasWeekendEvents = useMemo(() => days.some(day => {
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        return isWeekend && getEventsForDay(day).length > 0;
    }), [days, getEventsForDay]);

    const [showWeekends, setShowWeekends] = useState(hasWeekendEvents);
    
    useEffect(() => {
        setShowWeekends(hasWeekendEvents);
    }, [hasWeekendEvents]);

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const displayedWeekdays = showWeekends ? weekdays : weekdays.slice(0, 5);
    const gridColsClass = showWeekends ? 'grid-cols-7' : 'grid-cols-5';
    
    const displayedDays = showWeekends ? days : days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);

    const renderDayCell = useCallback((day: Date, key: React.Key) => {
        const dayEvents = getEventsForDay(day);
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isDayHoliday = isHoliday(day, holidays);
        const isDayToday = isToday(day);
        const isCurrentMonth = isSameMonth(day, date);

        return (
            <div 
                key={key} 
                ref={isDayToday ? todayRef : null}
                className={cn(
                "border-r border-b p-2 flex flex-col min-h-[150px]",
                !isCurrentMonth && "bg-muted/30",
                isDayToday && "bg-accent/10",
                !isDayToday && (isWeekend || isDayHoliday) && isCurrentMonth && "bg-muted/50"
            )}>
                <span className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-full text-sm text-foreground",
                    isDayToday && "font-emphasized",
                    !isCurrentMonth && "text-foreground/50",
                    (isWeekend || isDayHoliday) && "text-foreground/50"
                )}>
                    {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto flex-1">
                    {dayEvents.map(event => {
                         const calendarColors = calendarColorMap[event.calendarId];
                         const priorityInfo = getPriorityDisplay(event.priority);
                         
                         const badgeStyle = priorityInfo 
                            ? { backgroundColor: priorityInfo.color, color: getContrastColor(priorityInfo.color) }
                            : { backgroundColor: calendarColors?.bg, color: calendarColors?.text };

                         return (
                             <Badge 
                                 key={event.eventId} 
                                 data-event-id={event.eventId}
                                 onClick={() => onEventClick(event)}
                                 style={badgeStyle}
                                 className={cn("block w-full text-left truncate cursor-pointer border-transparent")}
                             >
                                 <span style={{ color: getContrastColor(badgeStyle.backgroundColor || '#ffffff') }}>
                                    {event.title}
                                 </span>
                             </Badge>
                         )
                    })}
                </div>
            </div>
        )
    }, [getEventsForDay, onEventClick, calendarColorMap, getPriorityDisplay, date, holidays]);
    
    return (
        <Card className="flex flex-col h-full flex-1">
            <div className={cn("grid border-b border-t sticky top-0 bg-card z-10", gridColsClass)}>
                {displayedWeekdays.map((day) => (
                    <div key={day} className={cn("text-center p-2 text-sm border-r last:border-r-0 relative text-foreground", 
                        { "bg-card": (day === 'Sat' || day === 'Sun') },
                        { "text-foreground": !(day === 'Sat' || day === 'Sun') }
                    )}>
                        {day}
                         {!showWeekends && day === 'Fri' && (
                             <Button variant="default" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(true)}>
                                <GoogleSymbol name="keyboard_double_arrow_right" weight={100} />
                            </Button>
                        )}
                        {showWeekends && day === 'Sun' && (
                            <Button variant="default" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(false)}>
                                <GoogleSymbol name="keyboard_double_arrow_left" weight={100} />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className={cn("grid flex-1", gridColsClass)} style={{ gridTemplateRows: `repeat(${displayedDays.length / displayedWeekdays.length}, minmax(150px, 1fr))` }}>
                    {displayedDays.map((day) => renderDayCell(day, day.toISOString()))}
                </div>
            </CardContent>
        </Card>
    );
});
MonthView.displayName = 'MonthView';
