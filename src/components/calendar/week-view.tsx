
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfDay, addHours, isToday, isSaturday, isSunday, isSameDay } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { Button } from '../ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

export function WeekView({ date, containerRef, zoomLevel }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit' }) {
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const [hourHeight, setHourHeight] = useState(60);

    useEffect(() => {
        const updateNow = () => setNow(new Date());
        updateNow();
        const timer = setInterval(updateNow, 60 * 1000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
    
        if (zoomLevel === 'fit') {
            const availableHeight = container.offsetHeight;
            // Fit 8am to 8pm (12 hours) in the view
            const newHourHeight = availableHeight / 12;
            setHourHeight(newHourHeight);
            // Scroll to 8am
            container.scrollTo({ top: 8 * newHourHeight, behavior: 'smooth' });
        } else { // zoomLevel === 'normal'
            setHourHeight(60);
             if (weekDays.some(isToday) && now) {
                // Scroll to current time
                const scrollTop = (now.getHours() -1) * 60;
                 container.scrollTo({ top: scrollTop, behavior: 'smooth' });
            }
        }
      }, [zoomLevel, containerRef, date, now, weekDays]);

    useEffect(() => {
        if (weekDays.some(isToday) && containerRef.current && nowMarkerRef.current && zoomLevel === 'normal') {
            const container = containerRef.current;
            const marker = nowMarkerRef.current;
            const scrollTop = marker.offsetTop - (container.offsetHeight / 2);
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });
        }
    }, [date, now, containerRef, zoomLevel, weekDays]);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }
    
    const [showWeekends, setShowWeekends] = useState(false);
    
    const displayedDays = showWeekends ? weekDays : weekDays.slice(0, 5);

    const getEventPosition = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const top = (startHour + startMinute / 60) * hourHeight; 
        const height = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourHeight, 30);
        return { top, height };
    }
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * hourHeight;
    }

    const gridColsClass = showWeekends ? 'grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr,1fr]' : 'grid-cols-[auto,1fr,1fr,1fr,1fr,1fr]';

    return (
        <Card>
            <CardHeader className="p-0 border-b sticky top-0 bg-card z-10">
                <div className={cn("grid", gridColsClass)}>
                    <div className="w-20"></div> {/* Timeline spacer */}
                    {displayedDays.map((day, index) => {
                        const isWeekend = isSaturday(day) || isSunday(day);
                        const isDayHoliday = isHoliday(day);
                        return (
                            <div key={day.toString()} className={cn("text-center p-2 border-l relative", { "bg-muted/10": index % 2 !== 0 }, { "bg-muted/50": isWeekend || isDayHoliday })}>
                                <p className={cn("text-sm font-medium", { "text-muted-foreground/50": isWeekend || isDayHoliday })}>{format(day, 'EEE')}</p>
                                <p className={cn(
                                    "text-2xl font-semibold",
                                    isToday(day) && 'text-primary bg-primary/10 rounded-full',
                                     { "text-muted-foreground/50": isWeekend || isDayHoliday }
                                )}>
                                    {format(day, 'd')}
                                </p>
                                {!showWeekends && format(day, 'EEE') === 'Fri' && (
                                    <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(true)}>
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                )}
                                {showWeekends && format(day, 'EEE') === 'Sun' && (
                                    <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(false)}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="p-0 relative">
                <div className={cn("grid min-h-full", gridColsClass)}>
                    {/* Timeline */}
                    <div className="w-20 border-r">
                        {hours.map((hour, index) => (
                            <div key={hour} className={cn("relative text-right pr-2 border-b", {"bg-muted/10": index % 2 !== 0})} style={{ height: `${hourHeight}px` }}>
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), 'HH:00')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {displayedDays.map((day, index) => {
                        const isWeekend = isSaturday(day) || isSunday(day);
                        const isDayHoliday = isHoliday(day);
                        return (
                            <div key={day.toString()} className={cn("relative border-l", { "bg-muted/10": index % 2 !== 0 }, { "bg-muted/50": isWeekend || isDayHoliday })}>
                                 {/* Working Hours Backgrounds */}
                                {isWeekend || isDayHoliday ? (
                                    <div className="absolute inset-0 bg-secondary/50 z-0" title="Overtime" />
                                ) : (
                                    <>
                                        <div className="absolute inset-x-0 top-0 bg-secondary/50 z-0" style={{ height: `${8 * hourHeight}px` }} title="Overtime" />
                                        <div className="absolute inset-x-0 bg-muted z-0" style={{ top: `${8 * hourHeight}px`, height: `${1 * hourHeight}px` }} title="Extended Working Hours" />
                                        <div className="absolute inset-x-0 bg-muted z-0" style={{ top: `${18 * hourHeight}px`, height: `${2 * hourHeight}px` }} title="Extended Working Hours" />
                                        <div className="absolute inset-x-0 bottom-0 bg-secondary/50 z-0" style={{ top: `${20 * hourHeight}px`, bottom: '0px' }} title="Overtime" />
                                    </>
                                )}
                                {/* Lunch Break Cue */}
                                <div
                                    className="absolute inset-x-0 lunch-break-pattern z-0 pointer-events-none"
                                    style={{
                                        top: `${12 * hourHeight}px`,
                                        height: `${2.5 * hourHeight}px`
                                    }}
                                    title="Lunch Break"
                                />
                                {/* Grid lines */}
                                {hours.map(hour => (
                                    <div key={hour} className="border-b" style={{ height: `${hourHeight}px` }}></div>
                                ))}
                                {/* Events */}
                                <div className="absolute inset-0 z-10">
                                    {getEventsForDay(day).map(event => {
                                        const { top, height } = getEventPosition(event);
                                        return (
                                            <div 
                                                key={event.eventId} 
                                                className="absolute left-1 right-1 p-1 bg-primary/80 text-primary-foreground rounded-md shadow-sm cursor-pointer hover:bg-primary"
                                                style={{ top: `${top}px`, height: `${height}px` }}
                                            >
                                                <p className="font-semibold text-xs truncate">{event.title}</p>
                                                <p className="text-[10px] opacity-90 truncate">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</p>
                                            </div>
                                        )
                                    })}
                                    {isToday(day) && now && (
                                        <div 
                                            ref={nowMarkerRef}
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
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
