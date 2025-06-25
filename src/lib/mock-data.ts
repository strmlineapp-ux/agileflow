
import { type Event } from '@/types';

export const mockEvents: Event[] = [
    { 
        eventId: '1', 
        title: 'Team Sync', 
        startTime: new Date(new Date().setHours(10, 0, 0, 0)), 
        endTime: new Date(new Date().setHours(11, 0, 0, 0)), 
        attendees: [], 
        location: 'Conference Room A',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '2', 
        title: 'Design Review', 
        startTime: new Date(new Date().setHours(14, 0, 0, 0)), 
        endTime: new Date(new Date().setHours(15, 30, 0, 0)), 
        attendees: [], 
        location: 'Conference Room B',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '3', 
        title: 'Project Kickoff', 
        startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(9, 0, 0, 0)), 
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 0, 0, 0)), 
        attendees: [], 
        location: 'Conference Room A',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '4', 
        title: '1-on-1 with Bob', 
        startTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(16, 0, 0, 0)), 
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(16, 30, 0, 0)), 
        attendees: [], 
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
     { 
        eventId: '5', 
        title: 'All-hands meeting', 
        startTime: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 11, 0, 0),
        endTime: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 12, 0, 0),
        attendees: [], 
        location: 'Main Hall',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
];

const currentYear = new Date().getFullYear();
export const mockHolidays: Date[] = [
    new Date(currentYear, 0, 1), // New Year's Day
    new Date(currentYear, 6, 4), // Independence Day
    new Date(currentYear, 11, 25), // Christmas Day
];
