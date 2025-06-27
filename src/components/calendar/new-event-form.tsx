
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/user-context';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { type CalendarId } from '@/types';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  calendarId: z.string().nonempty({ message: 'Please select a calendar.' }),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format (HH:mm).' }),
  location: z.string().optional(),
  description: z.string().optional(),
});

type NewEventFormProps = {
  onFinished?: () => void;
};

export function NewEventForm({ onFinished }: NewEventFormProps) {
  const { viewAsUser, calendars, addEvent } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const availableCalendars = React.useMemo(() => {
    return calendars.filter(cal => canManageEventOnCalendar(viewAsUser, cal.id));
  }, [calendars, viewAsUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      calendarId: availableCalendars.length > 0 ? availableCalendars[0].id : '',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
    },
  });

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
        <h4 className="font-medium text-lg mb-4">Create New Event</h4>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input placeholder="e.g. Team Standup" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="calendarId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Calendar</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a calendar" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableCalendars.map(cal => (
                                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
