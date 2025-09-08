

import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { type AppSettings, type SharedCalendar } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

async function getCalendarData(userId: string) {
    const db = getDb();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
        console.error(`No user document found for userId: ${userId}`);
        return { appSettings: null, calendars: [] };
    }
    
    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) {
        console.error(`User ${userId} does not have a workspaceId.`);
        return { appSettings: null, calendars: [] };
    }

    const appSettingsDocRef = doc(db, 'app-settings', workspaceId);
    const calendarsQuery = query(collection(db, 'calendars'), where('workspaceId', '==', workspaceId));

    const [appSettingsDoc, calendarsSnapshot] = await Promise.all([
        getDoc(appSettingsDocRef),
        getDocs(calendarsQuery)
    ]);

    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const calendars = calendarsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as SharedCalendar));
    
    return { appSettings, calendars };
}


export default async function CalendarPage() {
  // In a real app, you would get the authenticated user's session.
  // For now, we'll use a hardcoded email and handle potential errors.
  let session;
  try {
    session = await auth().getUserByEmail('demo@strm.com');
  } catch (error) {
     return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl mb-2">Authentication Error</h2>
                <p className="text-muted-foreground">Could not authenticate user. Please ensure the demo user exists.</p>
            </div>
        </div>
      )
  }

  const { appSettings, calendars } = await getCalendarData(session.uid);
  
  if (!appSettings) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl mb-2">Configuration Error</h2>
                <p className="text-muted-foreground">The application settings could not be found for your workspace.</p>
            </div>
        </div>
    )
  }

  const calendarTabConfig = appSettings.tabs.find(t => t.id === 'tab-calendar');

  if (!calendarTabConfig) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
            <h2 className="text-2xl mb-2">Configuration Error</h2>
            <p className="text-muted-foreground">The main calendar page configuration could not be found.</p>
            </div>
      </div>
    )
  }

  return <CalendarPageContent tab={calendarTabConfig} initialCalendars={calendars} />;
}
