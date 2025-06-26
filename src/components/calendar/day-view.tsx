
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

const DEFAULT_HOUR_WIDTH_PX = 120;
const LOCATION_LABEL_WIDTH_PX = 160;

export function DayView({ date, containerRef, zoomLevel, axisView }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', axisView: 'standard' | 'reversed' }) {
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);
    const [hourHeight, setHourHeight] = useState(60);

    useEffect(() => {
        const updateNow = () => setNow(new Date());
        updateNow();
        const timer = setInterval(updateNow, 60 * 1000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
    
        if (zoomLevel === 'fit') {
            if (axisView === 'standard') {
                const availableWidth = container.offsetWidth;
                // Fit 8am to 8pm (12 hours) in the view
                const newHourWidth = (availableWidth - LOCATION_LABEL_WIDTH_PX) / 12; 
                setHourWidth(newHourWidth);
                const scrollLeft = 8 * newHourWidth; // Scroll to 8am
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            } else { // reversed axis
                const availableHeight = container.offsetHeight;
                const newHourHeight = availableHeight / 12; // 12 hours from 8am to 8pm
                setHourHeight(newHourHeight);
                container.scrollTo({ top: 8 * newHourHeight, behavior: 'smooth' });
            }
        } else { // zoomLevel === 'normal'
            if (axisView === 'standard') {
                setHourWidth(DEFAULT_HOUR_WIDTH_PX);
                if (isSameDay(date, new Date()) && now) {
                    // Scroll to current time
                    const scrollLeft = (now.getHours() -1) * DEFAULT_HOUR_WIDTH_PX;
                     container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                } else {
                    // Scroll to 7am by default
                    container.scrollTo({ left: 7 * DEFAULT_HOUR_WIDTH_PX, behavior: 'smooth' });
                }
            } else { // reversed axis
                setHourHeight(60);
                if (isSameDay(date, new Date()) && now) {
                    const scrollTop = (now.getHours() - 1) * 60;
                    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
            }
        }
      }, [zoomLevel, containerRef, date, now, axisView]);


    useEffect(() => {
        if (isSameDay(date, new Date()) && containerRef.current && nowMarkerRef.current && zoomLevel === 'normal') {
            const container = containerRef.current;
            const marker = nowMarkerRef.current;
            if (axisView === 'standard') {
                const scrollLeft = marker.offsetLeft - (container.offsetWidth / 2);
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth',
                });
            } else {
                const scrollTop = marker.offsetTop - (container.offsetHeight / 2);
                container.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth',
                });
            }
        }
    }, [date, now, containerRef, zoomLevel, axisView]);


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

    const allLocations = useMemo(() => Object.keys(groupedEvents)
        .sort((a,b) => a === 'No Location' ? 1 : b === 'No Location' ? -1 : a.localeCompare(b)), [groupedEvents]);
    
    useEffect(() => {
        const locationsToCollapse = new Set<string>();
        allLocations.forEach(loc => {
            if (!groupedEvents[loc] || groupedEvents[loc].length === 0) {
                locationsToCollapse.add(loc);
            }
        });
        setCollapsedLocations(locationsToCollapse);
    }, [groupedEvents, allLocations]);

    const toggleLocationCollapse = (location: string) => {
        setCollapsedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(location)) newSet.delete(location);
            else newSet.add(location);
            return newSet;
        });
    };

    const getEventPositionStandard = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const left = (startHour + startMinute / 60) * hourWidth;
        const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourWidth - 4, 20);
        return { left, width };
    }
    
    const getEventPositionReversed = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const top = (startHour + startMinute / 60) * hourHeight; 
        const height = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourHeight, 30);
        return { top, height };
    }

    const isWeekend = isSaturday(date) || isSunday(date);
    const isDayHoliday = isHoliday(date);
    const isViewingToday = isSameDay(date, new Date());
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        if(axisView === 'standard') {
            return (now.getHours() + now.getMinutes() / 60) * hourWidth;
        }
        return (now.getHours() + now.getMinutes() / 60) * hourHeight;
    }
    
    const renderLocationRow = (location: string, isLast: boolean, index: number) => {
        const eventsInRow = groupedEvents[location] || [];
        const isCollapsed = collapsedLocations.has(location);
        return (
            <div key={location} className={cn("flex", { "border-b": !isLast }, { "bg-muted/10": index % 2 !== 0 })}>
                <div 
                    className="w-[160px] shrink-0 p-2 border-r flex items-center justify-start bg-card sticky left-0 z-30 gap-1 cursor-pointer"
                    onClick={() => toggleLocationCollapse(location)}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <p className="font-medium text-sm truncate">{location}</p>
                </div>
                <div className={cn("relative flex-1", isCollapsed ? "h-10" : "h-20")}>
                    {/* Vertical Grid lines for this row */}
                    {hours.slice(0, 23).map(hour => (
                        <div key={`line-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * hourWidth}px` }}></div>
                    ))}
                    {/* Events for this row */}
                    {!isCollapsed && eventsInRow.map(event => {
                        const { left, width } = getEventPositionStandard(event);
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

    const renderStandardView = () => {
        if (Object.keys(groupedEvents).length === 0) {
            return (
                 <Card>
                    <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                         <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                            <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-medium text-sm sticky left-0 bg-card z-30">Location</div>
                            {hours.map(hour => (
                                <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px` }}>
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
                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                    <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-medium text-sm sticky left-0 bg-card z-30">Location</div>
                        {hours.map(hour => (
                            <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px` }}>
                                <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), 'HH:mm')}</span>
                            </div>
                        ))}
                    </CardHeader>
                    <CardContent className="p-0 relative">
                         {/* Working Hours Backgrounds */}
                        {isWeekend || isDayHoliday ? (
                            <div className="absolute inset-0 bg-amber-400/10 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX}px` }} title="Overtime" />
                        ) : (
                            <>
                                <div className="absolute inset-y-0 bg-amber-400/10 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX}px`, width: `${8 * hourWidth}px` }} title="Overtime" />
                                <div className="absolute inset-y-0 bg-primary/5 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 8 * hourWidth}px`, width: `${1 * hourWidth}px` }} title="Extended Working Hours" />
                                <div className="absolute inset-y-0 bg-primary/5 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 18 * hourWidth}px`, width: `${2 * hourWidth}px` }} title="Extended Working Hours" />
                                <div className="absolute inset-y-0 bg-amber-400/10 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 20 * hourWidth}px`, width: `${4 * hourWidth}px` }} title="Overtime" />
                            </>
                        )}
                        
                        {allLocations.map((location, index) => renderLocationRow(location, index === allLocations.length - 1, index))}
                        
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
    
    const renderReversedView = () => {
         return (
            <Card>
                <CardContent className="p-0 relative">
                    <div className="grid grid-cols-[auto,1fr] min-h-full">
                        {/* Timeline */}
                        <div className="w-20 border-r">
                            {hours.map(hour => (
                                <div key={hour} className="relative text-right pr-2 border-b" style={{ height: `${hourHeight}px` }}>
                                    <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), 'HH:00')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Day column */}
                        <div className="relative">
                             {/* Working Hours Backgrounds */}
                            {isWeekend || isDayHoliday ? (
                                <div className="absolute inset-0 bg-amber-400/10 z-0" title="Overtime" />
                            ) : (
                                <>
                                    <div className="absolute inset-x-0 top-0 bg-amber-400/10 z-0" style={{ height: `${8 * hourHeight}px` }} title="Overtime" />
                                    <div className="absolute inset-x-0 bg-primary/5 z-0" style={{ top: `${8 * hourHeight}px`, height: `${1 * hourHeight}px` }} title="Extended Working Hours" />
                                    <div className="absolute inset-x-0 bg-primary/5 z-0" style={{ top: `${18 * hourHeight}px`, height: `${2 * hourHeight}px` }} title="Extended Working Hours" />
                                    <div className="absolute inset-x-0 bottom-0 bg-amber-400/10 z-0" style={{ height: `${4 * hourHeight}px` }} title="Overtime" />
                                </>
                            )}
                            {/* Grid lines */}
                            {hours.map(hour => (
                                <div key={hour} className="border-b" style={{ height: `${hourHeight}px` }}></div>
                            ))}
                            {/* Events */}
                            <div className="absolute inset-0 z-10">
                                {dayEvents.map(event => {
                                    const { top, height } = getEventPositionReversed(event);
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
                                {isViewingToday && now && (
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
                    </div>
                </CardContent>
            </Card>
        );
    }

    return axisView === 'reversed' ? renderReversedView() : renderStandardView();
}
