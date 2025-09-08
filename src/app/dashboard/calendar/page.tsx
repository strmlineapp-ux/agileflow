

import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { getDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { type AppSettings, type SharedCalendar } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

async function getCalendarData(userId: string) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { appSettings: null, calendars: [] };
    
    const workspaceId = userDoc.data().workspaceId;
    if (!workspaceId) return { appSettings: null, calendars: [] };

    const appSettingsDoc = await getDoc(doc(db, 'app-settings', workspaceId));
    const calendarsQuery = await getDocs(query(collection(db, 'calendars'), where('workspaceId', '==', workspaceId)));

    const appSettings = appSettingsDoc.exists() ? appSettingsDoc.data() as AppSettings : null;
    const calendars = calendarsQuery.docs.map(d => ({ id: d.id, ...d.data() } as SharedCalendar));
    
    return { appSettings, calendars };
}


export default async function CalendarPage() {
  const session = await auth().getUserByEmail('demo@strm.com'); // This should be replaced by actual auth
  const { appSettings, calendars } = await getCalendarData(session.uid);
  
  if (!appSettings) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl mb-2">Configuration Error</h2>
                <p className="text-muted-foreground">The application settings could not be found.</p>
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

  return <CalendarPageContent tab={calendarTabConfig} calendars={calendars} />;
}
