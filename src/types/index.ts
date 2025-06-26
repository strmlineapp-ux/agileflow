
export interface User {
  userId: string;
  email: string;
  displayName: string;
  teamId?: string;
  googleCalendarLinked: boolean;
  googleCalendarId?: string;
  avatarUrl?: string;
  location?: string;
  phone?: string;
  title?: string;
  roles?: string[];
  permissions?: string[];
  directReports?: string[];
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

export interface Event {
  eventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: User[];
  location?: string;
  associatedTaskId?: string;
  createdBy: string; // userId
  createdAt: Date;
  lastUpdated: Date;
  syncToGoogleCalendar?: boolean;
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
