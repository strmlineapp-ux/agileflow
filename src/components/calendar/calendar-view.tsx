
"use client";

import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSaturday, isSunday, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { type Event } from '@/types';
import { mockEvents, mockHolidays } from '@/lib/mock-data';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

export function MonthView({ date }: { date: Date }) {
    const firstDayOfMonth = startOfMonth(date);
    const lastDayOfMonth = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }

    const hasWeekendEvents = daysInMonth.some(day => {
        const isWeekend = isSaturday(day) || isSunday(day);
        return isWeekend && getEventsForDay(day).length > 0;
    });

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const displayedWeekdays = hasWeekendEvents ? weekdays : weekdays.slice(0, 5);
    const gridColsClass = hasWeekendEvents ? 'grid-cols-7' : 'grid-cols-5';
    
    const startingDayIndex = (getDay(firstDayOfMonth) + 6) % 7; 

    const renderDayCell = (day: Date, key: string | number) => {
        const dayEvents = getEventsForDay(day);
        const isWeekend = isSaturday(day) || isSunday(day);
        const isDayHoliday = isHoliday(day);
        return (
            <div key={key} className={cn(
                "border-r border-b p-2 flex flex-col",
                { "bg-accent/10": isToday(day) },
                { "bg-muted opacity-50": (isWeekend || isDayHoliday) && isSameMonth(day, date) }
            )}>
                <span className={cn(
                    "font-semibold h-6 w-6 flex items-center justify-center rounded-full text-sm",
                    { "bg-primary text-primary-foreground": isToday(day) },
                    { "text-muted-foreground": !isSameMonth(day, date) }
                )}>
                    {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {dayEvents.map(event => (
                        <Badge key={event.eventId} variant="secondary" className="block w-full text-left truncate cursor-pointer bg-accent/50 hover:bg-accent/80">
                            {event.title}
                        </Badge>
                    ))}
                </div>
            </div>
        )
    }

    let dayCells: React.ReactNode[] = [];
    if (hasWeekendEvents) {
        dayCells = [
            ...Array.from({ length: startingDayIndex }).map((_, index) => (
                <div key={`empty-${index}`} className="border-r border-b" />
            )),
            ...daysInMonth.map((day, index) => renderDayCell(day, index))
        ];
    } else {
        // Build cells for 5-day week view
        for (let i = 0; i < startingDayIndex; i++) {
            if (i < 5) { // Only add placeholders for Mon-Fri
                dayCells.push(<div key={`empty-${i}`} className="border-r border-b" />);
            }
        }
        daysInMonth.forEach((day, index) => {
            if (!isSaturday(day) && !isSunday(day)) {
                dayCells.push(renderDayCell(day, index));
            }
        });
    }

    return (
        <Card className="h-full flex flex-col">
            <div className={cn("grid border-b border-t", gridColsClass)}>
                {displayedWeekdays.map(day => (
                    <div key={day} className={cn("text-center font-medium text-muted-foreground p-2 text-sm border-r last:border-r-0", {
                        "opacity-50": day === 'Sat' || day === 'Sun'
                    })}>
                        {day}
                    </div>
                ))}
            </div>
            <CardContent className="p-0 flex-1 flex flex-col">
                <div className={cn("grid grid-rows-5 flex-1 min-h-[600px]", gridColsClass)}>
                    {dayCells}
                </div>
            </CardContent>
        </Card>
    );
}
