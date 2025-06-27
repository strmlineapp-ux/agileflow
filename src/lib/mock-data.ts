
import { type Event, type User, type Task, type Notification, type CalendarEventLabel, type RoleCategories } from '@/types';

export const initialRoleCategories: RoleCategories = {
    "Studio Productions": [
      'Edit Events', 'Post-Production', 'Studio Productions', 'Studio Productions Team Admin', 'Video Director'
    ],
    "Production": [
      'Production', 'Production Team Admin'
    ],
    "Live Events": [
      'TD', 'Manage Checks', 'Live Events', 'Live Events Team Admin', 'ES Operator', 'ES Daily Checks', 'Content Op', 'Camera', 'Audio', '1st AD'
    ],
    "System": [ // Not managed by teams
        'Admin',
        'Service Delivery Manager'
    ]
};

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
        roles: ['Admin', 'Live Event Team Admin', 'Live Events', 'Studio Productions', 'Video Director', 'TD', 'Edit Events', 'Manage Checks'], 
        directReports: ['2', '3'], 
        theme: 'dark', 
        defaultCalendarView: 'production-schedule' 
    },
    { 
        userId: '2', 
        displayName: 'Bob Williams', 
        email: 'bob@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Lead Engineer', 
        location: 'San Francisco, USA', 
        roles: ['Service Delivery Manager', 'Production Team Admin', 'Studio Production Team Admin', 'Live Event Team Admin', 'Production', 'Studio Productions', 'Live Events', 'Post-Production', 'Camera', 'Audio', 'Manage Checks'], 
        directReports: ['4'], 
        theme: 'light', 
        defaultCalendarView: 'week' 
    },
    { 
        userId: '3', 
        displayName: 'Charlie Brown', 
        email: 'charlie@example.com', 
        googleCalendarLinked: true, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Software Engineer', 
        location: 'Austin, USA', 
        roles: ["Production Team Admin", "Production", "Live Events", "D.o.P.", "Manage Checks"], 
        directReports: ['4'], 
        theme: 'light', 
        defaultCalendarView: 'month' 
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
        roles: ['Live Event Team Admin', 'Live Events', 'Content Op', 'ES Operator', '1st AD', 'Edit Events', 'ES Daily Checks'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'day' 
    },
    { 
        userId: '5', 
        displayName: 'Eve Adams', 
        email: 'eve@example.com', 
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Junior Developer', 
        location: 'Remote', 
        roles: ['Production', 'Camera'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'production-schedule' 
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
        roles: ['Studio Production Team Admin', 'Studio Productions', 'Audio', 'Camera', 'ES Daily Checks'], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'production-schedule' 
    },
];

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
        label: 'Event',
        startTime: new Date(new Date(today).setHours(9, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(9, 30, 0, 0)), 
        attendees: [mockUsers[0], mockUsers[1], mockUsers[2]], 
        location: 'ACR',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '2', 
        title: 'Product Demo Rehearsal', 
        label: 'Rehearsal',
        startTime: new Date(new Date(today).setHours(10, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(12, 0, 0, 0)), 
        attendees: [mockUsers[3], mockUsers[4]], 
        location: 'Event Space 1 (S2)',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '15', 
        title: 'Voice Over Recording', 
        label: 'Sound Recording',
        startTime: new Date(new Date(today).setHours(11, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(13, 0, 0, 0)), 
        attendees: [mockUsers[5]], 
        location: 'ACR',
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '3', 
        title: 'Client Photoshoot', 
        label: 'Shoot',
        startTime: new Date(new Date(today).setHours(14, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(17, 30, 0, 0)), 
        attendees: [mockUsers[2], mockUsers[5]], 
        location: 'Studio',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Tomorrow's events
    { 
        eventId: '4', 
        title: 'New Feature Test Shoot', 
        label: 'Mock Shoot',
        startTime: new Date(new Date(tomorrow).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(12, 30, 0, 0)),
        attendees: [mockUsers[1], mockUsers[4], mockUsers[5]], 
        location: 'Studio',
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '5', 
        title: 'UX Feedback Session', 
        label: 'Event',
        startTime: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(16, 30, 0, 0)),
        attendees: [mockUsers[3]], 
        location: 'Event Space 3 (R7)',
        createdBy: '3', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Yesterday's events
    { 
        eventId: '6', 
        title: 'Weekly Retrospective', 
        label: 'Event',
        startTime: new Date(new Date(yesterday).setHours(16, 0, 0, 0)),
        endTime: new Date(new Date(yesterday).setHours(17, 0, 0, 0)),
        attendees: mockUsers, 
        location: 'Event Space 4 (R7)',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '16', 
        title: 'Equipment Maintenance', 
        label: 'Event',
        startTime: new Date(new Date(yesterday).setHours(9, 0, 0, 0)),
        endTime: new Date(new Date(yesterday).setHours(11, 0, 0, 0)),
        attendees: [mockUsers[5]], 
        location: 'Studio',
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Rest of the week
    { 
        eventId: '7', 
        title: 'Town Hall', 
        label: 'Event',
        startTime: new Date(new Date(twoDaysLater).setHours(11, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysLater).setHours(12, 0, 0, 0)),
        attendees: mockUsers, 
        location: 'Auditorium',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '8', 
        title: 'Marketing Video Shoot', 
        label: 'Shoot',
        startTime: new Date(new Date(twoDaysLater).setHours(13, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysLater).setHours(18, 0, 0, 0)),
        attendees: [mockUsers[2], mockUsers[3], mockUsers[5]], 
        location: 'Event Space 2 (S2)',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '9', 
        title: 'Audio Mixing', 
        label: 'Sound Recording',
        startTime: new Date(new Date(threeDaysLater).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(threeDaysLater).setHours(17, 0, 0, 0)),
        attendees: [mockUsers[1], mockUsers[5]], 
        location: 'ACR',
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '10', 
        title: 'Performance Rehearsal', 
        label: 'Rehearsal',
        startTime: new Date(new Date(fourDaysLater).setHours(14, 0, 0, 0)),
        endTime: new Date(new Date(fourDaysLater).setHours(18, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[3]], 
        location: 'Auditorium',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
     // Last week
    { 
        eventId: '11', 
        title: 'On-location Scout', 
        label: 'Event',
        startTime: new Date(new Date(threeDaysAgo).setHours(9, 0, 0, 0)),
        endTime: new Date(new Date(threeDaysAgo).setHours(13, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[2]], 
        location: 'Off-site',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '12', 
        title: 'Green Screen Test', 
        label: 'Mock Shoot',
        startTime: new Date(new Date(fourDaysAgo).setHours(14, 0, 0, 0)),
        endTime: new Date(new Date(fourDaysAgo).setHours(16, 0, 0, 0)),
        attendees: [mockUsers[4], mockUsers[5]], 
        location: 'Studio',
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Weekend event
    { 
        eventId: '13', 
        title: 'Special Weekend Shoot', 
        label: 'Shoot',
        startTime: new Date(new Date(weekendShootDate).setHours(10, 0, 0, 0)),
        endTime: new Date(new Date(weekendShootDate).setHours(16, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[5]], 
        location: 'Studio',
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    // Event with no location
    { 
        eventId: '14', 
        title: 'Remote Planning Call', 
        label: 'Event',
        startTime: new Date(new Date(twoDaysAgo).setHours(11, 0, 0, 0)),
        endTime: new Date(new Date(twoDaysAgo).setHours(12, 0, 0, 0)),
        attendees: [mockUsers[0], mockUsers[1]], 
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
    user: { displayName: 'System', avatarUrl: 'https://placehold.co/40x40.png', userId: 'system', email: 'system', googleCalendarLinked: false },
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
