

'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, startOfDay } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/user-context';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { type CalendarId, type User, type SharedCalendar, type Attachment, type AttachmentType, type Attendee, type EventTemplate } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriorityBadge } from './priority-badge';
import { Separator } from '@/components/ui/separator';
import { GoogleSymbol } from '../icons/google-symbol';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { UserStatusBadge } from '../user-status-badge';

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
  drive: <GoogleDriveIcon className="h-4 w-4" />,
  docs: <GoogleDocsIcon className="h-4 w-4" />,
  sheets: <GoogleSheetsIcon className="h-4 w-4" />,
  slides: <GoogleSlidesIcon className="h-4 w-4" />,
  forms: <GoogleFormsIcon className="h-4 w-4" />,
  meet: <GoogleSymbol name="videocam" className="text-lg" />,
  local: <GoogleSymbol name="description" className="text-lg" />,
};

const AttendeeSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
});

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
  attachments: z.array(z.any()).optional(),
  attendees: z.array(AttendeeSchema).optional(),
});

type NewEventFormProps = {
  onFinished?: () => void;
  initialData?: { date: Date; startTime: string; endTime: string; } | null;
};

const getDefaultCalendarId = (user: User, availableCalendars: SharedCalendar[]): CalendarId | undefined => {
    if (availableCalendars.length === 0) return undefined;
    
    // Find the first calendar the user is a manager of
    const managedCalendar = availableCalendars.find(cal => cal.managers?.includes(user.userId));
    if (managedCalendar) return managedCalendar.id;
    
    // If Admin/SDM, they can manage all, so pick the first one
    if (user.roles?.includes('Admin') || user.roles?.includes('Service Delivery Manager')) {
        return availableCalendars[0].id;
    }

    return undefined;
};

