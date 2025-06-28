

import { type User, type CalendarId, type SharedCalendar, type Team } from '@/types';

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * @param user The user object.
 * @param calendar The calendar object.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendar: SharedCalendar): boolean => {
    // Admin and SDM roles have universal access to manage all calendars
    if (user.roles?.includes('Admin') || user.roles?.includes('Service Delivery Manager')) {
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
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User, allCalendars: SharedCalendar[]): boolean => {
    // If Admin or SDM, they can always create events as long as there's a calendar.
    if (user.roles?.includes('Admin') || user.roles?.includes('Service Delivery Manager')) {
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
    
    teams.forEach(team => {
        if (team.members.includes(user.userId)) {
            team.roles.forEach(role => allRoles.add(role));
        }
    });

    return Array.from(allRoles);
};
