'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback, useLayoutEffect } from 'react';
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
import { Badge } from '../ui/badge';
import { PriorityBadge } from './priority-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

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
    
    const handleRemoveStatusAssignment = useCallback((userId: string) => {
        setTempStatusAssignments(prev => prev.filter(a => a.userId !== userId));
    }, []);

    const handleSaveChanges = useCallback(() => {
        onSave(tempStatusAssignments);
        onOpenChange(false);
    }, [onSave, tempStatusAssignments, onOpenChange]);

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
                                                <span className="font-normal">{user.displayName}</span>
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
    onEventClick,
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
    handleEasyBookingClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, location: string) => void;
    onEventClick: (event: Event) => void;
}) => {
    const { viewAsUser, users, teams } = useUser();
    
    const dayIso = day.toISOString();
    const isLocationCollapsed = collapsedLocations[dayIso]?.has(location);
    const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
    const assignedUser = users.find(u => u.userId === assignedUserId);

    const canManageThisLocation = useMemo(() => {
        if (viewAsUser.isAdmin) return true;
        return teams.some(team => 
            (team.pinnedLocations || []).includes(location) && 
            (team.locationCheckManagers || []).includes(viewAsUser.userId)
        );
    }, [viewAsUser, teams, location]);

    const dailyCheckUsers = useMemo(() => {
        const teamsWithLocation = teams.filter(t => t.pinnedLocations?.includes(location));
        const userIds = new Set(teamsWithLocation.flatMap(t => t.members || []));
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
                    {assignedUser ? `${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}` : <GoogleSymbol name="person_add" weight={100} />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0">
                <div className="p-2 border-b"><p className="text-sm font-normal text-center">{alias || location}</p></div>
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
            <div className="w-[160px] shrink-0 p-2 border-r flex items-start justify-between bg-muted sticky left-0 z-30">
                <div className="flex items-start gap-1 cursor-pointer flex-1 min-w-0" onClick={() => toggleLocationCollapse(dayIso, location)}>
                    {isLocationCollapsed ? <GoogleSymbol name="chevron_right" className="mt-1" /> : <GoogleSymbol name="expand_more" className="mt-1" />}
                    <p className="font-normal text-sm" title={alias ? location : undefined}>{alias || location}</p>
                </div>
                 {canManageThisLocation ? assignmentControl : assignedUser && <div className="h-6 text-xs px-1.5 flex items-center justify-center text-muted-foreground">{`${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}`}</div>}
            </div>
            <div 
                className={cn("relative flex-1", isLocationCollapsed ? "h-10" : "min-h-[5rem] py-1")}
                onClick={(e) => handleEasyBookingClick(e, day, location)}
            >
                {Array.from({ length: 23 }).map((_, hour) => <div key={`line-${location}-${hour}`} className="absolute top-0 bottom-0 border-r" style={{ left: `${(hour + 1) * hourWidth}px` }}></div>)}
                {!isLocationCollapsed && eventsInRow.map(event => {
                    const { left, width } = getEventPosition(event);
                    const colors = calendarColorMap[event.calendarId];
                    const textColor = getContrastColor(colors?.bg || '#000000');
                    return (
                        <div 
                            key={event.eventId} 
                            data-event-id={event.eventId}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                            className={cn("absolute top-1 p-2 rounded-lg shadow-md cursor-pointer flex flex-col overflow-hidden h-[calc(100%-0.5rem)]")} 
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
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            {roleIcon && (
                                                                <div 
                                                                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                                                                    style={{ backgroundColor: roleColor, color: getContrastColor(roleColor || '#ffffff') }}
                                                                >
                                                                    <GoogleSymbol name={roleIcon} style={{fontSize: '10px'}}/>
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
                            <p className="text-[10px] opacity-90">{format(event.startTime, timeFormatEvent)} - {format(event.endTime, timeFormatEvent)}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
});
ProductionScheduleLocationRow.displayName = 'ProductionScheduleLocationRow';


export const ProductionScheduleView = React.memo(({ date, containerRef, zoomLevel, onEasyBooking, onEventClick, triggerScroll }: { date: Date, containerRef: React.RefObject<HTMLDivElement>, zoomLevel: 'normal' | 'fit', onEasyBooking: (data: { startTime: Date, location?: string }) => void, onEventClick: (event: Event) => void, triggerScroll: number }) => {
    const { users, teams, viewAsUser, events, calendars, userStatusAssignments, setUserStatusAssignments, appSettings } = useUser();

    const [now, setNow] = useState<Date | null>(null);
    const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH_PX);
    
    const dayCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const timelineScrollerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const nowMarkerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [collapsedLocations, setCollapsedLocations] = useState<Record<string, Set<string>>>({});
    const [dailyCheckAssignments, setDailyCheckAssignments] = useState<Record<string, Record<string, string | null>>>({});
    const [tempDailyChecks, setTempDailyChecks] = useState<Record<string, Set<string>>>({});
    
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [editingStatusDayIso, setEditingStatusDayIso] = useState<string | null>(null);
    const [addCheckPopoverOpen, setAddCheckPopoverOpen] = useState<Record<string, boolean>>({});
    const [checkSearchTerm, setCheckSearchTerm] = useState('');
    
    const timeFormatTimeline = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h a';
    const timeFormatEvent = viewAsUser.timeFormat === '24h' ? 'HH:mm' : 'h:mm a';

    const canManageAnyCheckLocation = useMemo(() => {
        if (viewAsUser.isAdmin) return true;
        return teams.some(t => (t.locationCheckManagers || []).includes(viewAsUser.userId));
    }, [viewAsUser.isAdmin, viewAsUser.userId, teams]);
    
    const calendarColorMap = useMemo(() => {
        const map: Record<string, { bg: string, text: string }> = {};
        calendars.forEach(cal => {
            map[cal.id] = { bg: cal.color, text: getContrastColor(cal.color) };
        });
        return map;
    }, [calendars]);

    const handleAssignCheck = useCallback((dayIso: string, location: string, userId: string | null) => {
        setDailyCheckAssignments(prev => ({
            ...prev,
            [dayIso]: {
                ...(prev[dayIso] || {}),
                [location]: userId
            }
        }));
    }, []);

    const handleEasyBookingClick = useCallback((e: React.MouseEvent<HTMLDivElement>, day: Date, location: string) => {
        if ((e.target as HTMLElement).closest('[data-event-id]')) {
            return;
        }

        const canCreateEvent = canCreateAnyEvent(viewAsUser, calendars);
        if (!viewAsUser.easyBooking || !canCreateEvent) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedHour = x / hourWidth;
        const hour = Math.floor(clickedHour);
        const minutes = Math.floor((clickedHour % 1) * 60);

        const startTime = new Date(day);
        startTime.setHours(hour, minutes, 0, 0);
        onEasyBooking({ startTime, location });
    }, [hourWidth, onEasyBooking, calendars, viewAsUser]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60 * 1000);
        setNow(new Date());
        return () => clearInterval(timer);
    }, []);

    const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);
    const isCurrentWeek = useMemo(() => weekDays.some(isToday), [weekDays]);

    const allPinnedLocationsFromAllTeams = useMemo(() => [...new Set(teams.flatMap(t => t.pinnedLocations || []))].sort(), [teams]);

    const weeklyScheduleData = useMemo(() => {
        return weekDays.map(day => {
            const dayEvents = events.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            const dayIso = day.toISOString();

            const teamsWithPinnedLocationsForDay = teams.filter(team => team.pinnedLocations && team.pinnedLocations.length > 0);
            
            const allCheckLocationsForDay = [...new Set(teamsWithPinnedLocationsForDay.flatMap(t => t.checkLocations || []))];
            
            const allPinnedLocations = [...new Set(teamsWithPinnedLocationsForDay.flatMap(t => t.pinnedLocations || []))].sort();

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
    
    useEffect(() => {
        timelineScrollerRefs.current.forEach(scroller => {
            if (!scroller) return;
            
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const isFit = zoomLevel === 'fit';
                    const newHourWidth = isFit ? (entry.contentRect.width - LOCATION_LABEL_WIDTH_PX) / 12 : DEFAULT_HOUR_WIDTH_PX;
                    setHourWidth(newHourWidth);
                }
            });
        
            resizeObserver.observe(scroller);
            return () => resizeObserver.disconnect();
        });
    }, [zoomLevel, weeklyScheduleData]);

    useEffect(() => {
        if(triggerScroll > 0) {
            const todayIso = weekDays.find(isToday)?.toISOString();
            const todayCard = todayIso ? dayCardRefs.current.get(todayIso) : undefined;
            if (isCurrentWeek && containerRef.current && todayCard) {
                containerRef.current.scrollTo({ top: todayCard.offsetTop - 20, behavior: 'smooth' });
            }

            const scroller = todayIso ? timelineScrollerRefs.current.get(todayIso) : undefined;
            if(scroller && now) {
                let scrollLeft = 8 * hourWidth; // Default scroll to 8am
                if (zoomLevel !== 'fit') {
                    scrollLeft = (now.getHours() + now.getMinutes() / 60) * hourWidth - (scroller.offsetWidth / 2) + (LOCATION_LABEL_WIDTH_PX / 2);
                }
                scroller.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [triggerScroll, isCurrentWeek, hourWidth, now, zoomLevel]);

    const toggleDayCollapse = useCallback((dayIso: string) => {
        setCollapsedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayIso)) newSet.delete(dayIso);
            else newSet.add(dayIso);
            return newSet;
        });
    }, []);

    const toggleLocationCollapse = useCallback((dayIso: string, location: string) => {
        setCollapsedLocations(prev => {
            const daySet = new Set(prev[dayIso] || []);
            if (daySet.has(location)) daySet.delete(location);
            else daySet.add(location);
            return { ...prev, [dayIso]: daySet };
        });
    }, []);

    const handleAddTempCheck = useCallback((dayIso: string, locationName: string) => {
        setTempDailyChecks(prev => {
            const daySet = new Set(prev[dayIso] || []);
            daySet.add(locationName);
            return { ...prev, [dayIso]: daySet };
        });
        setAddCheckPopoverOpen(prev => ({ ...prev, [dayIso]: false }));
    }, []);

    const handleRemoveTempCheck = useCallback((dayIso: string, locationName: string) => {
        setTempDailyChecks(prev => {
            const daySet = new Set(prev[dayIso] || []);
            daySet.delete(locationName);
            if (daySet.size === 0) {
                const newChecks = { ...prev };
                delete newChecks[dayIso];
                return newChecks;
            }
            return { ...prev, [dayIso]: daySet };
        });
    }, []);
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const calculateCurrentTimePosition = () => {
        if (!now) return 0;
        return (now.getHours() + now.getMinutes() / 60) * hourWidth;
    }
    
    const handleOpenStatusDialog = useCallback((dayIso: string) => {
        setEditingStatusDayIso(dayIso);
        setIsStatusDialogOpen(true);
    }, []);

    const handleSaveStatus = useCallback((newAssignments: UserStatusAssignment[]) => {
        if (!editingStatusDayIso) return;
        setUserStatusAssignments(prev => ({ ...prev, [editingStatusDayIso]: newAssignments }));
        toast({ title: "Success", description: "User statuses updated." });
        setEditingStatusDayIso(null);
    }, [editingStatusDayIso, setUserStatusAssignments]);

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

                const tempChecksForDaySet = tempDailyChecks[dayIso] || new Set();
                
                const allChecksToRender = Array.from(new Set([...(allCheckLocationsForDay || []), ...Array.from(tempChecksForDaySet)])).sort();

                const availableLocationsForTempCheck = allPinnedLocationsFromAllTeams
                    .filter(loc => !allChecksToRender.includes(loc))
                    .filter(loc => loc.toLowerCase().includes(checkSearchTerm.toLowerCase()));

                return (
                    <Card key={dayIso} ref={el => dayCardRefs.current.set(dayIso, el)}>
                        <CardHeader className="p-2 bg-muted/50 flex flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                {allChecksToRender.map(location => {
                                    const assignedUserId = dailyCheckAssignments[dayIso]?.[location];
                                    const assignedUser = users.find(u => u.userId === assignedUserId);
                                    const canManageThisCheckLocation = viewAsUser.isAdmin || teams.some(t =>
                                        (t.checkLocations || []).includes(location) && (t.locationCheckManagers || []).includes(viewAsUser.userId)
                                    );
                                    const isTempCheck = tempChecksForDaySet.has(location);

                                    const pillContent = (
                                        <>
                                            {locationAliasMap[location] || location}
                                            {assignedUser && <span className="ml-2 font-normal text-muted-foreground">({`${assignedUser.displayName.split(' ')[0]} ${assignedUser.displayName.split(' ').length > 1 ? `${assignedUser.displayName.split(' ')[1].charAt(0)}.` : ''}`})</span>}
                                            {!assignedUser && canManageThisCheckLocation && <GoogleSymbol name="person_add" weight={100} className="ml-2" />}
                                        </>
                                    );
                                    
                                    const dailyCheckUsers = users.filter(user => teams.some(t => (t.checkLocations || []).includes(location) && (t.locationCheckManagers || []).includes(viewAsUser.userId) && (t.members || []).includes(user.userId) ));

                                    const pill = canManageThisCheckLocation ? (
                                        <Popover key={location}><PopoverTrigger asChild><Button variant={assignedUser ? "default" : "outline"} size="sm" className={cn("rounded-full h-8", isTempCheck && "border-dashed")}>{pillContent}</Button></PopoverTrigger>
                                            <PopoverContent className="w-56 p-0">
                                                <div className="p-2 border-b"><p className="text-sm font-normal text-center">{locationAliasMap[location] || location}</p></div>
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
                                    ) : (<Button key={location} variant={assignedUser ? "default" : "outline"} size="sm" className={cn("rounded-full h-8", isTempCheck && "border-dashed")} disabled>{pillContent}</Button>);
                                    
                                    return isTempCheck ? (
                                        <div key={location} className="group relative">
                                            {pill}
                                            <button onClick={() => handleRemoveTempCheck(dayIso, location)} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GoogleSymbol name="close" className="text-xs" />
                                            </button>
                                        </div>
                                    ) : pill;
                                })}

                                {canManageAnyCheckLocation && (
                                    <Popover open={addCheckPopoverOpen[dayIso] || false} onOpenChange={(isOpen) => setAddCheckPopoverOpen(prev => ({ ...prev, [dayIso]: isOpen }))}>
                                        <PopoverTrigger asChild>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                            <GoogleSymbol name="playlist_add_check_circle" weight={100} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Add Temporary Check</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <div className="p-2 border-b">
                                                <Input
                                                    placeholder="Search locations..."
                                                    value={checkSearchTerm}
                                                    onChange={(e) => setCheckSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <ScrollArea className="h-48">
                                                {availableLocationsForTempCheck.length > 0 ? availableLocationsForTempCheck.map(loc => (
                                                <div 
                                                    key={loc} 
                                                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                                                    onClick={() => handleAddTempCheck(dayIso, loc)}
                                                >
                                                    {locationAliasMap[loc] || loc}
                                                </div>
                                                )) : (
                                                <p className="p-4 text-center text-sm text-muted-foreground">No matching locations.</p>
                                                )}
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleDayCollapse(dayIso)}>
                                    {isDayCollapsed ? <GoogleSymbol name="chevron_right" /> : <GoogleSymbol name="expand_more" />}
                                    <span className="sr-only">{isDayCollapsed ? "Expand day" : "Collapse day"}</span>
                                </Button>
                                <span className={cn("font-normal text-sm", { "text-primary": isDayToday })}>{format(day, 'EEE, MMMM d, yyyy').toUpperCase()}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {dayStatusAssignments.map(({ userId, status }) => {
                                    const user = users.find(u => u.userId === userId);
                                    return user ? <UserStatusBadge key={userId} status={status}>{user.displayName}</UserStatusBadge> : null;
                                })}
                                {canManageAnyCheckLocation && 
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenStatusDialog(dayIso)}><GoogleSymbol name="account_circle_off" weight={100} /><span className="sr-only">Edit user statuses</span></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Manage User Statuses</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                }
                            </div>
                        </CardHeader>
                        {!isDayCollapsed && (
                            <div className="overflow-x-auto" ref={el => timelineScrollerRefs.current.set(dayIso, el)}>
                                <div style={{ width: `${LOCATION_LABEL_WIDTH_PX + (24 * hourWidth)}px`}}>
                                    <CardHeader className="p-0 sticky top-0 bg-background z-20 flex flex-row">
                                        <div className="w-[160px] shrink-0 border-r p-2 flex items-center font-normal text-sm sticky left-0 bg-muted z-30">Location</div>
                                        {hours.map(hour => <div key={hour} className="shrink-0 text-left p-2 border-r bg-muted" style={{ width: `${hourWidth}px`}}><span className="text-xs text-muted-foreground">{format(addHours(startOfDay(day), hour), timeFormatTimeline)}</span></div>)}
                                    </CardHeader>
                                    <CardContent className="p-0 relative">
                                        <div className="absolute inset-y-0 lunch-break-pattern z-0 pointer-events-none" style={{ left: `${LOCATION_LABEL_WIDTH_PX + 12 * hourWidth}px`, width: `${2.5 * hourWidth}px` }} title="Lunch Break" />
                                        {(gridLocations || []).map((location, index) => (
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
                                                onEventClick={onEventClick}
                                            />
                                        ))}
                                        {isDayToday && now && <div ref={el => nowMarkerRefs.current.set(dayIso, el)} className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${LOCATION_LABEL_WIDTH_PX + calculateCurrentTimePosition()}px` }}><div className="relative w-px h-full bg-primary"></div></div>}
                                    </CardContent>
                                </div>
                            </div>
                        )}
                    </Card>
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
});
ProductionScheduleView.displayName = 'ProductionScheduleView';