export function NewEventForm({ onFinished, initialData }: NewEventFormProps) {
  const { viewAsUser, users, calendars, teams, addEvent, allBookableLocations, getEventStrategy, userStatusAssignments } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [guestSearch, setGuestSearch] = React.useState('');
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = React.useState(false);

  const [isCalendarPopoverOpen, setIsCalendarPopoverOpen] = React.useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = React.useState(false);
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = React.useState(false);

  const [roleAssignments, setRoleAssignments] = React.useState<Record<string, { assignedUser: string | null; popoverOpen: boolean }>>({});

  const availableCalendars = React.useMemo(() => {
    return calendars.filter(cal => canManageEventOnCalendar(viewAsUser, cal));
  }, [calendars, viewAsUser]);
  
  const eventStrategy = React.useMemo(() => getEventStrategy(), [getEventStrategy]);

  const defaultCalendarId = React.useMemo(() => {
    return getDefaultCalendarId(viewAsUser, availableCalendars);
  }, [viewAsUser, availableCalendars]);

  const getDefaultPriority = () => {
    if (!eventStrategy) return '';
    if (eventStrategy.type === 'tier') {
      return eventStrategy.priorities[0]?.id || '';
    }
    if (eventStrategy.type === 'symbol') {
      return `${eventStrategy.id}:${Math.floor(eventStrategy.max / 2)}`;
    }
    if (eventStrategy.type === 'scale') {
      return `${eventStrategy.id}:${Math.floor((eventStrategy.max - eventStrategy.min) / 2)}`;
    }
    return '';
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      calendarId: defaultCalendarId || '',
      priority: getDefaultPriority(),
      templateId: '',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
      attachments: [],
      attendees: [],
    },
  });
  
  const selectedCalendarId = form.watch('calendarId');
  const selectedTemplateId = form.watch('templateId');
  const eventDate = form.watch('date');

  const teamForSelectedCalendar = React.useMemo(() => {
    return teams.find(t => t.id === selectedCalendarId);
  }, [teams, selectedCalendarId]);

  const eventTemplates = React.useMemo(() => {
    return teamForSelectedCalendar?.eventTemplates || [];
  }, [teamForSelectedCalendar]);
  
  const selectedTemplate = React.useMemo(() => {
    return eventTemplates.find(t => t.id === selectedTemplateId);
  }, [eventTemplates, selectedTemplateId]);

  React.useEffect(() => {
    if (selectedTemplate) {
      const initialAssignments = selectedTemplate.requestedRoles.reduce((acc, role) => {
        acc[role] = { assignedUser: null, popoverOpen: false };
        return acc;
      }, {} as typeof roleAssignments);
      setRoleAssignments(initialAssignments);
    } else {
      setRoleAssignments({});
    }
  }, [selectedTemplate]);

  const handleTemplateChange = (templateId: string) => {
    form.setValue('templateId', templateId);
    setIsTemplatePopoverOpen(false);
  };

  const selectedAttendees = form.watch('attendees') || [];
  
  const filteredGuests = React.useMemo(() => {
    if (!guestSearch) return users;
    return users.filter(user => 
        user.displayName.toLowerCase().includes(guestSearch.toLowerCase()) || 
        user.email.toLowerCase().includes(guestSearch.toLowerCase())
    );
  }, [users, guestSearch]);


  React.useEffect(() => {
    if (initialData) {
        form.reset({
            calendarId: defaultCalendarId,
            priority: getDefaultPriority(),
            title: '',
            location: '',
            description: '',
            attachments: [],
            attendees: [],
            templateId: '',
            date: initialData.date,
            startTime: initialData.startTime,
            endTime: initialData.endTime,
        });
    }
  }, [initialData, form, defaultCalendarId, eventStrategy]);

  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId) || availableCalendars[0];
  
  const handleAddAttachment = (type: AttachmentType, name: string) => {
    setAttachments(prev => [...prev, { type, name, url: '#' }]);
    toast({
        title: 'Attachment Added',
        description: `${name} has been attached to the event.`,
    });
  };

  const handleToggleGuest = (guest: User) => {
    const currentAttendees = form.getValues('attendees') || [];
    const isAttending = currentAttendees.some(att => att.email === guest.email);

    if (isAttending) {
        form.setValue('attendees', currentAttendees.filter(att => att.email !== guest.email));
    } else {
        const newAttendee: Attendee = {
            userId: guest.userId,
            displayName: guest.displayName,
            email: guest.email,
            avatarUrl: guest.avatarUrl,
        };
        form.setValue('attendees', [...currentAttendees, newAttendee]);
    }
  };

  const handleAssignUserToRole = (role: string, user: User) => {
    setRoleAssignments(prev => ({ ...prev, [role]: { assignedUser: user.userId, popoverOpen: false }}));
    // Also add to guest list if not already there
    const currentAttendees = form.getValues('attendees') || [];
    if (!currentAttendees.some(att => att.userId === user.userId)) {
        handleToggleGuest(user);
    }
  };

  const handleUnassignUserFromRole = (role: string) => {
    setRoleAssignments(prev => ({ ...prev, [role]: { assignedUser: null, popoverOpen: false }}));
  };

  const toggleRolePopover = (role: string) => {
    setRoleAssignments(prev => ({
        ...prev,
        [role]: { ...prev[role], popoverOpen: !prev[role].popoverOpen }
    }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const [startHour, startMinute] = values.startTime.split(':').map(Number);
    const [endHour, endMinute] = values.endTime.split(':').map(Number);

    const startTime = new Date(values.date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(values.date);
    endTime.setHours(endHour, endMinute, 0, 0);

    if (endTime <= startTime) {
      form.setError('endTime', { message: 'End time must be after start time.' });
      setIsLoading(false);
      return;
    }

    try {
      await addEvent({
        title: values.title,
        calendarId: values.calendarId as CalendarId,
        startTime,
        endTime,
        location: values.location,
        description: values.description,
        priority: values.priority,
        attachments: attachments,
        attendees: values.attendees || [],
        templateId: values.templateId,
      });

      toast({
        title: 'Event Created',
        description: `"${values.title}" has been added to the calendar.`,
      });

      form.reset();
      setAttachments([]);
      onFinished?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create the event.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const dayKey = startOfDay(eventDate).toISOString();
  const absencesForDay = userStatusAssignments[dayKey] || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            {availableCalendars.length > 1 && (
              <FormField
                control={form.control}
                name="calendarId"
                render={({ field }) => (
                  <FormItem>
                    <Popover open={isCalendarPopoverOpen} onOpenChange={setIsCalendarPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0.5 rounded-full" aria-label="Select calendar">
                           <div className="h-4 w-4 rounded-full shrink-0 border" style={{ backgroundColor: selectedCalendar?.color }} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1" align="start">
                        {availableCalendars.map(cal => (
                          <div key={cal.id} 
                              onClick={() => {
                                  field.onChange(cal.id);
                                  form.setValue('templateId', ''); // Reset template on calendar change
                                  setIsCalendarPopoverOpen(false);
                              }}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                          >
                            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: cal.color }} />
                            <span>{cal.name}</span>
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {eventStrategy && (
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" className="h-auto p-0">
                          <PriorityBadge priorityId={field.value} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-1 w-auto" align="start">
                        {eventStrategy.type === 'tier' &&
                          eventStrategy.priorities.map(p => (
                            <div key={p.id}
                              onClick={() => { field.onChange(p.id); setIsPriorityPopoverOpen(false); }}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                              <PriorityBadge priorityId={p.id} />
                              <span className="font-semibold">{p.label}</span>
                            </div>
                          ))}
                        {eventStrategy.type === 'symbol' &&
                          Array.from({ length: eventStrategy.max }, (_, i) => eventStrategy.max - i).map(num => (
                            <div key={num}
                              onClick={() => { field.onChange(`${eventStrategy.id}:${num}`); setIsPriorityPopoverOpen(false); }}
                              className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                              <div className="flex items-center" style={{ color: eventStrategy.color }}>
                                {Array.from({ length: num }).map((_, i) => (
                                  <GoogleSymbol key={i} name={eventStrategy.icon} className="text-base" />
                                ))}
                              </div>
                            </div>
                          ))}
                        {eventStrategy.type === 'scale' && (
                          <div className="p-4 w-48">
                            <Slider
                              defaultValue={[Number(field.value.split(':')[1] || 0)]}
                              min={eventStrategy.min}
                              max={eventStrategy.max}
                              step={1}
                              onValueChange={val => field.onChange(`${eventStrategy.id}:${val[0]}`)}
                              className="flex-1"
                            />
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {eventTemplates.length > 0 && (
                <FormField
                    control={form.control}
                    name="templateId"
                    render={() => (
                        <FormItem>
                             <Popover open={isTemplatePopoverOpen} onOpenChange={setIsTemplatePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-auto p-0">
                                        <Badge variant={selectedTemplate ? 'default' : 'secondary'}>{selectedTemplate?.name || 'Tag'}</Badge>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-1 w-auto" align="start">
                                    <div
                                        onClick={() => handleTemplateChange('')}
                                        className="p-2 rounded-md hover:bg-accent cursor-pointer"
                                    >
                                        <span className="text-sm text-muted-foreground italic">No Template</span>
                                    </div>
                                    {eventTemplates.map(template => (
                                        <div key={template.id}
                                            onClick={() => handleTemplateChange(template.id)}
                                            className="p-2 rounded-md hover:bg-accent cursor-pointer"
                                        >
                                            <Badge>{template.name}</Badge>
                                        </div>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        </FormItem>
                    )}
                />
            )}

          </div>

          <div className="flex items-center">
            <Button type="button" variant="ghost" size="icon" onClick={onFinished} disabled={isLoading} aria-label="Discard event">
              <GoogleSymbol name="delete" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={isLoading} aria-label="Create event">
              <GoogleSymbol name="check" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                  <FormItem className="w-full">
                      <FormControl>
                          <Input 
                              placeholder={selectedCalendar?.defaultEventTitle || 'e.g. Team Standup'} 
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="space-y-2">
                  {selectedAttendees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAttendees.map(attendee => (
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
                      ))}
                    </div>
                  )}
                  <Popover open={isGuestPopoverOpen} onOpenChange={setIsGuestPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        <GoogleSymbol name="group" className="mr-2 text-xl" />
                        Add guests
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
                </div>
              </FormItem>
            )}
          />

            {selectedTemplate && (
                <Card>
                    <CardContent className="p-2">
                        <p className="text-sm text-muted-foreground mb-2 px-1">Requested Roles</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(roleAssignments).map(([role, { assignedUser, popoverOpen }]) => {
                                const user = assignedUser ? users.find(u => u.userId === assignedUser) : null;
                                const usersWithRole = users.filter(u => u.roles?.includes(role));
                                
                                const availableUsers = usersWithRole.filter(u => !absencesForDay.some(a => a.userId === u.userId));
                                const absentUsers = usersWithRole
                                    .filter(u => absencesForDay.some(a => a.userId === u.userId))
                                    .map(u => ({ ...u, absence: absencesForDay.find(a => a.userId === u.userId)!.status }));

                                return (
                                    <Popover key={role} open={popoverOpen} onOpenChange={() => toggleRolePopover(role)}>
                                        <PopoverTrigger asChild>
                                             <Badge variant={user ? "default" : "secondary"} className="text-sm p-1 pl-3 rounded-full cursor-pointer">
                                                {role}
                                                {user && <span className="font-normal mx-2 text-primary-foreground/80">/</span>}
                                                {user && <span className="font-semibold">{user.displayName}</span>}
                                                {user && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleUnassignUserFromRole(role); }} className="ml-1 h-4 w-4 rounded-full hover:bg-black/20 flex items-center justify-center">
                                                        <GoogleSymbol name="close" className="text-xs" />
                                                    </button>
                                                )}
                                            </Badge>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                             <ScrollArea className="max-h-60">
                                                <div className="p-1">
                                                {availableUsers.map(u => (
                                                    <div key={u.userId} onClick={() => handleAssignUserToRole(role, u)} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={u.avatarUrl} alt={u.displayName} data-ai-hint="user avatar" /><AvatarFallback>{u.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                        <p className="font-medium text-sm">{u.displayName}</p>
                                                    </div>
                                                ))}
                                                {absentUsers.length > 0 && availableUsers.length > 0 && <Separator className="my-1" />}
                                                {absentUsers.map(u => (
                                                    <div key={u.userId} className="flex items-center justify-between gap-2 p-2 rounded-md opacity-50 cursor-not-allowed">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8"><AvatarImage src={u.avatarUrl} alt={u.displayName} data-ai-hint="user avatar" /><AvatarFallback>{u.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                            <p className="font-medium text-sm">{u.displayName}</p>
                                                        </div>
                                                        <UserStatusBadge status={u.absence}>{u.absence}</UserStatusBadge>
                                                    </div>
                                                ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}


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
                      <DropdownMenuItem onSelect={() => handleAddAttachment('docs', 'Meeting Notes')}>
                        <GoogleDocsIcon className="mr-2 h-4 w-4" />
                        <span>Google Docs</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAddAttachment('sheets', 'Budget Tracker')}>
                        <GoogleSheetsIcon className="mr-2 h-4 w-4" />
                        <span>Google Sheets</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAddAttachment('slides', 'Presentation Deck')}>
                        <GoogleSlidesIcon className="mr-2 h-4 w-4" />
                        <span>Google Slides</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAddAttachment('forms', 'Feedback Form')}>
                        <GoogleFormsIcon className="mr-2 h-4 w-4" />
                        <span>Google Forms</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleAddAttachment('meet', 'Google Meet')}>
                        <GoogleSymbol name="videocam" className="mr-2 text-lg" />
                        <span>Add Google Meet</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((att, index) => (
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
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  >
                    <GoogleSymbol name="cancel" className="text-sm" />
                    <span className="sr-only">Remove attachment</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
