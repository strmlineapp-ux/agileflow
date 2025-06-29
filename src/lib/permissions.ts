

import { type User, type CalendarId, type SharedCalendar, type Team, type CustomAdminRole } from '@/types';

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * @param user The user object.
 * @param calendar The calendar object.
 * @param customAdminRoles The list of custom admin roles from app settings.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendar: SharedCalendar, customAdminRoles: CustomAdminRole[]): boolean => {
    // Admin and Service Admin roles have universal access to manage all calendars
    if (user.isAdmin || customAdminRoles.some(role => user.roles?.includes(role.name))) {
        return true;
    }

    // Check if the user is a designated manager for this specific calendar
    if (calendar.managers?.includes(user.userId)) {
        return true;
    }
    
    return false;
};

/**
 * Checks if a user can create an event in at least one calendar.
 * This determines if the "New Event" button should be visible.
 * @param user The user object.
 * @param allCalendars All available calendars in the system.
 * @param customAdminRoles The list of custom admin roles from app settings.
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User, allCalendars: SharedCalendar[], customAdminRoles: CustomAdminRole[]): boolean => {
    // If Admin or Service Admin, they can always create events as long as there's a calendar.
    if (user.isAdmin || customAdminRoles.some(role => user.roles?.includes(role.name))) {
        return allCalendars.length > 0;
    }

    // Check if the user is a manager of AT LEAST ONE calendar.
    return allCalendars.some(calendar => calendar.managers?.includes(user.userId));
};


/**
 * Gets all roles for a user, combining system roles and roles from their teams.
 * @param user The user object.
 * @param teams The list of all teams.
 * @returns A unique array of all roles the user has.
 */
export const getAllUserRoles = (user: User, teams: Team[]): string[] => {
    const allRoles = new Set<string>(user.roles || []);
    
    // In a more complex system, this might involve fetching roles based on team membership.
    // For now, user.roles is the source of truth for both system roles and badges.

    return Array.from(allRoles);
};
