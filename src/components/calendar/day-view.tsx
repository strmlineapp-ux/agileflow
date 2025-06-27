
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from '@/context/user-context';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const getContrastColor = (hsl: string): string => {
    // Add a guard for undefined input
    if (!hsl) {
        return 'hsl(var(--card-foreground))';
    }
    // Fix: HSL color values in mock data are space-separated, not comma-separated.
    const parts = hsl.split(' ');
    // Ensure we have enough parts to parse lightness
    if (parts.length < 3) {
        return 'hsl(var(--card-foreground))'; 
    }
    const lightness = parseInt(parts[2].replace('%', '').replace(')', ''));
    if (isNaN(lightness)) {
        return 'hsl(var(--card-foreground))';
    }
    return lightness > 55 ? 'hsl(var(--card-foreground))' : 'hsl(var(--primary-foreground))';
}


const DEFAULT_HOUR_WIDTH_PX = 120;
const DEFAULT_HOUR_HEIGHT_PX = 60;
const LOCATION_LABEL_WIDTH_PX = 160;

export function DayView({ date, containerRef, zoomLevel, axisView }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', axisView: 'standard' | 'reversed' }) {
    const { events, calendars } = useUser();
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);
    const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT_PX);

    const isViewingToday = useMemo(() => isSameDay(date, new Date()), [date]);

    const dayEvents = useMemo(() => events.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')), [date, events]);
    
    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    useEffect(() => {
        if (isViewingToday) {
            const timer = setInterval(() => setNow(new Date()), 60 * 1000);
            setNow(new Date());
            return () => clearInterval(timer);
        } else {
            setNow(null);
        }
    }, [isViewingToday]);

    // Handle scroll and zoom adjustments
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isFit = zoomLevel === 'fit';
        const isStandard = axisView === 'standard';

        if (isStandard) {
            const newHourWidth = isFit ? (container.offsetWidth - LOCATION_LABEL_WIDTH_PX) / 12 : DEFAULT_HOUR_WIDTH_PX;
            setHourWidth(newHourWidth);
            
            let scrollLeft = 7 * newHourWidth; // Default scroll to 7am
            if (isFit) {
                scrollLeft = 8 * newHourWidth; // Fit view scrolls to 8am
            } else if (now && isViewingToday) {
                scrollLeft = (now.getHours() - 1) * newHourWidth; // Normal view on today scrolls to current time
            }
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });

        } else { // Reversed axis
            const newHourHeight = isFit ? container.offsetHeight / 12 : DEFAULT_HOUR_HEIGHT_PX;
            setHourHeight(newHourHeight);

            let scrollTop = 0;
            if (isFit) {
                scrollTop = 8 * newHourHeight;
            } else if (now && isViewingToday) {
                scrollTop = (now.getHours() - 1) * newHourHeight;
            }
            container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
    }, [zoomLevel, axisView, containerRef, now, isViewingToday, date]);

    // Center view on "Now" marker
    useEffect(() => {
        if (isViewingToday && containerRef.current && nowMarkerRef.current && zoomLevel === 'normal') {
            const container = containerRef.current;
            const marker = nowMarkerRef.current;
            if (axisView === 'standard') {
                container.scrollTo({ left: marker.offsetLeft - (container.offsetWidth / 2), behavior: 'smooth' });
            } else {
                container.scrollTo({ top: marker.offsetTop - (container.offsetHeight / 2), behavior: 'smooth' });
            }
        }
    }, [now, isViewingToday, containerRef, zoomLevel, axisView]);


    const hours = Array.from({ length: 24 }, (_, i) => i);

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
                        const colors = calendarColorMap[event.calendarId];
                        return (
                            <div 
                                key={event.eventId} 
                                className={cn(
                                    "absolute h-[calc(100%-1rem)] top-1/2 -translate-y-1/2 p-2 rounded-lg shadow-md cursor-pointer z-10"
                                )}
                                style={{ left: `${left + 2}px`, width: `${width}px`, backgroundColor: colors?.bg, color: colors?.text }}
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

    const renderStandardView = () => (
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
                {allLocations.length === 0 ? (
                     <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No events scheduled for this day.
                    </div>
                ) : (
                    <CardContent className="p-0 relative">
                        {/* Lunch Break Cue */}
                        <div
                            className="absolute inset-y-0 lunch-break-pattern z-0 pointer-events-none"
                            style={{
                                left: `${LOCATION_LABEL_WIDTH_PX + 12 * hourWidth}px`,
                                width: `${2.5 * hourWidth}px`
                            }}
                            title="Lunch Break"
                        />
                        
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
                )}
            </div>
        </Card>
    );
    
    const renderReversedView = () => (
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

                        {/* Events or No Events Message */}
                        {dayEvents.length === 0 ? (
                             <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                No events scheduled for this day.
                            </div>
                        ) : (
                            <div className="absolute inset-0 z-10">
                                {dayEvents.map(event => {
                                    const { top, height } = getEventPositionReversed(event);
                                    const colors = calendarColorMap[event.calendarId];
                                    return (
                                        <div 
                                            key={event.eventId} 
                                            className={cn(
                                                "absolute left-1 right-1 p-1 rounded-md shadow-sm cursor-pointer"
                                            )}
                                            style={{ top: `${top}px`, height: `${height}px`, backgroundColor: colors?.bg, color: colors?.text }}
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
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return axisView === 'reversed' ? renderReversedView() : renderStandardView();
}
