
import type React from 'react';

export interface AppTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  componentKey: 'team_members' | 'badges' | 'locations' | 'workstations' | 'templates' | 'admins' | 'pages' | 'tabs' | 'overview' | 'tasks' | 'notifications' | 'settings' | 'calendar' | 'calendars' | 'teams' | 'strategies';
  contextTeamId?: string; // Optional teamId to provide context for a tab on a non-dynamic page
}

export interface AppPage {
  id: string;
  name: string;
  icon: string;
  color: string;
  path: string; // e.g., /dashboard/service-delivery or /dashboard/teams
  isDynamic: boolean; // True for paths like /dashboard/teams/:teamId
  associatedTabs: string[]; // Array of AppTab ids
  access: {
    users: string[]; // User IDs
    teams: string[]; // Team IDs
  };
}

export interface AppSettings {
  pages: AppPage[];
  tabs: AppTab[];
  globalBadges: Badge[];
  calendarManagementLabel?: string;
  teamManagementLabel?: string;
  strategyLabel?: string;
}

export interface Attendee {
  userId?: string; // Optional: for internal users, this is their ID.
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface User {
  userId: string;
  email: string;
  displayName:string;
  isAdmin: boolean;
  accountType: 'Full' | 'Viewer';
  googleCalendarLinked: boolean;
  googleCalendarId?: string;
  avatarUrl?: string;
  location?: string;
  phone?: string;
  title?: string;
  roles?: string[]; // Contains names of Badges assigned to the user
  directReports?: string[];
  theme?: 'light' | 'dark';
  primaryColor?: string; // HEX value string e.g., "#4A90E2"
  defaultCalendarView?: 'month' | 'week' | 'day' | 'production-schedule';
  easyBooking?: boolean;
  timeFormat?: '12h' | '24h';
  linkedTeamIds?: string[];
  linkedCollectionIds?: string[];
}

export interface EventTemplate {
  id: string;
  name: string; // This is the "Tag"
  icon: string;
  requestedRoles: string[]; // array of Badge names
}

export interface Badge {
  id: string;
  ownerCollectionId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  schedule?: {
    startDate?: Date;
    endDate?: Date;
  };
}

export type BadgeApplication = 'team members' | 'events' | 'tasks' | 'badges';

export type BadgeCollectionOwner = { type: 'user' | 'team'; id: string };

export interface BadgeCollection {
  id: string;
  owner: BadgeCollectionOwner;
  name: string;
  icon: string;
  color: string;
  viewMode: 'assorted' | 'detailed' | 'list';
  badgeIds: string[];
  description?: string;
  applications?: BadgeApplication[];
  isShared?: boolean;
}

export interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  owner: { type: 'user', id: string };
  isShared?: boolean;
  members: string[]; // array of userIds
  teamAdmins?: string[]; // array of userIds who are admins for this team
  teamAdminsLabel?: string;
  membersLabel?: string;
  locationCheckManagers: string[]; // array of userIds who can manage check locations
  allBadges: Badge[];
  badgeCollections: BadgeCollection[];
  userBadgesLabel?: string;
  pinnedLocations?: string[]; // array of location names
  checkLocations?: string[]; // subset of pinnedLocations designated for daily checks
  locationAliases?: { [key:string]: string };
  workstations?: string[];
  eventTemplates?: EventTemplate[];
  linkedCollectionIds?: string[];
  activeBadgeCollections?: string[];
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  assignedTo: User[];
  dueDate: Date;
  priority: string; // Holds the ID of a badge used for priority
  status: 'not_started' | 'in_progress' | 'awaiting_review' | 'completed' | 'blocked';
  createdBy: string; // userId
  createdAt: Date;
  lastUpdated: Date;
}

export type CalendarId = string;

export interface SharedCalendar {
  id: CalendarId;
  name: string;
  icon: string;
  color: string;
  googleCalendarId?: string; // The ID of the real Google Calendar it's linked to
  managers?: string[]; // array of userIds who can manage this calendar
  defaultEventTitle?: string;
  roleAssignmentsLabel?: string;
}

export type AttachmentType = 'drive' | 'docs' | 'sheets' | 'slides' | 'forms' | 'meet' | 'local' | 'link';

export interface Attachment {
  name: string;
  type: AttachmentType;
  url: string; // The link to the resource or a placeholder
}

export interface Event {
  eventId: string;
  title: string;
  calendarId: CalendarId;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: Attendee[];
  location?: string;
  associatedTaskId?: string;
  priority: string; // Holds the ID of a badge used for priority
  templateId?: string;
  roleAssignments?: Record<string, string | null>;
  attachments: Attachment[];
  createdBy: string; // userId
  createdAt: Date;
  lastUpdated: Date;
  syncToGoogleCalendar?: boolean;
}

export type UserStatus = 'PTO' | 'PTO (AM)' | 'PTO (PM)' | 'TOIL' | 'TOIL (AM)' | 'TOIL (PM)' | 'Sick' | 'Offsite' | 'Training';

export interface UserStatusAssignment {
  userId: string;
  status: UserStatus;
}

export interface Notification {
  id: string;
  type: 'access_request' | 'standard';
  status?: 'pending' | 'approved' | 'rejected'; // only for access_requests
  user: Pick<User, 'userId' | 'displayName' | 'avatarUrl'>; // The user who *caused* the notification
  content: string;
  time: Date;
  read: boolean;
  data?: { // payload for access_requests
    email: string;
    displayName: string;
  };
}

export interface BookableLocation {
  id: string;
  name: string;
}

// Data for priority strategies, which will be managed in the UI
export type PriorityStrategyType = 'tier' | 'symbol' | 'scale';

export interface Priority {
  id: string;
  label: string;
  description?: string;
  color: string;
  shape: 'rounded-md' | 'rounded-full';
}

export interface PriorityStrategy {
  id: string;
  name: string;
  description?: string;
  applications: BadgeApplication[];
  type: PriorityStrategyType;
  // Tier-specific
  priorities?: Priority[];
  // Symbol-specific
  icon?: string;
  max?: number; // e.g., 5 for a 5-star rating
  color?: string; // color for the symbol
  // Scale-specific
  min?: number;
  intervals?: {
    label: string;
    from: number;
    to: number;
    color: string;
  }[];
}
