
import type React from 'react';

export interface AdminGroup {
  id: string;
  name:string;
  icon: string;
  color: string;
  groupAdmins?: string[]; // userIds of users who are admins *of this group*
}

export interface AppTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  componentKey: 'calendars' | 'teams' | 'team_members' | 'badges' | 'locations' | 'workstations' | 'templates' | 'adminGroups' | 'pages' | 'tabs' | 'strategy' | 'overview' | 'tasks' | 'notifications' | 'settings' | 'calendar';
}

export interface AppPage {
  id: string;
  name: string;
  icon: string;
  color: string;
  path: string; // e.g., /dashboard/service-delivery or /dashboard/teams
  isDynamic: boolean; // True for paths like /dashboard/teams/:teamId
  associatedTabs: string[]; // Array of AppTab ids
  componentKey?: 'overview' | 'calendar' | 'tasks' | 'notifications' | 'settings';
  access: {
    users: string[]; // User IDs
    teams: string[]; // Team IDs
    adminGroups: string[]; // AdminGroup names
  };
}

export interface AppSettings {
  adminGroups: AdminGroup[];
  pages: AppPage[];
  tabs: AppTab[];
  strategyLabel?: string;
  calendarManagementLabel?: string;
  teamManagementLabel?: string;
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
  roles?: string[]; // Contains names of AdminGroups and Badge names
  directReports?: string[];
  theme?: 'light' | 'dark';
  primaryColor?: string; // HEX value string e.g., "#4A90E2"
  defaultCalendarView?: 'month' | 'week' | 'day' | 'production-schedule';
  easyBooking?: boolean;
  timeFormat?: '12h' | '24h';
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

export type BadgeApplication = 'users' | 'events' | 'tasks' | 'badges';

export interface BadgeCollection {
  id: string;
  ownerTeamId: string;
  name: string;
  icon: string;
  color: string;
  viewMode: 'assorted' | 'detailed' | 'list';
  badgeIds: string[];
  description?: string;
  applications?: BadgeApplication[];
}

export interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  members: string[]; // array of userIds
  teamAdmins?: string[]; // array of userIds who are admins for this team
  locationCheckManagers: string[]; // array of userIds who can manage check locations
  allBadges: Badge[]; // The single source of truth for all badges in this team
  badgeCollections: BadgeCollection[]; // Groups of badges, containing badge IDs
  sharedCollectionIds?: string[];
  sharedTeamIds?: string[];
  pinnedLocations: string[]; // array of location names
  checkLocations: string[]; // subset of pinnedLocations designated for daily checks
  locationAliases?: { [key:string]: string };
  workstations?: string[];
  eventTemplates?: EventTemplate[];
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

// Represents a named tier of priority (e.g., P0, P1, P2).
export interface Priority {
  id: string;
  label: string;
  description?: string;
  color: string;
  shape: 'rounded-md' | 'rounded-full';
}

// Represents a strategy for displaying priority based on a symbol (e.g., star rating).
export interface SymbolPriority {
  icon: string;
  max: number;
  color: string;
}

// Represents a strategy for displaying priority based on a numerical scale (e.g., 1-100).
export interface ScalePriority {
  min: number;
  max: number;
  intervals: {
    label: string;
    from: number;
    to: number;
    color: string;
  }[];
}

export type PriorityStrategyApplication = 'events' | 'tasks';

export type PriorityStrategyType = 'tier' | 'symbol' | 'scale';

export type PriorityStrategy = {
  id: string;
  name: string;
  description: string;
  applications: PriorityStrategyApplication[];
} & (
  | { type: 'tier'; priorities: Priority[] }
  | { type: 'symbol'; icon: string; max: number; color: string }
  | { type: 'scale'; min: number; max: number; intervals: { label: string, from: number, to: number, color: string }[] }
);
