
import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers'; // Import cookies
import { auth } from '@/lib/firebase-admin'; // Import server-side auth
import { type AppSettings, type Team, type User } from '@/types';

// Component Imports (assuming these are correct)
import { AdminsManagement, PagesManagement, TabsManagement } from '@/components/admin/page';
import { BadgeManagement } from '@/components/teams/badge-management';
import { CalendarManagement } from '@/components/calendar/calendar-management';
import { TeamManagement } from '@/components/teams/team-management';
import { PinnedLocationManagement } from '@/components/settings/pinned-location-management';
import { WorkstationManagement } from '@/components/settings/workstation-management';
import { EventTemplateManagement } from '@/components/teams/event-template-management';
import { TeamMembersView } from '@/components/teams/team-members-view';
import { OverviewContent } from '@/components/dashboard/tabs/overview-tab';
import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { NotificationsContent } from '@/components/dashboard/tabs/notifications-tab';
import { SettingsContent } from '@/components/dashboard/tabs/settings-tab';
import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { ProjectsContent } from '@/components/dashboard/tabs/projects-tab';
import { EventsContent } from '@/components/dashboard/tabs/events-tab';
import { DynamicPageClient } from './page-client';

const componentMap = {
  admins: AdminsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
  badges: BadgeManagement,
  calendars: CalendarManagement,
  teams: TeamManagement,
  locations: PinnedLocationManagement,
  workstations: WorkstationManagement,
  templates: EventTemplateManagement,
  team_members: TeamMembersView,
  overview: OverviewContent,
  tasks: TasksContent,
  notifications: NotificationsContent,
  settings: SettingsContent,
  calendar: CalendarPageContent,
  projects: ProjectsContent,
  events: EventsContent,
};

async function getPageData(params: { page: string[] }, user: User | null) {
    const db = getDb();
    const { page: pagePath } = params;
    const path = Array.isArray(pagePath) ? `/dashboard/${pagePath.join('/')}` : `/dashboard/${pagePath}`;

    // Get workspaceId from the authenticated user, not hardcoded.
    const workspaceId = user?.workspaceId;

    if (!workspaceId) {
        // If there's no workspace ID, we cannot proceed.
        return { page: null, teamContext: null, appSettings: null, user };
    }

    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));
    if (!appSettingsDoc.exists()) {
        console.error(`App settings not found for workspace: ${workspaceId}`);
        return { page: null, teamContext: null, appSettings: null, user };
    }
    const appSettings = appSettingsDoc.data() as AppSettings;

    const foundPage = appSettings.pages.find(p => p.isDynamic ? path.startsWith(p.path.replace(/\[.*?\]/, '')) : p.path === path);

    let teamContext: Team | null = null;
    if (foundPage?.isDynamic) {
        const teamId = pagePath[pagePath.length - 1];
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (teamDoc.exists()) {
            teamContext = { id: teamDoc.id, ...teamDoc.data() } as Team;
        }
    }

    return { page: foundPage || null, teamContext, appSettings, user };
}

async function getUserFromSession(): Promise<User | null> {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
        const db = getDb();
        const userDoc = await getDoc(doc(db, 'users', decodedIdToken.uid));
        if (userDoc.exists()) {
            return { userId: userDoc.id, ...userDoc.data() } as User;
        }
        return null;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;
    }
}

export default async function DynamicPage({ params }: { params: { page: string[] }}) {
    const user = await getUserFromSession();
    const { page, teamContext, appSettings } = await getPageData(params, user);

    if (!page || !appSettings) {
        notFound();
    }

    return (
       <DynamicPageClient
            page={page}
            teamContext={teamContext}
            appSettings={appSettings}
            componentMap={componentMap}
            params={params}
            // Pass the user prop to the client if needed by child components
            // Note: Be careful not to expose sensitive user info to the client.
            user={user} 
       />
    );
}
