

import { type Event, type User, type Task, type Notification, type SharedCalendar, type BookableLocation, type Attendee, type Team, type AppSettings, type Badge, type BadgeCollection, type AppTab, type AppPage, type AdminGroup } from '@/types';

export const mockTabs: AppTab[] = [
  { id: 'tab-calendars', name: 'Calendars', icon: 'calendar_month', color: '#3B82F6', componentKey: 'calendars', description: 'Manage shared calendars, colors, and default settings.' },
  { id: 'tab-teams', name: 'Teams', icon: 'group', color: '#10B981', componentKey: 'teams', description: 'Create and configure teams and their members.' },
  { id: 'tab-team-members', name: 'Members', icon: 'group', color: '#6366F1', componentKey: 'team_members', description: 'View all members of a specific team and manage their roles.' },
  { id: 'tab-badges', name: 'Badges', icon: 'style', color: '#F97316', componentKey: 'badges', description: 'Create and manage reusable badges for skills, roles, or priorities.' },
  { id: 'tab-locations', name: 'Locations', icon: 'push_pin', color: '#A855F7', componentKey: 'locations', description: 'Manage pinned locations and check-in points for the team schedule.' },
  { id: 'tab-workstations', name: 'Workstations', icon: 'desktop_windows', color: '#D946EF', componentKey: 'workstations', description: 'Configure bookable workstations and edit machines for the team.' },
  { id: 'tab-templates', name: 'Templates', icon: 'file_copy', color: '#14B8A6', componentKey: 'templates', description: 'Create reusable event templates with pre-filled badge requests.' },
  { id: 'tab-admin-roles', name: 'Admin Groups', icon: 'admin_panel_settings', color: '#8B5CF6', componentKey: 'roles', description: 'Manage high-level administrative groups and their permissions.' },
  { id: 'tab-admin-pages', name: 'Pages', icon: 'web', color: '#EC4899', componentKey: 'pages', description: 'Configure application pages, their navigation, and access controls.' },
  { id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', color: '#EF4444', componentKey: 'tabs', description: 'Manage the properties of reusable tabs that appear on pages.' },
];

export const mockPages: AppPage[] = [
    {
        id: 'page-admin-management',
        name: 'Admin Management',
        icon: 'shield',
        color: '#64748B',
        path: '/dashboard/admin',
        isDynamic: false,
        associatedTabs: ['tab-admin-roles', 'tab-admin-pages', 'tab-admin-tabs'],
        access: {
            users: [],
            teams: [],
            adminGroups: ['Admin'] // This should likely be a check for the isAdmin flag
        }
    },
    {
        id: 'page-service-delivery',
        name: 'Service Delivery',
        icon: 'business_center',
        color: '#8B5CF6',
        path: '/dashboard/service-delivery',
        isDynamic: false,
        associatedTabs: ['tab-calendars', 'tab-teams'],
        access: {
            users: [],
            teams: [],
            adminGroups: ['Service Admin']
        }
    },
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
            teams: ['studio-productions', 'live-events', 'productions'], // Grants access to members of these teams
            adminGroups: ['Service Admin']
        }
    }
];

export const mockAppSettings: AppSettings = {
  adminGroups: [
    {
      id: 'service-admin-main',
      name: 'Service Admin',
      icon: 'business_center',
      color: '#8B5CF6',
      teamAdmins: [],
    },
  ],
  pages: mockPages,
  tabs: mockTabs,
  strategyLabel: 'Priority Strategies',
};

