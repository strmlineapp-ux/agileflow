
/**
 * @fileoverview This file contains the hardcoded, core definitions for the application's
 * essential pages and tabs. These are fundamental parts of the app that should not be
 * configurable or deletable by administrators in the same way as custom-created pages.
 * Separating them from mock-data.ts ensures a stable core navigation and structure.
 */

import { type AppPage, type AppTab } from '@/types';

// Core tabs that are fundamental to the application's operation.
// This order defines their default sequence in the "Manage Tabs" admin screen.
export const coreTabs: AppTab[] = [
  // Team Management Tabs first
  { id: 'tab-calendars', name: 'Calendars', icon: 'calendar_month', color: '#3B82F6', componentKey: 'calendars', description: 'Manage shared calendars for event creation across the application.' },
  { id: 'tab-service-teams', name: 'Teams', icon: 'group', color: '#22C55E', componentKey: 'teams', description: 'Manage all teams, their properties, and their shared status.' },
  { id: 'tab-team-members', name: 'Members', icon: 'group', color: '#6366F1', componentKey: 'team_members', description: 'View all members of a specific team and manage their roles.' },
  { id: 'tab-badges', name: 'Badges', icon: 'style', color: '#F97316', componentKey: 'badges', description: 'Create and manage reusable badges for skills, roles, or priorities.' },
  { id: 'tab-locations', name: 'Locations', icon: 'push_pin', color: '#A855F7', componentKey: 'locations', description: 'Manage pinned locations and check-in points for the team schedule.' },
  { id: 'tab-workstations', name: 'Workstations', icon: 'desktop_windows', color: '#D946EF', componentKey: 'workstations', description: 'Configure bookable workstations and edit machines for the team.' },
  { id: 'tab-templates', name: 'Templates', icon: 'file_copy', color: '#14B8A6', componentKey: 'templates', description: 'Create reusable event templates with pre-filled badge requests.' },
  
  // Main Navigation Tabs
  { id: 'tab-overview', name: 'Overview', icon: 'dashboard', color: '#F97316', componentKey: 'overview', description: "Get a high-level summary of team activity and recent tasks." },
  { id: 'tab-calendar', name: 'Calendar', icon: 'calendar_month', color: '#0EA5E9', componentKey: 'calendar', description: "View and manage events in various calendar layouts." },
  { id: 'tab-tasks', name: 'Tasks', icon: 'checklist', color: '#10B981', componentKey: 'tasks', description: "Track personal and team tasks, grouped by status." },
  { id: 'tab-notifications', name: 'Notifications', icon: 'notifications', color: '#3B82F6', componentKey: 'notifications', description: "View recent notifications and handle access requests." },
  
  // System Tabs (generally hidden from user selection)
  { id: 'tab-admins', name: 'Admin Management', icon: 'admin_panel_settings', color: '#8B5CF6', componentKey: 'admins', description: 'Manage system administrators.' },
  { id: 'tab-settings', name: 'Settings', icon: 'settings', color: '#64748B', componentKey: 'settings', description: "Manage your personal user preferences and account settings." },
  
  // Pinned Admin Tabs
  { id: 'tab-admin-pages', name: 'Pages', icon: 'web', color: '#EC4899', componentKey: 'pages', description: 'Configure application pages, their navigation, and access controls.' },
  { id: 'tab-admin-tabs', name: 'Tabs', icon: 'tab', color: '#EF4444', componentKey: 'tabs', description: 'Manage the properties of reusable tabs that appear on pages.' },
];

// Core pages that are fundamental to the application's navigation.
export const corePages: AppPage[] = [
    {
        id: 'page-admin-management',
        name: 'Admin',
        icon: 'shield',
        color: '#64748B',
        path: '/dashboard/admin',
        isDynamic: false,
        associatedTabs: ['tab-admins', 'tab-admin-pages', 'tab-admin-tabs'],
        access: { users: [], teams: [] } // Special-cased in hasAccess to only allow isAdmin
    },
    {
        id: 'page-overview',
        name: 'Overview',
        icon: 'dashboard',
        color: '#F97316',
        path: '/dashboard/overview',
        isDynamic: false,
        associatedTabs: ['tab-overview'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-calendar',
        name: 'Calendar',
        icon: 'calendar_month',
        color: '#0EA5E9',
        path: '/dashboard/calendar',
        isDynamic: false,
        associatedTabs: ['tab-calendar'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-tasks',
        name: 'Tasks',
        icon: 'checklist',
        color: '#10B981',
        path: '/dashboard/tasks',
        isDynamic: false,
        associatedTabs: ['tab-tasks'],
        access: { users: [], teams: [] }
    },
    {
        id: 'page-notifications',
        name: 'Notifications',
        icon: 'notifications',
        color: '#3B82F6',
        path: '/dashboard/notifications',
        isDynamic: false,
        associatedTabs: ['tab-notifications'],
        access: { users: [], teams: [] } // Public
    },
    {
        id: 'page-settings',
        name: 'Settings',
        icon: 'settings',
        color: '#64748B',
        path: '/dashboard/settings',
        isDynamic: false,
        associatedTabs: ['tab-settings'],
        access: { users: [], teams: [] } // Public
    },
];
