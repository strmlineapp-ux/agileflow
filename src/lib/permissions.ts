
import { type User, type CalendarId, type Team } from '@/types';

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * This is now simplified as SDMs and Admins have broad access, and other permissions
 * will be handled by team-specific roles in the future.
 * @param user The user object.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendarId: CalendarId): boolean => {
    // Admin and SDM roles have universal access to manage all calendars
    if (user.roles?.includes('Admin') || user.roles?.includes('Service Delivery Manager')) {
        return true;
    }
    
    // For now, we allow any user to create events on any calendar if they don't have special roles.
    // This can be refined later with team-based calendar permissions.
    return true;
};

/**
 * Checks if a user can create an event in at least one calendar.
 * This determines if the "New Event" button should be visible.
 * @param user The user object.
 * @param allCalendars All available calendars in the system.
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User, allCalendars: {id: string}[]): boolean => {
    // In this simplified model, if you can create on one, you can create on any.
    // So we just need to check if there's at least one calendar.
    if (allCalendars.length > 0) {
        return canManageEventOnCalendar(user, allCalendars[0].id);
    }
    return false;
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
