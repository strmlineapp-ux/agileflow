
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
      adminGroups: ['service-admin-main'],
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
      adminGroups: ['service-admin-main'],
    }
  },
  { id: 'tab-team-members', name: 'Members', icon: 'group', color: '#6366F1', componentKey: 'team_members', description: 'View all members of a specific team and manage their roles.' },
  { id: 'tab-badges', name: 'Badges', icon: 'style', color: '#F97316', componentKey: 'badges', description: 'Create and manage reusable badges for skills, roles, or priorities.', contextTeamId: 'service-delivery' },
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
        access: { users: [], teams: [], adminGroups: [] } // Special-cased in hasAccess to only allow isAdmin
    },
    {
        id: 'page-overview',
        name: 'Overview',
        icon: 'dashboard',
        color: '#F97316',
        path: '/dashboard/overview',
        isDynamic: false,
        associatedTabs: ['tab-overview'],
        access: { users: [], teams: [], adminGroups: [] } // Public
    },
    {
        id: 'page-calendar',
        name: 'Calendar',
        icon: 'calendar_month',
        color: '#0EA5E9',
        path: '/dashboard/calendar',
        isDynamic: false,
        associatedTabs: ['tab-calendar'],
        access: { users: [], teams: [], adminGroups: [] } // Public
    },
    {
        id: 'page-tasks',
        name: 'Tasks',
        icon: 'checklist',
        color: '#10B981',
        path: '/dashboard/tasks',
        isDynamic: false,
        associatedTabs: ['tab-tasks'],
        access: { users: [], teams: [], adminGroups: [] }
    },
    {
        id: 'page-service-delivery',
        name: 'Service Delivery',
        icon: 'business_center',
        color: '#8B5CF6',
        path: '/dashboard/service-delivery',
        isDynamic: false,
        associatedTabs: ['tab-calendars', 'tab-teams', 'tab-badges'],
        access: {
            users: [],
            teams: [],
            adminGroups: ['service-admin-main']
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
            adminGroups: ['service-admin-main'] 
        }
    },
    {
        id: 'page-notifications',
        name: 'Notifications',
        icon: 'notifications',
        color: '#3B82F6',
        path: '/dashboard/notifications',
        isDynamic: false,
        associatedTabs: ['tab-notifications'],
        access: { users: [], teams: [], adminGroups: [] } // Public
    },
    {
        id: 'page-settings',
        name: 'Settings',
        icon: 'settings',
        color: '#64748B',
        path: '/dashboard/settings',
        isDynamic: false,
        associatedTabs: ['tab-settings'],
        access: { users: [], teams: [], adminGroups: [] } // Public
    },
];

const pScaleCollectionId = 'global-p-scale';
const starSystemCollectionId = 'global-star-system';
const effortCollectionId = 'global-effort';

const pScaleBadges: Badge[] = [
    { id: 'p0', ownerCollectionId: pScaleCollectionId, name: 'P0', icon: 'priority_high', color: '#EF4444', description: 'Highest priority - immediate action required.' },
    { id: 'p1', ownerCollectionId: pScaleCollectionId, name: 'P1', icon: 'priority_high', color: '#F97316', description: 'High priority - requires attention soon.' },
    { id: 'p2', ownerCollectionId: pScaleCollectionId, name: 'P2', icon: 'priority_high', color: '#FBBF24', description: 'Medium priority - standard work.' },
    { id: 'p3', ownerCollectionId: pScaleCollectionId, name: 'P3', icon: 'priority_high', color: '#22C55E', description: 'Low priority - can be deferred.' },
    { id: 'p4', ownerCollectionId: pScaleCollectionId, name: 'P4', icon: 'priority_high', color: '#64748B', description: 'Lowest priority - to be done when time permits.' },
];
const starSystemBadges: Badge[] = [
    { id: 'star1', ownerCollectionId: starSystemCollectionId, name: '1 Star', icon: 'star', color: '#64748B', description: '1/5 Stars' },
    { id: 'star2', ownerCollectionId: starSystemCollectionId, name: '2 Stars', icon: 'star', color: '#64748B', description: '2/5 Stars' },
    { id: 'star3', ownerCollectionId: starSystemCollectionId, name: '3 Stars', icon: 'star', color: '#64748B', description: '3/5 Stars' },
    { id: 'star4', ownerCollectionId: starSystemCollectionId, name: '4 Stars', icon: 'star', color: '#64748B', description: '4/5 Stars' },
    { id: 'star5', ownerCollectionId: starSystemCollectionId, name: '5 Stars', icon: 'star', color: '#64748B', description: '5/5 Stars' },
];
const effortBadges: Badge[] = [
    { id: 'effort-xs', ownerCollectionId: effortCollectionId, name: 'XS', icon: 'fitness_center', color: '#A855F7', description: 'Extra Small' },
    { id: 'effort-s', ownerCollectionId: effortCollectionId, name: 'S', icon: 'fitness_center', color: '#A855F7', description: 'Small' },
    { id: 'effort-m', ownerCollectionId: effortCollectionId, name: 'M', icon: 'fitness_center', color: '#A855F7', description: 'Medium' },
    { id: 'effort-l', ownerCollectionId: effortCollectionId, name: 'L', icon: 'fitness_center', color: '#A855F7', description: 'Large' },
    { id: 'effort-xl', ownerCollectionId: effortCollectionId, name: 'XL', icon: 'fitness_center', color: '#A855F7', description: 'Extra Large' },
];

export const mockAppSettings: AppSettings = {
  adminGroups: [
    {
      id: 'service-admin-main',
      name: 'Service Delivery',
      icon: 'business_center',
      color: '#8B5CF6',
      groupAdmins: ['2']
    },
  ],
  pages: mockPages,
  tabs: mockTabs,
  globalBadges: [...pScaleBadges, ...starSystemBadges, ...effortBadges]
};

