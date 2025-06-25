
'use client';

import React, { useEffect, useState } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

export function DayView({ date }: { date: Date }) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60 * 1000); // Update every minute

        return () => clearInterval(timer);
    }, []);

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
    const isViewingToday = isSameDay(date, new Date());
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * 60;
    }

    return (
        <Card>
            <CardHeader className="p-0 border-b">
                <div className="grid grid-cols-[auto,1fr]">
                    <div className="w-20"></div> {/* Spacer for timeline */}
                    <div className={cn("text-center p-2 border-l", { "bg-muted/50": isWeekend || isDayHoliday })}>
                        <p className={cn("text-sm font-medium", { "text-muted-foreground/50": isWeekend || isDayHoliday })}>{format(date, 'EEE')}</p>
                        <p className={cn(
                            "text-2xl font-semibold",
                            isToday(date) && 'text-primary bg-primary/10 rounded-full',
                            { "text-muted-foreground/50": isWeekend || isDayHoliday }
                        )}>
                            {format(date, 'd')}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative">
                <div className="grid grid-cols-[auto,1fr] h-full">
                    {/* Timeline */}
                    <div className="w-20 border-r">
                        {hours.map(hour => (
                            <div key={hour} className="h-[60px] relative text-right pr-2">
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), 'HH:00')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day column */}
                    <div className={cn("relative", { "bg-muted/50": isWeekend || isDayHoliday })}>
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
                                        <p className="text-xs opacity-90">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</p>
                                    </div>
                                )
                            })}
                             {isViewingToday && now && (
                                <div 
                                    className="absolute w-full z-10"
                                    style={{ top: `${calculateCurrentTimePosition()}px` }}
                                >
                                    <div className="relative h-0.5 bg-primary">
                                        <div className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
