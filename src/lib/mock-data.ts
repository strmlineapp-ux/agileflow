
import { type Event, type User, type Task, type Notification, type SharedCalendar, type BookableLocation, type Attendee, type Team, type AppSettings, type Badge, type BadgeCollection, type AppTab, type AppPage, type AdminGroup } from '@/types';

export const mockTabs: AppTab[] = [
  { id: 'tab-overview', name: 'Overview', icon: 'dashboard', color: '#F97316', componentKey: 'overview', description: "Get a high-level summary of team activity and recent tasks." },
  { id: 'tab-calendar', name: 'Calendar', icon: 'calendar_month', color: '#0EA5E9', componentKey: 'calendar', description: "View and manage events in various calendar layouts." },
  { id: 'tab-tasks', name: 'Tasks', icon: 'checklist', color: '#10B981', componentKey: 'tasks', description: "Track personal and team tasks, grouped by status." },
  { id: 'tab-notifications', name: 'Notifications', icon: 'notifications', color: '#3B82F6', componentKey: 'notifications', description: "View recent notifications and handle access requests." },
  { id: 'tab-settings', name: 'Settings', icon: 'settings', color: '#64748B', componentKey: 'settings', description: "Manage your personal user preferences and account settings." },
  { 
    id: 'tab-calendars', 
    name: 'Manage Calendars', 
    icon: 'calendar_month', 
    color: '#3B82F6', 
    componentKey: 'calendars', 
    description: 'Manage shared calendars, colors, and default settings.',
    access: {
      users: [],
      teams: [],
      adminGroups: ['Service Delivery'],
    } 
  },
  { 
    id: 'tab-teams', 
    name: 'Teams', 
    icon: 'group', 
    color: '#10B981', 
    componentKey: 'teams', 
    description: 'Create and configure teams and their members.',
    access: {
      users: [],
      teams: [],
      adminGroups: ['Service Delivery'],
    }
  },
  { id: 'tab-team-members', name: 'Members', icon: 'group', color: '#6366F1', componentKey: 'team_members', description: 'View all members of a specific team and manage their roles.' },
  { id: 'tab-badges', name: 'Badges', icon: 'style', color: '#F97316', componentKey: 'badges', description: 'Create and manage reusable badges for skills, roles, or priorities.' },
  { id: 'tab-locations', name: 'Locations', icon: 'push_pin', color: '#A855F7', componentKey: 'locations', description: 'Manage pinned locations and check-in points for the team schedule.' },
  { id: 'tab-workstations', name: 'Workstations', icon: 'desktop_windows', color: '#D946EF', componentKey: 'workstations', description: 'Configure bookable workstations and edit machines for the team.' },
  { id: 'tab-templates', name: 'Templates', icon: 'file_copy', color: '#14B8A6', componentKey: 'templates', description: 'Create reusable event templates with pre-filled badge requests.' },
  { id: 'tab-admin-roles', name: 'Admin Groups', icon: 'admin_panel_settings', color: '#8B5CF6', componentKey: 'adminGroups', description: 'Manage high-level administrative groups and their permissions.' },
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
        access: { users: [], teams: [], adminGroups: [] }
    },
    {
        id: 'page-overview',
        name: 'Overview',
        icon: 'dashboard',
        color: '#F97316',
        path: '/dashboard/overview',
        isDynamic: false,
        associatedTabs: [],
        componentKey: 'overview',
        access: { users: [], teams: [], adminGroups: [] }
    },
    {
        id: 'page-calendar',
        name: 'Calendar',
        icon: 'calendar_month',
        color: '#0EA5E9',
        path: '/dashboard/calendar',
        isDynamic: false,
        associatedTabs: [],
        componentKey: 'calendar',
        access: { users: [], teams: [], adminGroups: [] }
    },
    {
        id: 'page-tasks',
        name: 'Tasks',
        icon: 'checklist',
        color: '#10B981',
        path: '/dashboard/tasks',
        isDynamic: false,
        associatedTabs: [],
        componentKey: 'tasks',
        access: {
            users: [],
            teams: ['video-production', 'live-events', 'production'],
            adminGroups: []
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
            adminGroups: ['Service Delivery']
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
            teams: ['video-production', 'live-events', 'production'],
            adminGroups: ['Service Delivery']
        }
    },
    {
        id: 'page-notifications',
        name: 'Notifications',
        icon: 'notifications',
        color: '#3B82F6',
        path: '/dashboard/notifications',
        isDynamic: false,
        associatedTabs: [],
        componentKey: 'notifications',
        access: { users: [], teams: [], adminGroups: [] }
    },
    {
        id: 'page-settings',
        name: 'Settings',
        icon: 'settings',
        color: '#64748B',
        path: '/dashboard/settings',
        isDynamic: false,
        associatedTabs: [],
        componentKey: 'settings',
        access: { users: [], teams: [], adminGroups: [] }
    },
];

export const mockAppSettings: AppSettings = {
  adminGroups: [
    {
      id: 'service-admin-main',
      name: 'Service Delivery',
      icon: 'business_center',
      color: '#8B5CF6',
      groupAdmins: []
    },
  ],
  pages: mockPages,
  tabs: mockTabs,
};

