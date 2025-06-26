
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday, startOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { type Event } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUser } from '@/context/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const DEFAULT_HOUR_WIDTH_PX = 120;
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

const getEventPosition = (event: Event, hourWidth: number) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    const left = (startHour + startMinute / 60) * hourWidth;
    const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourWidth - 4, 20);
    return { left, width };
}

export function ProductionScheduleView({ date, containerRef, zoomLevel }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit' }) {
    const [now, setNow] = useState<Date | null>(null);
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);

    const todayCardRef = useRef<HTMLDivElement>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const dayScrollerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [collapsedLocations, setCollapsedLocations] = useState<Record<string, Set<string>>>({});
    const [dailyCheckAssignments, setDailyCheckAssignments] = useState<Record<string, Record<string, string | null>>>({});
    const { users } = useUser();

    const dailyCheckUsers = useMemo(() => {
        return users.filter(user => user.roles?.includes('ES Daily Checks'));
    }, [users]);

    const handleAssignCheck = (dayIso: string, location: string, userId: string | null) => {
        setDailyCheckAssignments(prev => ({
            ...prev,
            [dayIso]: {
                ...(prev[dayIso] || {}),
                [location]: userId
            }
        }));
    };

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
            const groupedEvents = [...fixedLocations, ...Object.keys(dayEvents.reduce((acc, event) => {
                const locationKey = event.location || 'No Location';
                if (!fixedLocations.includes(locationKey) && !acc[locationKey]) {
                  acc[locationKey] = [];
                }
                return acc;
            }, {} as Record<string, Event[]>)).sort()]
            .reduce((acc, locationKey) => {
                acc[locationKey] = dayEvents.filter(e => e.location === locationKey);
                return acc;
            }, {} as Record<string, Event[]>);
            
            const isWeekend = isSaturday(day) || isSunday(day);
            const allDayLocations = Object.keys(groupedEvents);
                
            return { day, groupedEvents, isWeekend, allDayLocations };
        });
    }, [date]);

    useEffect(() => {
        const initialCollapsedDays = new Set<string>();
        const initialCollapsedLocations: Record<string, Set<string>> = {};

        weeklyScheduleData.forEach(({ day, isWeekend, groupedEvents, allDayLocations }) => {
            const dayIso = day.toISOString();
            if (isWeekend) {
                initialCollapsedDays.add(dayIso);
            }

            const locationsToCollapse = new Set<string>();
            allDayLocations.forEach(loc => {
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
        // Handle vertical and horizontal scrolling to today
        const today = new Date();
        const isCurrentWeek = weekDays.some(day => isSameDay(day, today));
        
        if (isCurrentWeek && containerRef.current && todayCardRef.current) {
            // Vertical scroll to today's card
            const container = containerRef.current;
            const todayElement = todayCardRef.current;
            const scrollTop = todayElement.offsetTop - 20;
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth',
            });

            // Horizontal scroll to current time on today's card
            if (nowMarkerRef.current && zoomLevel === 'normal') {
                const todayIso = weekDays.find(d => isSameDay(d, today))!.toISOString();
                const scroller = dayScrollerRefs.current.get(todayIso);
                if (scroller) {
                     const scrollLeft = nowMarkerRef.current.offsetLeft - (scroller.offsetWidth / 2) + (LOCATION_LABEL_WIDTH_PX / 2);
                     scroller.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth',
                    });
                }
            }
        }
    }, [date, containerRef, weeklyScheduleData, now, zoomLevel]);

    useEffect(() => {
        // Handle zoom level changes
        const firstScroller = dayScrollerRefs.current.values().next().value;
        if (!firstScroller) return;

        if (zoomLevel === 'fit') {
            const availableWidth = firstScroller.offsetWidth;
            const newHourWidth = (availableWidth - LOCATION_LABEL_WIDTH_PX) / 12; // 12 hours from 8am to 8pm
            setHourWidth(newHourWidth);
            const scrollLeft = 8 * newHourWidth;
            dayScrollerRefs.current.forEach(scroller => {
                scroller?.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            });
        } else { // zoomLevel === 'normal'
            setHourWidth(DEFAULT_HOUR_WIDTH_PX);
            const scrollLeft = (new Date().getHours() - 1) * DEFAULT_HOUR_WIDTH_PX;
            dayScrollerRefs.current.forEach((scroller, dayIso) => {
                 if (isToday(new Date(dayIso))) {
                    scroller?.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                 } else {
                    scroller?.scrollTo({ left: 7 * DEFAULT_HOUR_WIDTH_PX, behavior: 'smooth' });
                 }
            });
        }
    }, [zoomLevel]);


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
        return (now.getHours() + now.getMinutes() / 60) * hourWidth;
    }

    const renderLocationRow = (dayIso: string, location: string, eventsInRow: Event[], isLast: boolean) => {
        const isLocationCollapsed = collapsedLocations[dayIso]?.has(location);
        const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
        const assignedUser = users.find(u => u.userId === assignedUserId);
        
        return (
            <div key={location} className={cn("flex", { "border-b": !isLast })}>
                <div 
                    className="w-[160px] shrink-0 p-2 border-r flex items-center justify-between bg-card sticky left-0 z-30"
                >
                    <div className="flex items-center gap-1 cursor-pointer flex-1 min-w-0" onClick={() => toggleLocationCollapse(dayIso, location)}>
                        {isLocationCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <p className="font-medium text-sm truncate">{location}</p>
                    </div>
                     {fixedLocations.includes(location) && location !== 'Studio' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size={assignedUser ? "sm" : "icon"} 
                                    className={cn("h-6 text-xs", assignedUser ? "w-auto px-1.5" : "w-6 ml-1")}
                                >
                                    {assignedUser ? (
                                        <>
                                            {assignedUser.displayName.split(' ')[0]} {assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="h-4 w-4" />
                                            <span className="sr-only">Assign to daily check</span>
                                        </>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0">
                                <div className="grid gap-1">
                                    <div className="p-2 border-b">
                                        <p className="text-sm font-medium text-center">Assign User</p>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1">
                                        {dailyCheckUsers.length > 0 ? dailyCheckUsers.map(user => (
                                            <Button
                                                key={user.userId}
                                                variant="ghost"
                                                className="justify-start h-8"
                                                onClick={() => handleAssignCheck(dayIso, location, user.userId)}
                                            >
                                                <Avatar className="h-6 w-6 mr-2">
                                                    <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{user.displayName}</span>
                                            </Button>
                                        )) : (
                                            <p className="text-sm text-muted-foreground text-center p-2">No users with "ES Daily Checks" role.</p>
                                        )}
                                    </div>
                                    {assignedUser && (
                                        <div className="p-1 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-destructive hover:text-destructive"
                                                onClick={() => handleAssignCheck(dayIso, location, null)}
                                            >
                                                Unassign
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className={cn("relative flex-1", isLocationCollapsed ? "h-10" : "h-20")}>
                    {hours.slice(0, 23).map(hour => (
                        <div key={`line-${location}-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * hourWidth}px` }}></div>
                    ))}
                    {!isLocationCollapsed && eventsInRow.map(event => {
                        const { left, width } = getEventPosition(event, hourWidth);
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
            {weeklyScheduleData.map(({ day, groupedEvents, allDayLocations }) => {
                const dayIso = day.toISOString();
                const isDayCollapsed = collapsedDays.has(dayIso);
                const isDayToday = isToday(day);
                const isWeekend = isSaturday(day) || isSunday(day);
                const isDayHoliday = isHoliday(day);

                return (
                    <div key={dayIso} ref={isDayToday ? todayCardRef : null}>
                        <Card className="overflow-hidden">
                            <div 
                                className="overflow-x-auto" 
                                ref={el => dayScrollerRefs.current.set(dayIso, el)}
                            >
                                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                                    <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-semibold text-sm sticky left-0 bg-card z-30 cursor-pointer gap-2" onClick={() => toggleDayCollapse(dayIso)}>
                                           {isDayCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                           <span className={cn({ "text-primary": isDayToday })}>{format(day, 'EEE, MMMM d, yyyy').toUpperCase()}</span>
                                        </div>
                                        {hours.map(hour => (
                                            <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px`}}>
                                                <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(day), hour), 'HH:mm')}</span>
                                            </div>
                                        ))}
                                    </CardHeader>
                                    {!isDayCollapsed && (
                                        <CardContent className={cn("p-0 relative", { "bg-muted/20": isWeekend || isDayHoliday })}>
                                            {allDayLocations.map((location, index) => renderLocationRow(
                                                dayIso,
                                                location,
                                                groupedEvents[location] || [],
                                                index === allDayLocations.length - 1
                                            ))}
                                            
                                            {isDayToday && now && (
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
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
