
import { type User, type AppPage, type SharedCalendar, type Team, type AdminGroup, type AppTab, type BadgeCollectionOwner } from '@/types';

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
 * Tab visibility is handled separately in the rendering component.
 * @param user The user to check.
 * @param page The AppPage configuration.
 * @param teams The list of all teams.
 * @param adminGroups The list of all admin groups.
 * @returns `true` if the user has access, `false` otherwise.
 */
export const hasAccess = (user: User, page: AppPage, teams: Team[], adminGroups: AdminGroup[]): boolean => {
    // System admin has universal access
    if (user.isAdmin) return true;

    // Special case for the admin management page, which is only for admins
    if (page.id === 'page-admin-management') {
        return user.isAdmin;
    }

    const access = page.access;

    // If no access rules are defined, the page is public.
    if (!access || (access.users.length === 0 && access.teams.length === 0 && access.adminGroups.length === 0)) {
        return true;
    }

    // Direct user assignment
    if (access.users.includes(user.userId)) return true;
    
    // Group-based access (using IDs)
    const userAdminGroupIds = new Set(adminGroups.filter(ag => (user.roles || []).includes(ag.name)).map(ag => ag.id));
    if (access.adminGroups.some(requiredGroupId => userAdminGroupIds.has(requiredGroupId))) {
        return true;
    }

    // Team-based access
    const userTeamIds = new Set(teams.filter(t => t.members.includes(user.userId)).map(t => t.id));
    if (access.teams.some(teamId => userTeamIds.has(teamId))) {
        return true;
    }
    
    // Default to no access
    return false;
};

/**
 * Determines the ownership context for a new item. With the simplified ownership model,
 * this always returns the current user.
 * @param page The current AppPage configuration.
 * @param user The current user object.
 * @param teams The list of all teams.
 * @param adminGroups The list of all admin groups.
 * @returns A BadgeCollectionOwner object.
 */
export const getOwnershipContext = (page: AppPage, user: User, teams: Team[], adminGroups: AdminGroup[]): BadgeCollectionOwner => {
    // Ownership is now always assigned to the user who creates the item.
    return { type: 'user', id: user.userId };
};