export const mockUsers: User[] = [
    { userId: '1', displayName: 'Bernardo Resende', email: 'bernardo.resende@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Production Lead', roles: ['Video Director', 'TD'], theme: 'dark', defaultCalendarView: 'production-schedule' },
    { userId: '2', displayName: 'Daniel Lazard', email: 'dlazard@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Service Delivery Manager', roles: ['Service Delivery'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '3', displayName: 'May-Kate Woods', email: 'maykate@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['ES Operator'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '4', displayName: 'Zoey Roberts', email: 'zoeyr@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: ['1st AD'], theme: 'light', defaultCalendarView: 'month' },
    { userId: '5', displayName: 'Bilal Merhi', email: 'merhi@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Video Editor', roles: ['Post-Production'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '6', displayName: 'Sam Walker', email: 'samwalker@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Creative Producer', roles: ['D.o.P.'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '7', displayName: 'Ashley Mulla', email: 'ashleymulla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Editor', roles: ['Edit Events'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '8', displayName: 'Perry Rogantin', email: 'rogantin@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Audio)', roles: ['Audio'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '9', displayName: 'Robby Atilla', email: 'robbyatilla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'TD Vision Specialist', roles: ['TD'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '10', displayName: 'Robert Messere', email: 'messere@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Content Op'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '11', displayName: 'Reno Adriaanse', email: 'renoa@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Visual)', roles: ['Camera'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '12', displayName: 'Danny Smartt', email: 'dsmartt@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: [], theme: 'light', defaultCalendarView: 'week' },
    { userId: '13', displayName: 'Maciej Chamulak', email: 'chamulak@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician', roles: [], theme: 'light', defaultCalendarView: 'week' },
    { userId: '14', displayName: 'Milan Chohan', email: 'mchohan@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: [], theme: 'light', defaultCalendarView: 'week' },
    { userId: '15', displayName: 'Molly Rose', email: 'mollyrose@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: [], theme: 'light', defaultCalendarView: 'month' },
];


export const mockCalendars: SharedCalendar[] = [
    { id: 'video-production', name: 'Video Production', icon: 'movie', color: '#10B981', managers: ['1'] },
    { id: 'live-events', name: 'Live Events', icon: 'videocam', color: '#3B82F6', managers: ['3'] },
    { id: 'production', name: 'General Production', icon: 'campaign', color: '#EC4899', managers: ['4'] },
    { id: 'corporate', name: 'Corporate', icon: 'business_center', color: '#64748B', managers: ['2'] },
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
    ownerTeamId: 'video-production',
    name: 'P# Scale',
    icon: 'rule',
    color: '#94A3B8',
    viewMode: 'assorted',
    applications: ['events', 'tasks'],
    description: 'Standard P-number priority system for criticality.',
    badgeIds: pScaleBadges.map(b => b.id),
    isShared: false,
};

export const mockTeams: Team[] = [
    {
        id: 'video-production',
        name: 'Video Production',
        icon: 'movie',
        color: '#10B981',
        members: ['1', '5', '6', '7'],
        teamAdmins: ['1'],
        locationCheckManagers: ['1'],
        allBadges: [
            ...studioProdBadges,
            ...pScaleBadges,
        ],
        badgeCollections: [{
            id: studioProdCollectionId,
            ownerTeamId: 'video-production',
            name: 'Audio & Video Production',
            icon: 'video_settings',
            color: '#10B981',
            viewMode: 'detailed',
            applications: ['team members', 'events'],
            description: 'Badges related to the full pipeline of audio and video creation.',
            badgeIds: studioProdBadges.map(b => b.id),
            isShared: true,
        }, pScaleCollection],
        pinnedLocations: ['Studio', 'ACR'],
        checkLocations: ['Studio'],
        workstations: ['EDIT 1', 'EDIT 2', 'Pro Tools Machine'],
        eventTemplates: [
            { id: 'template-1', name: 'Basic Studio Shoot', icon: 'theaters', requestedRoles: ['Video Director', 'Camera', 'Audio'] },
            { id: 'template-2', name: 'Voice Over Record', icon: 'record_voice_over', requestedRoles: ['Post-Production', 'Audio'] }
        ],
    },
    {
        id: 'live-events',
        name: 'Live Events',
        icon: 'videocam',
        color: '#3B82F6',
        members: ['3', '8', '9', '10', '11', '12', '13', '14'],
        teamAdmins: ['3'],
        locationCheckManagers: ['3'],
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
            applications: ['team members', 'events'],
            description: 'General skills and roles for live event execution.',
            badgeIds: liveEventsBadges.map(b => b.id),
            isShared: false,
        }],
        pinnedLocations: ['Auditorium', 'ACR', 'Event Space 1 (S2)', 'Event Space 2 (S2)'],
        checkLocations: ['Auditorium'],
        eventTemplates: [
            { id: 'template-3', name: 'Standard Live Event', icon: 'podcasts', requestedRoles: ['TD', 'ES Operator', 'Camera', 'Audio'] },
            { id: 'template-4', name: 'Auditorium Presentation', icon: 'slideshow', requestedRoles: ['TD', 'Content Op'] }
        ],
    },
    {
        id: 'production',
        name: 'Production',
        icon: 'campaign',
        color: '#EC4899',
        members: ['4', '15'],
        teamAdmins: ['4'],
        locationCheckManagers: ['4'],
        allBadges: [],
        badgeCollections: [],
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
];

const today = new Date();
const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
const yesterday = new Date(new Date().setDate(today.getDate() - 1));

export const mockEvents: Event[] = [
    { 
        eventId: '1', 
        title: 'Morning Briefing', 
        calendarId: 'corporate',
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
        roleAssignments: { 'Video Director': '1', 'Camera': '11', 'Audio': '8' },
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
        calendarId: 'corporate',
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
