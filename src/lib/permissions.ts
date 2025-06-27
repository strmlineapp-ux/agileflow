import { type User, type CalendarId } from '@/types';

// Role-to-calendar mapping for management permissions
const calendarPermissions: Record<string, CalendarId[]> = {
    'Admin': ['studio-productions', 'live-events', 'business', 'post-production'],
    'Service Delivery Manager': ['studio-productions', 'live-events', 'business', 'post-production'],
    'Production': ['studio-productions', 'live-events', 'business', 'post-production'],
    'Live Events': ['live-events', 'business'],
    'Studio Productions': ['studio-productions', 'live-events', 'business'],
    'Post-Production': ['post-production'],
};

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * @param user The user object.
 * @param calendarId The ID of the calendar to check.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendarId: CalendarId): boolean => {
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
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User): boolean => {
    const roles = user.roles || [];
    const creatorRoles = Object.keys(calendarPermissions);
    return roles.some(role => creatorRoles.includes(role));
};
