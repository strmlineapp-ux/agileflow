
'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { format, addHours, startOfDay, isSaturday, isSunday, isSameDay, isToday, startOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { type Event, type User, type UserStatus, type UserStatusAssignment, type Team } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, getContrastColor } from '@/lib/utils';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUser } from '@/context/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserStatusBadge } from '@/components/user-status-badge';
import { Separator } from '@/components/ui/separator';
import { canCreateAnyEvent } from '@/lib/permissions';
import { GoogleSymbol } from '../icons/google-symbol';

const DEFAULT_HOUR_WIDTH_PX = 120;
const LOCATION_LABEL_WIDTH_PX = 160;

const ALL_USER_STATUSES: UserStatus[] = [
    'PTO', 'PTO (AM)', 'PTO (PM)', 'TOIL', 'TOIL (AM)', 'TOIL (PM)', 'Sick', 'Offsite', 'Training'
];

type ManageStatusDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    day: Date | null;
    initialAssignments: UserStatusAssignment[];
    users: User[];
    onSave: (newAssignments: UserStatusAssignment[]) => void;
};

const ManageStatusDialog = ({ isOpen, onOpenChange, day, initialAssignments, users, onSave }: ManageStatusDialogProps) => {
    const [tempStatusAssignments, setTempStatusAssignments] = useState(initialAssignments);
    const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
    const [selectedStatusToAdd, setSelectedStatusToAdd] = useState<UserStatus | null>(null);
    
    useEffect(() => {
        setTempStatusAssignments(initialAssignments);
    }, [initialAssignments]);

    useEffect(() => {
        if (selectedUserIdToAdd && selectedStatusToAdd) {
            setTempStatusAssignments(prev => [...prev, { userId: selectedUserIdToAdd, status: selectedStatusToAdd }]);
            setSelectedUserIdToAdd('');
            setSelectedStatusToAdd(null);
        }
    }, [selectedUserIdToAdd, selectedStatusToAdd]);
    
    const handleRemoveStatusAssignment = (userId: string) => {
        setTempStatusAssignments(prev => prev.filter(a => a.userId !== userId));
    };

    const handleSaveChanges = () => {
        onSave(tempStatusAssignments);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                 <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveChanges}>
                        <GoogleSymbol name="check" className="text-xl" />
                        <span className="sr-only">Save Changes</span>
                    </Button>
                </div>
                <DialogHeader>
                    <DialogTitle>Manage User Status</DialogTitle>
                    <DialogDescription>
                        Assign an absence status to users for {day ? format(day, 'MMMM d, yyyy') : 'the selected day'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2 pr-2">
                        <h4 className="font-medium text-sm">Current Absences</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                            {tempStatusAssignments.length > 0 ? (
                                tempStatusAssignments.map(({ userId, status }) => {
                                    const user = users.find(u => u.userId === userId);
                                    if (!user) return null;
                                    return (
                                        <div key={userId} className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.displayName}</span>
                                                <UserStatusBadge status={status}>{status}</UserStatusBadge>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveStatusAssignment(userId)}>
                                                <GoogleSymbol name="cancel" className="text-sm" />
                                                <span className="sr-only">Remove status</span>
                                            </Button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No users have an absence status for this day.
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Add Absence</h4>
                        <div className="flex items-center gap-2">
                            <Select value={selectedUserIdToAdd} onValueChange={setSelectedUserIdToAdd}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select User" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.filter(u => !tempStatusAssignments.some(a => a.userId === u.userId)).map(user => (
                                        <SelectItem key={user.userId} value={user.userId}>{user.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatusToAdd || ''} onValueChange={(value) => setSelectedStatusToAdd(value as UserStatus)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_USER_STATUSES.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ProductionScheduleLocationRow = React.memo(({
    day,
    location,
    alias,
    eventsInRow,
    isLast,
    index,
    hourWidth,
    calendarColorMap,
    timeFormatEvent,
    collapsedLocations,
    dailyCheckAssignments,
    toggleLocationCollapse,
    handleAssignCheck,
    handleEasyBookingClick,
}: {
    day: Date;
    location: string;
    alias?: string;
    eventsInRow: Event[];
    isLast: boolean;
    index: number;
    hourWidth: number;
    calendarColorMap: Record<string, { bg: string; text: string }>;
    timeFormatEvent: string;
    collapsedLocations: Record<string, Set<string>>;
    dailyCheckAssignments: Record<string, Record<string, string | null>>;
    toggleLocationCollapse: (dayIso: string, location: string) => void;
    handleAssignCheck: (dayIso: string, location: string, userId: string | null) => void;
    handleEasyBookingClick: (e: React.MouseEvent<HTMLDivElement>, day: Date) => void;
}) => {
    const { viewAsUser, users, teams } = useUser();
    
    const dayIso = day.toISOString();
    const isLocationCollapsed = collapsedLocations[dayIso]?.has(location);
    const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
    const assignedUser = users.find(u => u.userId === assignedUserId);

    const canManageThisLocation = useMemo(() => {
        if (viewAsUser.roles?.includes('Admin')) return true;
        return teams.some(team => 
            team.pinnedLocations.includes(location) && 
            team.locationCheckManagers?.includes(viewAsUser.userId)
        );
    }, [viewAsUser, teams, location]);

    const dailyCheckUsers = useMemo(() => {
        const teamsWithLocation = teams.filter(t => t.pinnedLocations.includes(location));
        const userIds = new Set(teamsWithLocation.flatMap(t => t.members));
        return users.filter(u => userIds.has(u.userId));
    }, [teams, users, location]);
    
    const getEventPosition = (event: Event) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();

        const left = (startHour + startMinute / 60) * hourWidth;
        const width = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * hourWidth - 4, 20);
        return { left, width };
    };

    const assignmentControl = (
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size={assignedUser ? "sm" : "icon"} className={cn("h-6 text-xs", assignedUser ? "w-auto px-1.5" : "w-6 ml-1")}>
                    {assignedUser ? `${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}` : <GoogleSymbol name="add_circle" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0">
                <div className="p-2 border-b"><p className="text-sm font-medium text-center">{alias || location}</p></div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1">
                    {dailyCheckUsers.length > 0 ? dailyCheckUsers.filter(user => user.userId !== assignedUserId).map(user => (
                        <Button key={user.userId} variant="ghost" className="justify-start h-8" onClick={() => handleAssignCheck(dayIso, location, user.userId)}>
                            <Avatar className="h-6 w-6 mr-2"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <span className="text-sm">{user.displayName}</span>
                        </Button>
                    )) : <p className="text-sm text-muted-foreground text-center p-2">No users to assign.</p>}
                </div>
                {assignedUser && <div className="p-1 border-t"><Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => handleAssignCheck(dayIso, location, null)}>Unassign</Button></div>}
            </PopoverContent>
        </Popover>
    );

    return (
        <div className={cn("flex", { "border-b": !isLast }, {"bg-muted/10": index % 2 !== 0})}>
            <div className="w-[160px] shrink-0 p-2 border-r flex items-start justify-between bg-card sticky left-0 z-30">
                <div className="flex items-start gap-1 cursor-pointer flex-1 min-w-0" onClick={() => toggleLocationCollapse(dayIso, location)}>
                    {isLocationCollapsed ? <GoogleSymbol name="chevron_right" className="mt-1" /> : <GoogleSymbol name="expand_more" className="mt-1" />}
                    <p className="font-medium text-sm" title={alias ? location : undefined}>{alias || location}</p>
                </div>
                 {canManageThisLocation ? assignmentControl : assignedUser && <div className="h-6 text-xs px-1.5 flex items-center justify-center text-muted-foreground">{`${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}`}</div>}
            </div>
            <div 
                className={cn("relative flex-1", isLocationCollapsed ? "h-10" : "min-h-[5rem] py-1")}
                onClick={(e) => handleEasyBookingClick(e, day)}
            >
                {Array.from({ length: 23 }).map((_, hour) => <div key={`line-${location}-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * hourWidth}px` }}></div>)}
                {!isLocationCollapsed && eventsInRow.map(event => {
                    const { left, width } = getEventPosition(event);
                    const colors = calendarColorMap[event.calendarId];
                    return (
                        <div key={event.eventId} className={cn("absolute top-1 p-2 rounded-lg shadow-md cursor-pointer z-10")} style={{ left: `${left + 2}px`, width: `${width}px`, backgroundColor: colors?.bg, color: colors?.text }}>
                            <p className="font-semibold text-sm whitespace-normal">{event.title}</p>
                            <p className="text-xs opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});
ProductionScheduleLocationRow.displayName = 'ProductionScheduleLocationRow';


export function ProductionScheduleView({ date, containerRef, zoomLevel, onEasyBooking }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', onEasyBooking: (date: Date) => void }) {
    const { users, teams, viewAsUser, events, calendars, userStatusAssignments, setUserStatusAssignments } = useUser();

    const [now, setNow] = useState<Date | null>(null);
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);

    const todayCardRef = useRef<HTMLDivElement>(null);
    const nowMarkerRef = useRef<HTMLDivElement>(null);
    const dayScrollerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [collapsedLocations, setCollapsedLocations] = useState<Record<string, Set<string>>>({});
    const [dailyCheckAssignments, setDailyCheckAssignments] = useState<Record<string, Record<string, string | null>>>({});

    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [editingStatusDayIso, setEditingStatusDayIso] = useState<string | null>(null);
    
    const userCanCreateEvent = canCreateAnyEvent(viewAsUser, calendars);
    const managerialRoles = ["Admin", "Service Delivery Manager"];
    const canManageStatus = viewAsUser.roles?.some(p => managerialRoles.includes(p));

    const timeFormatTimeline = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h a';
    const timeFormatEvent = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h:mm a';
    
    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    const handleAssignCheck = (dayIso: string, location: string, userId: string | null) => {
        setDailyCheckAssignments(prev => ({
            ...prev,
            [dayIso]: {
                ...(prev[dayIso] || {}),
                [location]: userId
            }
        }));
    };

    const handleEasyBookingClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        if (!viewAsUser.easyBooking || !userCanCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedHour = x / hourWidth;
        const hour = Math.floor(clickedHour);
        const minutes = Math.floor((clickedHour % 1) * 60);

        const startTime = new Date(day);
        startTime.setHours(hour, minutes, 0, 0);
        onEasyBooking(startTime);
    };

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60 * 1000);
        setNow(new Date());
        return () => clearInterval(timer);
    }, []);

    const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);
    const isCurrentWeek = useMemo(() => weekDays.some(d => isToday(d)), [weekDays]);

    const weeklyScheduleData = useMemo(() => {
        return weekDays.map(day => {
            const dayEvents = events.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const dayIso = day.toISOString();

            const teamsWithPinnedLocationsForDay = teams.filter(team => team.pinnedLocations && team.pinnedLocations.length > 0);
            
            const allCheckLocationsForDay = [...new Set(teamsWithPinnedLocationsForDay.flatMap(t => t.checkLocations || []))];
            
            const allPinnedLocations = [...new Set(teamsWithPinnedLocationsForDay.flatMap(t => t.pinnedLocations))].sort();

            const gridLocations = allPinnedLocations.filter(loc => !allCheckLocationsForDay.includes(loc));
            
            const locationAliasMap: Record<string, string> = {};
            teams.forEach(team => {
                if (team.locationAliases) {
                    Object.entries(team.locationAliases).forEach(([canonicalName, alias]) => {
                        if (!locationAliasMap[canonicalName]) {
                            locationAliasMap[canonicalName] = alias;
                        }
                    });
                }
            });
            
            const groupedEvents = gridLocations.reduce((acc, locationKey) => {
                acc[locationKey] = dayEvents.filter(e => e.location === locationKey);
                return acc;
            }, {} as Record<string, Event[]>);
            
            return { day, dayIso, groupedEvents, isWeekend: isSaturday(day) || isSunday(day), gridLocations, allCheckLocationsForDay, locationAliasMap };
        });
    }, [weekDays, events, teams]);

    useEffect(() => {
        const initialCollapsedDays = new Set<string>();
        const initialCollapsedLocations: Record<string, Set<string>> = {};

        weeklyScheduleData.forEach(({ dayIso, isWeekend, groupedEvents, gridLocations }) => {
            if (isWeekend) initialCollapsedDays.add(dayIso);

            const locationsToCollapse = new Set<string>();
            (gridLocations || []).forEach(loc => {
                if (!groupedEvents[loc] || groupedEvents[loc].length === 0) {
                    locationsToCollapse.add(loc);
                }
            });
            initialCollapsedLocations[dayIso] = locationsToCollapse;
        });
        setCollapsedDays(initialCollapsedDays);
        setCollapsedLocations(initialCollapsedLocations);
    }, [weeklyScheduleData]);
    
    // Scroll handling
    useEffect(() => {
        if (isCurrentWeek && containerRef.current && todayCardRef.current) {
            const container = containerRef.current;
            const todayElement = todayCardRef.current;
            container.scrollTo({ top: todayElement.offsetTop - 20, behavior: 'smooth' });

            if (nowMarkerRef.current && zoomLevel === 'normal' && now) {
                const todayIso = weekDays.find(isToday)!.toISOString();
                const scroller = dayScrollerRefs.current.get(todayIso);
                if (scroller) {
                     const scrollLeft = nowMarkerRef.current.offsetLeft - (scroller.offsetWidth / 2) + (LOCATION_LABEL_WIDTH_PX / 2);
                     scroller.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        }
    }, [date, containerRef, isCurrentWeek, zoomLevel, weekDays, now]);

    // Zoom handling
    useEffect(() => {
        const firstScroller = dayScrollerRefs.current.values().next().value;
        if (!firstScroller) return;

        const isFit = zoomLevel === 'fit';
        const newHourWidth = isFit ? (firstScroller.offsetWidth - LOCATION_LABEL_WIDTH_PX) / 12 : DEFAULT_HOUR_WIDTH_PX;
        setHourWidth(newHourWidth);

        dayScrollerRefs.current.forEach((scroller, dayIso) => {
            let targetScroll = 7 * newHourWidth; // Default for normal zoom
            if (isFit) {
                targetScroll = 8 * newHourWidth;
            } else if (isToday(new Date(dayIso)) && now) {
                targetScroll = (now.getHours() - 1) * newHourWidth;
            }
            scroller?.scrollTo({ left: targetScroll, behavior: 'smooth' });
        });
    }, [zoomLevel, now]);

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
            if (daySet.has(location)) daySet.delete(location);
            else daySet.add(location);
            return { ...prev, [dayIso]: daySet };
        });
    };
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * hourWidth;
    }
    
    const handleOpenStatusDialog = (dayIso: string) => {
        setEditingStatusDayIso(dayIso);
        setIsStatusDialogOpen(true);
    };

    const handleSaveStatus = (newAssignments: UserStatusAssignment[]) => {
        if (!editingStatusDayIso) return;
        setUserStatusAssignments(prev => ({ ...prev, [editingStatusDayIso]: newAssignments }));
        toast({ title: "Success", description: "User statuses updated." });
        setEditingStatusDayIso(null);
    };

    const editingStatusDayData = useMemo(() => {
        if (!editingStatusDayIso) return { day: null, initialAssignments: [] };
        const dayData = weeklyScheduleData.find(d => d.day.toISOString() === editingStatusDayIso);
        return {
            day: dayData?.day ?? null,
            initialAssignments: userStatusAssignments[editingStatusDayIso] || []
        };
    }, [editingStatusDayIso, weeklyScheduleData, userStatusAssignments]);


    return (
        <div className="space-y-4">
            {weeklyScheduleData.map(({ day, dayIso, groupedEvents, gridLocations, allCheckLocationsForDay, locationAliasMap }) => {
                const isDayCollapsed = collapsedDays.has(dayIso);
                const isDayToday = isToday(day);
                const dayStatusAssignments = userStatusAssignments[dayIso] || [];
                
                const dailyCheckLocationsForPills = [...new Set(allCheckLocationsForDay)];

                return (
                    <div key={dayIso} ref={isDayToday ? todayCardRef : null}>
                        <Card className="overflow-hidden">
                             <div className="p-2 border-b bg-card flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {dailyCheckLocationsForPills.map(location => {
                                        const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
                                        const assignedUser = users.find(u => u.userId === assignedUserId);
                                        const canManageThisCheckLocation = viewAsUser.roles?.includes('Admin') || teams.some(t =>
                                            t.checkLocations.includes(location) && (t.locationCheckManagers || []).includes(viewAsUser.userId)
                                        );

                                        const pillContent = <>{locationAliasMap[location] || location}{assignedUser && <span className="ml-2 font-normal text-muted-foreground">({`${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}`})</span>}{!assignedUser && canManageThisCheckLocation && <GoogleSymbol name="add_circle" className="ml-2" />}</>;
                                        
                                        const dailyCheckUsers = users.filter(user => teams.some(t => t.checkLocations.includes(location) && (t.locationCheckManagers || []).includes(viewAsUser.userId) && (t.members || []).includes(user.userId) ));

                                        return canManageThisCheckLocation ? (
                                            <Popover key={location}><PopoverTrigger asChild><Button variant={assignedUser ? "secondary" : "outline"} size="sm" className="rounded-full h-8">{pillContent}</Button></PopoverTrigger>
                                                <PopoverContent className="w-56 p-0">
                                                    <div className="p-2 border-b"><p className="text-sm font-medium text-center">{locationAliasMap[location] || location}</p></div>
                                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1">
                                                        {dailyCheckUsers.length > 0 ? dailyCheckUsers.filter(user => user.userId !== assignedUserId).map(user => (
                                                            <Button key={user.userId} variant="ghost" className="justify-start h-8" onClick={() => handleAssignCheck(dayIso, location, user.userId)}>
                                                                <Avatar className="h-6 w-6 mr-2"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                                <span className="text-sm">{user.displayName}</span>
                                                            </Button>
                                                        )) : <p className="text-sm text-muted-foreground text-center p-2">No users to assign.</p>}
                                                    </div>
                                                    {assignedUser && <div className="p-1 border-t"><Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => handleAssignCheck(dayIso, location, null)}>Unassign</Button></div>}
                                                </PopoverContent>
                                            </Popover>
                                        ) : (<Button key={location} variant={assignedUser ? "secondary" : "outline"} size="sm" className="rounded-full h-8" disabled>{pillContent}</Button>);
                                    })}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {dayStatusAssignments.map(({ userId, status }) => {
                                        const user = users.find(u => u.userId === userId);
                                        return user ? <UserStatusBadge key={userId} status={status}>{user.displayName}</UserStatusBadge> : null;
                                    })}
                                    {canManageStatus && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenStatusDialog(dayIso)}><GoogleSymbol name="edit" /><span className="sr-only">Edit user statuses</span></Button>}
                                </div>
                            </div>
                            <div className="overflow-x-auto" ref={el => dayScrollerRefs.current.set(dayIso, el)}>
                                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                                    <CardHeader className="p-0 border-b sticky top-0 bg-card z-20 flex flex-row">
                                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-semibold text-sm sticky left-0 bg-card z-30 cursor-pointer gap-2" onClick={() => toggleDayCollapse(dayIso)}>
                                           {isDayCollapsed ? <GoogleSymbol name="chevron_right" /> : <GoogleSymbol name="expand_more" />}
                                           <span className={cn({ "text-primary": isDayToday })}>{format(day, 'EEE, MMMM d, yyyy').toUpperCase()}</span>
                                        </div>
                                        {hours.map(hour => <div key={hour} className="shrink-0 text-left p-2 border-r" style={{ width: `${hourWidth}px`}}><span className="text-xs text-muted-foreground">{format(addHours(startOfDay(day), hour), timeFormatTimeline)}</span></div>)}
                                    </CardHeader>
                                    {!isDayCollapsed && (
                                        <CardContent className="p-0 relative">
                                            <div className="absolute inset-y-0 lunch-break-pattern z-0 pointer-events-none" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 12 * hourWidth}px`, width: `${2.5 * hourWidth}px` }} title="Lunch Break" />
                                            {gridLocations.map((location, index) => (
                                                <ProductionScheduleLocationRow
                                                    key={location}
                                                    day={day}
                                                    location={location}
                                                    alias={locationAliasMap[location]}
                                                    eventsInRow={groupedEvents[location] || []}
                                                    isLast={index === gridLocations.length - 1}
                                                    index={index}
                                                    hourWidth={hourWidth}
                                                    calendarColorMap={calendarColorMap}
                                                    timeFormatEvent={timeFormatEvent}
                                                    collapsedLocations={collapsedLocations}
                                                    dailyCheckAssignments={dailyCheckAssignments}
                                                    toggleLocationCollapse={toggleLocationCollapse}
                                                    handleAssignCheck={handleAssignCheck}
                                                    handleEasyBookingClick={handleEasyBookingClick}
                                                />
                                            ))}
                                            {isDayToday && now && <div ref={nowMarkerRef} className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${LOCATION_LABEL_WIDTH_PX + calculateCurrentTimePosition()}px` }}><div className="relative w-0.5 h-full bg-primary"><div className="absolute -top-1.5 -left-[5px] h-3 w-3 rounded-full bg-primary border-2 border-background"></div></div></div>}
                                        </CardContent>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}
            <ManageStatusDialog
                isOpen={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                day={editingStatusDayData.day}
                initialAssignments={editingStatusDayData.initialAssignments}
                users={users}
                onSave={handleSaveStatus}
            />
        </div>
    );
}
