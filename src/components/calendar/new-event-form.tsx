
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/user-context';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { type CalendarId, type User, type SharedCalendar, type Task } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from './priority-badge';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  calendarId: z.string().nonempty({ message: 'Please select a calendar.' }),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  location: z.string().optional(),
  description: z.string().optional(),
});

type NewEventFormProps = {
  onFinished?: () => void;
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

export function NewEventForm({ onFinished }: NewEventFormProps) {
  const { viewAsUser, calendars, addEvent } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const availableCalendars = React.useMemo(() => {
    return calendars.filter(cal => canManageEventOnCalendar(viewAsUser, cal.id));
  }, [calendars, viewAsUser]);

  const defaultCalendarId = React.useMemo(() => {
    return getDefaultCalendarId(viewAsUser, availableCalendars);
  }, [viewAsUser, availableCalendars]);

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
    },
  });

  const selectedCalendarId = form.watch('calendarId');
  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId) || availableCalendars[0];

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
        attendees: [], // Attendee selection can be added later
      });

      toast({
        title: 'Event Created',
        description: `"${values.title}" has been added to the calendar.`,
      });

      form.reset();
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                className="pl-24"
                            />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date('1900-01-01')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="flex gap-4">
                 <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
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
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g. Conference Room 1" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
        </form>
        </Form>
    </div>
  );
}
