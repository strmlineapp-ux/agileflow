
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday, startOfWeek, eachDayOfInterval, addDays } from 'date-fns';
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

const getEventPosition = (event: Event) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    const left = (startHour + startMinute / 60) * HOUR_WIDTH_PX;
    const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * HOUR_WIDTH_PX - 4, 20);
    return { left, width };
}

export function ProductionScheduleView({ date, containerRef }: { date: Date, containerRef: React.RefObject<HTMLDivElement> }) {
    const [now, setNow] = useState<Date | null>(null);
    const todayCardRef = useRef<HTMLDivElement>(null);
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [collapsedLocations, setCollapsedLocations] = useState<Record<string, Set<string>>>({});

    useEffect(() => {
        const updateNow = () => setNow(new Date());
        updateNow();
        const timer = setInterval(updateNow, 60 * 1000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    const weeklyScheduleData = useMemo(() => {
        return weekDays.map(day => {
            const dayEvents = mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const groupedEvents = dayEvents.reduce((acc, event) => {
                const locationKey = event.location || 'No Location';
                if (!acc[locationKey]) {
                    acc[locationKey] = [];
                }
                acc[locationKey].push(event);
                return acc;
            }, {} as Record<string, Event[]>);
            
            const isWeekend = isSaturday(day) || isSunday(day);
            const otherLocations = Object.keys(groupedEvents)
                .filter(loc => !fixedLocations.includes(loc))
                .sort((a,b) => a === 'No Location' ? 1 : b === 'No Location' ? -1 : a.localeCompare(b));
                
            return { day, groupedEvents, isWeekend, otherLocations };
        });
    }, [date]);

    useEffect(() => {
        const initialCollapsedDays = new Set<string>();
        const initialCollapsedLocations: Record<string, Set<string>> = {};

        weeklyScheduleData.forEach(({ day, isWeekend, groupedEvents }) => {
            const dayIso = day.toISOString();
            if (isWeekend) {
                initialCollapsedDays.add(dayIso);
            }

            const locationsToCollapse = new Set<string>();
            fixedLocations.forEach(loc => {
                if (!groupedEvents[loc] || groupedEvents[loc].length === 0) {
                    locationsToCollapse.add(loc);
                }
            });
            initialCollapsedLocations[dayIso] = locationsToCollapse;
        });
        setCollapsedDays(initialCollapsedDays);
        setCollapsedLocations(initialCollapsedLocations);
    }, [weeklyScheduleData]);
    
    useEffect(() => {
        if (weekDays.some(isToday) && containerRef.current && todayCardRef.current) {
            const container = containerRef.current;
            const todayElement = todayCardRef.current;
            const scrollTop = todayElement.offsetTop - 20;
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });
        }
    }, [date, containerRef, weeklyScheduleData]); // depend on weeklyScheduleData to run after collapsed states are set

    const toggleDayCollapse = (dayIso: string) => {
        setCollapsedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayIso)) newSet.delete(dayIso);
            else newSet.add(dayIso);
            return newSet;
        });
    };

    const toggleLocationCollapse = (dayIso: string, location: string) => {
        setCollapsedLocations(prev => {
            const daySet = new Set(prev[dayIso] || []);
            if (daySet.has(location)) {
                daySet.delete(location);
            } else {
                daySet.add(location);
            }
            return { ...prev, [dayIso]: daySet };
        });
    };
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * HOUR_WIDTH_PX;
    }

    const renderLocationRow = (dayIso: string, location: string, eventsInRow: Event[], isLast: boolean, isFixed: boolean) => {
        const isLocationCollapsed = isFixed && collapsedLocations[dayIso]?.has(location);
        
        return (
            <div key={location} className={cn("flex", { "border-b": !isLast })}>
                <div 
                    className={cn(
                        "w-[160px] shrink-0 p-2 border-r flex items-center justify-start bg-card sticky left-0 z-30 gap-1",
                        isFixed && "cursor-pointer"
                    )}
                    onClick={() => isFixed && toggleLocationCollapse(dayIso, location)}
                >
                     {isFixed && (isLocationCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    <p className="font-medium text-sm truncate">{location}</p>
                </div>
                <div className={cn("relative flex-1", isLocationCollapsed ? "h-10" : "h-20")}>
                    {hours.slice(0, 23).map(hour => (
                        <div key={`line-${location}-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * HOUR_WIDTH_PX}px` }}></div>
                    ))}
                    {!isLocationCollapsed && eventsInRow.map(event => {
                        const { left, width } = getEventPosition(event);
                        return (
                            <div key={event.eventId} className="absolute h-[calc(100%-1rem)] top-1/2 -translate-y-1/2 p-2 bg-primary/90 text-primary-foreground rounded-lg shadow-md cursor-pointer hover:bg-primary z-10" style={{ left: `${left + 2}px`, width: `${width}px` }}>
                                <p className="font-semibold text-sm truncate">{event.title}</p>
                                <p className="text-xs opacity-90 truncate">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {weeklyScheduleData.map(({ day, groupedEvents, otherLocations }) => {
                const dayIso = day.toISOString();
                const isDayCollapsed = collapsedDays.has(dayIso);
                const isDayToday = isToday(day);
                const isWeekend = isSaturday(day) || isSunday(day);
                const isDayHoliday = isHoliday(day);

                return (
                    <div key={dayIso} ref={isDayToday ? todayCardRef : null}>
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * HOUR_WIDTH_PX)}px`}}>
                                    <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-semibold text-sm sticky left-0 bg-card z-30 cursor-pointer gap-2" onClick={() => toggleDayCollapse(dayIso)}>
                                           {isDayCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                           <span>{format(day, 'EEE, MMMM d, yyyy').toUpperCase()}</span>
                                        </div>
                                        {hours.map(hour => (
                                            <div key={hour} className="w-[120px] shrink-0 text-left p-2 border-r">
                                                <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(day), hour), 'HH:mm')}</span>
                                            </div>
                                        ))}
                                    </CardHeader>
                                    {!isDayCollapsed && (
                                        <CardContent className={cn("p-0 relative", { "bg-muted/20": isWeekend || isDayHoliday })}>
                                            {/* Fixed Locations Section */}
                                            {fixedLocations.map((location, index) => renderLocationRow(
                                                dayIso,
                                                location,
                                                groupedEvents[location] || [],
                                                index === fixedLocations.length - 1 && otherLocations.length === 0,
                                                true
                                            ))}

                                            {/* Other Locations */}
                                            {otherLocations.map((location, index) => renderLocationRow(
                                                dayIso,
                                                location,
                                                groupedEvents[location] || [],
                                                index === otherLocations.length - 1,
                                                false
                                            ))}
                                            
                                            {isDayToday && now && (
                                                <div 
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
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
