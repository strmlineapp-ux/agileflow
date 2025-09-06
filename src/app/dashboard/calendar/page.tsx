

'use client';

import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function CalendarPage() {
  const { appSettings, loading } = useUser();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
      </div>
    );
  }
  
  const calendarPageConfig = appSettings.pages.find(p => p.id === 'page-calendar');
  const calendarTabConfig = appSettings.tabs.find(t => t.id === 'tab-calendar');


  if (!calendarPageConfig || !calendarTabConfig) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
            <h2 className="text-2xl mb-2">Configuration Error</h2>
            <p className="text-muted-foreground">The main calendar page configuration could not be found.</p>
            </div>
      </div>
    )
  }

  return <CalendarPageContent tab={calendarTabConfig} />;
}
