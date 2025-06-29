

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfDay, addHours, isToday, isSaturday, isSunday, isSameDay } from 'date-fns';
import { type Event, type Team } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { mockHolidays } from '@/lib/mock-data';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const DEFAULT_HOUR_HEIGHT_PX = 60;

export const WeekView = React.memo(({ date, containerRef, zoomLevel, onEasyBooking, onEventClick }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', onEasyBooking: (data: { startTime: Date, location?: string }) => void, onEventClick: (event: Event) => void }) => {
    const { viewAsUser, events, calendars, users, teams } = useUser();
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT_PX);
    const [showWeekends, setShowWeekends] = useState(false);
    const initialScrollPerformed = useRef(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    
    const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars);
    const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);
    const isCurrentWeek = useMemo(() => weekDays.some(isToday), [weekDays]);

    const timeFormatTimeline = viewAsUser.timeFormat === '24h' ? 'HH:00' : 'h a';
    const timeFormatEvent = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h:mm a';

    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    const handleEasyBookingClick = useCallback((e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        if ((e.target as HTMLElement).closest('[data-event-id]')) {
            return;
        }

        if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const clickedHour = y / hourHeight;
        const hour = Math.floor(clickedHour);
        const minutes = Math.floor((clickedHour % 1) * 60);

        const startTime = new Date(day);
        startTime.setHours(hour, minutes, 0, 0);
        onEasyBooking({ startTime });
    }, [hourHeight, onEasyBooking, userCanCreateEvent, viewAsUser.easyBooking]);

    useEffect(() => {
        if (isCurrentWeek) {
            const timer = setInterval(() => setNow(new Date()), 60 * 1000);
            setNow(new Date());
            return () => clearInterval(timer);
        } else {
            setNow(null);
        }
    }, [isCurrentWeek]);

    useEffect(() => {
        initialScrollPerformed.current = false;
    }, [date]);

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

    // Effect for calculating hour height based on zoom
    useEffect(() => {
        if (containerSize.height > 0) {
            const isFit = zoomLevel === 'fit';
            const newHourHeight = isFit ? containerSize.height / 12 : DEFAULT_HOUR_HEIGHT_PX;
            setHourHeight(newHourHeight);
        }
    }, [zoomLevel, containerSize]);

    // Effect for scrolling to current time or a default position
    useEffect(() => {
        const container = containerRef.current;
        if (!container || initialScrollPerformed.current) return;
    
        const performScroll = () => {
            if (isCurrentWeek && now && nowMarkerRef.current) {
                container.scrollTo({ top: nowMarkerRef.current.offsetTop - (container.offsetHeight / 2), behavior: 'smooth' });
            } else {
                container.scrollTo({ top: 7 * hourHeight, behavior: 'auto' });
            }
            initialScrollPerformed.current = true;
        };

        // Delay scroll slightly to allow dimensions to stabilize
        const scrollTimeout = setTimeout(performScroll, 50);

        return () => clearTimeout(scrollTimeout);

    }, [containerRef, now, isCurrentWeek, date, hourHeight]);


    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = useCallback((day: Date) => {
        return events.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }, [events]);
    
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
                                        <GoogleSymbol name="keyboard_double_arrow_right" />
                                    </Button>
                                )}
                                {showWeekends && format(day, 'EEE') === 'Sun' && (
                                    <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-full rounded-none" onClick={() => setShowWeekends(false)}>
                                        <GoogleSymbol name="keyboard_double_arrow_left" />
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
                                <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), timeFormatTimeline)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {displayedDays.map((day, index) => {
                        return (
                            <div 
                                key={day.toString()} 
                                className={cn("relative border-l", { "bg-muted/10": index % 2 !== 0 })}
                                onClick={(e) => handleEasyBookingClick(e, day)}
                            >
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
                                        const colors = calendarColorMap[event.calendarId];
                                        return (
                                            <div 
                                                key={event.eventId} 
                                                data-event-id={event.eventId}
                                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                                className={cn(
                                                    "absolute left-1 right-1 p-1 rounded-md shadow-sm cursor-pointer flex flex-col overflow-hidden"
                                                )}
                                                style={{ top: `${top}px`, height: `${height}px`, backgroundColor: colors?.bg, color: colors?.text }}
                                            >
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <PriorityBadge priorityId={event.priority} />
                                                    {event.roleAssignments && Object.keys(event.roleAssignments).length > 0 && (
                                                        <div className="flex flex-wrap -space-x-2">
                                                            {Object.entries(event.roleAssignments).filter(([, userId]) => !!userId).map(([role, userId]) => {
                                                                const user = users.find(u => u.userId === userId);
                                                                if (!user) return null;
                                                                const teamForEvent = teams.find(t => t.id === event.calendarId);
                                                                const roleInfo = teamForEvent?.roles.find(r => r.name === role);
                                                                const roleIcon = roleInfo?.icon;
                                                                const roleColor = roleInfo?.color;

                                                                return (
                                                                <TooltipProvider key={role}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="relative">
                                                                                <Avatar className="h-6 w-6 border-2 border-background">
                                                                                    <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                                {roleIcon && (
                                                                                    <div 
                                                                                        className="absolute -bottom-1 -right-1 p-0.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-background"
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
                                                <p className="text-[10px] opacity-90 truncate">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
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
});
WeekView.displayName = 'WeekView';
