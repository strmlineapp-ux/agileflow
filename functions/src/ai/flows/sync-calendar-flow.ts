'use server';
/**
 * @fileOverview A flow for syncing events from a Google Calendar.
 *
 * - syncCalendar - A function that handles fetching events from Google Calendar.
 * - SyncCalendarInput - The input type for the syncCalendar function.
 * - SyncCalendarOutput - The return type for the syncCalendar function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { google } from 'googleapis';
import { getFirestore } from 'firebase-admin/firestore';
import { startOfDay } from 'date-fns';

export const ai = genkit({
  plugins: [googleAI()],
});


const SyncCalendarInputSchema = z.object({
  googleCalendarId: z
    .string()
    .describe('The ID of the Google Calendar to sync.'),
  workspaceId: z
    .string()
    .describe('The ID of the workspace this calendar belongs to.'),
});
export type SyncCalendarInput = z.infer<typeof SyncCalendarInputSchema>;

const SyncCalendarOutputSchema = z.object({
  syncedEventCount: z.number().describe('The number of events synced from the calendar.'),
  // In a real implementation, you would return the actual event data.
});
export type SyncCalendarOutput = z.infer<typeof SyncCalendarOutputSchema>;


export async function syncCalendar(
  input: SyncCalendarInput
): Promise<SyncCalendarOutput> {
  return await syncCalendarFlow(input);
}


const syncCalendarFlow = ai.defineFlow(
  {
    name: 'syncCalendarFlow',
    inputSchema: SyncCalendarInputSchema,
    outputSchema: SyncCalendarOutputSchema,
  },
  async (input) => {
    console.log(`Starting REAL event sync for Google Calendar ID: ${input.googleCalendarId}`);

    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    const authClient = await auth.getClient();
    const calendarApi = google.calendar({version: 'v3', auth: authClient});
    
    const db = getFirestore();

    try {
        const response = await calendarApi.events.list({
            calendarId: input.googleCalendarId,
            timeMin: (startOfDay(new Date())).toISOString(),
            maxResults: 250, // Fetch a reasonable number of upcoming events
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        const events = response.data.items;

        if (!events || events.length === 0) {
            console.log('No upcoming events found.');
            return { syncedEventCount: 0 };
        }
        
        console.log(`Found ${events.length} events to sync.`);

        // In a full implementation, you would now process these events and
        // write them to your Firestore database, associating them with your
        // internal calendar and workspace.
        
        // For now, we will just log the event summaries.
        events.forEach(event => {
            console.log(`- ${event.summary} (${event.start?.dateTime || event.start?.date})`);
        });

        return {
            syncedEventCount: events.length,
        };

    } catch (err) {
      console.error('The API returned an error: ' + err);
      throw new Error('Failed to fetch calendar events.');
    }
  }
);
