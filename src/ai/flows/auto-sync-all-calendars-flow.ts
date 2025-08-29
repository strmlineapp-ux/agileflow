
'use server';
/**
 * @fileOverview A "master" flow to automatically sync all linked Google Calendars.
 * This flow is designed to be triggered by a scheduler (e.g., a cron job).
 *
 * - autoSyncAllCalendars - A function that finds and syncs all calendars.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {syncCalendar, SyncCalendarInput} from './sync-calendar-flow';
import { getDb } from '@/lib/firebase';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { type SharedCalendar } from '@/types';


const AutoSyncOutputSchema = z.object({
  totalCalendarsToSync: z.number(),
  syncedCalendars: z.array(z.object({
    calendarId: z.string(),
    calendarName: z.string(),
    syncedEventCount: z.number(),
  })),
  failedCalendars: z.array(z.object({
    calendarId: z.string(),
    calendarName: z.string(),
    error: z.string(),
  })),
});

export async function autoSyncAllCalendars(): Promise<z.infer<typeof AutoSyncOutputSchema>> {
    return await autoSyncAllCalendarsFlow();
}

const autoSyncAllCalendarsFlow = ai.defineFlow(
  {
    name: 'autoSyncAllCalendarsFlow',
    outputSchema: AutoSyncOutputSchema,
  },
  async () => {
    console.log('Starting automatic synchronization for all calendars...');

    // 1. Fetch calendar data from Firestore.
    const db = getDb();
    const calendarsRef = collection(db, 'calendars');
    const q = query(calendarsRef, where('googleCalendarId', '!=', null));
    const querySnapshot = await getDocs(q);
    const linkedCalendars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedCalendar));

    console.log(`Found ${linkedCalendars.length} calendars to sync.`);

    const syncPromises = linkedCalendars.map(async (calendar) => {
      try {
        const syncInput: SyncCalendarInput = { googleCalendarId: calendar.googleCalendarId! };
        const result = await syncCalendar(syncInput);
        return {
          status: 'fulfilled' as const,
          value: {
            calendarId: calendar.id,
            calendarName: calendar.name,
            syncedEventCount: result.syncedEventCount,
          },
        };
      } catch (error) {
        return {
          status: 'rejected' as const,
          reason: {
            calendarId: calendar.id,
            calendarName: calendar.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    });

    const results = await Promise.all(syncPromises);
    
    const syncedCalendars = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as { status: 'fulfilled', value: any }).value);
        
    const failedCalendars = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as { status: 'rejected', reason: any }).reason);

    console.log(`Successfully synced ${syncedCalendars.length} calendars.`);
    if (failedCalendars.length > 0) {
      console.error(`Failed to sync ${failedCalendars.length} calendars.`);
    }

    return {
      totalCalendarsToSync: linkedCalendars.length,
      syncedCalendars,
      failedCalendars,
    };
  }
);
