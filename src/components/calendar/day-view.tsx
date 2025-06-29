

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
    teams,
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
    teams: Team[];
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
                className="w-[160px] shrink-0 p-2 border-r flex items-start justify-start bg-card sticky left-0 z-30 gap-1 cursor-pointer"
                onClick={() => toggleLocationCollapse(location)}
            >
                {isCollapsed ? <GoogleSymbol name="chevron_right" className="text-lg mt-1" /> : <GoogleSymbol name="expand_more" className="text-lg mt-1" />}
                <p className="font-medium text-sm">{location}</p>
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
                                            const teamForEvent = teams.find(t => t.id === event.calendarId);
                                            const roleInfo = teamForEvent?.allBadges.find(b => b.name === role);
                                            const roleIcon = roleInfo?.icon;
                                            const roleColor = roleInfo?.color;

                                            return (
                                            <TooltipProvider key={role}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="relative">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            {roleIcon && (
                                                                <div 
                                                                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                                                                    style={{ backgroundColor: roleColor, color: getContrastColor(roleColor || '#ffffff') }}
                                                                >
                                                                    <GoogleSymbol name={roleIcon} style={{fontSize: '10px'}} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="flex items-center gap-1">
                                                        {roleIcon && <GoogleSymbol name={roleIcon} className="text-sm" />}
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
                            <p className="font-semibold text-xs truncate leading-tight">{event.title}</p>
                            <p className="text-[10px] opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});
DayViewLocationRow.displayName = 'DayViewLocationRow';

export const DayView = React.memo(({ date, containerRef, zoomLevel, axisView, onEasyBooking, onEventClick }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', axisView: 'standard' | 'reversed', onEasyBooking: (data: { startTime: Date, location?: string }) => void, onEventClick: (event: Event) => void }) => {
    const { viewAsUser, events, calendars, users, teams, appSettings } = useUser();
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const [collapsedLocations, setCollapsedLocations] = useState<Set<string>>(new Set());
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);
    const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT_PX);
    const initialScrollPerformed = useRef(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars, appSettings.customAdminRoles);
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
    
    useEffect(() => {
        initialScrollPerformed.current = false;
    }, [date]);

    // This layout effect observes the container size and updates state
    // It's more stable than calculating size in a normal useEffect
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });

        resizeObserver.observe(container);
        setContainerSize({ width: container.offsetWidth, height: container.offsetHeight });

        return () => resizeObserver.disconnect();
    }, [containerRef]);

    // Effect for calculating dimensions based on zoom and view axis, now dependent on stable containerSize
    useEffect(() => {
        const isFit = zoomLevel === 'fit';
        if (axisView === 'standard') {
            if (containerSize.width > 0) {
                const newHourWidth = isFit ? (containerSize.width - LOCATION_LABEL_WIDTH_PX) / 12 : DEFAULT_HOUR_WIDTH_PX;
                setHourWidth(newHourWidth);
            }
        } else { // Reversed axis
            if (containerSize.height > 0) {
                const newHourHeight = isFit ? containerSize.height / 12 : DEFAULT_HOUR_HEIGHT_PX;
                setHourHeight(newHourHeight);
            }
        }
    }, [zoomLevel, axisView, containerSize]);

    // Effect for scrolling to current time or a default position
    useEffect(() => {
        const container = containerRef.current;
        if (!container || initialScrollPerformed.current) return;

        const performScroll = () => {
            if (isViewingToday && now && nowMarkerRef.current) {
                if (axisView === 'standard') {
                    container.scrollTo({ left: nowMarkerRef.current.offsetLeft - (container.offsetWidth / 2), behavior: 'smooth' });
                } else {
                    container.scrollTo({ top: nowMarkerRef.current.offsetTop - (container.offsetHeight / 2), behavior: 'smooth' });
                }
            } else {
                // Scroll to a default position (e.g., 7 AM) on other days
                if (axisView === 'standard') {
                    container.scrollTo({ left: 7 * hourWidth, behavior: 'auto' });
                } else {
                    container.scrollTo({ top: 7 * hourHeight, behavior: 'auto' });
                }
            }
            initialScrollPerformed.current = true;
        };

        // Delay scroll slightly to allow dimensions to stabilize
        const scrollTimeout = setTimeout(performScroll, 50);

        return () => clearTimeout(scrollTimeout);

    }, [containerRef, now, isViewingToday, date, hourWidth, hourHeight, axisView]);

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

        if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        
        let startTime;

        if (type === 'standard') {
            const x = e.clientX - rect.left;
            const clickedHour = x / hourWidth;
            const hour = Math.floor(clickedHour);
            const minutes = Math.floor((clickedHour % 1) * 60);

            startTime = new Date(day);
            startTime.setHours(hour, minutes, 0, 0);
        } else { // reversed
            const y = e.clientY - rect.top;
            const clickedHour = y / hourHeight;
            const hour = Math.floor(clickedHour);
            const minutes = Math.floor((clickedHour % 1) * 60);

            startTime = new Date(day);
            startTime.setHours(hour, minutes, 0, 0);
        }
        
        onEasyBooking({ startTime, location });
    }, [hourWidth, hourHeight, onEasyBooking, userCanCreateEvent, viewAsUser.easyBooking]);

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
        <Card>
            <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                    <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-medium text-sm sticky left-0 bg-card z-30">Location</div>
                    {hours.map(hour => (
                        <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px` }}>
                            <span className="text-xs text-muted-foreground">{format(addHours(startOfDay(date), hour), timeFormatTimeline)}</span>
                        </div>
                    ))}
                </CardHeader>
                {allLocations.length === 0 && dayEvents.length === 0 ? (
                     <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No events scheduled for this day.
                    </div>
                ) : (
                    <CardContent className="p-0 relative">
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
                                teams={teams}
                           />
                        ))}
                        
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
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), viewAsUser.timeFormat === '24h' ? 'HH:00' : 'h a')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day column */}
                    <div className="relative" onClick={(e) => handleEasyBookingClick(e, 'reversed', date)}>
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
                                                            const teamForEvent = teams.find(t => t.id === event.calendarId);
                                                            const roleInfo = teamForEvent?.allBadges.find(b => b.name === role);
                                                            const roleIcon = roleInfo?.icon;
                                                            const roleColor = roleInfo?.color;

                                                            return (
                                                            <TooltipProvider key={role}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="relative">
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            {roleIcon && (
                                                                                <div
                                                                                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                                                                                    style={{ backgroundColor: roleColor, color: getContrastColor(roleColor || '#ffffff') }}
                                                                                >
                                                                                    <GoogleSymbol name={roleIcon} style={{fontSize: '10px'}} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="flex items-center gap-1">
                                                                        {roleIcon && <GoogleSymbol name={roleIcon} className="text-sm" />}
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
                                            <p className="font-semibold text-xs truncate leading-tight">{event.title}</p>
                                            <p className="text-[10px] opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
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
});
DayView.displayName = 'DayView';
