

import { type Event, type User, type Task, type Notification, type SharedCalendar, type BookableLocation, type Attendee, type Team } from '@/types';

export const mockCalendars: SharedCalendar[] = [
    { id: 'studio-productions', name: 'Studio Productions', color: 'hsl(48 96% 53%)' }, // Yellow
    { id: 'live-events', name: 'Live Events', color: 'hsl(210 70% 50%)' }, // Blue
    { id: 'business', name: 'Business', color: 'hsl(220 9% 46%)' }, // Grey
    { id: 'post-production', name: 'Post-Production', color: 'hsl(24 95% 53%)' }, // Orange
];

export const mockLocations: BookableLocation[] = [
    { id: 'auditorium', name: 'Auditorium' },
    { id: 'acr', name: 'ACR' },
    { id: 'event-space-1', name: 'Event Space 1 (S2)' },
    { id: 'event-space-2', name: 'Event Space 2 (S2)' },
    { id: 'event-space-3', name: 'Event Space 3 (R7)' },
    { id: 'event-space-4', name: 'Event Space 4 (R7)' },
    { id: 'studio', name: 'Studio' },
    { id: 'training-room', name: 'Training Room' },
    { id: 'locke', name: 'Locke' },
    { id: 'apgar', name: 'Apgar' },
];

