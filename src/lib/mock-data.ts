import { type Event, type User, type Task } from '@/types';

export const mockUsers: User[] = [
    { userId: '1', displayName: 'Alice Johnson', email: 'alice@example.com', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Product Manager', location: 'New York, USA', phone: '123-456-7890', skills: ['Video Director', 'TD', 'Edit Events'], permissions: ['Admin', 'Event Users', 'Events', 'Studio Productions'], directReports: ['2', '3'] },
    { userId: '2', displayName: 'Bob Williams', email: 'bob@example.com', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'Lead Engineer', location: 'San Francisco, USA', skills: ['Camera', 'Audio'], permissions: ['Service Delivery Manager', 'Production Management', 'Studio Production Users', 'Event Users', 'Production', 'Studio Productions', 'Events', 'Post-Production'], directReports: ['4'] },
    { userId: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Software Engineer', location: 'Austin, USA', skills: ["D.o.P."], permissions: ['Production Management', 'Production'], directReports: ['4'] },
    { userId: '4', displayName: 'Diana Prince', email: 'diana@example.com', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'UX Designer', location: 'Chicago, USA', phone: '098-765-4321', skills: ['Content Op', 'ES Operator', '1st AD', 'Edit Events'], permissions: ['Event Users', 'Events'], directReports: [] },
    { userId: '5', displayName: 'Eve Adams', email: 'eve@example.com', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'Junior Developer', location: 'Remote', skills: ['Camera'], permissions: ['Production'], directReports: [] },
    { userId: '6', displayName: 'Frank Miller', email: 'frank@example.com', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'Studio Technician', location: 'Los Angeles, USA', phone: '555-555-5555', skills: ['Audio', 'Camera'], permissions: ['Studio Production Users', 'Studio Productions'], directReports: [] },
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
