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

const HOUR_WIDTH_PX = 120;

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

        const left = (startHour + startMinute / 60) * HOUR_WIDTH_PX;
        const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * HOUR_WIDTH_PX - 4, 20);
        return { left, width };
    }

    const isWeekend = isSaturday(date) || isSunday(date);
    const isDayHoliday = isHoliday(date);
    const isViewingToday = isSameDay(date, new Date());
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * HOUR_WIDTH_PX;
    }

    return (
        <Card style={{ width: `${24 * HOUR_WIDTH_PX}px` }}>
             <CardHeader className="p-0 border-b sticky top-0 bg-card z-10 flex flex-row">
                {hours.map(hour => (
                    <div key={hour} className="w-[120px] shrink-0 text-left p-2 border-r">
                        <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), 'HH:mm')}</span>
                    </div>
                ))}
            </CardHeader>
            <CardContent className={cn("p-0 relative h-[calc(100vh-250px)]", { "bg-muted/50": isWeekend || isDayHoliday })}>
                {/* Vertical Grid lines */}
                {hours.slice(0, 23).map(hour => (
                    <div key={`line-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * HOUR_WIDTH_PX}px` }}></div>
                ))}

                {/* Events */}
                <div className="absolute inset-0 p-2">
                    {dayEvents.map(event => {
                        const { left, width } = getEventPosition(event);
                        return (
                            <div 
                                key={event.eventId} 
                                className="absolute h-[calc(100%-1rem)] p-2 bg-primary/90 text-primary-foreground rounded-lg shadow-md cursor-pointer hover:bg-primary"
                                style={{ left: `${left + 2}px`, width: `${width}px` }}
                            >
                                <p className="font-semibold text-sm truncate">{event.title}</p>
                                <p className="text-xs opacity-90 truncate">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</p>
                            </div>
                        )
                    })}
                </div>
                
                {/* Current Time Marker */}
                {isViewingToday && now && (
                    <div 
                        className="absolute top-0 bottom-0 z-10"
                        style={{ left: `${calculateCurrentTimePosition()}px` }}
                    >
                        <div className="relative w-0.5 h-full bg-primary">
                            <div className="absolute -top-1.5 -left-[5px] h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