export const mockUsers: User[] = [
    { userId: '1', displayName: 'Bernardo Resende', email: 'bernardo.resende@google.com', isAdmin: true, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Production Lead', roles: ['Video Director', 'Director of Photography'], theme: 'dark', defaultCalendarView: 'production-schedule', primaryColor: '#FBBF24' },
    { userId: '2', displayName: 'Daniel Lazard', email: 'dlazard@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Service Delivery Manager', roles: ['Service Delivery'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '3', displayName: 'May-Kate Woods', email: 'maykate@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['ES Operator', 'TD'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '4', displayName: 'Zoey Roberts', email: 'zoeyr@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: ['1st AD'], theme: 'light', defaultCalendarView: 'month' },
    { userId: '5', displayName: 'Bilal Merhi', email: 'merhi@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Video Editor', roles: ['Editor', 'Motion Graphics'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '6', displayName: 'Sam Walker', email: 'samwalker@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Creative Producer', roles: ['Creative Producer', 'Script'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '7', displayName: 'Ashley Mulla', email: 'ashleymulla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Video Editor', roles: ['Editor', 'Camera Op.'], theme: 'light', defaultCalendarView: 'day' },
    { userId: '8', displayName: 'Perry Rogantin', email: 'rogantin@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Audio)', roles: ['Audio Engineer', 'Audio Mix'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '9', displayName: 'Robby Atilla', email: 'robbyatilla@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'TD Vision Specialist', roles: ['TD', 'Camera Op.'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '10', displayName: 'Robert Messere', email: 'messere@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Content Op', '1st AD'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '11', displayName: 'Reno Adriaanse', email: 'renoa@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician (Visual)', roles: ['Camera Op.', 'D.o.P.'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '12', displayName: 'Danny Smartt', email: 'dsmartt@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Events Editor'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '13', displayName: 'Maciej Chamulak', email: 'chamulak@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Senior Event Technician', roles: ['Camera Op.'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '14', displayName: 'Milan Chohan', email: 'mchohan@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Event Technician', roles: ['Audio Engineer'], theme: 'light', defaultCalendarView: 'week' },
    { userId: '15', displayName: 'Molly Rose', email: 'mollyrose@google.com', isAdmin: false, accountType: 'Full', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Production Coordinator', roles: [], theme: 'light', defaultCalendarView: 'month' },
];

export const mockCalendars: SharedCalendar[] = [
    { id: 'production', name: 'Production', icon: 'campaign', color: '#22C55E', managers: ['4'] },
    { id: 'video-production', name: 'Video Production', icon: 'movie', color: '#FBBF24', managers: ['1'] },
    { id: 'live-events', name: 'Live Events', icon: 'videocam', color: '#3B82F6', managers: ['3'] },
    { id: 'dreamtek', name: 'Dreamtek', icon: 'business_center', color: '#8B5CF6', managers: ['2'] },
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
const videoProdBadges: Badge[] = [
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
const liveEventsBadges: Badge[] = [
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
        owner: { type: 'admin_group', name: 'Service Delivery' },
        isShared: false,
        members: ['1', '5', '6', '7'],
        teamAdmins: ['1'],
        teamAdminsLabel: 'Prod Team Leads',
        membersLabel: 'Prod Team Members',
        locationCheckManagers: ['1'],
        allBadges: [...videoProdBadges],
        badgeCollections: [{
            id: videoProdCollectionId,
            owner: { type: 'team', id: 'video-production'},
            name: 'Video Production Roles',
            icon: 'video_settings',
            color: '#FBBF24',
            viewMode: 'assorted',
            applications: ['team members'],
            description: 'Core roles for studio and field video production.',
            badgeIds: [
              ...videoProdBadges.map(b => b.id),
              'badge-cameraop', 'badge-audioeng', 'badge-audiomix', 'badge-esop'
            ],
            isShared: true,
        }],
        pinnedLocations: ['Studio', 'ACR'],
        checkLocations: ['Studio'],
        workstations: ['EDIT 1', 'EDIT 2', 'Pro Tools Machine'],
        eventTemplates: [
            { id: 'template-1', name: 'Basic Studio Shoot', icon: 'theaters', requestedRoles: ['Video Director', 'Camera Op.', 'Audio Engineer'] },
            { id: 'template-2', name: 'Voice Over Record', icon: 'record_voice_over', requestedRoles: ['Editor', 'Audio Mix'] }
        ],
    },
    {
        id: 'live-events',
        name: 'Live Events',
        icon: 'videocam',
        color: '#3B82F6',
        owner: { type: 'admin_group', name: 'Service Delivery' },
        isShared: false,
        members: ['3', '8', '9', '10', '11', '12', '13', '14'],
        teamAdmins: ['3'],
        locationCheckManagers: ['3'],
        allBadges: [...liveEventsBadges],
        badgeCollections: [{
            id: liveEventsCollectionId,
            owner: { type: 'team', id: 'live-events'},
            name: 'Event Roles',
            icon: 'palette',
            color: '#3B82F6',
            viewMode: 'assorted',
            applications: ['team members'],
            description: 'Specialized roles for executing live events and broadcasts.',
            badgeIds: [
                ...liveEventsBadges.map(b => b.id),
                'badge-dop', 'badge-editor'
            ],
            isShared: true,
        }],
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
        owner: { type: 'admin_group', name: 'Service Delivery' },
        isShared: false,
        members: ['4', '15'],
        teamAdmins: ['4'],
        locationCheckManagers: ['4'],
        allBadges: [],
        badgeCollections: [],
    },
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
