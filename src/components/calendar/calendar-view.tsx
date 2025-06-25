"use client";

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { type Event } from '@/types';

const mockEvents: Event[] = [
    { eventId: '1', title: 'Team Sync', startTime: new Date(new Date().setDate(2)), endTime: new Date(new Date().setDate(2)), attendees: [], createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
    { eventId: '2', title: 'Design Review', startTime: new Date(new Date().setDate(15)), endTime: new Date(new Date().setDate(15)), attendees: [], createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
    { eventId: '3', title: 'Project Kickoff', startTime: new Date(new Date().setDate(15)), endTime: new Date(new Date().setDate(15)), attendees: [], createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
    { eventId: '4', title: '1-on-1 with Bob', startTime: new Date(new Date().setDate(22)), endTime: new Date(new Date().setDate(22)), attendees: [], createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
    const startingDayIndex = getDay(firstDayOfMonth);

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getEventsForDay = (day: Date) => {
        return mockEvents.filter(event => format(event.startTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex gap-2 items-center">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold font-headline w-40 text-center">{format(currentDate, 'MMMM yyyy')}</h2>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="outline" onClick={goToToday}>Today</Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b">
                    {weekdays.map(day => (
                        <div key={day} className="text-center font-medium text-muted-foreground p-2 text-sm">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 flex-1">
                    {Array.from({ length: startingDayIndex }).map((_, index) => (
                        <div key={`empty-${index}`} className="border-r border-b" />
                    ))}
                    {daysInMonth.map((day, index) => {
                        const dayEvents = getEventsForDay(day);
                        return (
                            <div key={index} className={cn("border-r border-b p-2 flex flex-col", { "bg-accent/10": isToday(day) })}>
                                <span className={cn(
                                    "font-semibold h-6 w-6 flex items-center justify-center rounded-full text-sm", 
                                    { "bg-primary text-primary-foreground": isToday(day) },
                                    { "text-muted-foreground": !isSameMonth(day, currentDate) }
                                )}>
                                    {format(day, 'd')}
                                </span>
                                <div className="mt-1 space-y-1 overflow-y-auto">
                                    {dayEvents.map(event => (
                                        <Badge key={event.eventId} variant="secondary" className="block w-full text-left truncate cursor-pointer bg-accent/50 hover:bg-accent/80">
                                            {event.title}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
