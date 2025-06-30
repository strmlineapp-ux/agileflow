

import type React from 'react';

export interface LinkGroup {
  icon: string;
  color: string;
}

export interface CustomAdminRole {
  id: string;
  name:string;
  icon: string;
  color: string;
  linkGroupId?: string;
  teamAdmins?: string[];
}

export interface AppTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  componentKey: 'calendars' | 'teams' | 'team_members' | 'badges' | 'locations' | 'workstations' | 'templates' | 'roles' | 'pages' | 'tabs';
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
    roles: string[]; // CustomAdminRole names
  };
}

export interface AppSettings {
  customAdminRoles: CustomAdminRole[];
  linkGroups: Record<string, LinkGroup>;
  teamLinkGroups?: Record<string, LinkGroup>;
  pages: AppPage[];
  tabs: AppTab[];
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
  roles?: string[]; // Contains names of CustomAdminRoles and Badge names
  directReports?: string[];
  theme?: 'light' | 'dark' | 'high-visibility' | 'firebase';
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
  assignedUsers?: string[];
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
  linkGroupId?: string;
  linkedTeamIds?: string[];
  members: string[]; // array of userIds
  teamAdmins?: string[]; // array of userIds who are admins for this team
  locationCheckManagers: string[]; // array of userIds who can manage check locations
  allBadges: Badge[]; // The single source of truth for all badges in this team
  badgeCollections: BadgeCollection[]; // Groups of badges, containing badge IDs
  linkedCollectionIds?: string[];
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
  user: Pick<User, 'userId' | 'displayName' | 'avatarUrl' | 'easyBooking'>; // The user who *caused* the notification
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
