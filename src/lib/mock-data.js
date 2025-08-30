

import { googleSymbolNames } from './google-symbols';

export const mockUsers = [
  {
    userId: 'user-001',
    displayName: 'Eleanor Vance',
    email: 'eleanor@example.com',
    isAdmin: true,
    accountType: 'Full',
    title: 'Lead Producer',
    avatarUrl: 'https://placehold.co/100x100/A7C7E7/333333?text=EV',
    googleCalendarLinked: true,
    roles: ['badge-video-producer', 'badge-audio-engineer', 'badge-camera-operator'],
    memberOfTeamIds: ['team-video-prod', 'team-exec'],
    theme: 'dark',
    primaryColor: 'hsl(25, 88%, 45%)',
    defaultCalendarView: 'production-schedule',
    easyBooking: true,
    timeFormat: '12h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-01-10T09:00:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-002',
    displayName: 'Marcus Holloway',
    email: 'marcus@example.com',
    isAdmin: false,
    accountType: 'Full',
    title: 'Senior Editor',
    avatarUrl: 'https://placehold.co/100x100/C1E1C1/333333?text=MH',
    googleCalendarLinked: true,
    roles: ['badge-editor', 'badge-colorist'],
    memberOfTeamIds: ['team-video-prod'],
    theme: 'light',
    primaryColor: null,
    defaultCalendarView: 'week',
    easyBooking: false,
    timeFormat: '24h',
    dragActivationKey: 'alt',
    createdAt: new Date('2023-01-15T11:30:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-003',
    displayName: 'Anya Sharma',
    email: 'anya@example.com',
    isAdmin: false,
    accountType: 'Full',
    title: 'Audio Engineer',
    avatarUrl: 'https://placehold.co/100x100/F8D7DA/333333?text=AS',
    googleCalendarLinked: false,
    roles: ['badge-audio-engineer', 'badge-sound-mixer'],
    memberOfTeamIds: ['team-audio-post'],
    theme: 'dark',
    primaryColor: null,
    defaultCalendarView: 'day',
    easyBooking: true,
    timeFormat: '12h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-02-01T14:00:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-004',
    displayName: 'Liam Gallagher',
    email: 'liam@example.com',
    isAdmin: false,
    accountType: 'Full',
    title: 'Camera Operator',
    avatarUrl: 'https://placehold.co/100x100/D4F1F4/333333?text=LG',
    googleCalendarLinked: true,
    roles: ['badge-camera-operator'],
    memberOfTeamIds: ['team-video-prod', 'team-live-events'],
    theme: 'light',
    primaryColor: 'hsl(142, 71%, 45%)',
    defaultCalendarView: 'day',
    easyBooking: false,
    timeFormat: '12h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-02-20T10:00:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-005',
    displayName: 'Chloe Kim',
    email: 'chloe@example.com',
    isAdmin: false,
    accountType: 'Full',
    title: 'Production Assistant',
    avatarUrl: 'https://placehold.co/100x100/FDFD96/333333?text=CK',
    googleCalendarLinked: true,
    roles: ['badge-production-assistant'],
    memberOfTeamIds: ['team-video-prod'],
    theme: 'light',
    primaryColor: null,
    defaultCalendarView: 'week',
    easyBooking: true,
    timeFormat: '12h',
    dragActivationKey: 'ctrl',
    createdAt: new Date('2023-03-05T09:30:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-006',
    displayName: 'Javier Morales',
    email: 'javier@example.com',
    isAdmin: false,
    accountType: 'Viewer',
    title: 'VFX Artist',
    avatarUrl: 'https://placehold.co/100x100/BDB2E1/333333?text=JM',
    googleCalendarLinked: false,
    roles: ['badge-vfx-artist'],
    memberOfTeamIds: ['team-vfx'],
    theme: 'dark',
    primaryColor: null,
    defaultCalendarView: 'day',
    easyBooking: false,
    timeFormat: '24h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-03-10T16:00:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-007',
    displayName: 'Isabella Rossi',
    email: 'isabella@example.com',
    isAdmin: true,
    accountType: 'Full',
    title: 'Head of Post-Production',
    avatarUrl: 'https://placehold.co/100x100/FFDAB9/333333?text=IR',
    googleCalendarLinked: true,
    roles: ['badge-video-producer'],
    memberOfTeamIds: ['team-audio-post', 'team-vfx', 'team-exec'],
    theme: 'light',
    primaryColor: 'hsl(347, 89%, 61%)',
    defaultCalendarView: 'month',
    easyBooking: false,
    timeFormat: '12h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-01-11T09:00:00Z'),
    tenantId: 'default'
  },
  {
    userId: 'user-008',
    displayName: 'Kenji Tanaka',
    email: 'kenji@example.com',
    isAdmin: false,
    accountType: 'Full',
    title: 'Sound Mixer',
    avatarUrl: 'https://placehold.co/100x100/E6E6FA/333333?text=KT',
    googleCalendarLinked: true,
    roles: ['badge-sound-mixer'],
    memberOfTeamIds: ['team-audio-post', 'team-live-events'],
    theme: 'dark',
    primaryColor: null,
    defaultCalendarView: 'day',
    easyBooking: true,
    timeFormat: '12h',
    dragActivationKey: 'shift',
    createdAt: new Date('2023-04-02T13:00:00Z'),
    tenantId: 'default'
  }
];

export const mockCalendars = [
  {
    id: 'cal-001',
    name: 'Studio A',
    icon: 'meeting_room',
    color: 'hsl(142, 71%, 45%)',
    owner: { type: 'user', id: 'user-001' },
    isShared: true,
    defaultEventTitle: 'Studio A Booking',
    roleAssignmentsLabel: 'Crew',
    tenantId: 'default'
  },
  {
    id: 'cal-002',
    name: 'Edit Suite 1',
    icon: 'desktop_windows',
    color: 'hsl(221, 83%, 61%)',
    owner: { type: 'user', id: 'user-001' },
    isShared: true,
    defaultEventTitle: 'Edit Session',
    roleAssignmentsLabel: 'Personnel',
    tenantId: 'default'
  },
  {
    id: 'cal-003',
    name: 'Audio Mix Room',
    icon: 'surround_sound',
    color: 'hsl(262, 88%, 66%)',
    owner: { type: 'user', id: 'user-007' },
    isShared: false,
    defaultEventTitle: 'Mix Session',
    roleAssignmentsLabel: 'Engineers',
    tenantId: 'default'
  },
  {
    id: 'cal-004',
    name: 'Company Events',
    icon: 'celebration',
    color: 'hsl(347, 89%, 61%)',
    owner: { type: 'user', id: 'user-001' },
    isShared: true,
    googleCalendarId: 'your-company-events-calendar-id@group.calendar.google.com',
    tenantId: 'default'
  }
];

export const mockTeams = [
    {
      id: 'team-video-prod',
      name: 'Video Production',
      icon: 'videocam',
      color: 'hsl(25, 95%, 53%)',
      owner: { type: 'user', id: 'user-001' },
      isShared: true,
      members: ['user-001', 'user-002', 'user-004', 'user-005'],
      teamAdmins: ['user-001'],
      activeBadgeCollections: ['coll-video-roles', 'coll-general-roles', 'coll-event-priority'],
      pinnedLocations: ['Studio A', 'Studio B', 'Green Room'],
      checkLocations: ['Studio A'],
      locationCheckManagers: ['user-001'],
      workstations: ['VFX Render Farm', 'Encoding Station'],
      eventTemplates: [
        { id: 'template-1', name: 'Standard Shoot', icon: 'videocam', color: 'hsl(25, 95%, 53%)', requestedRoles: ['Video Producer', 'Camera Operator', 'Production Assistant'] }
      ],
      tenantId: 'default'
    },
    {
      id: 'team-audio-post',
      name: 'Audio Post',
      icon: 'graphic_eq',
      color: 'hsl(262, 88%, 66%)',
      owner: { type: 'user', id: 'user-007' },
      isShared: false,
      members: ['user-003', 'user-007', 'user-008'],
      teamAdmins: ['user-007'],
      activeBadgeCollections: ['coll-audio-roles', 'coll-general-roles'],
      pinnedLocations: ['Audio Mix Room'],
      workstations: ['Sound Booth 1', 'Sound Booth 2'],
      tenantId: 'default'
    },
    {
      id: 'team-vfx',
      name: 'VFX',
      icon: 'movie_filter',
      color: 'hsl(188, 95%, 43%)',
      owner: { type: 'user', id: 'user-007' },
      isShared: true,
      members: ['user-006', 'user-007'],
      teamAdmins: ['user-007'],
      tenantId: 'default'
    },
    {
      id: 'team-live-events',
      name: 'Live Events',
      icon: 'podcasts',
      color: 'hsl(347, 89%, 61%)',
      owner: { type: 'user', id: 'user-001' },
      isShared: true,
      members: ['user-001', 'user-004', 'user-008'],
      teamAdmins: ['user-001'],
      tenantId: 'default'
    },
    {
      id: 'team-exec',
      name: 'Executive Team',
      icon: 'business_center',
      color: 'hsl(220, 13%, 47%)',
      owner: { type: 'user', id: 'user-001' },
      isShared: false,
      members: ['user-001', 'user-007'],
      teamAdmins: ['user-001'],
      tenantId: 'default'
    }
];

export const videoProductionRoles = [
  { id: 'badge-video-producer', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-video-roles', name: 'Video Producer', icon: 'movie', color: '#10B981', tenantId: 'default' },
  { id: 'badge-camera-operator', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-video-roles', name: 'Camera Operator', icon: 'photo_camera', color: '#3B82F6', tenantId: 'default' },
  { id: 'badge-editor', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-video-roles', name: 'Editor', icon: 'content_cut', color: '#6366F1', tenantId: 'default' },
  { id: 'badge-colorist', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-video-roles', name: 'Colorist', icon: 'palette', color: '#A855F7', tenantId: 'default' },
];

export const audioPostRoles = [
  { id: 'badge-audio-engineer', owner: { type: 'user', id: 'user-007' }, ownerCollectionId: 'coll-audio-roles', name: 'Audio Engineer', icon: 'graphic_eq', color: '#D946EF', tenantId: 'default' },
  { id: 'badge-sound-mixer', owner: { type: 'user', id: 'user-007' }, ownerCollectionId: 'coll-audio-roles', name: 'Sound Mixer', icon: 'speaker_group', color: '#F43F5E', tenantId: 'default' },
];

export const vfxRoles = [
  { id: 'badge-vfx-artist', owner: { type: 'user', id: 'user-007' }, ownerCollectionId: 'coll-vfx-roles', name: 'VFX Artist', icon: 'auto_awesome', color: '#0EA5E9', tenantId: 'default' },
];

export const generalRoles = [
  { id: 'badge-production-assistant', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-general-roles', name: 'Production Assistant', icon: 'assistant', color: '#84CC16', tenantId: 'default' },
  { id: 'badge-team-lead', owner: { type: 'user', id: 'user-001' }, ownerCollectionId: 'coll-general-roles', name: 'Team Lead', icon: 'star', color: '#FBBF24', tenantId: 'default' },
];

export const priorityBadges = [
    { id: 'badge-priority-high', owner: { type: 'user', id: 'user-001'}, ownerCollectionId: 'coll-event-priority', name: 'High', icon: 'priority_high', color: 'hsl(0, 84%, 60%)', description: 'High Priority', tenantId: 'default' },
    { id: 'badge-priority-medium', owner: { type: 'user', id: 'user-001'}, ownerCollectionId: 'coll-event-priority', name: 'Medium', icon: 'signal_cellular_alt_2_bar', color: 'hsl(45, 93%, 47%)', description: 'Medium Priority', tenantId: 'default' },
    { id: 'badge-priority-low', owner: { type: 'user', id: 'user-001'}, ownerCollectionId: 'coll-event-priority', name: 'Low', icon: 'signal_cellular_alt_1_bar', color: 'hsl(142, 71%, 45%)', description: 'Low Priority', tenantId: 'default' },
];

export const allMockBadgeCollections = [
  { id: 'coll-video-roles', name: 'Video Production Roles', icon: 'video_camera_back', color: 'hsl(25, 95%, 53%)', owner: { type: 'user', id: 'user-001' }, viewMode: 'list', badgeIds: videoProductionRoles.map(b => b.id), applications: ['team members', 'events'], isShared: true, tenantId: 'default' },
  { id: 'coll-audio-roles', name: 'Audio Department Roles', icon: 'spatial_audio', color: 'hsl(262, 88%, 66%)', owner: { type: 'user', id: 'user-007' }, viewMode: 'grid', badgeIds: audioPostRoles.map(b => b.id), applications: ['team members'], isShared: true, tenantId: 'default' },
  { id: 'coll-vfx-roles', name: 'VFX Roles', icon: 'movie_filter', color: 'hsl(188, 95%, 43%)', owner: { type: 'user', id: 'user-007' }, viewMode: 'compact', badgeIds: vfxRoles.map(b => b.id), applications: ['tasks'], isShared: false, tenantId: 'default' },
  { id: 'coll-general-roles', name: 'General & Admin Roles', icon: 'admin_panel_settings', color: 'hsl(220, 13%, 47%)', owner: { type: 'user', id: 'user-001' }, viewMode: 'grid', badgeIds: generalRoles.map(b => b.id), applications: ['team members'], tenantId: 'default' },
  { id: 'coll-event-priority', name: 'Event Priority', icon: 'flag', color: 'hsl(0, 84%, 60%)', owner: { type: 'user', id: 'user-001' }, viewMode: 'list', badgeIds: priorityBadges.map(b => b.id), applications: ['events'], tenantId: 'default' }
];

export const mockLocations = [
  { id: 'loc-1', name: 'Studio A', tenantId: 'default' },
  { id: 'loc-2', name: 'Studio B', tenantId: 'default' },
  { id: 'loc-3', name: 'Green Room', tenantId: 'default' },
  { id: 'loc-4', name: 'Audio Mix Room', tenantId: 'default' },
  { id: 'loc-5', name: 'Conference Room', tenantId: 'default' },
];

export const mockHolidays = [
  new Date('2024-01-01'), new Date('2024-07-04'), new Date('2024-12-25')
];


export const mockEvents = [
  {
    eventId: 'evt-001',
    projectId: 'proj-corp-video',
    calendarId: 'cal-001',
    title: 'Corporate Shoot - Day 1',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    location: 'Studio A',
    priority: 'badge-priority-high',
    attendees: [],
    roleAssignments: {
      'Video Producer': 'user-001',
      'Camera Operator': 'user-004',
    },
    attachments: [
      { name: 'Shooting Schedule', type: 'sheets', url: '#' },
      { name: 'Script v4.2', type: 'docs', url: '#' },
    ],
    createdBy: 'user-001',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    eventId: 'evt-002',
    projectId: 'proj-corp-video',
    calendarId: 'cal-002',
    title: 'Review Dailies',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
    endTime: new Date(new Date().setHours(12, 30, 0, 0)),
    location: 'Edit Suite 1',
    priority: 'badge-priority-medium',
    attendees: [
        { userId: 'user-001', displayName: 'Eleanor Vance', email: 'eleanor@example.com' },
    ],
    roleAssignments: {
      'Editor': 'user-002',
    },
    attachments: [],
    createdBy: 'user-002',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    eventId: 'evt-003',
    projectId: 'proj-podcast',
    calendarId: 'cal-003',
    title: 'Podcast Ep 12 - Final Mix',
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    endTime: new Date(new Date().setHours(18, 0, 0, 0)),
    location: 'Audio Mix Room',
    priority: 'badge-priority-low',
    attendees: [],
    roleAssignments: {
      'Sound Mixer': 'user-008',
      'Audio Engineer': 'user-003',
    },
    attachments: [],
    createdBy: 'user-007',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    eventId: 'evt-004',
    projectId: 'proj-internal',
    calendarId: 'cal-004',
    title: 'All-Hands Meeting',
    startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0, 0)),
    endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(12, 0, 0, 0)),
    location: 'Conference Room',
    priority: 'badge-priority-medium',
    attendees: mockUsers.map(u => ({ userId: u.userId, displayName: u.displayName, email: u.email })),
    roleAssignments: {},
    attachments: [
        { name: 'Q2 Performance Review', type: 'slides', url: '#' }
    ],
    createdBy: 'user-001',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  }
];

export const mockProjects = [
  { id: 'proj-corp-video', name: 'Project Phoenix - Corporate Video', owner: {type: 'user', id: 'user-001'}, isShared: false, icon: 'movie', color: '#10B981', tenantId: 'default' },
  { id: 'proj-podcast', name: 'The TechTrek Podcast', owner: {type: 'user', id: 'user-007'}, isShared: true, icon: 'podcasts', color: '#F97316', tenantId: 'default' },
  { id: 'proj-internal', name: 'Internal Projects', owner: {type: 'user', id: 'user-001'}, isShared: false, icon: 'business_center', color: '#64748B', tenantId: 'default' },
];

export const mockTasks = [
  {
    taskId: 'task-001',
    projectId: 'proj-corp-video',
    title: 'Finalize script for corporate video',
    assignedTo: [mockUsers[0]],
    dueDate: new Date(),
    priority: 'badge-priority-high',
    status: 'in_progress',
    createdBy: 'user-002',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    taskId: 'task-002',
    projectId: 'proj-corp-video',
    title: 'Scout locations for warehouse scene',
    assignedTo: [mockUsers[4]],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    priority: 'badge-priority-medium',
    status: 'not_started',
    createdBy: 'user-001',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    taskId: 'task-003',
    projectId: 'proj-podcast',
    title: 'Edit guest audio for Episode 12',
    assignedTo: [mockUsers[2], mockUsers[7]],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    priority: 'badge-priority-high',
    status: 'awaiting_review',
    createdBy: 'user-007',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    taskId: 'task-004',
    projectId: 'proj-corp-video',
    title: 'Source stock footage for b-roll',
    assignedTo: [mockUsers[1]],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: 'badge-priority-low',
    status: 'not_started',
    createdBy: 'user-001',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  },
  {
    taskId: 'task-005',
    projectId: 'proj-internal',
    title: 'Update asset library with new logos',
    assignedTo: [mockUsers[4]],
    dueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    priority: 'badge-priority-low',
    status: 'completed',
    createdBy: 'user-007',
    createdAt: new Date(),
    lastUpdated: new Date(),
    tenantId: 'default'
  }
];

export const mockNotifications = [
    {
      id: 'notif-1',
      type: 'standard',
      user: { userId: 'user-002', displayName: 'Marcus Holloway', avatarUrl: mockUsers[1].avatarUrl },
      content: 'commented on the "Corporate Shoot - Day 1" event.',
      time: new Date(new Date().getTime() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
    },
    {
      id: 'notif-2',
      type: 'standard',
      user: { userId: 'user-007', displayName: 'Isabella Rossi', avatarUrl: mockUsers[6].avatarUrl },
      content: 'assigned you to the "Finalize script" task.',
      time: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: 'notif-3',
      type: 'access_request',
      user: { userId: 'user-006', displayName: 'Javier Morales', avatarUrl: mockUsers[5].avatarUrl },
      content: 'has requested access to the workspace.',
      time: new Date(new Date().getTime() - 22 * 60 * 60 * 1000), // 22 hours ago
      read: false,
      status: 'pending',
      data: {
        email: 'javier@example.com',
        displayName: 'Javier Morales'
      }
    },
    {
      id: 'notif-4',
      type: 'standard',
      user: { userId: 'user-004', displayName: 'Liam Gallagher', avatarUrl: mockUsers[3].avatarUrl },
      content: 'updated the location for "All-Hands Meeting".',
      time: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
    }
];
