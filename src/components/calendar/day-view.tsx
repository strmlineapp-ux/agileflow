'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { format, addHours, startOfDay, isSameDay, isToday } from 'date-fns';
import { type Event, type User, type SharedCalendar, type BookableLocation, type Team, type Badge } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const DEFAULT_HOUR_WIDTH_PX = 120;
const LOCATION_LABEL_WIDTH_PX = 160;
const DEFAULT_HOUR_HEIGHT_PX = 60;

const DayViewLocationRow = React.memo(({
    location,
    isLast,
    index,
    hourWidth,
    groupedEvents,
    collapsedLocations,
    calendarColorMap,
    timeFormatEvent,
    toggleLocationCollapse,
    handleEasyBookingClick,
    day,
    onEventClick,
    users,
    allBadges
}: {
    location: string;
    isLast: boolean;
    index: number;
    hourWidth: number;
    groupedEvents: Record<string, Event[]>;
    collapsedLocations: Set<string>;
    calendarColorMap: Record<string, { bg: string; text: string }>;
    timeFormatEvent: string;
    toggleLocationCollapse: (location: string) => void;
    handleEasyBookingClick: (e: React.MouseEvent<HTMLDivElement>, type: 'standard' | 'reversed', day: Date, location: string) => void;
    day: Date;
    onEventClick: (event: Event) => void;
    users: User[];
    allBadges: Badge[];
}) => {
    const eventsInRow = groupedEvents[location] || [];
    const isCollapsed = collapsedLocations.has(location);

    const getEventPositionStandard = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const left = (startHour + startMinute / 60) * hourWidth;
        const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourWidth - 4, 20);
        return { left, width };
    }

    return (
        <div className={cn("flex", { "border-b": !isLast }, { "bg-muted/10": index % 2 !== 0 })}>
            <div 
                className="w-[160px] shrink-0 p-2 border-r flex items-start justify-start bg-muted sticky left-0 z-30 gap-1 cursor-pointer"
                onClick={() => toggleLocationCollapse(location)}
            >
                {isCollapsed ? <GoogleSymbol name="chevron_right" className="text-lg mt-1" weight={100} /> : <GoogleSymbol name="expand_more" className="text-lg mt-1" weight={100} />}
                <p className="font-normal text-sm">{location}</p>
            </div>
            <div className={cn("relative flex-1", isCollapsed ? "h-10" : "min-h-[5rem] py-1")} onClick={(e) => handleEasyBookingClick(e, 'standard', day, location)}>
                {Array.from({ length: 23 }).map((_, hour) => (
                    <div key={`line-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * hourWidth}px` }}></div>
                ))}
                {!isCollapsed && eventsInRow.map(event => {
                    const { left, width } = getEventPositionStandard(event);
                    const colors = calendarColorMap[event.calendarId];
                    const textColor = getContrastColor(colors?.bg || '#000000');
                    return (
                        <div 
                            key={event.eventId} 
                            data-event-id={event.eventId}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                            className="absolute top-1 p-2 rounded-lg shadow-md cursor-pointer flex flex-col overflow-hidden h-[calc(100%-0.5rem)]"
                            style={{ left: `${left + 2}px`, width: `${width}px`, backgroundColor: colors?.bg, color: textColor }}
                        >
                             <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <PriorityBadge priorityId={event.priority} />
                                {event.roleAssignments && Object.keys(event.roleAssignments).length > 0 && (
                                    <div className="flex flex-wrap -space-x-2">
                                        {Object.entries(event.roleAssignments).filter(([, userId]) => !!userId).map(([role, userId]) => {
                                            const user = users.find(u => u.userId === userId);
                                            if (!user) return null;
                                            const roleInfo = allBadges.find(b => b?.name === role);
                                            const roleIcon = roleInfo?.icon;
                                            const roleColor = roleInfo?.color;

                                            return (
                                            <TooltipProvider key={role}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="relative">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar"/>
                                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            {roleIcon && (
                                                                <div 
                                                                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                                                                    style={{ backgroundColor: roleColor, color: getContrastColor(roleColor || '#ffffff') }}
                                                                >
                                                                    <GoogleSymbol name={roleIcon} style={{fontSize: '10px'}} weight={100} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="flex items-center gap-1">
                                                        {roleIcon && <GoogleSymbol name={roleIcon} className="text-sm" weight={100} />}
                                                        <span>{role}: {user.displayName}</span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <p className="font-normal text-xs truncate leading-tight">{event.title}</p>
                            <p className="text-[10px] opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});
DayViewLocationRow.displayName = 'DayViewLocationRow';

export const DayView = React.memo(({ date, containerRef, zoomLevel, axisView, onEasyBooking, onEventClick, triggerScroll }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', axisView: 'standard' | 'reversed', onEasyBooking: (data: { startTime: Date, location?: string }) => void, onEventClick: (event: Event) => void, triggerScroll: number }) => {
    const { viewAsUser, events, calendars, users, allBadges } = useUser();
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const timelineScrollerRef = useRef<HTMLDivElement>(null);

    const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);
    const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT_PX);

    const isViewingToday = useMemo(() => isSameDay(date, new Date()), [date]);

    const timeFormatTimeline = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h a';
    const timeFormatEvent = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h:mm a';

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

    useLayoutEffect(() => {
        const scroller = timelineScrollerRef.current;
        if (!scroller) return;

        const handleResize = () => {
            const isFit = zoomLevel === 'fit';
            if (axisView === 'standard') {
                const availableWidth = scroller.offsetWidth - LOCATION_LABEL_WIDTH_PX;
                const newHourWidth = isFit ? availableWidth / 12 : DEFAULT_HOUR_WIDTH_PX;
                setHourWidth(newHourWidth);
            } else { // reversed
                 const newHourHeight = isFit ? scroller.offsetHeight / 12 : DEFAULT_HOUR_HEIGHT_PX;
                 setHourHeight(newHourHeight);
            }
        };

        handleResize(); // Initial calculation
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(scroller);
        return () => resizeObserver.disconnect();
    }, [zoomLevel, axisView, dayEvents]); // Re-run when view changes


    useEffect(() => {
        const scroller = timelineScrollerRef.current;
        if (!scroller) return;

        let scrollLeft = 8 * hourWidth; // Default scroll to 8am
        let scrollTop = 8 * hourHeight; // Default scroll to 8am
        
        const centerOnTime = (timeInHours: number) => {
            if (axisView === 'standard') {
                return (timeInHours * hourWidth) - (scroller.offsetWidth / 2) + (LOCATION_LABEL_WIDTH_PX / 2);
            } else {
                return (timeInHours * hourHeight) - (scroller.offsetHeight / 2);
            }
        };

        if (zoomLevel === 'fit') {
            scrollLeft = axisView === 'standard' ? centerOnTime(8) : 0;
            scrollTop = axisView === 'reversed' ? centerOnTime(8) : 0;
        } else if (isViewingToday && now) {
            const nowInHours = now.getHours() + now.getMinutes() / 60;
            if (axisView === 'standard') {
                scrollLeft = centerOnTime(nowInHours);
            } else {
                scrollTop = centerOnTime(nowInHours);
            }
        }
        
        scroller.scrollTo({ 
            left: axisView === 'standard' ? scrollLeft : 0, 
            top: axisView === 'reversed' ? scrollTop : 0, 
            behavior: triggerScroll === 0 ? 'auto' : 'smooth' 
        });
    }, [hourWidth, hourHeight, triggerScroll, isViewingToday, now, zoomLevel, axisView, date]);

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

    const allLocations = useMemo(() => {
        const eventLocations = Object.keys(groupedEvents);
        if (eventLocations.length === 0) {
            return [];
        }
        return eventLocations.sort((a,b) => a === 'No Location' ? 1 : b === 'No Location' ? -1 : a.localeCompare(b));
    }, [groupedEvents]);
    
    useEffect(() => {
        const locationsToCollapse = new Set<string>();
        allLocations.forEach(loc => {
            if (!groupedEvents[loc] || groupedEvents[loc].length === 0) {
                locationsToCollapse.add(loc);
            }
        });
        setCollapsedLocations(locationsToCollapse);
    }, [groupedEvents, allLocations]);

    const toggleLocationCollapse = useCallback((location: string) => {
        setCollapsedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(location)) newSet.delete(location);
            else newSet.add(location);
            return newSet;
        });
    }, []);

    const handleEasyBookingClick = useCallback((e: React.MouseEvent<HTMLDivElement>, type: 'standard' | 'reversed', day: Date, location?: string) => {
        if ((e.target as HTMLElement).closest('[data-event-id]')) {
            return;
        }

        const canCreateEvent = canCreateAnyEvent(viewAsUser, calendars);
        if (!viewAsUser.easyBooking || !canCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        
        let startTime;

        if (type === 'standard') {
            const x = e.clientX - rect.left;
            const clickedHour = x / hourWidth;
            const hour = Math.floor(clickedHour);
            const minutes = Math.floor((clickedHour % 1) * 60);

            startTime = new Date(day);
            startTime.setHours(hour, minutes, 0, 0);
        } else {
            const y = e.clientY - rect.top;
            const clickedHour = y / hourHeight;
            const hour = Math.floor(clickedHour);
            const minutes = Math.floor((clickedHour % 1) * 60);

            startTime = new Date(day);
            startTime.setHours(hour, minutes, 0, 0);
        }
        
        onEasyBooking({ startTime, location });
    }, [hourWidth, hourHeight, onEasyBooking, calendars, viewAsUser]);

    const getEventPositionReversed = (event: Event) => {
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
        if(axisView === 'standard') {
            return (now.getHours() + now.getMinutes() / 60) * hourWidth;
        }
        return (now.getHours() + now.getMinutes() / 60) * hourHeight;
    }
    
    const renderStandardView = () => (
        <Card className="h-full flex flex-col flex-1">
            <div className="overflow-y-hidden" ref={timelineScrollerRef}>
                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}} className="flex flex-col flex-1 h-full">
                    <CardHeader className="p-0 border-b sticky top-0 bg-muted z-20 flex flex-row">
                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-normal text-sm sticky left-0 bg-muted z-30">Location</div>
                        {hours.map(hour => (
                            <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px` }}>
                                <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), timeFormatTimeline)}</span>
                            </div>
                        ))}
                    </CardHeader>
                    {allLocations.length === 0 && dayEvents.length === 0 ? (
                         <div className="flex items-center justify-center h-40 text-muted-foreground flex-1">
                            No events scheduled for this day.
                        </div>
                    ) : (
                        <CardContent className="p-0 relative flex-1">
                            <div
                                className="absolute inset-y-0 lunch-break-pattern z-0 pointer-events-none"
                                style={{
                                    left: `${LOCATION_LABEL_WIDTH_PX + 12 * hourWidth}px`,
                                    width: `${2.5 * hourWidth}px`
                                }}
                                title="Lunch Break"
                            />
                            
                            {allLocations.map((location, index) => (
                               <DayViewLocationRow
                                    key={location}
                                    location={location}
                                    isLast={index === allLocations.length - 1}
                                    index={index}
                                    hourWidth={hourWidth}
                                    groupedEvents={groupedEvents}
                                    collapsedLocations={collapsedLocations}
                                    calendarColorMap={calendarColorMap}
                                    timeFormatEvent={timeFormatEvent}
                                    toggleLocationCollapse={toggleLocationCollapse}
                                    handleEasyBookingClick={handleEasyBookingClick}
                                    day={date}
                                    onEventClick={onEventClick}
                                    users={users}
                                    allBadges={allBadges}
                               />
                            ))}
                            
                            {isViewingToday && now && (
                                <div 
                                    ref={nowMarkerRef}
                                    className="absolute top-0 bottom-0 z-20 pointer-events-none"
                                    style={{ left: `${LOCATION_LABEL_WIDTH_PX + calculateCurrentTimePosition()}px` }}
                                >
                                    <div className="w-px h-full bg-primary"></div>
                                </div>
                            )}
                        </CardContent>
                    )}
                </div>
            </div>
        </Card>
    );
    
    const renderReversedView = () => (
        <Card className="h-full flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto" ref={timelineScrollerRef}>
                <CardContent className="p-0 relative flex-1">
                    <div className="grid grid-cols-[auto,1fr] min-h-full h-full">
                        <div className="w-20 border-r bg-muted">
                            {hours.map(hour => (
                                <div key={hour} className="relative text-right pr-2 border-b" style={{ height: `${hourHeight}px` }}>
                                    <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), viewAsUser.timeFormat === '24h' ? 'HH:00' : 'h a')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="relative" onClick={(e) => handleEasyBookingClick(e, 'reversed', date)}>
                            <div
                                className="absolute inset-x-0 lunch-break-pattern z-0 pointer-events-none"
                                style={{
                                    top: `${12 * hourHeight}px`,
                                    height: `${2.5 * hourHeight}px`
                                }}
                                title="Lunch Break"
                            />
                            {hours.map(hour => (
                                <div key={hour} className="border-b" style={{ height: `${hourHeight}px` }}></div>
                            ))}

                            {dayEvents.length === 0 ? (
                                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    No events scheduled for this day.
                                </div>
                            ) : (
                                <div className="absolute inset-0 z-10">
                                    {dayEvents.map(event => {
                                        const { top, height } = getEventPositionReversed(event);
                                        const colors = calendarColorMap[event.calendarId];
                                        const textColor = getContrastColor(colors?.bg || '#000000');
                                        return (
                                            <div 
                                                key={event.eventId} 
                                                data-event-id={event.eventId}
                                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                                className={cn(
                                                    "absolute left-1 right-1 p-1 rounded-md shadow-sm cursor-pointer flex flex-col overflow-hidden"
                                                )}
                                                style={{ top: `${top}px`, height: `${height}px`, backgroundColor: colors?.bg, color: textColor }}
                                            >
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <PriorityBadge priorityId={event.priority} />
                                                    {event.roleAssignments && Object.keys(event.roleAssignments).length > 0 && (
                                                        <div className="flex flex-wrap -space-x-2">
                                                            {Object.entries(event.roleAssignments).filter(([, userId]) => !!userId).map(([role, userId]) => {
                                                                const user = users.find(u => u.userId === userId);
                                                                if (!user) return null;
                                                                const roleInfo = allBadges.find(b => b?.name === role);
                                                                const roleIcon = roleInfo?.icon;
                                                                const roleColor = roleInfo?.color;

                                                                return (
                                                                <TooltipProvider key={role}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="relative">
                                                                                <Avatar className="h-6 w-6">
                                                                                    <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar"/>
                                                                                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                                {roleIcon && (
                                                                                    <div
                                                                                        className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                                                                                        style={{ backgroundColor: roleColor, color: getContrastColor(roleColor || '#ffffff') }}
                                                                                    >
                                                                                        <GoogleSymbol name={roleIcon} style={{fontSize: '10px'}} weight={100} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="flex items-center gap-1">
                                                                            {roleIcon && <GoogleSymbol name={roleIcon} className="text-sm" weight={100} />}
                                                                            <span>{role}: {user.displayName}</span>
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-normal text-xs truncate leading-tight">{event.title}</p>
                                                <p className="text-[10px] opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                                            </div>
                                        )
                                    })}
                                    {isViewingToday && now && (
                                        <div 
                                            ref={nowMarkerRef}
                                            className="absolute w-full z-10 pointer-events-none"
                                            style={{ top: `${calculateCurrentTimePosition()}px` }}
                                        >
                                            <div className="relative h-px bg-primary"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
    
    return axisView === 'reversed' ? renderReversedView() : renderStandardView();
});
DayView.displayName = 'DayView';
