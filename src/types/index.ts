

export interface Attendee {
  userId?: string; // Optional: for internal users, this is their ID.
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface User {
  userId: string;
  email: string;
  displayName: string;
  googleCalendarLinked: boolean;
  googleCalendarId?: string;
  avatarUrl?: string;
  location?: string;
  phone?: string;
  title?: string;
  roles?: string[]; // System-level roles like 'Admin', 'Service Delivery Manager'
  directReports?: string[];
  theme?: 'light' | 'dark' | 'high-visibility' | 'firebase';
  defaultCalendarView?: 'month' | 'week' | 'day' | 'production-schedule';
  easyBooking?: boolean;
  timeFormat?: '12h' | '24h';
}

export interface Team {
  id: string;
  name: string;
  icon: string;
  members: string[]; // array of userIds
  managers?: string[]; // array of userIds who are managers for this team
  locationCheckManagers: string[]; // array of userIds who can manage check locations
  roles: string[]; // team-specific roles
  pinnedLocations: string[]; // array of location names
  checkLocations: string[]; // subset of pinnedLocations designated for daily checks
  locationAliases?: { [key: string]: string };
}

export interface PageConfig {
  id: string;
  name: string;
  icon: string;
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  assignedTo: User[];
  dueDate: Date;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
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
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
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
