
'use client';

import React from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

export function DayView({ date }: { date: Date }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

    const getEventPosition = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const top = (startHour + startMinute / 60) * 60; // 60px per hour
        const height = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60, 30);
        return { top, height };
    }

    const isWeekend = isSaturday(date) || isSunday(date);
    const isDayHoliday = isHoliday(date);

    return (
        <Card className="h-full flex flex-col">
            <CardContent className="p-0 flex-1 relative overflow-y-auto">
                <div className="grid grid-cols-[auto,1fr] h-full">
                    {/* Timeline */}
                    <div className="w-20 border-r">
                        {hours.map(hour => (
                            <div key={hour} className="h-[60px] relative text-right pr-2">
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), 'ha')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day column */}
                    <div className={cn("relative", { "bg-border": isWeekend || isDayHoliday })}>
                        {/* Grid lines */}
                        {hours.map(hour => (
                            <div key={hour} className="h-[60px] border-b"></div>
                        ))}
                        {/* Events */}
                        <div className="absolute inset-0">
                            {dayEvents.map(event => {
                                const { top, height } = getEventPosition(event);
                                return (
                                    <div 
                                        key={event.eventId} 
                                        className="absolute left-2 right-2 p-2 bg-primary/90 text-primary-foreground rounded-lg shadow-md cursor-pointer hover:bg-primary"
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                    >
                                        <p className="font-semibold text-sm">{event.title}</p>
                                        <p className="text-xs opacity-90">{format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
