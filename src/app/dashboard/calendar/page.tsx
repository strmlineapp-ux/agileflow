'use client';

import { CalendarPageContent } from '@/components/dashboard/tabs/calendar-tab';

export default function CalendarPage() {
  // The tab and page props are simplified as they are no longer needed for routing.
  // We pass a minimal mock object for prop compatibility.
  const mockTab = { id: 'tab-calendar', name: 'Calendar', icon: 'calendar_month', color: '#0EA5E9', componentKey: 'calendar' as const };
  
  return <CalendarPageContent tab={mockTab} />;
}