export const mockUsers: User[] = [
    { 
        userId: '1', 
        displayName: 'Alice Johnson', 
        email: 'alice@example.com', 
        googleCalendarLinked: true, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Product Manager', 
        location: 'New York, USA', 
        phone: '123-456-7890', 
        roles: ['Admin', 'Service Delivery Manager', 'Video Director', 'TD', 'ES Operator'], 
        directReports: ['2', '3'], 
        theme: 'dark', 
        defaultCalendarView: 'production-schedule',
        easyBooking: true,
        timeFormat: '24h',
    },
    { 
        userId: '2', 
        displayName: 'Bob Williams', 
        email: 'bob@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Lead Engineer', 
        location: 'San Francisco, USA', 
        roles: ['Service Delivery Manager', 'Post-Production', 'Production Team Admin', 'Live Event Team Admin'], 
        directReports: ['4'], 
        theme: 'light', 
        defaultCalendarView: 'week',
        easyBooking: false,
        timeFormat: '12h',
    },
    { 
        userId: '3', 
        displayName: 'Charlie Brown', 
        email: 'charlie@example.com', 
        googleCalendarLinked: true, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Software Engineer', 
        location: 'Austin, USA', 
        roles: ['Camera', 'Audio', 'ES Daily Checks'], 
        directReports: ['4'], 
        theme: 'light', 
        defaultCalendarView: 'month',
        easyBooking: true,
        timeFormat: '12h',
    },
    { 
        userId: '4', 
        displayName: 'Diana Prince', 
        email: 'diana@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'UX Designer', 
        location: 'Chicago, USA', 
        phone: '098-765-4321', 
        roles: ['Content Op', '1st AD'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'day',
        easyBooking: false,
        timeFormat: '12h',
    },
    { 
        userId: '5', 
        displayName: 'Eve Adams', 
        email: 'eve@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Junior Developer', 
        location: 'Remote', 
        roles: ['Production Team Admin'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'production-schedule',
        easyBooking: false,
        timeFormat: '12h',
    },
    { 
        userId: '6', 
        displayName: 'Frank Miller', 
        email: 'frank@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Studio Technician', 
        location: 'Los Angeles, USA', 
        phone: '555-555-5555', 
        roles: ['Studio Productions Team Admin'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'production-schedule',
        easyBooking: true,
        timeFormat: '24h',
    },
];

export const mockTeams: Team[] = [
    {
        id: 'studio-productions',
        name: 'Studio Productions',
        icon: 'movie',
        members: ['1', '2', '6'],
        managers: ['1', '2'],
        locationCheckManagers: ['1'],
        roles: ['Post-Production', 'Studio Productions Team Admin', 'Video Director', 'Edit Events'],
        pinnedLocations: ['Studio'],
        checkLocations: ['Studio'],
    },
    {
        id: 'live-events',
        name: 'Live Events',
        icon: 'videocam',
        members: ['1', '2', '3', '4'],
        managers: ['1', '2'],
        locationCheckManagers: ['2'],
        roles: ['TD', 'ES Operator', 'ES Daily Checks', 'Content Op', 'Camera', 'Audio', '1st AD', 'Live Event Team Admin'],
        pinnedLocations: ['Auditorium', 'ACR', 'Event Space 1 (S2)', 'Event Space 2 (S2)', 'Event Space 3 (R7)', 'Event Space 4 (R7)', 'Training Room', 'Apgar', 'Locke'],
        checkLocations: ['Training Room', 'Apgar', 'Locke'],
    },
    {
        id: 'productions',
        name: 'Productions',
        icon: 'campaign',
        members: ['2', '3', '5'],
        managers: ['2'],
        locationCheckManagers: [],
        roles: ['Production Team Admin'],
        pinnedLocations: [],
        checkLocations: [],
    }
];


const userToAttendee = (user: User): Attendee => ({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
});

export const mockTasks: Task[] = [
  { taskId: '1', title: 'Design new dashboard layout', assignedTo: [mockUsers[0]], dueDate: new Date(), priority: 'P1', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '2', title: 'Develop authentication API', assignedTo: [mockUsers[1], mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), priority: 'P0', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '3', title: 'Write documentation for components', assignedTo: [mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), priority: 'P2', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '4', title: 'Fix login page CSS bug', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), priority: 'P3', status: 'completed', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '5', title: 'Setup CI/CD pipeline', assignedTo: [mockUsers[0], mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'P1', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '6', title: 'User testing for new features', assignedTo: [mockUsers[2]], dueDate: new Date(), priority: 'P2', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '7', title: 'Update project dependencies', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), priority: 'P4', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

const today = new Date();
const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
const yesterday = new Date(new Date().setDate(today.getDate() - 1));
const twoDaysLater = new Date(new Date().setDate(today.getDate() + 2));
const threeDaysLater = new Date(new Date().setDate(today.getDate() + 3));
const fourDaysLater = new Date(new Date().setDate(today.getDate() + 4));
const twoDaysAgo = new Date(new Date().setDate(today.getDate() - 2));
const threeDaysAgo = new Date(new Date().setDate(today.getDate() - 3));
const fourDaysAgo = new Date(new Date().setDate(today.getDate() - 4));

const weekendShootDate = new Date();
const dayOfWeek = weekendShootDate.getDay(); // 0 for Sunday, 6 for Saturday
const daysUntilSunday = (7 - dayOfWeek) % 7;
weekendShootDate.setDate(weekendShootDate.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));


export const mockEvents: Event[] = [
    // Today's events
    { 
        eventId: '1', 
        title: 'Morning Briefing', 
        calendarId: 'business',
        startTime: new Date(new Date(today).setHours(9, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(9, 30, 0, 0)), 
        attendees: [mockUsers[0], mockUsers[1], mockUsers[2]].map(userToAttendee), 
        location: 'ACR',
        priority: 'P2',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '2', 
        title: 'Product Demo Rehearsal', 
        calendarId: 'live-events',
        startTime: new Date(new Date(today).setHours(10, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(12, 0, 0, 0)), 
        attendees: [mockUsers[3], mockUsers[4]].map(userToAttendee), 
        location: 'Event Space 1 (S2)',
        priority: 'P1',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '15', 
        title: 'Voice Over Recording', 
        calendarId: 'post-production',
        startTime: new Date(new Date(today).setHours(11, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(13, 0, 0, 0)), 
        attendees: [mockUsers[5]].map(userToAttendee), 
        location: 'ACR',
        priority: 'P3',
        attachments: [],
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '3', 
        title: 'Client Photoshoot', 
        calendarId: 'studio-productions',
        startTime: new Date(new Date(today).setHours(14, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(17, 30, 0, 0)), 
        attendees: [mockUsers[2], mockUsers[5]].map(userToAttendee), 
        location: 'Studio',
        priority: 'P0',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Tomorrow's events
    { 
        eventId: '4', 
        title: 'New Feature Test Shoot', 
        calendarId: 'studio-productions',
        startTime: new Date(new Date(tomorrow).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(12, 30, 0, 0)),
        attendees: [mockUsers[1], mockUsers[4], mockUsers[5]].map(userToAttendee), 
        location: 'Studio',
        priority: 'P2',
        attachments: [],
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '5', 
        title: 'UX Feedback Session', 
        calendarId: 'business',
        startTime: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(16, 30, 0, 0)),
        attendees: [mockUsers[3]].map(userToAttendee), 
        location: 'Event Space 3 (R7)',
        priority: 'P3',
        attachments: [],
        createdBy: '3', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Yesterday's events
    { 
        eventId: '6', 
        title: 'Weekly Retrospective', 
        calendarId: 'business',
        startTime: new Date(new Date(yesterday).setHours(16, 0, 0, 0)),
        endTime: new Date(new Date(yesterday).setHours(17, 0, 0, 0)),
        attendees: mockUsers.map(userToAttendee), 
        location: 'Event Space 4 (R7)',
        priority: 'P4',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '16', 
        title: 'Equipment Maintenance', 
        calendarId: 'studio-productions',
        startTime: new Date(new Date(yesterday).setHours(9, 0, 0, 0)),
        endTime: new Date(new Date(yesterday).setHours(11, 0, 0, 0)),
        attendees: [mockUsers[5]].map(userToAttendee), 
        location: 'Studio',
        priority: 'P3',
        attachments: [],
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Rest of the week
    { 
        eventId: '7', 
        title: 'Town Hall', 
        calendarId: 'business',
        startTime: new Date(new Date(twoDaysLater).setHours(11, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysLater).setHours(12, 0, 0, 0)),
        attendees: mockUsers.map(userToAttendee), 
        location: 'Auditorium',
        priority: 'P2',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '8', 
        title: 'Marketing Video Shoot', 
        calendarId: 'live-events',
        startTime: new Date(new Date(twoDaysLater).setHours(13, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysLater).setHours(18, 0, 0, 0)),
        attendees: [mockUsers[2], mockUsers[3], mockUsers[5]].map(userToAttendee), 
        location: 'Event Space 2 (S2)',
        priority: 'P1',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '9', 
        title: 'Audio Mixing', 
        calendarId: 'post-production',
        startTime: new Date(new Date(threeDaysLater).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(threeDaysLater).setHours(17, 0, 0, 0)),
        attendees: [mockUsers[1], mockUsers[5]].map(userToAttendee), 
        location: 'ACR',
        priority: 'P2',
        attachments: [],
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '10', 
        title: 'Performance Rehearsal', 
        calendarId: 'live-events',
        startTime: new Date(new Date(fourDaysLater).setHours(14, 0, 0, 0)),
        endTime: new Date(new Date(fourDaysLater).setHours(18, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[3]].map(userToAttendee), 
        location: 'Auditorium',
        priority: 'P1',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
     // Last week
    { 
        eventId: '11', 
        title: 'On-location Scout', 
        calendarId: 'live-events',
        startTime: new Date(new Date(threeDaysAgo).setHours(9, 0, 0, 0)),
        endTime: new Date(new Date(threeDaysAgo).setHours(13, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[2]].map(userToAttendee), 
        location: 'Off-site',
        priority: 'P3',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '12', 
        title: 'Green Screen Test', 
        calendarId: 'studio-productions',
        startTime: new Date(new Date(fourDaysAgo).setHours(14, 0, 0, 0)),
        endTime: new Date(new Date(fourDaysAgo).setHours(16, 0, 0, 0)),
        attendees: [mockUsers[4], mockUsers[5]].map(userToAttendee), 
        location: 'Studio',
        priority: 'P3',
        attachments: [],
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Weekend event
    { 
        eventId: '13', 
        title: 'Special Weekend Shoot', 
        calendarId: 'studio-productions',
        startTime: new Date(new Date(weekendShootDate).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(weekendShootDate).setHours(16, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[5]].map(userToAttendee), 
        location: 'Studio',
        priority: 'P1',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Event with no location
    { 
        eventId: '14', 
        title: 'Remote Planning Call', 
        calendarId: 'business',
        startTime: new Date(new Date(twoDaysAgo).setHours(11, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysAgo).setHours(12, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[1]].map(userToAttendee), 
        priority: 'P3',
        attachments: [],
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'standard',
    user: mockUsers[1],
    content: 'assigned you to a new task: Develop authentication API',
    time: new Date(new Date().setHours(new Date().getHours() - 1)),
    read: false,
  },
  {
    id: '2',
    type: 'standard',
    user: mockUsers[0],
    content: 'mentioned you in a comment on Project Kickoff',
    time: new Date(new Date().setDate(new Date().getDate() - 1)),
    read: false,
  },
  {
    id: '3',
    type: 'standard',
    user: mockUsers[2],
    content: 'completed the task: Fix login page CSS bug',
    time: new Date(new Date().setDate(new Date().getDate() - 2)),
    read: true,
  },
  {
    id: '4',
    type: 'standard',
    user: { displayName: 'System', avatarUrl: 'https://placehold.co/40x40.png', userId: 'system', email: 'system', googleCalendarLinked: false, easyBooking: false },
    content: 'New features are now available in the Calendar view.',
    time: new Date(new Date().setDate(new Date().getDate() - 3)),
    read: true,
  }
];


const currentYear = new Date().getFullYear();
export const mockHolidays: Date[] = [
    new Date(currentYear, 0, 1), // New Year's Day
    new Date(currentYear, 6, 4), // Independence Day
    new Date(currentYear, 11, 25), // Christmas Day
];
