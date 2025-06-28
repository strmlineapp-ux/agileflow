

import type React from 'react';

export interface AppSettings {
  displayName: string;
  icon: string;
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
  googleCalendarLinked: boolean;
  googleCalendarId?: string;
  avatarUrl?: string;
  location?: string;
  phone?: string;
  title?: string;
  roles?: string[]; // System-level roles like 'Admin'
  directReports?: string[];
  theme?: 'light' | 'dark' | 'high-visibility' | 'firebase';
  defaultCalendarView?: 'month' | 'week' | 'day' | 'production-schedule';
  easyBooking?: boolean;
  timeFormat?: '12h' | '24h';
}

export interface EventTemplate {
  id: string;
  name: string; // This is the "Tag"
  requestedRoles: string[];
}

export interface Team {
  id: string;
  name: string;
  icon: string;
  members: string[]; // array of userIds
  managers?: string[]; // array of userIds who are managers for this team
  managerRoleName?: string;
  memberRoleName?: string;
  locationCheckManagers: string[]; // array of userIds who can manage check locations
  roles: string[]; // team-specific roles
  pinnedLocations: string[]; // array of location names
  checkLocations: string[]; // subset of pinnedLocations designated for daily checks
  locationAliases?: { [key:string]: string };
  workstations?: string[];
  eventTemplates?: EventTemplate[];
}

export interface Priority {
  id: string;
  label: string;
  description?: string;
  color: string;
  shape: 'rounded-md' | 'rounded-full';
}

export type PriorityStrategyApplication = 'tasks' | 'events';
export type PriorityStrategyType = 'tier' | 'symbol' | 'scale';

interface TierStrategyConfig {
    type: 'tier';
    priorities: Priority[];
}

interface SymbolStrategyConfig {
    type: 'symbol';
    icon: string;
    max: number;
    color: string;
}

interface ScaleInterval {
    label: string;
    from: number;
    to: number;
    color: string;
}

interface ScaleStrategyConfig {
    type: 'scale';
    min: number;
    max: number;
    intervals: ScaleInterval[];
}

export type PriorityStrategy = {
    id: string;
    name: string;
    description?: string;
    applications: PriorityStrategyApplication[];
} & (TierStrategyConfig | SymbolStrategyConfig | ScaleStrategyConfig);


export interface Task {
  taskId: string;
  title: string;
  description?: string;
  assignedTo: User[];
  dueDate: Date;
  priority: string; // e.g., 'p-number:p2' or 'star-rating:4' or 'effort-scale:75'
  status: 'not_started' | 'in_progress' | 'awaiting_review' | 'completed' | 'blocked';
  createdBy: string; // userId
  createdAt: Date;
  lastUpdated: Date;
}

export type CalendarId = string;

export interface SharedCalendar {
  id: CalendarId;
  name: string;
  color: string;
  managers?: string[]; // array of userIds who can manage this calendar
  defaultEventTitle?: string;
}

export type AttachmentType = 'drive' | 'docs' | 'sheets' | 'slides' | 'forms' | 'meet' | 'local';

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
  priority: string; // e.g., 'p-number:p2' or 'star-rating:4' or 'effort-scale:75'
  templateId?: string;
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
