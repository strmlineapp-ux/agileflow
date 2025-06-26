
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const HOUR_WIDTH_PX = 120;
const LOCATION_LABEL_WIDTH_PX = 160;

const fixedLocations = [
    "Auditorium", 
    "ACR", 
    "Event Space 1 (S2)", 
    "Event Space 2 (S2)", 
    "Event Space 3 (R7)", 
    "Event Space 4 (R7)", 
    "Studio"
];

export function DayView({ date, containerRef }: { date: Date, containerRef: React.RefObject<HTMLDivElement> }) {
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateNow = () => setNow(new Date());
        updateNow();
        const timer = setInterval(updateNow, 60 * 1000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isSameDay(date, new Date()) && containerRef.current && nowMarkerRef.current) {
            const container = containerRef.current;
            const marker = nowMarkerRef.current;
            const scrollLeft = marker.offsetLeft - (container.offsetWidth / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth',
            });
        }
    }, [date, now, containerRef]);


    const hours = Array.from({ length: 24 }, (_, i) => i);

    const dayEvents = useMemo(() => mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')), [date]);

    const groupedEvents = useMemo(() => {
        return dayEvents.reduce((acc, event) => {
            const locationKey = event.location || 'No Location';
            if (!acc[locationKey]) {
                acc[locationKey] = [];
            }
            acc[locationKey].push(event);
            return acc;
        }, {} as Record<string, Event[]>);
    }, [dayEvents]);

    const otherLocations = useMemo(() => Object.keys(groupedEvents)
        .filter(loc => !fixedLocations.includes(loc))
        .sort((a,b) => a === 'No Location' ? 1 : b === 'No Location' ? -1 : a.localeCompare(b)), [groupedEvents]);
    
    const fixedLocationsHaveEvents = useMemo(() => fixedLocations.some(loc => (groupedEvents[loc] || []).length > 0), [groupedEvents]);
    
    const [fixedLocationsCollapsed, setFixedLocationsCollapsed] = useState(!fixedLocationsHaveEvents);

    useEffect(() => {
        setFixedLocationsCollapsed(!fixedLocationsHaveEvents);
    }, [fixedLocationsHaveEvents]);


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
    
    const renderLocationRow = (location: string, isLast: boolean) => {
        const eventsInRow = groupedEvents[location] || [];
        return (
            <div key={location} className={cn("flex", { "border-b": !isLast })}>
                <div className="w-[160px] shrink-0 p-2 border-r flex items-center justify-start bg-card sticky left-0 z-30">
                    <p className="font-medium text-sm truncate">{location}</p>
                </div>
                <div className="relative flex-1 h-20">
                    {/* Vertical Grid lines for this row */}
                    {hours.slice(0, 23).map(hour => (
                        <div key={`line-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * HOUR_WIDTH_PX}px` }}></div>
                    ))}
                    {/* Events for this row */}
                    {eventsInRow.map(event => {
                        const { left, width } = getEventPosition(event);
                        return (
                            <div 
                                key={event.eventId} 
                                className="absolute h-[calc(100%-1rem)] top-1/2 -translate-y-1/2 p-2 bg-primary/90 text-primary-foreground rounded-lg shadow-md cursor-pointer hover:bg-primary z-10"
                                style={{ left: `${left + 2}px`, width: `${width}px` }}
                            >
                                <p className="font-semibold text-sm truncate">{event.title}</p>
                                <p className="text-xs opacity-90 truncate">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    if (Object.keys(groupedEvents).length === 0) {
        return (
             <Card>
                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * HOUR_WIDTH_PX)}px`}}>
                     <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-medium text-sm sticky left-0 bg-card z-30">Location</div>
                        {hours.map(hour => (
                            <div key={hour} className="w-[120px] shrink-0 text-left p-2 border-r">
                                <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), 'HH:mm')}</span>
                            </div>
                        ))}
                    </CardHeader>
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No events scheduled for this day.
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * HOUR_WIDTH_PX)}px`}}>
                <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                    <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-medium text-sm sticky left-0 bg-card z-30">Location</div>
                    {hours.map(hour => (
                        <div key={hour} className="w-[120px] shrink-0 text-left p-2 border-r">
                            <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), 'HH:mm')}</span>
                        </div>
                    ))}
                </CardHeader>
                <CardContent className={cn("p-0 relative", { "bg-muted/20": isWeekend || isDayHoliday })}>
                    <div className={cn("flex border-b")}>
                        <div 
                            className="w-[160px] shrink-0 p-2 border-r flex items-center justify-start bg-card sticky left-0 z-30 font-semibold cursor-pointer gap-1"
                            onClick={() => setFixedLocationsCollapsed(prev => !prev)}
                        >
                            {fixedLocationsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <p className="truncate text-sm">Fixed Locations</p>
                        </div>
                        <div className="relative flex-1 h-12">
                             {hours.slice(0, 23).map(hour => (
                                <div key={`line-fixed-trigger-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * HOUR_WIDTH_PX}px` }}></div>
                            ))}
                        </div>
                    </div>
                    
                    {!fixedLocationsCollapsed && fixedLocations.map((location, index) => renderLocationRow(location, index === fixedLocations.length - 1 && otherLocations.length === 0))}
                    
                    {otherLocations.map((location, index) => renderLocationRow(location, index === otherLocations.length - 1))}
                    
                    {isViewingToday && now && (
                        <div 
                            ref={nowMarkerRef}
                            className="absolute top-0 bottom-0 z-20 pointer-events-none"
                            style={{ left: `${LOCATION_LABEL_WIDTH_PX + calculateCurrentTimePosition()}px` }}
                        >
                            <div className="relative w-0.5 h-full bg-primary">
                                <div className="absolute -top-1.5 -left-[5px] h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}
