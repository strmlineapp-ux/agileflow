
import { type Event, type User, type Task, type Notification, type SharedCalendar, type BookableLocation, type Attendee, type Team, type AppSettings, type Badge, type BadgeCollection, type AppTab, type AppPage, type BadgeCollectionOwner, type Holiday } from '@/types';
import { corePages, coreTabs } from './core-data';

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
        associatedTabs: ['tab-team-members', 'tab-badges', 'tab-locations', 'tab-workstations', 'tab-templates', 'tab-calendars', 'tab-service-teams'],
        access: {
            users: [],
            teams: ['video-production', 'live-events', 'production'], // This page is visible only to members of these teams.
        }
    },
];

export const mockAppSettings: AppSettings = {
  pages: [...dynamicPages],
  tabs: [], // Core tabs are now in core-data.ts
};

export const mockUsers: User[] = [
    { userId: '1', displayName: 'Bernardo Resende', email: 'bernardo.resende@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Production Lead', roles: ['badge-video-director', 'badge-dop'], theme: 'dark', defaultCalendarView: 'production-schedule', primaryColor: '#D8620E', linkedTeamIds: [], linkedCollectionIds: ['event-roles-collection'], linkedCalendarIds: ['dreamtek'], dragActivationKey: 'shift', memberOfTeamIds: ['video-production'] },
    { userId: '2', displayName: 'Daniel Lazard', email: 'dlazard@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Manager', roles: [], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['service-delivery'] },
    { userId: '3', displayName: 'May-Kate Woods', email: 'maykate@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['badge-esop', 'badge-td'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '4', displayName: 'Zoey Roberts', email: 'zoeyr@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: ['badge-1stad'], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['production'] },
    { userId: '5', displayName: 'Bilal Merhi', email: 'merhi@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Video Editor', roles: ['badge-editor', 'badge-motion'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['video-production'] },
    { userId: '6', displayName: 'Sam Walker', email: 'samwalker@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Creative Producer', roles: ['badge-creative-producer', 'badge-script'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['video-production'] },
    { userId: '7', displayName: 'Ashley Mulla', email: 'ashleymulla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Editor', roles: ['badge-editor', 'badge-cameraop'], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['video-production'] },
    { userId: '8', displayName: 'Perry Rogantin', email: 'rogantin@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Audio)', roles: ['badge-audioeng', 'badge-audiomix'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '9', displayName: 'Robby Atilla', email: 'robbyatilla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'TD Vision Specialist', roles: ['badge-td', 'badge-cameraop'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '10', displayName: 'Robert Messere', email: 'messere@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['badge-contentop', 'badge-1stad'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '11', displayName: 'Reno Adriaanse', email: 'renoa@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Visual)', roles: ['badge-cameraop', 'badge-dop'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '12', displayName: 'Danny Smartt', email: 'dsmartt@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['badge-eventeditor'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '13', displayName: 'Maciej Chamulak', email: 'chamulak@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician', roles: ['badge-cameraop'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '14', displayName: 'Milan Chohan', email: 'mchohan@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['badge-audioeng'], theme: 'light', defaultCalendarView: 'week', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['live-events'] },
    { userId: '15', displayName: 'Molly Rose', email: 'mollyrose@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: [], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: ['production'] },
    { userId: '16', displayName: 'Chandra Patel', email: 'chandra.patel@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'System Administrator', roles: [], theme: 'light', defaultCalendarView: 'month', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: [] },
    { userId: '17', displayName: 'John Doe', email: 'john.doe@google.com', isAdmin: false, accountType: 'Viewer', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'New Hire', roles: [], theme: 'light', defaultCalendarView: 'day', linkedTeamIds: [], linkedCollectionIds: [], linkedCalendarIds: [], dragActivationKey: 'shift', memberOfTeamIds: [] }
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

// Bernardo Resende (userId: '1') owns these
const videoProdCollectionId = 'video-prod-collection';
export const videoProdBadges: Badge[] = [
    { id: 'badge-video-director', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'Video Director', icon: 'videocam', color: '#FCD34D', description: 'Oversees the creative and technical aspects of a video shoot.' },
    { id: 'badge-dop', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'D.o.P.', icon: 'camera', color: '#FBBF24', description: 'Director of Photography' },
    { id: 'badge-editor', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'Editor', icon: 'edit_note', color: '#F59E0B' },
    { id: 'badge-motion', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'Motion Graphics', icon: 'animation', color: '#D97706' },
    { id: 'badge-creative-producer', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'Creative Producer', icon: 'person', color: '#FEF08A' },
    { id: 'badge-script', owner: { type: 'user', id: '1' }, ownerCollectionId: videoProdCollectionId, name: 'Script', icon: 'description', color: '#FDE68A' },
];

// May-Kate Woods (userId: '3') owns these
const liveEventsCollectionId = 'event-roles-collection';
export const liveEventsBadges: Badge[] = [
    { id: 'badge-td', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'TD', icon: 'engineering', color: '#60A5FA', description: 'Technical Director for live events.' },
    { id: 'badge-1stad', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: '1st AD', icon: 'group', color: '#3B82F6' },
    { id: 'badge-cameraop', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'Camera Op.', icon: 'photo_camera', color: '#2563EB', description: 'Camera Operator' },
    { id: 'badge-audioeng', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'Audio Engineer', icon: 'mic', color: '#93C5FD' },
    { id: 'badge-audiomix', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'Audio Mix', icon: 'equalizer', color: '#BFDBFE' },
    { id: 'badge-contentop', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'Content Op', icon: 'article', color: '#1D4ED8' },
    { id: 'badge-esop', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'ES Operator', icon: 'slideshow', color: '#3B82F6' },
    { id: 'badge-eventeditor', owner: { type: 'user', id: '3' }, ownerCollectionId: liveEventsCollectionId, name: 'Events Editor', icon: 'local_movies', color: '#60A5FA' },
];

// Daniel Lazard (userId: '2') owns these
const pScaleCollectionId = 'p-scale-collection';
const starRatingCollectionId = 'star-rating-collection';
const effortCollectionId = 'effort-collection';

export const pScaleBadges: Badge[] = [
    { id: 'p0', owner: { type: 'user', id: '2' }, ownerCollectionId: pScaleCollectionId, name: 'P0', icon: 'priority_high', color: '#EF4444', description: 'Highest priority' },
    { id: 'p1', owner: { type: 'user', id: '2' }, ownerCollectionId: pScaleCollectionId, name: 'P1', icon: 'keyboard_arrow_up', color: '#F97316', description: 'High priority' },
    { id: 'p2', owner: { type: 'user', id: '2' }, ownerCollectionId: pScaleCollectionId, name: 'P2', icon: 'remove', color: '#FBBF24', description: 'Medium priority' },
    { id: 'p3', owner: { type: 'user', id: '2' }, ownerCollectionId: pScaleCollectionId, name: 'P3', icon: 'keyboard_arrow_down', color: '#22C55E', description: 'Low priority' },
    { id: 'p4', owner: { type: 'user', id: '2' }, ownerCollectionId: pScaleCollectionId, name: 'P4', icon: 'remove', color: '#64748B', description: 'Lowest priority' },
];
export const starRatingBadges: Badge[] = [
    { id: 'star1', owner: { type: 'user', id: '2' }, ownerCollectionId: starRatingCollectionId, name: '1 Star', icon: 'star', color: '#64748B' },
    { id: 'star2', owner: { type: 'user', id: '2' }, ownerCollectionId: starRatingCollectionId, name: '2 Stars', icon: 'star', color: '#64748B' },
    { id: 'star3', owner: { type: 'user', id: '2' }, ownerCollectionId: starRatingCollectionId, name: '3 Stars', icon: 'star', color: '#64748B' },
    { id: 'star4', owner: { type: 'user', id: '2' }, ownerCollectionId: starRatingCollectionId, name: '4 Stars', icon: 'star', color: '#64748B' },
    { id: 'star5', owner: { type: 'user', id: '2' }, ownerCollectionId: starRatingCollectionId, name: '5 Stars', icon: 'star', color: '#64748B' },
];
export const effortBadges: Badge[] = [
    { id: 'task-high', owner: { type: 'user', id: '2' }, ownerCollectionId: effortCollectionId, name: 'High', icon: 'keyboard_double_arrow_up', color: '#EF4444' },
    { id: 'task-medium', owner: { type: 'user', id: '2' }, ownerCollectionId: effortCollectionId, name: 'Medium', icon: 'drag_handle', color: '#FBBF24' },
    { id: 'task-low', owner: { type: 'user', id: '2' }, ownerCollectionId: effortCollectionId, name: 'Low', icon: 'keyboard_double_arrow_down', color: '#22C55E' },
];


export const allMockBadgeCollections: BadgeCollection[] = [
    {
        id: videoProdCollectionId,
        owner: { type: 'user', id: '1' }, // Bernardo
        name: 'Video Production Roles',
        icon: 'movie',
        color: '#FBBF24',
        viewMode: 'compact',
        badgeIds: [
            ...videoProdBadges.map(b => b.id),
            'badge-cameraop',
            'badge-audioeng',
            'badge-audiomix',
            'badge-eventeditor',
        ],
        applications: ['team members', 'events'],
        isShared: true,
    },
    {
        id: liveEventsCollectionId,
        owner: { type: 'user', id: '3' }, // May-Kate
        name: 'Event Roles',
        icon: 'podcasts',
        color: '#3B82F6',
        viewMode: 'compact',
        badgeIds: liveEventsBadges.map(b => b.id),
        applications: ['team members', 'events'],
        isShared: true,
    },
    {
        id: pScaleCollectionId,
        owner: { type: 'user', id: '2' }, // Daniel
        name: 'P# Scale',
        icon: 'numbers',
        color: '#A855F7',
        viewMode: 'list',
        badgeIds: pScaleBadges.map(b => b.id),
        applications: ['events'],
        isShared: true,
    },
    {
        id: starRatingCollectionId,
        owner: { type: 'user', id: '2' }, // Daniel
        name: 'Star Rating',
        icon: 'stars',
        color: '#F59E0B',
        viewMode: 'compact',
        badgeIds: starRatingBadges.map(b => b.id),
        applications: ['tasks'],
        isShared: false,
    },
    {
        id: effortCollectionId,
        owner: { type: 'user', id: '2' }, // Daniel
        name: 'Effort',
        icon: 'fitness_center',
        color: '#10B981',
        viewMode: 'compact',
        badgeIds: effortBadges.map(b => b.id),
        applications: ['tasks'],
        isShared: false,
    }
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

export const mockHolidays: Holiday[] = [
    new Date(new Date().getFullYear(), 0, 1), // New Year's Day
    new Date(new Date().getFullYear(), 6, 4), // Independence Day
    new Date(new Date().getFullYear(), 11, 25), // Christmas Day
];

const now = new Date();

export let mockEvents: Event[] = [
    { 
        eventId: 'evt-1', 
        title: 'Project Kick-off Meeting', 
        calendarId: 'production',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
        attendees: [userToAttendee(mockUsers[0]), userToAttendee(mockUsers[1]), userToAttendee(mockUsers[3])],
        location: 'ACR',
        priority: 'p1',
        createdBy: '2',
        createdAt: new Date(),
        lastUpdated: new Date(),
        attachments: [],
    },
    {
        eventId: 'evt-2', 
        title: 'Q3 All Hands Rehearsal', 
        calendarId: 'live-events',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30),
        attendees: mockUsers.slice(2, 10).map(userToAttendee),
        location: 'Auditorium',
        priority: 'p0',
        roleAssignments: { 'TD': '9', 'Audio Engineer': '8', 'Camera Op.': '11', 'ES Operator': '3', 'Content Op': null },
        templateId: 'template-3',
        createdBy: '3',
        createdAt: new Date(),
        lastUpdated: new Date(),
        attachments: [],
    },
     { 
        eventId: 'evt-3', 
        title: 'VFX Review', 
        calendarId: 'video-production',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
        attendees: [userToAttendee(mockUsers[0]), userToAttendee(mockUsers[4])],
        location: 'EDIT 1',
        priority: 'p2',
        createdBy: '1',
        createdAt: new Date(),
        lastUpdated: new Date(),
        attachments: [],
    },
     { 
        eventId: 'evt-4', 
        title: 'Weekly Sync', 
        calendarId: 'production',
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
        attendees: [userToAttendee(mockUsers[3]), userToAttendee(mockUsers[14])],
        location: 'Training Room',
        priority: 'p3',
        createdBy: '4',
        createdAt: new Date(),
        lastUpdated: new Date(),
        attachments: [],
    },
];

export let mockTasks: Task[] = [
  { taskId: 'task-1', title: 'Draft Q4 Comms Strategy', assignedTo: [mockUsers[5]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2), priority: 'task-high', status: 'in_progress', createdBy: '2', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: 'task-2', title: 'Review new sizzle reel edit', assignedTo: [mockUsers[0], mockUsers[5]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), priority: 'task-high', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: 'task-3', title: 'Organize asset library', assignedTo: [mockUsers[6]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), priority: 'task-medium', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: 'task-4', title: 'Finalize audio mix for All-Hands', assignedTo: [mockUsers[7]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), priority: 'task-high', status: 'completed', createdBy: '3', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: 'task-5', title: 'Update presentation deck', assignedTo: [mockUsers[9]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3), priority: 'task-low', status: 'in_progress', createdBy: '3', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: 'task-6', title: 'Source new background music', assignedTo: [mockUsers[4]], dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), priority: 'task-medium', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

export let mockNotifications: Notification[] = [
    { id: 'notif-1', type: 'standard', user: mockUsers[2], content: 'approved your request for PTO.', time: new Date(Date.now() - 1000 * 60 * 5), read: false },
    { id: 'notif-2', type: 'standard', user: mockUsers[3], content: 'assigned you to the Q3 All Hands Rehearsal as ES Operator.', time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false },
    { id: 'notif-3', type: 'standard', user: mockUsers[0], content: 'completed the task "Finalize audio mix for All-Hands".', time: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
    { id: 'notif-4', type: 'access_request', status: 'pending', user: { displayName: 'new.user@example.com', avatarUrl: '', userId: '' }, content: 'has requested access to the workspace.', time: new Date(Date.now() - 1000 * 60 * 60 * 48), read: false, data: { email: 'new.user@example.com', displayName: 'New User' }},
];
