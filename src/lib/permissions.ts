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
 * Checks if a user has permission to view a page or a tab based on its access rules.
 * @param user The user to check.
 * @param item The AppPage or AppTab configuration.
 * @param teams The list of all teams.
 * @param adminGroups The list of all admin groups.
 * @returns `true` if the user has access, `false` otherwise.
 */
export const hasAccess = (user: User, item: AppPage | AppTab, teams: Team[], adminGroups: AdminGroup[]): boolean => {
    // System admin has universal access
    if (user.isAdmin) return true;

    // Special case for the admin management page, which is only for admins
    if ('path' in item && item.id === 'page-admin-management') {
        return user.isAdmin;
    }

    const access = item.access;

    // If no specific access rules are defined, we assume it's accessible
    if (!access || (access.users.length === 0 && access.teams.length === 0 && access.adminGroups.length === 0)) {
        return true;
    }

    // Direct user assignment always grants access
    if (access.users.includes(user.userId)) return true;
    
    // Group-based access
    if (access.adminGroups.some(groupName => (user.roles || []).includes(groupName))) {
        return true;
    }

    // Team-based access
    // This now simply checks for membership. More granular permissions (like teamAdmin)
    // should be checked within the component itself, not for page/tab visibility.
    const userTeamIds = new Set(teams.filter(t => t.members.includes(user.userId)).map(t => t.id));
    if (access.teams.some(teamId => userTeamIds.has(teamId))) {
        return true;
    }
    
    // Default to no access
    return false;
};

/**
 * Determines the ownership context for a new item based on how a user gained access to the page.
 * The hierarchy is Admin Group > Team > User.
 * @param page The current AppPage configuration.
 * @param user The current user object.
 * @param teams The list of all teams.
 * @param adminGroups The list of all admin groups.
 * @returns A BadgeCollectionOwner object.
 */
export const getOwnershipContext = (page: AppPage, user: User, teams: Team[], adminGroups: AdminGroup[]): BadgeCollectionOwner => {
    // Highest priority: Admin Group ownership
    const userAdminGroups = user.roles || [];
    const relevantAdminGroup = adminGroups.find(ag =>
        (page.access.adminGroups || []).includes(ag.name) && userAdminGroups.includes(ag.name)
    );
    if (relevantAdminGroup) {
        return { type: 'admin_group', name: relevantAdminGroup.name };
    }

    // Second priority: Team ownership
    const userTeamIds = new Set(teams.filter(t => t.members.includes(user.userId)).map(t => t.id));
    const relevantTeam = teams.find(t =>
        (page.access.teams || []).some(teamId => userTeamIds.has(teamId))
    );
    if (relevantTeam) {
        return { type: 'team', id: relevantTeam.id };
    }

    // Default to user ownership if they have direct access or if they are a system admin on a non-restricted page
    if ((page.access.users || []).includes(user.userId) || user.isAdmin) {
         return { type: 'user', id: user.userId };
    }

    // Fallback case - should ideally not be hit if hasAccess is checked first, but good practice.
    // Default to the user creating the item.
    return { type: 'user', id: user.userId };
};
