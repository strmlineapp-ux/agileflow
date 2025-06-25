
'use client';

import React from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfDay, addHours, isToday, isSaturday, isSunday } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mockEvents } from '@/lib/mock-data';

export function WeekView({ date }: { date: Date }) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }
    
    const hasWeekendEvents = weekDays.slice(5, 7).some(day => getEventsForDay(day).length > 0);
    const displayedDays = hasWeekendEvents ? weekDays : weekDays.slice(0, 5);

    const getEventPosition = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const top = (startHour + startMinute / 60) * 60; // 60px per hour
        const height = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60, 30);
        return { top, height };
    }

    const gridColsClass = hasWeekendEvents ? 'grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr,1fr]' : 'grid-cols-[auto,1fr,1fr,1fr,1fr,1fr]';

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-0 border-b sticky top-0 bg-card z-10">
                <div className={cn("grid", gridColsClass)}>
                    <div className="w-20"></div> {/* Timeline spacer */}
                    {displayedDays.map(day => (
                        <div key={day.toString()} className={cn("text-center p-2 border-l", { "bg-muted/30": isSaturday(day) || isSunday(day) })}>
                            <p className="text-sm font-medium text-muted-foreground">{format(day, 'EEE')}</p>
                            <p className={cn(
                                "text-2xl font-semibold",
                                isToday(day) && 'text-primary bg-primary/10 rounded-full'
                            )}>
                                {format(day, 'd')}
                            </p>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative overflow-y-auto">
                <div className={cn("grid min-h-full", gridColsClass)}>
                    {/* Timeline */}
                    <div className="w-20 border-r">
                        {hours.map(hour => (
                            <div key={hour} className="h-[60px] relative text-right pr-2">
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), 'ha')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {displayedDays.map(day => (
                        <div key={day.toString()} className={cn("relative border-l", { "bg-muted/30": isSaturday(day) || isSunday(day) })}>
                            {/* Grid lines */}
                            {hours.map(hour => (
                                <div key={hour} className="h-[60px] border-b"></div>
                            ))}
                            {/* Events */}
                            <div className="absolute inset-0">
                                {getEventsForDay(day).map(event => {
                                    const { top, height } = getEventPosition(event);
                                    return (
                                        <div 
                                            key={event.eventId} 
                                            className="absolute left-1 right-1 p-1 bg-primary/80 text-primary-foreground rounded-md shadow-sm cursor-pointer hover:bg-primary"
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        >
                                            <p className="font-semibold text-xs truncate">{event.title}</p>
                                            <p className="text-[10px] opacity-90 truncate">{format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
