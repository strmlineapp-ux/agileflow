
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday, startOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { type Event, type User } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { mockEvents, mockHolidays } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, PlusCircle, Pencil, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUser } from '@/context/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


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
    const { users, viewAsUser, extraCheckLocations, setExtraCheckLocations, ptoAssignments, setPtoAssignments } = useUser();
    const defaultCheckLocations = useMemo(() => ["Training Room", "Locke", "Apgar"], []);

    const [isManageChecksDialogOpen, setIsManageChecksDialogOpen] = useState(false);
    const [editingDayIso, setEditingDayIso] = useState<string | null>(null);
    const [tempCheckLocations, setTempCheckLocations] = useState<string[]>([]);
    const [newLocationName, setNewLocationName] = useState('');

    const [isPtoDialogOpen, setIsPtoDialogOpen] = useState(false);
    const [editingPtoDayIso, setEditingPtoDayIso] = useState<string | null>(null);
    const [tempPtoUsers, setTempPtoUsers] = useState<string[]>([]);
    
    const canManageChecks = viewAsUser.roles?.includes('Manage Checks');
    const managerialPermissions = ["Admin", "Service Delivery Manager", "Production Management", "Studio Production Users", "Event Users"];
    const canManagePto = viewAsUser.permissions?.some(p => managerialPermissions.includes(p));

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
            
            const allLocationsWithEvents = Object.keys(dayEvents.reduce((acc, event) => {
                const locationKey = event.location || 'No Location';
                if (!acc[locationKey]) {
                  acc[locationKey] = [];
                }
                acc[locationKey].push(event)
                return acc;
            }, {} as Record<string, Event[]>));

            const allDayLocations = [...new Set([...fixedLocations, ...allLocationsWithEvents])].sort((a,b) => {
                const aIsFixed = fixedLocations.includes(a);
                const bIsFixed = fixedLocations.includes(b);
                if (aIsFixed && !bIsFixed) return -1;
                if (!aIsFixed && bIsFixed) return 1;
                if(aIsFixed && bIsFixed) return fixedLocations.indexOf(a) - fixedLocations.indexOf(b);
                return a.localeCompare(b);
            });

            const groupedEvents = allDayLocations.reduce((acc, locationKey) => {
                acc[locationKey] = dayEvents.filter(e => e.location === locationKey);
                return acc;
            }, {} as Record<string, Event[]>);
            
            const isWeekend = isSaturday(day) || isSunday(day);
                
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
    
    const handleOpenManageChecksDialog = (dayIso: string) => {
        setEditingDayIso(dayIso);
        const isWeekend = isSaturday(new Date(dayIso)) || isSunday(new Date(dayIso));
        setTempCheckLocations(extraCheckLocations[dayIso] ?? (isWeekend ? [] : defaultCheckLocations));
        setIsManageChecksDialogOpen(true);
    };

    const handleAddNewLocation = () => {
        if (newLocationName && !tempCheckLocations.includes(newLocationName.trim())) {
            setTempCheckLocations([...tempCheckLocations, newLocationName.trim()]);
            setNewLocationName('');
        }
    };

    const handleRemoveLocation = (locationToRemove: string) => {
        setTempCheckLocations(tempCheckLocations.filter(loc => loc !== locationToRemove));
    };

    const handleSaveChanges = () => {
        if (!editingDayIso) return;
        setExtraCheckLocations(prev => ({
            ...prev,
            [editingDayIso]: tempCheckLocations
        }));
        toast({ title: "Success", description: "Check locations updated for this day." });
        setIsManageChecksDialogOpen(false);
        setEditingDayIso(null);
    };

    const editingDayDate = useMemo(() => {
        if (!editingDayIso) return null;
        const data = weeklyScheduleData.find(d => d.day.toISOString() === editingDayIso);
        return data ? data.day : null;
    }, [editingDayIso, weeklyScheduleData]);

    const handleOpenPtoDialog = (dayIso: string) => {
        setEditingPtoDayIso(dayIso);
        setTempPtoUsers(ptoAssignments[dayIso] || []);
        setIsPtoDialogOpen(true);
    };

    const handlePtoUserSelectionChange = (userId: string, checked: boolean) => {
        setTempPtoUsers(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return Array.from(newSet);
        });
    };

    const handleSavePto = () => {
        if (!editingPtoDayIso) return;
        setPtoAssignments(prev => ({
            ...prev,
            [editingPtoDayIso]: tempPtoUsers
        }));
        toast({ title: "Success", description: "PTO updated for this day." });
        setIsPtoDialogOpen(false);
        setEditingPtoDayIso(null);
    };

    const editingPtoDayDate = useMemo(() => {
        if (!editingPtoDayIso) return null;
        const data = weeklyScheduleData.find(d => d.day.toISOString() === editingPtoDayIso);
        return data ? data.day : null;
    }, [editingPtoDayIso, weeklyScheduleData]);


    const renderLocationRow = (dayIso: string, location: string, eventsInRow: Event[], isLast: boolean, index: number) => {
        const isLocationCollapsed = collapsedLocations[dayIso]?.has(location);
        const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
        const assignedUser = users.find(u => u.userId === assignedUserId);
        
        const assignmentControl = (
            <>
                {canManageChecks ? (
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
                ) : (
                    assignedUser && (
                        <div className="h-6 text-xs px-1.5 flex items-center justify-center text-muted-foreground">
                            {assignedUser.displayName.split(' ')[0]} {assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}
                        </div>
                    )
                )}
            </>
        );


        return (
            <div key={location} className={cn("flex", { "border-b": !isLast }, {"bg-muted/10": index % 2 !== 0})}>
                <div 
                    className="w-[160px] shrink-0 p-2 border-r flex items-center justify-between bg-card sticky left-0 z-30"
                >
                    <div className="flex items-center gap-1 cursor-pointer flex-1 min-w-0" onClick={() => toggleLocationCollapse(dayIso, location)}>
                        {isLocationCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <p className="font-medium text-sm truncate">{location}</p>
                    </div>
                     {fixedLocations.includes(location) && location !== 'Studio' && assignmentControl}
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
                const dailyExtraLocations = extraCheckLocations[dayIso] ?? (isWeekend ? [] : defaultCheckLocations);
                const usersOnPto = ptoAssignments[dayIso] || [];

                return (
                    <div key={dayIso} ref={isDayToday ? todayCardRef : null}>
                        <Card className="overflow-hidden">
                             <div className="p-2 border-b bg-card flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {canManageChecks && (
                                        <>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenManageChecksDialog(dayIso)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit check locations</span>
                                            </Button>
                                        </>
                                    )}
                                    {dailyExtraLocations.map(location => {
                                        const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
                                        const assignedUser = users.find(u => u.userId === assignedUserId);
                                        
                                        const pillContent = (
                                            <>
                                                {location}
                                                {assignedUser && (
                                                    <span className="ml-2 font-normal text-muted-foreground">({assignedUser.displayName.split(' ')[0]} {assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''})</span>
                                                )}
                                                {!assignedUser && canManageChecks && <PlusCircle className="ml-2 h-4 w-4" />}
                                            </>
                                        );

                                        return canManageChecks ? (
                                            <Popover key={location}>
                                                <PopoverTrigger asChild>
                                                    <Button 
                                                        variant={assignedUser ? "secondary" : "outline"} 
                                                        size="sm" 
                                                        className="rounded-full h-8"
                                                    >
                                                    {pillContent}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0">
                                                    <div className="grid gap-1">
                                                        <div className="p-2 border-b">
                                                            <p className="text-sm font-medium text-center">Assign User to {location}</p>
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
                                        ) : (
                                            <Button
                                                key={location}
                                                variant={assignedUser ? "secondary" : "outline"}
                                                size="sm"
                                                className="rounded-full h-8"
                                                disabled
                                            >
                                                {pillContent}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {usersOnPto.map(userId => {
                                        const user = users.find(u => u.userId === userId);
                                        return user ? (
                                            <Badge key={userId} variant="secondary" className="rounded-full h-8">
                                                {user.displayName}
                                            </Badge>
                                        ) : null;
                                    })}
                                    {canManagePto && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenPtoDialog(dayIso)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit users on PTO</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
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
                                        <CardContent className="p-0 relative">
                                            {/* Working Hours Backgrounds */}
                                            {isWeekend || isDayHoliday ? (
                                                <div className="absolute inset-0 bg-secondary/50 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX}px` }} title="Overtime" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-y-0 bg-secondary/50 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX}px`, width: `${8 * hourWidth}px` }} title="Overtime" />
                                                    <div className="absolute inset-y-0 bg-muted z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 8 * hourWidth}px`, width: `${1 * hourWidth}px` }} title="Extended Working Hours" />
                                                    <div className="absolute inset-y-0 bg-muted z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 18 * hourWidth}px`, width: `${2 * hourWidth}px` }} title="Extended Working Hours" />
                                                    <div className="absolute inset-y-0 bg-secondary/50 z-0" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 20 * hourWidth}px`, width: `${4 * hourWidth}px` }} title="Overtime" />
                                                </>
                                            )}
                                            {/* Lunch Break Cue */}
                                            <div
                                                className="absolute inset-y-0 lunch-break-pattern z-0 pointer-events-none"
                                                style={{
                                                    left: `${LOCATION_LABEL_WIDTH_PX + 12 * hourWidth}px`,
                                                    width: `${2.5 * hourWidth}px`
                                                }}
                                                title="Lunch Break"
                                            />
                                            
                                            {allDayLocations.map((location, index) => renderLocationRow(
                                                dayIso,
                                                location,
                                                groupedEvents[location] || [],
                                                index === allDayLocations.length - 1,
                                                index
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
             <Dialog open={isManageChecksDialogOpen} onOpenChange={(isOpen) => {
                 if (!isOpen) {
                    setEditingDayIso(null);
                 }
             }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Check Locations</DialogTitle>
                        <DialogDescription>
                            Add or remove pill buttons for {editingDayDate ? format(editingDayDate, 'MMMM d, yyyy') : 'the selected day'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                            {tempCheckLocations.map(loc => (
                                <div key={loc} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                    <span className="text-sm">{loc}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveLocation(loc)}>
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove {loc}</span>
                                    </Button>
                                </div>
                            ))}
                            {tempCheckLocations.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">No check locations defined.</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="New location name"
                                value={newLocationName}
                                onChange={(e) => setNewLocationName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewLocation()}
                            />
                            <Button onClick={handleAddNewLocation}>Add</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsManageChecksDialogOpen(false);
                            setEditingDayIso(null);
                        }}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isPtoDialogOpen} onOpenChange={(isOpen) => {
                 if (!isOpen) {
                    setEditingPtoDayIso(null);
                 }
             }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage PTO</DialogTitle>
                        <DialogDescription>
                            Select users on PTO for {editingPtoDayDate ? format(editingPtoDayDate, 'MMMM d, yyyy') : 'the selected day'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                        {users.map(user => (
                            <div key={user.userId} className="flex items-center space-x-2 p-1">
                                <Checkbox
                                    id={`pto-user-${user.userId}`}
                                    checked={tempPtoUsers.includes(user.userId)}
                                    onCheckedChange={(checked) => handlePtoUserSelectionChange(user.userId, !!checked)}
                                />
                                <Label htmlFor={`pto-user-${user.userId}`} className="font-normal flex items-center gap-2 cursor-pointer">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {user.displayName}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsPtoDialogOpen(false);
                            setEditingPtoDayIso(null);
                        }}>Cancel</Button>
                        <Button onClick={handleSavePto}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
