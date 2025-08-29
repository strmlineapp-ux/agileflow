
"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '../icons/google-symbol';
import { type Event, type Badge as BadgeType } from '@/types';

const isHoliday = (day: Date, holidays: Date[]) => {
    return holidays.some(holiday => {
        return day.getDate() === holiday.getDate() &&
               day.getMonth() === holiday.getMonth() &&
               day.getFullYear() === holiday.getFullYear();
    });
}

function isToday(day: Date) {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
}

function getDaysInMonth(year: number, month: number) {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
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

    const daysInMonth = getDaysInMonth(date.getFullYear(), date.getMonth());

    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    useEffect(() => {
        if (date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() && todayRef.current && containerRef.current) {
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
        return events.filter(event => new Date(event.startTime).toDateString() === day.toDateString());
    }, [events]);

    const hasWeekendEvents = useMemo(() => daysInMonth.some(day => {
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        return isWeekend && getEventsForDay(day).length > 0;
    }), [daysInMonth, getEventsForDay]);

    const [showWeekends, setShowWeekends] = useState(hasWeekendEvents);
    
    useEffect(() => {
        setShowWeekends(hasWeekendEvents);
    }, [hasWeekendEvents]);

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const displayedWeekdays = showWeekends ? weekdays : weekdays.slice(0, 5);
    const gridColsClass = showWeekends ? 'grid-cols-7' : 'grid-cols-5';
    
    const firstDay = getFirstDayOfMonth(date.getFullYear(), date.getMonth());
    const startingDayIndex = (firstDay === 0) ? 6 : firstDay - 1;

    const renderDayCell = useCallback((day: Date, key: React.Key, dayIndex: number) => {
        const dayEvents = getEventsForDay(day);
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isDayHoliday = isHoliday(day, holidays);
        const isDayToday = isToday(day);
        const colIndex = (startingDayIndex + dayIndex) % 7;


        return (
            <div 
                key={key} 
                ref={isDayToday ? todayRef : null}
                className={cn(
                "border-r border-b p-2 flex flex-col",
                { "bg-muted/10": colIndex % 2 !== 0 },
                { "bg-accent/10": isDayToday },
                { "bg-muted/50": !isDayToday && (isWeekend || isDayHoliday) && day.getMonth() === date.getMonth() }
            )}>
                <span className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-full text-sm text-muted-foreground",
                    { "bg-primary text-primary-foreground": isDayToday },
                    { "text-muted-foreground/50": day.getMonth() !== date.getMonth() },
                    { "text-muted-foreground/50": (isWeekend || isDayHoliday) }
                )}>
                    {day.getDate()}
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
    }, [getEventsForDay, onEventClick, calendarColorMap, getPriorityDisplay, startingDayIndex, date, holidays]);

    let dayCells: React.ReactNode[] = [];
    if (showWeekends) {
        dayCells = [
            ...Array.from({ length: startingDayIndex }).map((_, index) => (
                <div key={`empty-${index}`} className="border-r border-b" />
            )),
            ...daysInMonth.map((day, index) => renderDayCell(day, `day-${index}`, index))
        ];
    } else {
        // Build cells for 5-day week view
        let emptyCells = [];
        for (let i = 0; i < startingDayIndex; i++) {
            if (i < 5) { // Only add placeholders for Mon-Fri
                emptyCells.push(<div key={`empty-${i}`} className="border-r border-b" />);
            }
        }
        dayCells = [
            ...emptyCells,
            ...daysInMonth
                .map((day, index) => ({ day, index }))
                .filter(({ day }) => day.getDay() !== 0 && day.getDay() !== 6)
                .map(({ day, index }) => renderDayCell(day, `day-${index}`, index))
        ];
    }

    return (
        <Card className="flex flex-col h-full flex-1">
            <div className={cn("grid border-b border-t sticky top-0 bg-muted z-10", gridColsClass)}>
                {displayedWeekdays.map((day, index) => (
                    <div key={day} className={cn("text-center p-2 text-sm border-r last:border-r-0 relative text-muted-foreground", 
                        { "bg-muted": (day === 'Sat' || day === 'Sun') },
                        { "text-muted-foreground": !(day === 'Sat' || day === 'Sun') }
                    )}>
                        {day}
                         {!showWeekends && day === 'Fri' && (
                             <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(true)}>
                                <GoogleSymbol name="keyboard_double_arrow_right" weight={100} />
                            </Button>
                        )}
                        {showWeekends && day === 'Sun' && (
                            <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(false)}>
                                <GoogleSymbol name="keyboard_double_arrow_left" weight={100} />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <div className={cn("grid flex-1", gridColsClass, `grid-rows-6`)}>
                    {dayCells}
                </div>
            </CardContent>
        </Card>
    );
});
MonthView.displayName = 'MonthView';
