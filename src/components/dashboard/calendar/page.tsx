

'use client';

import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useDataQueries } from '@/hooks/use-data-queries';
import { type SharedCalendar } from '@/types';

export default function CalendarPage() {
  const { viewAsUser } = useUser();
  const { useFetchAppSettings } = useDataQueries();
  const { data: appSettings, isLoading: isLoadingSettings } = useFetchAppSettings(viewAsUser?.workspaceId);
  
  // In a real app, you might fetch calendars separately or ensure they are part of a global context.
  // For now, we'll assume they come from a context or are passed down.
  const allCalendars: SharedCalendar[] = []; // Placeholder

  const calendarTabConfig = appSettings?.tabs.find(t => t.id === 'tab-calendar');

  if (isLoadingSettings || !viewAsUser) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
        </div>
    )
  }

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

  return <CalendarPageContent tab={calendarTabConfig} initialCalendars={allCalendars} />;
}
