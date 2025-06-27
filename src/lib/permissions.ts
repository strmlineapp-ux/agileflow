import { type User, type CalendarId } from '@/types';

// Role-to-calendar mapping for management permissions on the initial set of calendars
const calendarPermissions: Record<string, CalendarId[]> = {
    'Service Delivery Manager': ['studio-productions', 'live-events', 'business', 'post-production'],
    'Production': ['studio-productions', 'live-events', 'business', 'post-production'],
    'Live Events': ['live-events', 'business'],
    'Studio Productions': ['live-events', 'business'],
    'Post-Production': ['post-production'],
};

const initialCalendarIds = ['studio-productions', 'live-events', 'business', 'post-production'];

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * @param user The user object.
 * @param calendarId The ID of the calendar to check.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendarId: CalendarId): boolean => {
    // Admin role has universal access
    if (user.roles?.includes('Admin')) {
        return true;
    }

    // For any custom calendars not in the initial set, only Admins (handled above) and SDMs have access.
    if (!initialCalendarIds.includes(calendarId)) {
        return user.roles?.includes('Service Delivery Manager') ?? false;
    }
    
    // For initial calendars, check role-based permissions
    const roles = user.roles || [];
    for (const role of roles) {
        if (calendarPermissions[role]?.includes(calendarId)) {
            return true;
        }
    }
    return false;
};

/**
 * Checks if a user can create an event in at least one calendar.
 * This determines if the "New Event" button should be visible.
 * @param user The user object.
 * @param allCalendars All available calendars in the system.
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User, allCalendars: {id: string}[]): boolean => {
    // Admin role has universal access
    if (user.roles?.includes('Admin')) {
        return true;
    }
    
    // Check if user has permission on any of the available calendars
    return allCalendars.some(calendar => canManageEventOnCalendar(user, calendar.id));
};
