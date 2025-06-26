
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSaturday, isSunday, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { type Event, type CalendarEventLabel } from '@/types';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { Button } from '../ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const labelColors: Record<CalendarEventLabel, string> = {
    'Event': 'bg-blue-600 hover:bg-blue-700',
    'Rehearsal': 'bg-purple-600 hover:bg-purple-700',
    'Shoot': 'bg-red-600 hover:bg-red-700',
    'Mock Shoot': 'bg-orange-500 hover:bg-orange-600',
    'Sound Recording': 'bg-green-600 hover:bg-green-700',
};

export function MonthView({ date, containerRef }: { date: Date; containerRef: React.RefObject<HTMLDivElement> }) {
    const todayRef = useRef<HTMLDivElement>(null);
    const firstDayOfMonth = startOfMonth(date);
    const lastDayOfMonth = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

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

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }

    const hasWeekendEvents = useMemo(() => daysInMonth.some(day => {
        const isWeekend = isSaturday(day) || isSunday(day);
        return isWeekend && getEventsForDay(day).length > 0;
    }), [daysInMonth, date]);

    const [showWeekends, setShowWeekends] = useState(hasWeekendEvents);

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const displayedWeekdays = showWeekends ? weekdays : weekdays.slice(0, 5);
    const gridColsClass = showWeekends ? 'grid-cols-7' : 'grid-cols-5';
    
    const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7; 

    const renderDayCell = (day: Date, key: React.Key, dayIndex: number) => {
        const dayEvents = getEventsForDay(day);
        const isWeekend = isSaturday(day) || isSunday(day);
        const isDayHoliday = isHoliday(day);
        const isDayToday = isToday(day);
        const colIndex = (startingDayIndex + dayIndex) % 7;


        return (
            <div 
                key={key} 
                ref={isDayToday ? todayRef : null}
                className={cn(
                "border-r border-b p-2 flex flex-col min-h-[120px]",
                { "bg-muted/10": colIndex % 2 !== 0 },
                { "bg-accent/10": isDayToday },
                { "bg-muted/50": !isDayToday && (isWeekend || isDayHoliday) && isSameMonth(day, date) }
            )}>
                <span className={cn(
                    "font-semibold h-6 w-6 flex items-center justify-center rounded-full text-sm",
                    { "bg-primary text-primary-foreground": isDayToday },
                    { "text-muted-foreground": !isSameMonth(day, date) },
                    { "text-muted-foreground/50": (isWeekend || isDayHoliday) }
                )}>
                    {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {dayEvents.map(event => (
                        <Badge key={event.eventId} className={cn("block w-full text-left truncate cursor-pointer text-white border-transparent", labelColors[event.label])}>
                            {event.title}
                        </Badge>
                    ))}
                </div>
            </div>
        )
    }

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
                .filter(({ day }) => !isSaturday(day) && !isSunday(day))
                .map(({ day, index }) => renderDayCell(day, `day-${index}`, index))
        ];
    }

    return (
        <Card>
            <div className={cn("grid border-b border-t sticky top-0 bg-card z-10", gridColsClass)}>
                {displayedWeekdays.map((day, index) => (
                    <div key={day} className={cn("text-center font-medium p-2 text-sm border-r last:border-r-0 relative", 
                        { "bg-muted/10": index % 2 !== 0},
                        { "bg-muted/50 text-muted-foreground/50": (day === 'Sat' || day === 'Sun') },
                        { "text-muted-foreground": !(day === 'Sat' || day === 'Sun') }
                    )}>
                        {day}
                         {!showWeekends && day === 'Fri' && (
                             <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(true)}>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        )}
                        {showWeekends && day === 'Sun' && (
                            <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(false)}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <CardContent className="p-0">
                <div className={cn("grid", gridColsClass)}>
                    {dayCells}
                </div>
            </CardContent>
        </Card>
    );
}
