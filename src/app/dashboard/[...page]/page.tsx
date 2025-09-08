
import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useUser } from '@/context/user-context'; // Although this is a server component, we can get user from a server context
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hasAccess } from '@/lib/permissions';
import { type AppTab, type Team, type AppPage, type BadgeCollection, type SharedCalendar, type Badge, type User } from '@/types';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, pointerWithin, type DragStartEvent, type DragEndEvent, type Active, type Over } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';


// Import all possible tab content components
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
import { auth } from '@/lib/firebase-admin';


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
  // Add other mappings as needed
};

async function getPageData(params: { page: string[] }) {
    const db = getDb();
    const { page: pagePath } = params;
    const path = Array.isArray(pagePath) ? `/dashboard/${pagePath.join('/')}` : `/dashboard/${pagePath}`;

    // This part is tricky without a user session.
    // For now, let's assume a simplified workspace logic for fetching settings.
    // In a real multi-tenant app, you'd get the workspaceId from the user's session or subdomain.
    const workspaceId = 'default'; // Hardcoded for this example

    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));
    if (!appSettingsDoc.exists()) {
        return { page: null, teamContext: null, appSettings: { pages: [], tabs: [] } };
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

    return { page: foundPage || null, teamContext, appSettings };
}

export default async function DynamicPage({ params }: { params: { page: string[] }}) {
    const { page, teamContext, appSettings } = await getPageData(params);
    
    // In a real app with server-side auth, you'd get the user session here.
    // We'll pass a placeholder or fetch it if possible.
    // const session = await auth().getSession();
    // const user = session ? await getUser(session.uid) : null;

    if (!page) {
        notFound();
    }

    return (
       <DynamicPageClient
            page={page}
            teamContext={teamContext}
            appSettings={appSettings}
            componentMap={componentMap}
            params={params}
       />
    );
}