export const mockUsers: User[] = [
    { 
        userId: '1', 
        displayName: 'Alice Johnson', 
        email: 'alice@example.com', 
        isAdmin: true,
        accountType: 'Full',
        googleCalendarLinked: true, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Product Manager', 
        location: 'New York, USA', 
        phone: '123-456-7890', 
        roles: ['Video Director', 'TD', 'ES Operator', 'D.o.P.'], 
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
        isAdmin: false,
        accountType: 'Viewer',
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Lead Engineer', 
        location: 'San Francisco, USA', 
        roles: ['Post-Production', 'Service Admin'], 
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
        isAdmin: false,
        accountType: 'Full',
        googleCalendarLinked: true, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Software Engineer', 
        location: 'Austin, USA', 
        roles: ['Camera', 'Audio'], 
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
        isAdmin: false,
        accountType: 'Viewer',
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
        isAdmin: false,
        accountType: 'Viewer',
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Junior Developer', 
        location: 'Remote', 
        roles: [], 
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
        isAdmin: false,
        accountType: 'Viewer',
        googleCalendarLinked: false, 
        avatarUrl: 'https://placehold.co/40x40.png', 
        title: 'Studio Technician', 
        location: 'Los Angeles, USA', 
        phone: '555-555-5555', 
        roles: [], 
        directReports: [], 
        theme: 'light', 
        defaultCalendarView: 'production-schedule',
        easyBooking: true,
        timeFormat: '24h',
    },
];

