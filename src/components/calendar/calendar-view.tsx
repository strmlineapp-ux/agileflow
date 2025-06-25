
"use client";

import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { type Event } from '@/types';
import { mockEvents } from '@/lib/mock-data';

export function MonthView({ date }: { date: Date }) {
    const firstDayOfMonth = startOfMonth(date);
    const lastDayOfMonth = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
    const startingDayIndex = getDay(firstDayOfMonth);

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <Card className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-t">
                {weekdays.map(day => (
                    <div key={day} className="text-center font-medium text-muted-foreground p-2 text-sm border-r last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>
            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="grid grid-cols-7 grid-rows-5 flex-1 min-h-[600px]">
                    {Array.from({ length: startingDayIndex }).map((_, index) => (
                        <div key={`empty-${index}`} className="border-r border-b" />
                    ))}
                    {daysInMonth.map((day, index) => {
                        const dayEvents = getEventsForDay(day);
                        return (
                            <div key={index} className={cn("border-r border-b p-2 flex flex-col", { "bg-accent/10": isToday(day) })}>
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
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
