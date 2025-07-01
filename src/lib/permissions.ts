

import { type User, type AppPage, type SharedCalendar, type Team, type AdminGroup } from '@/types';

/**
 * Checks if a user has permission to manage events (create, edit, delete) on a specific calendar.
 * @param user The user object.
 * @param calendar The calendar object.
 * @param adminGroups The list of admin groups from app settings.
 * @returns `true` if the user has permission, `false` otherwise.
 */
export const canManageEventOnCalendar = (user: User, calendar: SharedCalendar, adminGroups: AdminGroup[]): boolean => {
    // Admin and Service Admin roles have universal access to manage all calendars
    if (user.isAdmin || adminGroups.some(group => user.roles?.includes(group.name))) {
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
 * @param adminGroups The list of admin groups from app settings.
 * @returns `true` if the user has any event creation permissions, `false` otherwise.
 */
export const canCreateAnyEvent = (user: User, allCalendars: SharedCalendar[], adminGroups: AdminGroup[]): boolean => {
    // If Admin or Service Admin, they can always create events as long as there's a calendar.
    if (user.isAdmin || adminGroups.some(group => user.roles?.includes(group.name))) {
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


/**
 * Checks if a user has permission to view a page based on its access rules.
 * @param user The user to check.
 * @param page The page configuration.
 * @param teams The list of all teams.
 * @param adminGroups The list of all admin groups.
 * @returns `true` if the user has access, `false` otherwise.
 */
export const hasAccess = (user: User, page: AppPage, teams: Team[], adminGroups: AdminGroup[]): boolean => {
    // System admin has universal access
    if (user.isAdmin) return true;

    // Direct user assignment always grants access
    if (page.access.users.includes(user.userId)) return true;

    // Team-based access: grants access ONLY if the user is a Team Admin of an associated team
    const userIsTeamAdminForPage = teams.some(team =>
        page.access.teams.includes(team.id) && (team.teamAdmins || []).includes(user.userId)
    );
    if (userIsTeamAdminForPage) return true;

    // Role-based access: grants access ONLY if the user is a Team Admin of an associated Service Admin group
    const userIsRoleAdminForPage = adminGroups.some(group =>
        page.access.adminGroups.includes(group.name) && (group.teamAdmins || []).includes(user.userId)
    );
    if (userIsRoleAdminForPage) return true;
    
    // Default to no access
    return false;
};
