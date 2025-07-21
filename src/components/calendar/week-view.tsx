

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfDay, addHours, isToday, isSaturday, isSunday, isSameDay, differenceInMinutes } from 'date-fns';
import { type Event, type Team, type Badge } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { mockHolidays } from '@/lib/mock-data';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-context';
import { canCreateAnyEvent } from '@/lib/permissions';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const isHoliday = (day: Date) => {
    return mockHolidays.some(holiday => isSameDay(day, holiday));
}

const DEFAULT_HOUR_HEIGHT_PX = 60;

const isAllDayEvent = (event: Event) => {
    const start = event.startTime;
    const end = event.endTime;
    return isSameDay(start, end) &&
           start.getHours() === 0 && start.getMinutes() === 0 &&
           end.getHours() === 23 && end.getMinutes() === 59;
}

export const WeekView = React.memo(({ date, containerRef, zoomLevel, onEasyBooking, onEventClick, triggerScroll }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', onEasyBooking: (data: { startTime: Date, location?: string }) => void, onEventClick: (event: Event) => void, triggerScroll: number }) => {
    const { viewAsUser, events, calendars, users, allBadges } = useUser();
    const [now, setNow] = useState<Date | null>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const timelineScrollerRef = useRef<HTMLDivElement>(null);

    const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT_PX);
    const [showWeekends, setShowWeekends] = useState(false);

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

        const canCreateEvent = canCreateAnyEvent(viewAsUser, calendars);
        if (!viewAsUser.easyBooking || !canCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const clickedHour = y / hourHeight;
        const hour = Math.floor(clickedHour);
        const minutes = Math.floor((clickedHour % 1) * 60);

        const startTime = new Date(day);
        startTime.setHours(hour, minutes, 0, 0);
        onEasyBooking({ startTime });
    }, [hourHeight, onEasyBooking, calendars, viewAsUser]);

    useEffect(() => {
        if (isCurrentWeek) {
            const timer = setInterval(() => setNow(new Date()), 60 * 1000);
            setNow(new Date());
            return () => clearInterval(timer);
        } else {
            setNow(null);
        }
    }, [isCurrentWeek]);

    useLayoutEffect(() => {
        const scroller = timelineScrollerRef.current;
        if (!scroller) return;
        
        const handleResize = () => {
            const isFit = zoomLevel === 'fit';
            const newHourHeight = isFit ? scroller.clientHeight / 12 : DEFAULT_HOUR_HEIGHT_PX;
            setHourHeight(newHourHeight);
        };
        
        handleResize(); // Initial calculation
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(scroller);
        return () => resizeObserver.disconnect();
    }, [zoomLevel]);

    useEffect(() => {
        const scroller = timelineScrollerRef.current;
        if (!scroller) return;
    
        const centerOnTime = (timeInHours: number) => {
            return (timeInHours * hourHeight) - (scroller.offsetHeight / 2);
        };
        
        let scrollTop = centerOnTime(8); // Default scroll to 8am
        
        if (zoomLevel === 'fit') {
            scrollTop = centerOnTime(8); 
        } else if (isCurrentWeek && now) {
            const nowInHours = now.getHours() + now.getMinutes() / 60;
            scrollTop = centerOnTime(nowInHours);
        }
        
        scroller.scrollTo({ top: scrollTop, behavior: triggerScroll === 0 ? 'auto' : 'smooth' });
    }, [hourHeight, triggerScroll, isCurrentWeek, now, zoomLevel]);

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
        <Card className="h-full flex flex-col flex-1">
            <CardHeader className="p-0 border-b sticky top-0 bg-muted z-10">
                <div className={cn("grid", gridColsClass)}>
                    <div className="w-20"></div> {/* Timeline spacer */}
                    {displayedDays.map((day, index) => {
                        const isWeekend = isSaturday(day) || isSunday(day);
                        const isDayHoliday = isHoliday(day);
                        return (
                            <div key={day.toString()} className={cn("text-center p-2 border-l relative", { "bg-muted/50": isWeekend || isDayHoliday })}>
                                <p className={cn("text-sm font-normal", { "text-muted-foreground": isWeekend || isDayHoliday })}>{format(day, 'EEE')}</p>
                                <p className={cn(
                                    "text-2xl font-normal",
                                    isToday(day) && 'text-primary bg-primary/10 rounded-full',
                                     { "text-muted-foreground": isWeekend || isDayHoliday }
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
            <div className="flex-1 overflow-y-auto" ref={timelineScrollerRef}>
                <CardContent className="p-0 relative">
                    <div className={cn("grid min-h-full", gridColsClass)}>
                        {/* Timeline */}
                        <div className="w-20 border-r bg-muted">
                            {hours.map((hour, index) => (
                                <div key={hour} className={cn("relative text-right pr-2 border-b bg-muted", {"bg-muted/10": index % 2 !== 0})} style={{ height: `${hourHeight}px` }}>
                                    <span className="text-xs text-muted-foreground relative -top-2">{format(addHours(startOfDay(date), hour), timeFormatTimeline)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Day columns */}
                        {displayedDays.map((day, index) => {
                            const dayEvents = getEventsForDay(day);
                            const timedEvents = dayEvents.filter(e => !isAllDayEvent(e));
                            const allDayEvents = dayEvents.filter(isAllDayEvent);
                            return (
                                <div 
                                    key={day.toString()} 
                                    className={cn("relative border-l", { "bg-muted/10": index % 2 !== 0 })}
                                >
                                    {allDayEvents.length > 0 && (
                                        <div className="absolute top-0 left-0 right-0 z-20 p-1 space-y-1 bg-muted/20 border-b">
                                            {allDayEvents.map(event => {
                                                const colors = calendarColorMap[event.calendarId];
                                                return (
                                                    <div key={event.eventId} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} className="px-2 py-0.5 rounded text-xs cursor-pointer truncate" style={{ backgroundColor: colors?.bg, color: colors?.text }}>
                                                        {event.title}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="h-full w-full" onClick={(e) => handleEasyBookingClick(e, day)}>
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
                                            {timedEvents.map(event => {
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
                                                        <p className="font-normal text-xs truncate leading-tight">{event.title}</p>
                                                        <p className="text-[10px] opacity-90 truncate">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                                                    </div>
                                                )
                                            })}
                                            {isToday(day) && now && (
                                                <div 
                                                    ref={nowMarkerRef}
                                                    className="absolute w-full z-10 pointer-events-none"
                                                    style={{ top: `${calculateCurrentTimePosition()}px` }}
                                                >
                                                    <div className="relative h-px bg-primary"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
});
WeekView.displayName = 'WeekView';
