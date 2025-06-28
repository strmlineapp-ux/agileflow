
'use client';

import * as React from 'react';
import { type Event, type Attendee, type Attachment, type AttachmentType, type User, type CalendarId, type SharedCalendar, type EventTemplate } from '@/types';
import { useUser } from '@/context/user-context';
import { format, startOfDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn, getContrastColor } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { UserStatusBadge } from '../user-status-badge';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


// --- ICON COMPONENTS ---
const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M9.19,4.5l-3.2,0l-1.7,2.9l3.2,5.7l4.9,0l1.7,-2.9l-4.9,-5.7Z" fill="#0f9d58"></path><path d="M5.99,4.5l-3.2,5.7l1.7,2.9l3.2,-5.7l-1.7,-2.9Z" fill="#ffc107"></path><path d="M10.89,7.4l-3.2,0l-1.7,-2.9l4.9,0l0,0Z" fill="#1976d2"></path></svg>
);
const GoogleDocsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#4285f4"></path><path d="M10,9H6V8h4V9z M11,7H6V6h5V7z M11,5H6V4h5V5z" fill="#ffffff"></path></svg>
);
const GoogleSheetsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#0f9d58"></path><path d="M7,11v-1H5v-1h2V8H5V7h2V6H4v6h3V11z M12,12H8v-1h1V8H8V7h4v1h-1v2h1V12z" fill="#ffffff"></path></svg>
);
const GoogleSlidesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#ffc107"></path><path d="M12,4H4v6h8V4z" fill="#ffffff"></path></svg>
);
const GoogleFormsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#7e57c2"></path><path d="M10,11H6v-1h4V11z M11,8H6V7h5V8z M8,5H6V4h2V5z" fill="#ffffff"></path></svg>
);

const attachmentIcons: Record<AttachmentType, React.ReactNode> = {
  drive: <GoogleDriveIcon className="h-5 w-5" />,
  docs: <GoogleDocsIcon className="h-5 w-5" />,
  sheets: <GoogleSheetsIcon className="h-5 w-5" />,
  slides: <GoogleSlidesIcon className="h-5 w-5" />,
  forms: <GoogleFormsIcon className="h-5 w-5" />,
  meet: <GoogleSymbol name="videocam" className="text-xl" />,
  local: <GoogleSymbol name="description" className="text-xl" />,
};


