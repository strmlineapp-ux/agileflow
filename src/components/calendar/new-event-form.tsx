
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Paperclip, File as FileIcon, Video, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/user-context';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { type CalendarId, type User, type SharedCalendar, type Task, type Attachment, type AttachmentType } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriorityBadge } from './priority-badge';

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
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#7e57c2"></path><path d="M10,11H6v-1h4V11z M11,8H6V7h5V8z M8,5H6v1h2V5z" fill="#ffffff"></path></svg>
);

const attachmentIcons: Record<AttachmentType, React.ReactNode> = {
  drive: <GoogleDriveIcon className="h-4 w-4" />,
  docs: <GoogleDocsIcon className="h-4 w-4" />,
  sheets: <GoogleSheetsIcon className="h-4 w-4" />,
  slides: <GoogleSlidesIcon className="h-4 w-4" />,
  forms: <GoogleFormsIcon className="h-4 w-4" />,
  meet: <Video className="h-4 w-4" />,
  local: <FileIcon className="h-4 w-4" />,
};

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  calendarId: z.string().nonempty({ message: 'Please select a calendar.' }),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  location: z.string().optional(),
  description: z.string().optional(),
  attachments: z.array(z.any()).optional(),
});

type NewEventFormProps = {
  onFinished?: () => void;
  initialData?: { date: Date; startTime: string; endTime: string; } | null;
};

const getDefaultCalendarId = (user: User, availableCalendars: SharedCalendar[]): CalendarId => {
    const roles = new Set(user.roles || []);

    if (roles.has('Service Delivery Manager')) return 'business';
    if (roles.has('Live Events')) return 'live-events';
    if (roles.has('Production')) return 'live-events';
    if (roles.has('Studio Productions')) return 'studio-productions';
    if (roles.has('Post-Production') && !roles.has('Studio Productions') && !roles.has('Live Events')) {
        return 'post-production';
    }
    if (roles.has('Admin')) return 'business';
    
    if (availableCalendars.length > 0) {
        return availableCalendars[0].id;
    }

    return 'business';
};

const titlePlaceholders: Record<CalendarId, string> = {
  'business': 'New Event',
  'live-events': 'New Live Event',
  'studio-productions': 'New Production Studios Event',
  'post-production': 'New EDIT Machine Book',
};

const priorities: Task['priority'][] = ['P0', 'P1', 'P2', 'P3', 'P4'];

export function NewEventForm({ onFinished, initialData }: NewEventFormProps) {
  const { viewAsUser, calendars, addEvent, locations } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

  const availableCalendars = React.useMemo(() => {
    return calendars.filter(cal => canManageEventOnCalendar(viewAsUser, cal.id));
  }, [calendars, viewAsUser]);

  const defaultCalendarId = React.useMemo(() => {
    return getDefaultCalendarId(viewAsUser, availableCalendars);
  }, [viewAsUser, availableCalendars]);

  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      calendarId: defaultCalendarId,
      priority: 'P3',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
      attachments: [],
    },
  });

  React.useEffect(() => {
    if (initialData) {
        form.reset({
            calendarId: defaultCalendarId,
            priority: 'P3',
            title: '',
            location: '',
            description: '',
            attachments: [],
            date: initialData.date,
            startTime: initialData.startTime,
            endTime: initialData.endTime,
        });
    }
  }, [initialData, form, defaultCalendarId]);

  const selectedCalendarId = form.watch('calendarId');
  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId) || availableCalendars[0];
  
  const handleAddAttachment = (type: AttachmentType, name: string) => {
    setAttachments(prev => [...prev, { type, name, url: '#' }]);
    toast({
        title: 'Attachment Added',
        description: `${name} has been attached to the event.`,
    });
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
        attendees: [], // Attendee selection can be added later
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

  return (
    <div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                         <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 h-full">
                                {availableCalendars.length > 1 ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex items-center justify-center h-5 w-5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                style={{ backgroundColor: selectedCalendar.color }}
                                                aria-label="Select calendar"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {availableCalendars.map(cal => (
                                                <DropdownMenuItem
                                                    key={cal.id}
                                                    onSelect={() => form.setValue('calendarId', cal.id, { shouldValidate: true })}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full border"
                                                            style={{ backgroundColor: cal.color }}
                                                        />
                                                        <span>{cal.name}</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div
                                        className="h-5 w-5 rounded-full border"
                                        style={{ backgroundColor: selectedCalendar.color }}
                                        aria-label={`Calendar: ${selectedCalendar.name}`}
                                    />
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button type="button">
                                            <PriorityBadge priority={form.watch('priority')} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {priorities.map(p => (
                                            <DropdownMenuItem key={p} onSelect={() => form.setValue('priority', p, { shouldValidate: true })}>
                                                <PriorityBadge priority={p} />
                                                <span className="ml-2 text-sm text-muted-foreground w-20">
                                                {{ P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low', P4: 'Lowest' }[p]}
                                                </span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <FormControl>
                            <Input 
                                placeholder={titlePlaceholders[selectedCalendarId as CalendarId] || 'e.g. Team Standup'} 
                                {...field} 
                                className="pl-20"
                            />
                            </FormControl>
                        </div>
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
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, 'MMM d, yyyy') : <span>Pick a date</span>}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
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
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timeOptions.map(time => <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timeOptions.map(time => <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
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
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">Attach file</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onSelect={() => handleAddAttachment('local', 'design_brief.pdf')}>
                                        <FileIcon className="mr-2 h-4 w-4" />
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
                                        <Video className="mr-2 h-4 w-4" />
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
                                className="h-6 w-6 shrink-0" 
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove attachment</span>
                            </Button>
                        </div>
                    ))}
                </div>
            )}


            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
        </form>
        </Form>
    </div>
  );
}