export const mockCalendars: SharedCalendar[] = [
    { id: 'studio-productions', name: 'Studio Productions', icon: 'movie', color: '#FBBF24', managers: ['1', '6'], defaultEventTitle: 'New Production Studios Event' },
    { id: 'live-events', name: 'Live Events', icon: 'videocam', color: '#3B82F6', managers: ['1', '2', '3'], defaultEventTitle: 'New Live Event' },
    { id: 'business', name: 'Business', icon: 'business_center', color: '#64748B', managers: ['1', '2'], defaultEventTitle: 'New Event' },
    { id: 'post-production', name: 'Post-Production', icon: 'theaters', color: '#F97316', managers: ['1', '2', '5'], defaultEventTitle: 'New Event Edit' },
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

const studioProdCollectionId = 'av-prod-collection';
const liveEventsCollectionId = 'skills-collection';

const studioProdBadges: Badge[] = [
    { id: 'badge-postprod', ownerCollectionId: studioProdCollectionId, name: 'Post-Production', icon: 'movie_filter', color: '#F97316', description: 'Handles all post-production tasks including editing, color grading, and final exports.' },
    { id: 'badge-director', ownerCollectionId: studioProdCollectionId, name: 'Video Director', icon: 'videocam', color: '#3B82F6' },
    { id: 'badge-editevents', ownerCollectionId: studioProdCollectionId, name: 'Edit Events', icon: 'edit_calendar', color: '#10B981' },
    { id: 'badge-camera', ownerCollectionId: studioProdCollectionId, name: 'Camera', icon: 'photo_camera', color: '#6366F1' },
    { id: 'badge-audio', ownerCollectionId: studioProdCollectionId, name: 'Audio', icon: 'mic', color: '#EC4899' },
    { id: 'badge-dop', ownerCollectionId: studioProdCollectionId, name: 'D.o.P.', icon: 'camera', color: '#8B5CF6' },
];

const liveEventsBadges: Badge[] = [
    { id: 'badge-td', ownerCollectionId: liveEventsCollectionId, name: 'TD', icon: 'engineering', color: '#F43F5E' },
    { id: 'badge-esop', ownerCollectionId: liveEventsCollectionId, name: 'ES Operator', icon: 'slideshow', color: '#14B8A6' },
    { id: 'badge-contentop', ownerCollectionId: liveEventsCollectionId, name: 'Content Op', icon: 'article', color: '#0EA5E9' },
    { id: 'badge-1stad', ownerCollectionId: liveEventsCollectionId, name: '1st AD', icon: 'group', color: '#A855F7' }
];

const pScaleCollectionId = 'p-scale-collection';
const pScaleBadges: Badge[] = [
    { id: 'p0', ownerCollectionId: pScaleCollectionId, name: 'P0', icon: 'priority_high', color: '#EF4444', description: 'Highest priority - immediate action required.' },
    { id: 'p1', ownerCollectionId: pScaleCollectionId, name: 'P1', icon: 'priority_high', color: '#F97316', description: 'High priority - requires attention soon.' },
    { id: 'p2', ownerCollectionId: pScaleCollectionId, name: 'P2', icon: 'priority_high', color: '#FBBF24', description: 'Medium priority - standard work.' },
    { id: 'p3', ownerCollectionId: pScaleCollectionId, name: 'P3', icon: 'priority_high', color: '#22C55E', description: 'Low priority - can be deferred.' },
    { id: 'p4', ownerCollectionId: pScaleCollectionId, name: 'P4', icon: 'priority_high', color: '#64748B', description: 'Lowest priority - to be done when time permits.' },
];
const pScaleCollection: BadgeCollection = {
    id: pScaleCollectionId,
    ownerTeamId: 'studio-productions',
    name: 'P# Scale',
    icon: 'rule',
    color: '#94A3B8',
    viewMode: 'assorted',
    applications: ['events', 'tasks'],
    description: 'Standard P-number priority system for criticality.',
    badgeIds: pScaleBadges.map(b => b.id)
};

const starRatingCollectionId = 'star-rating-collection';
const starRatingBadges: Badge[] = [
    { id: 'star1', ownerCollectionId: starRatingCollectionId, name: '1 Star', icon: 'star', color: '#FBBF24' },
    { id: 'star2', ownerCollectionId: starRatingCollectionId, name: '2 Stars', icon: 'star', color: '#FBBF24' },
    { id: 'star3', ownerCollectionId: starRatingCollectionId, name: '3 Stars', icon: 'star', color: '#FBBF24' },
    { id: 'star4', ownerCollectionId: starRatingCollectionId, name: '4 Stars', icon: 'star', color: '#FBBF24' },
    { id: 'star5', ownerCollectionId: starRatingCollectionId, name: '5 Stars', icon: 'star', color: '#FBBF24' },
];
const starRatingCollection: BadgeCollection = {
    id: starRatingCollectionId,
    ownerTeamId: 'studio-productions',
    name: 'Star Rating',
    icon: 'stars',
    color: '#FBBF24',
    viewMode: 'assorted',
    applications: [],
    description: 'A simple 5-star rating system.',
    badgeIds: starRatingBadges.map(b => b.id)
};

const effortScoreCollectionId = 'effort-score-collection';
const effortScoreBadges: Badge[] = [
    { id: 'effort-trivial', ownerCollectionId: effortScoreCollectionId, name: 'Trivial', icon: 'speed', color: '#4CAF50' },
    { id: 'effort-medium', ownerCollectionId: effortScoreCollectionId, name: 'Medium', icon: 'speed', color: '#FFC107' },
    { id: 'effort-high', ownerCollectionId: effortScoreCollectionId, name: 'High', icon: 'speed', color: '#F44336' },
];
const effortScoreCollection: BadgeCollection = {
    id: effortScoreCollectionId,
    ownerTeamId: 'studio-productions',
    name: 'Effort Score',
    icon: 'speed',
    color: '#888888',
    viewMode: 'assorted',
    applications: [],
    description: 'A numeric scale for estimating effort.',
    badgeIds: effortScoreBadges.map(b => b.id)
};

export const mockTeams: Team[] = [
    {
        id: 'studio-productions',
        name: 'Studio Productions',
        icon: 'movie',
        color: '#10B981',
        sharedTeamIds: ['live-events'],
        members: ['1', '2', '6'],
        teamAdmins: ['1', '2'],
        locationCheckManagers: ['1'],
        allBadges: [
            ...studioProdBadges,
            ...pScaleBadges,
            ...starRatingBadges,
            ...effortScoreBadges,
        ],
        badgeCollections: [{
            id: studioProdCollectionId,
            ownerTeamId: 'studio-productions',
            name: 'Audio & Video Production',
            icon: 'video_settings',
            color: '#10B981',
            viewMode: 'assorted',
            applications: ['users'],
            description: 'Badges related to the full pipeline of audio and video creation, from directing to post-production.',
            badgeIds: studioProdBadges.map(b => b.id)
        }, pScaleCollection, starRatingCollection, effortScoreCollection],
        sharedCollectionIds: [],
        pinnedLocations: ['Studio'],
        checkLocations: [],
        locationAliases: {},
        workstations: ['EDIT 1', 'EDIT 2', 'EDIT 3', 'EDIT 4', 'Pro Tools Machine'],
        eventTemplates: [
            { id: 'template-1', name: 'Basic Studio Shoot', icon: 'theaters', requestedRoles: ['Video Director', 'Edit Events'] },
            { id: 'template-2', name: 'Voice Over Record', icon: 'record_voice_over', requestedRoles: ['Post-Production'] }
        ]
    },
    {
        id: 'live-events',
        name: 'Live Events',
        icon: 'videocam',
        color: '#3B82F6',
        sharedTeamIds: ['studio-productions'],
        members: ['1', '2', '3', '4'],
        teamAdmins: ['1', '2'],
        locationCheckManagers: ['2'],
        allBadges: [
            ...liveEventsBadges,
        ],
        badgeCollections: [{
            id: liveEventsCollectionId,
            ownerTeamId: 'live-events',
            name: 'Skills',
            icon: 'palette',
            color: '#64748B',
            viewMode: 'assorted',
            applications: ['users', 'events'],
            description: 'General skills and roles for live event execution.',
            badgeIds: [
                ...liveEventsBadges.map(b => b.id),
            ]
        }],
        sharedCollectionIds: [studioProdCollectionId],
        pinnedLocations: ['Auditorium', 'ACR', 'Event Space 1 (S2)', 'Event Space 2 (S2)', 'Event Space 3 (R7)', 'Event Space 4 (R7)', 'Training Room', 'Apgar', 'Locke'],
        checkLocations: ['Training Room', 'Apgar', 'Locke'],
        locationAliases: {},
        workstations: [],
        eventTemplates: [
            { id: 'template-3', name: 'Standard Live Event', icon: 'podcasts', requestedRoles: ['TD', 'ES Operator', 'Camera', 'Audio'] },
            { id: 'template-4', name: 'Auditorium Presentation', icon: 'slideshow', requestedRoles: ['TD', 'Content Op'] }
        ]
    },
    {
        id: 'productions',
        name: 'Productions',
        icon: 'campaign',
        color: '#EC4899',
        sharedTeamIds: [],
        members: ['2', '3', '5'],
        teamAdmins: ['2'],
        locationCheckManagers: [],
        allBadges: [],
        badgeCollections: [],
        sharedCollectionIds: [],
        pinnedLocations: [],
        checkLocations: [],
        locationAliases: {},
        workstations: [],
        eventTemplates: [],
    }
];


const userToAttendee = (user: User): Attendee => ({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
});

export const mockTasks: Task[] = [
  { taskId: '1', title: 'Design new dashboard layout', assignedTo: [mockUsers[0]], dueDate: new Date(), priority: 'p1', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '2', title: 'Develop authentication API', assignedTo: [mockUsers[1], mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), priority: 'p0', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '3', title: 'Write documentation for components', assignedTo: [mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), priority: 'p2', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '4', title: 'Fix login page CSS bug', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), priority: 'p3', status: 'completed', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '5', title: 'Setup CI/CD pipeline', assignedTo: [mockUsers[0], mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'p1', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '6', title: 'User testing for new features', assignedTo: [mockUsers[2]], dueDate: new Date(), priority: 'p2', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '7', title: 'Update project dependencies', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), priority: 'p4', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
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
        priority: 'p2',
        attachments: [],
        roleAssignments: {},
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
        attendees: [], 
        location: 'Event Space 1 (S2)',
        priority: 'p1',
        templateId: 'template-4',
        roleAssignments: {
            'TD': '1',
            'Content Op': '4',
        },
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p0',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p2',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p4',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p2',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p1',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p2',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p1',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p1',
        attachments: [],
        roleAssignments: {},
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
        priority: 'p3',
        attachments: [],
        roleAssignments: {},
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