// --- DISPLAY VIEW ---
const EventDisplayView = ({ event, onEdit }: { event: Event, onEdit: () => void }) => {
    const { viewAsUser, users, calendars, teams } = useUser();
    const calendar = calendars.find(c => c.id === event.calendarId);
    if (!calendar) return null;

    const canManage = canManageEventOnCalendar(viewAsUser, calendar);
    const timeFormat = format(event.startTime, 'eeee, MMM d, yyyy') + ' ⋅ ' + format(event.startTime, 'p') + ' - ' + format(event.endTime, 'p');
    const teamForEvent = teams.find(t => t.id === event.calendarId);
    const eventTemplate = teamForEvent?.eventTemplates?.find(t => t.id === event.templateId);
    const roleAssignmentsLabel = calendar?.roleAssignmentsLabel || 'Role Assignments';
    
    const assignedUserIds = new Set(Object.values(event.roleAssignments || {}).filter(Boolean) as string[]);
    const guestsToDisplay = (event.attendees || []).filter(attendee => !attendee.userId || !assignedUserIds.has(attendee.userId));

    return (
        <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{timeFormat}</p>
            </DialogHeader>
            {canManage && (
                <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <GoogleSymbol name="edit" className="text-xl" />
                        <span className="sr-only">Edit Event</span>
                    </Button>
                </div>
            )}
            <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 pr-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {calendar && (
                            <Badge style={{ backgroundColor: calendar.color, color: getContrastColor(calendar.color) }} className="border-transparent">{calendar.name}</Badge>
                        )}
                        <PriorityBadge priorityId={event.priority} />
                        {eventTemplate && <TooltipProvider><Tooltip><TooltipTrigger asChild><Badge variant="secondary" className="p-1"><GoogleSymbol name={eventTemplate.icon} className="text-sm" /></Badge></TooltipTrigger><TooltipContent>{eventTemplate.name}</TooltipContent></Tooltip></TooltipProvider>}
                    </div>
                    
                    {event.location && (
                        <div className="flex items-start gap-4">
                            <GoogleSymbol name="location_on" className="text-2xl text-muted-foreground mt-0.5" />
                            <p className="font-medium">{event.location}</p>
                        </div>
                    )}
                    
                    {event.description && (
                         <div className="flex items-start gap-4">
                            <GoogleSymbol name="subject" className="text-2xl text-muted-foreground mt-0.5" />
                            <p className="text-sm">{event.description}</p>
                        </div>
                    )}
                    
                    {teamForEvent && event.roleAssignments && Object.keys(event.roleAssignments).length > 0 && (
                         <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                <GoogleSymbol name="badge" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{roleAssignmentsLabel}</p>
                                    <div className="space-y-2">
                                        {Object.entries(event.roleAssignments).map(([role, userId]) => {
                                            const user = users.find(u => u.userId === userId);
                                            return (
                                                <div key={role} className="flex items-center gap-2 text-sm">
                                                    <span className="font-semibold w-24">{role}:</span>
                                                    {user ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6"><AvatarImage src={user.avatarUrl} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                            <span>{user.displayName}</span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic">Not assigned</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {guestsToDisplay.length > 0 && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                <GoogleSymbol name="group" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{guestsToDisplay.length} Guests</p>
                                    <div className="space-y-2">
                                        {guestsToDisplay.map(attendee => (
                                            <div key={attendee.email} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={attendee.avatarUrl} alt={attendee.displayName} data-ai-hint="user avatar" />
                                                    <AvatarFallback>{attendee.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{attendee.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {event.attachments && event.attachments.length > 0 && (
                         <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                 <GoogleSymbol name="attachment" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{event.attachments.length} Attachments</p>
                                    <div className="space-y-2">
                                        {event.attachments.map((att, index) => (
                                            <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                                {attachmentIcons[att.type]}
                                                <span className="text-sm font-medium underline-offset-4 hover:underline">{att.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </>
    );
};


// --- EDIT FORM ---
const EventEditForm = ({ event, onFinished }: { event: Event, onFinished: () => void }) => {
    // This component is a modified version of NewEventForm, adapted for editing.
    // The structure, hooks, and state management are very similar.
    const { viewAsUser, users, calendars, teams, updateEvent, allBookableLocations, getEventStrategy, userStatusAssignments } = useUser();
    const { toast } = useToast();
    
    // State management for UI elements
    const [isLoading, setIsLoading] = React.useState(false);
    const [guestSearch, setGuestSearch] = React.useState('');
    const [isGuestPopoverOpen, setIsGuestPopoverOpen] = React.useState(false);
    const [isCalendarPopoverOpen, setIsCalendarPopoverOpen] = React.useState(false);
    const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = React.useState(false);
    const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = React.useState(false);

    // Form schema
    const formSchema = z.object({
        title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
        calendarId: z.string().nonempty({ message: 'Please select a calendar.' }),
        priority: z.string().nonempty({ message: 'Please select a priority.' }),
        templateId: z.string().optional(),
        date: z.date({ required_error: 'A date is required.' }),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
        location: z.string().optional(),
        description: z.string().optional(),
        attendees: z.array(z.object({ userId: z.string().optional(), displayName: z.string(), email: z.string().email(), avatarUrl: z.string().optional() })).optional(),
        attachments: z.array(z.any()).optional(),
        roleAssignments: z.record(z.string().nullable()).optional(),
      }).refine(data => data.endTime > data.startTime, {
        message: "End time must be after start time.",
        path: ["endTime"],
      });

    const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });
    
    // Populate form with event data on load
    React.useEffect(() => {
        if (event) {
            form.reset({
                title: event.title,
                calendarId: event.calendarId,
                priority: event.priority,
                templateId: event.templateId,
                date: event.startTime,
                startTime: format(event.startTime, 'HH:mm'),
                endTime: format(event.endTime, 'HH:mm'),
                location: event.location,
                description: event.description,
                attendees: event.attendees,
                attachments: event.attachments,
                roleAssignments: event.roleAssignments,
            });
        }
    }, [event, form]);

    // Watched form values
    const selectedCalendarId = form.watch('calendarId');
    const eventDate = form.watch('date');
    const selectedAttendees = form.watch('attendees') || [];
    const roleAssignments = form.watch('roleAssignments') || {};
    
    // Derived state
    const availableCalendars = React.useMemo(() => calendars.filter(cal => canManageEventOnCalendar(viewAsUser, cal)), [calendars, viewAsUser]);
    const teamForSelectedCalendar = React.useMemo(() => teams.find(t => t.id === selectedCalendarId), [teams, selectedCalendarId]);
    const eventTemplates = React.useMemo(() => teamForSelectedCalendar?.eventTemplates || [], [teamForSelectedCalendar]);
    const selectedTemplate = React.useMemo(() => eventTemplates.find(t => t.id === form.watch('templateId')), [eventTemplates, form]);
    const assignedRoleUserIds = new Set(Object.values(roleAssignments).filter(Boolean));
    const filteredGuests = React.useMemo(() => {
        const selectedAttendeeIds = new Set(selectedAttendees.map(att => att.userId).filter(Boolean));
        return users.filter(user => !selectedAttendeeIds.has(user.userId) && !assignedRoleUserIds.has(user.userId));
    }, [users, selectedAttendees, assignedRoleUserIds]);

    const dayKey = startOfDay(eventDate).toISOString();
    const absencesForDay = userStatusAssignments[dayKey] || [];

    // --- Handlers ---
    const handleAddAttachment = (type: AttachmentType, name: string) => {
        const currentAttachments = form.getValues('attachments') || [];
        form.setValue('attachments', [...currentAttachments, { type, name, url: '#' }]);
    };

    const handleRemoveAttachment = (index: number) => {
        const currentAttachments = form.getValues('attachments') || [];
        form.setValue('attachments', currentAttachments.filter((_, i) => i !== index));
    };

    const handleToggleGuest = (guest: User) => {
        const currentAttendees = form.getValues('attendees') || [];
        const isAttending = currentAttendees.some(att => att.email === guest.email);
        if (isAttending) {
            form.setValue('attendees', currentAttendees.filter(att => att.email !== guest.email));
        } else {
            form.setValue('attendees', [...currentAttendees, { userId: guest.userId, displayName: guest.displayName, email: guest.email, avatarUrl: guest.avatarUrl }]);
        }
    };
    
    const handleAssignUserToRole = (role: string, user: User) => {
        form.setValue(`roleAssignments.${role}`, user.userId);
    };

    const handleUnassignUserFromRole = (role: string) => {
        form.setValue(`roleAssignments.${role}`, null);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const [startHour, startMinute] = values.startTime.split(':').map(Number);
        const [endHour, endMinute] = values.endTime.split(':').map(Number);
        const startTime = new Date(values.date);
        startTime.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(values.date);
        endTime.setHours(endHour, endMinute, 0, 0);

        try {
            await updateEvent(event.eventId, {
                ...values,
                startTime,
                endTime,
            });
            toast({ title: 'Event Updated', description: `"${values.title}" has been saved.` });
            onFinished();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update the event.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between pb-4">
          <DialogTitle>Edit Event</DialogTitle>
          <div className="flex items-center">
            <Button type="button" variant="ghost" size="icon" onClick={onFinished} disabled={isLoading} aria-label="Discard changes">
              <GoogleSymbol name="close" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={isLoading} aria-label="Save changes">
              <GoogleSymbol name="check" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[60vh] -mr-4 pr-4">
        <div className="space-y-4">
          <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                  <FormItem className="w-full">
                      <FormControl>
                          <Input 
                              placeholder="Event Title" 
                              {...field} 
                              className="text-lg font-semibold h-12"
                          />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
          />

          <div className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          <GoogleSymbol name="calendar_month" className="mr-2 text-lg" />
                          {field.value ? format(field.value, 'MMM d, yyyy') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} className="w-[110px]" step="900" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} className="w-[110px]" step="900" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allBookableLocations.map(loc => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attendees"
            render={() => (
              <FormItem>
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-start gap-2">
                      <Popover open={isGuestPopoverOpen} onOpenChange={setIsGuestPopoverOpen}>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="shrink-0">
                            <GoogleSymbol name="group_add" className="text-xl" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[480px] p-0" align="start">
                          <div className="p-2">
                            <Input
                              placeholder="Search by name or email..."
                              value={guestSearch}
                              onChange={e => setGuestSearch(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <Separator />
                          <div className="max-h-60 overflow-y-auto p-1">
                            {filteredGuests.map(guest => (
                              <div
                                key={guest.userId}
                                onClick={() => handleToggleGuest(guest)}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={selectedAttendees.some(att => att.email === guest.email)}
                                  readOnly
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={guest.avatarUrl} alt={guest.displayName} data-ai-hint="user avatar" />
                                  <AvatarFallback>{guest.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{guest.displayName}</p>
                                  <p className="text-xs text-muted-foreground">{guest.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-1 items-center min-h-[40px]">
                        {selectedAttendees.length > 0 ? (
                           selectedAttendees.map(attendee => (
                            <div key={attendee.email} className="flex items-center gap-2 p-1 pr-2 bg-muted rounded-full">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={attendee.avatarUrl} alt={attendee.displayName} data-ai-hint="user avatar" />
                                <AvatarFallback>{attendee.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{attendee.displayName}</span>
                              <button type="button" onClick={() => handleToggleGuest(attendee as User)} className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center">
                                <GoogleSymbol name="cancel" className="text-sm" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Add guests...</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <GoogleSymbol name="attachment" className="text-xl" />
                        <span className="sr-only">Attach file</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onSelect={() => handleAddAttachment('local', 'design_brief.pdf')}>
                        <GoogleSymbol name="description" className="mr-2 text-lg" />
                        <span>Attach file</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleAddAttachment('drive', 'Project Assets')}>
                        <GoogleDriveIcon className="mr-2 h-4 w-4" />
                        <span>Google Drive</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <>
                {field.value && field.value.length > 0 && (
                    <div className="space-y-2">
                    {field.value.map((att: Attachment, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-2 text-sm p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {attachmentIcons[att.type]}
                            <span className="truncate">{att.name}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 shrink-0"
                            onClick={() => handleRemoveAttachment(index)}
                        >
                            <GoogleSymbol name="cancel" className="text-sm" />
                            <span className="sr-only">Remove attachment</span>
                        </Button>
                        </div>
                    ))}
                    </div>
                )}
              </>
            )}
            />
        </div>
        </ScrollArea>
      </form>
    </Form>
    );
};



// --- MAIN DIALOG COMPONENT ---
type EventDetailsDialogProps = {
  event: Event | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventDetailsDialog({ event, isOpen, onOpenChange }: EventDetailsDialogProps) {
  const { viewAsUser, calendars } = useUser();
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    // Reset editing state when dialog is closed or event changes
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);
  
  if (!event) return null;
  
  const calendar = calendars.find(c => c.id === event.calendarId);
  if (!calendar) return null; // Or show an error state

  const canManage = canManageEventOnCalendar(viewAsUser, calendar);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {isEditing && canManage ? (
            <EventEditForm event={event} onFinished={() => {
                setIsEditing(false);
                onOpenChange(false);
            }} />
        ) : (
            <EventDisplayView event={event} onEdit={() => setIsEditing(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
