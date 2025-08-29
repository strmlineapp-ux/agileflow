

import { type AppPage, type AppTab } from '@/types';

// Core tabs that are fundamental to the application's operation.
// This order defines their default sequence in the "Manage Tabs" admin screen.
export const coreTabs: AppTab[] = [
  // Team Management Tabs first
  { id: 'tab-calendars', name: 'Calendars', icon: 'calendar_month', color: 'hsl(221, 83%, 61%)', componentKey: 'calendars', description: 'Manage shared calendars for event creation across the application.' },
  { id: 'tab-service-teams', name: 'Teams', icon: 'group', color: 'hsl(142, 71%, 45%)', componentKey: 'teams', description: 'Manage all teams, their properties, and their shared status.' },
  { id: 'tab-team-members', name: 'Members', icon: 'assignment_ind', color: 'hsl(244, 100%, 72%)', componentKey: 'team_members', description: 'View all members of a specific team and manage their roles.' },
  { id: 'tab-badges', name: 'Badges', icon: 'style', color: 'hsl(25, 95%, 53%)', componentKey: 'badges', description: 'Create and manage reusable badges for skills, roles, or priorities.' },
  { id: 'tab-locations', name: 'Locations', icon: 'push_pin', color: 'hsl(271, 91%, 65%)', componentKey: 'locations', description: 'Manage pinned locations and check-in points for the team schedule.' },
  { id: 'tab-workstations', name: 'Workstations', icon: 'desktop_windows', color: 'hsl(328, 84%, 60%)', componentKey: 'workstations', description: 'Configure bookable workstations and edit machines for the team.' },
  { id: 'tab-templates', name: 'Presets', icon: 'file_copy', color: 'hsl(174, 100%, 34%)', componentKey: 'templates', description: 'Create reusable event presets with pre-filled badge requests.' },
  
  // Main Navigation Tabs
  { id: 'tab-overview', name: 'Overview', icon: 'dashboard', color: 'hsl(25, 95%, 53%)', componentKey: 'overview', description: "Get a high-level summary of team activity and recent tasks." },
  { id: 'tab-calendar', name: 'Calendar', icon: 'calendar_month', color: 'hsl(207, 90%, 54%)', componentKey: 'calendar', description: "View and manage events in various calendar layouts." },
  { id: 'tab-tasks', name: 'Tasks', icon: 'checklist', color: 'hsl(160, 100%, 37%)', componentKey: 'tasks', description: "Track personal and team tasks, grouped by status." },
  { id: 'tab-notifications', name: 'Notifications', icon: 'notifications', color: 'hsl(221, 83%, 61%)', componentKey: 'notifications', description: "View recent notifications and handle access requests." },
  
  // System Tabs (generally hidden from user selection)
  { id: 'tab-admins', name: 'Admin Management', icon: 'admin_panel_settings', color: 'hsl(262, 88%, 66%)', componentKey: 'admins', description: 'Manage system administrators.' },
  { id: 'tab-settings', name: 'Settings', icon: 'settings', color: 'hsl(220, 13%, 47%)', componentKey: 'settings', description: "Manage your personal user preferences and account settings." },
  
  // Pinned Admin Tabs
  { id: 'tab-admin-pages', name: 'Pages', icon: 'web', color: 'hsl(347, 89%, 61%)', componentKey: 'pages', description: 'Configure application pages, their navigation, and access controls.' },
  { id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', color: 'hsl(0, 84%, 60%)', componentKey: 'tabs', description: 'Manage the properties of reusable tabs that appear on pages.' },
];

// Core pages that are fundamental to the application's navigation.
export const corePages: AppPage[] = [
    {
        id: 'page-admin-management',
        name: 'Admin',
        icon: 'shield',
        color: 'hsl(220, 13%, 47%)',
        path: '/dashboard/admin',
        isDynamic: false,
        associatedTabs: ['tab-admins', 'tab-admin-pages', 'tab-admin-tabs'],
        access: { users: [], teams: [] } // Special-cased in hasAccess to only allow isAdmin
    },
    {
        id: 'page-overview',
        name: 'Overview',
        icon: 'dashboard',
        color: 'hsl(25, 95%, 53%)',
        path: '/dashboard/overview',
        isDynamic: false,
        associatedTabs: ['tab-overview'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-calendar',
        name: 'Calendar',
        icon: 'calendar_month',
        color: 'hsl(207, 90%, 54%)',
        path: '/dashboard/calendar',
        isDynamic: false,
        associatedTabs: ['tab-calendar'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-tasks',
        name: 'Tasks',
        icon: 'checklist',
        color: 'hsl(160, 100%, 37%)',
        path: '/dashboard/tasks',
        isDynamic: false,
        associatedTabs: ['tab-tasks'],
        access: { users: [], teams: [] }
    },
    {
        id: 'page-notifications',
        name: 'Notifications',
        icon: 'notifications',
        color: 'hsl(221, 83%, 61%)',
        path: '/dashboard/notifications',
        isDynamic: false,
        associatedTabs: ['tab-notifications'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-settings',
        name: 'Settings',
        icon: 'settings',
        color: 'hsl(220, 13%, 47%)',
        path: '/dashboard/settings',
        isDynamic: false,
        associatedTabs: ['tab-settings'],
        access: { users: [], teams: [] } // Public
    },
];

    