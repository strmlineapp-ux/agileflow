

import { type Event, type User, type Task, type Notification, type SharedCalendar, type BookableLocation, type Attendee, type Team, type AppSettings, type Badge, type BadgeCollection, type AppTab, type AppPage, type BadgeCollectionOwner } from '@/types';
import { corePages, coreTabs, globalBadges } from './core-data';

// This file now contains only the data that an administrator would dynamically
// create and manage, such as new pages or teams. The core, stable application
// structure is defined in `core-data.ts`.

const dynamicPages: AppPage[] = [
    // Example of a dynamic page that an admin could create.
    {
        id: 'page-team-management',
        name: 'Team Management',
        icon: 'group_work',
        color: '#EC4899',
        path: '/dashboard/teams',
        isDynamic: true,
        associatedTabs: ['tab-team-members', 'tab-badges', 'tab-locations', 'tab-workstations', 'tab-templates'],
        access: {
            users: [],
            teams: ['video-production', 'live-events', 'production'], // This page is visible only to members of these teams.
        }
    },
];

export const mockAppSettings: AppSettings = {
  pages: [...dynamicPages],
  tabs: [], // Core tabs are now in core-data.ts
  globalBadges: globalBadges,
};

export const mockUsers: User[] = [
    { userId: '1', displayName: 'Bernardo Resende', email: 'bernardo.resende@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Production Lead', roles: ['Video Director', 'Director of Photography'], theme: 'dark', defaultCalendarView: 'production-schedule', primaryColor: '#D8620E', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '2', displayName: 'Daniel Lazard', email: 'dlazard@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Manager', roles: [], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '3', displayName: 'May-Kate Woods', email: 'maykate@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['ES Operator', 'TD'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '4', displayName: 'Zoey Roberts', email: 'zoeyr@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: ['1st AD'], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '5', displayName: 'Bilal Merhi', email: 'merhi@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Video Editor', roles: ['Editor', 'Motion Graphics'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '6', displayName: 'Sam Walker', email: 'samwalker@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Creative Producer', roles: ['Creative Producer', 'Script'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '7', displayName: 'Ashley Mulla', email: 'ashleymulla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Editor', roles: ['Editor', 'Camera Op.'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '8', displayName: 'Perry Rogantin', email: 'rogantin@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Audio)', roles: ['Audio Engineer', 'Audio Mix'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '9', displayName: 'Robby Atilla', email: 'robbyatilla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'TD Vision Specialist', roles: ['TD', 'Camera Op.'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '10', displayName: 'Robert Messere', email: 'messere@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Content Op', '1st AD'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '11', displayName: 'Reno Adriaanse', email: 'renoa@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Visual)', roles: ['Camera Op.', 'D.o.P.'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '12', displayName: 'Danny Smartt', email: 'dsmartt@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Events Editor'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '13', displayName: 'Maciej Chamulak', email: 'chamulak@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician', roles: ['Camera Op.'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '14', displayName: 'Milan Chohan', email: 'mchohan@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Audio Engineer'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '15', displayName: 'Molly Rose', email: 'mollyrose@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: [], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '16', displayName: 'Chandra Patel', email: 'chandra.patel@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'System Administrator', roles: [], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
    { userId: '17', displayName: 'John Doe', email: 'john.doe@google.com', isAdmin: false, accountType: 'Viewer', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'New Hire', roles: [], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [] },
];

export const mockCalendars: SharedCalendar[] = [
    { id: 'production', name: 'Production', icon: 'campaign', color: '#22C55E', owner: { type: 'user', id: '4' }, defaultEventTitle: 'New Production Meeting' },
    { id: 'video-production', name: 'Video Production', icon: 'movie', color: '#FBBF24', owner: { type: 'user', id: '1' }, defaultEventTitle: 'New Video Shoot' },
    { id: 'live-events', name: 'Live Events', icon: 'videocam', color: '#3B82F6', owner: { type: 'user', id: '3' }, googleCalendarId: 'live-events-calendar@google.com', isShared: true, defaultEventTitle: 'New Live Event' },
    { id: 'dreamtek', name: 'Dreamtek', icon: 'business_center', color: '#8B5CF6', owner: { type: 'user', id: '2' }, defaultEventTitle: 'New Dreamtek Event' },
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

// --- Badge Definitions ---

// Video Production Owned Badges
const videoProdCollectionId = 'video-prod-collection';
export const videoProdBadges: Badge[] = [
    { id: 'badge-director', ownerCollectionId: videoProdCollectionId, name: 'Video Director', icon: 'videocam', color: '#FCD34D', description: 'Oversees the creative and technical aspects of a video shoot.' },
    { id: 'badge-dop', ownerCollectionId: videoProdCollectionId, name: 'D.o.P.', icon: 'camera', color: '#FBBF24', description: 'Director of Photography' },
    { id: 'badge-editor', ownerCollectionId: videoProdCollectionId, name: 'Editor', icon: 'edit_note', color: '#F59E0B' },
    { id: 'badge-motion', ownerCollectionId: videoProdCollectionId, name: 'Motion Graphics', icon: 'animation', color: '#D97706' },
    { id: 'badge-creative-producer', ownerCollectionId: videoProdCollectionId, name: 'Creative Producer', icon: 'person', color: '#FEF08A' },
    { id: 'badge-script', ownerCollectionId: videoProdCollectionId, name: 'Script', icon: 'description', color: '#FDE68A' },
    { id: 'badge-gaffer', ownerCollectionId: videoProdCollectionId, name: 'Gaffer', icon: 'lightbulb', color: '#B45309' },
];

// Live Events Owned Badges
const liveEventsCollectionId = 'event-roles-collection';
export const liveEventsBadges: Badge[] = [
    { id: 'badge-td', ownerCollectionId: liveEventsCollectionId, name: 'TD', icon: 'engineering', color: '#60A5FA', description: 'Technical Director for live events.' },
    { id: 'badge-1stad', ownerCollectionId: liveEventsCollectionId, name: '1st AD', icon: 'group', color: '#3B82F6' },
    { id: 'badge-cameraop', ownerCollectionId: liveEventsCollectionId, name: 'Camera Op.', icon: 'photo_camera', color: '#2563EB', description: 'Camera Operator' },
    { id: 'badge-audioeng', ownerCollectionId: liveEventsCollectionId, name: 'Audio Engineer', icon: 'mic', color: '#93C5FD' },
    { id: 'badge-audiomix', ownerCollectionId: liveEventsCollectionId, name: 'Audio Mix', icon: 'equalizer', color: '#BFDBFE' },
    { id: 'badge-contentop', ownerCollectionId: liveEventsCollectionId, name: 'Content Op', icon: 'article', color: '#1D4ED8' },
    { id: 'badge-esop', ownerCollectionId: liveEventsCollectionId, name: 'ES Operator', icon: 'slideshow', color: '#3B82F6' },
    { id: 'badge-eventeditor', ownerCollectionId: liveEventsCollectionId, name: 'Events Editor', icon: 'local_movies', color: '#60A5FA' },
];


export const mockTeams: Team[] = [
    {
        id: 'video-production',
        name: 'Video Production',
        icon: 'movie',
        color: '#FBBF24',
        owner: { type: 'user', id: '1' },
        isShared: false,
        members: ['1', '5', '6', '7'],
        teamAdmins: ['1'],
        teamAdminsLabel: 'Prod Team Leads',
        membersLabel: 'Prod Team Members',
        locationCheckManagers: ['1'],
        pinnedLocations: ['Studio', 'ACR'],
        checkLocations: ['Studio'],
        workstations: ['EDIT 1', 'EDIT 2', 'Pro Tools Machine'],
        eventTemplates: [
            { id: 'template-1', name: 'Basic Studio Shoot', icon: 'theaters', requestedRoles: ['Video Director', 'Camera Op.', 'Audio Engineer'] },
            { id: 'template-2', name: 'Voice Over Record', icon: 'record_voice_over', requestedRoles: ['Editor', 'Audio Mix'] }
        ],
        activeBadgeCollections: [videoProdCollectionId]
    },
    {
        id: 'live-events',
        name: 'Live Events',
        icon: 'videocam',
        color: '#3B82F6',
        owner: { type: 'user', id: '3' },
        isShared: false,
        members: ['3', '8', '9', '10', '11', '12', '13', '14'],
        teamAdmins: [],
        locationCheckManagers: ['3'],
        pinnedLocations: ['Auditorium', 'ACR', 'Event Space 1 (S2)', 'Event Space 2 (S2)'],
        checkLocations: ['Auditorium'],
        eventTemplates: [
            { id: 'template-3', name: 'Standard Live Event', icon: 'podcasts', requestedRoles: ['TD', 'ES Operator', 'Camera Op.', 'Audio Engineer'] },
            { id: 'template-4', name: 'Auditorium Presentation', icon: 'slideshow', requestedRoles: ['TD', 'Content Op'] }
        ],
    },
    {
        id: 'production',
        name: 'Production',
        icon: 'campaign',
        color: '#22C55E',
        owner: { type: 'user', id: '4' },
        isShared: false,
        members: ['4', '15'],
        teamAdmins: [],
        locationCheckManagers: ['4'],
    },
    {
        id: 'service-delivery',
        name: 'Service Delivery',
        icon: 'business_center',
        color: '#8B5CF6',
        owner: { type: 'user', id: '2' },
        isShared: false,
        members: ['2'],
        teamAdmins: ['2'],
        locationCheckManagers: [],
    }
];


const userToAttendee = (user: User): Attendee => ({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
});

export const mockTasks: Task[] = [
  { taskId: '1', title: 'Design new dashboard layout', assignedTo: [mockUsers[0]], dueDate: new Date(), priority: 'task-high', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '2', title: 'Develop authentication API', assignedTo: [mockUsers[1], mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), priority: 'task-high', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '3', title: 'Write documentation for components', assignedTo: [mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), priority: 'task-medium', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '4', title: 'Fix login page CSS bug', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), priority: 'task-low', status: 'completed', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '5', title: 'Setup CI/CD pipeline', assignedTo: [mockUsers[0], mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'task-high', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

const today = new Date();
const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
const yesterday = new Date(new Date().setDate(today.getDate() - 1));

export const mockEvents: Event[] = [
    { 
        eventId: '1', 
        title: 'Morning Briefing', 
        calendarId: 'dreamtek',
        startTime: new Date(new Date(today).setHours(9, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(9, 30, 0, 0)), 
        attendees: [mockUsers[0], mockUsers[1], mockUsers[2]].map(userToAttendee), 
        location: 'ACR',
        priority: 'p2',
        attachments: [],
        roleAssignments: {},
        createdBy: '2', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '2', 
        title: 'Product Demo Rehearsal', 
        calendarId: 'live-events',
        startTime: new Date(new Date(today).setHours(10, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(12, 0, 0, 0)), 
        attendees: [], 
        location: 'Event Space 1 (S2)',
        priority: 'p1',
        templateId: 'template-4',
        roleAssignments: { 'TD': '9', 'Content Op': '10' },
        createdBy: '3', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '3', 
        title: 'Client Photoshoot', 
        calendarId: 'video-production',
        startTime: new Date(new Date(today).setHours(14, 0, 0, 0)), 
        endTime: new Date(new Date(today).setHours(17, 30, 0, 0)), 
        attendees: [mockUsers[5], mockUsers[6]].map(userToAttendee), 
        location: 'Studio',
        priority: 'p0',
        attachments: [],
        templateId: 'template-1',
        roleAssignments: { 'Video Director': '1', 'Camera Op.': '11', 'Audio Engineer': '8' },
        createdBy: '1', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '5', 
        title: 'UX Feedback Session', 
        calendarId: 'production',
        startTime: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)),
        endTime: new Date(new Date(tomorrow).setHours(16, 30, 0, 0)),
        attendees: [mockUsers[3]].map(userToAttendee), 
        location: 'Event Space 3 (R7)',
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
        createdBy: '4', 
        createdAt: new Date(), 
        lastUpdated: new Date() 
    },
    { 
        eventId: '6', 
        title: 'Weekly Retrospective', 
        calendarId: 'dreamtek',
        startTime: new Date(new Date(yesterday).setHours(16, 0, 0, 0)),
        endTime: new Date(new Date(yesterday).setHours(17, 0, 0, 0)),
        attendees: mockUsers.map(userToAttendee), 
        location: 'Event Space 4 (R7)',
        priority: 'p4',
        attachments: [],
        roleAssignments: {},
        createdBy: '2', 
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
