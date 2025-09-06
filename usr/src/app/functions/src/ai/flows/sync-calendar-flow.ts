
'use server';
/**
 * @fileOverview A flow for syncing events from a Google Calendar.
 *
 * - syncCalendar - A function that handles fetching events from Google Calendar.
 * - SyncCalendarInput - The input type for the syncCalendar function.
 * - SyncCalendarOutput - The return type for the syncCalendar function.
 */

import { genkit, z } from 'genkit';
import { google } from '@genkit-ai/google';
import { google as googleapis } from 'googleapis';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { startOfDay } from 'date-fns';
import { type Event, type SharedCalendar } from '@/types';

export const ai = genkit({
  plugins: [google()],
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
    console.log(`Starting REAL event sync for Google Calendar ID: ${input.googleCalendarId} in workspace ${input.workspaceId}`);

    const auth = new googleapis.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    const authClient = await auth.getClient();
    const calendarApi = googleapis.calendar({version: 'v3', auth: authClient});
    
    const db = getFirestore();

    try {
        const response = await calendarApi.events.list({
            calendarId: input.googleCalendarId,
            timeMin: (startOfDay(new Date())).toISOString(),
            maxResults: 250, 
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        const events = response.data.items;

        if (!events || events.length === 0) {
            console.log('No upcoming events found.');
            return { syncedEventCount: 0 };
        }
        
        console.log(`Found ${events.length} events to sync.`);

        const internalCalendarQuery = await db.collection('calendars')
            .where('googleCalendarId', '==', input.googleCalendarId)
            .where('workspaceId', '==', input.workspaceId)
            .limit(1)
            .get();
        
        if (internalCalendarQuery.empty) {
            throw new Error(`Could not find internal calendar for Google ID ${input.googleCalendarId}`);
        }
        
        const internalCalendar = internalCalendarQuery.docs[0].data() as SharedCalendar;

        const batch = db.batch();

        for (const event of events) {
            if (!event.id || !event.summary || !event.start?.dateTime || !event.end?.dateTime) {
                console.warn('Skipping event with missing data:', event.summary || 'No Title');
                continue;
            }
            
            // Use a consistent ID based on workspace and Google event ID
            const eventDocId = `${input.workspaceId}_${event.id}`;
            const eventDocRef = db.collection('events').doc(eventDocId);
            
            const newEventData: Omit<Event, 'eventId'> = {
                title: event.summary,
                googleEventId: event.id,
                startTime: Timestamp.fromDate(new Date(event.start.dateTime)),
                endTime: Timestamp.fromDate(new Date(event.end.dateTime)),
                description: event.description || '',
                location: event.location || '',
                calendarId: internalCalendar.id, // Link to our internal calendar
                attendees: (event.attendees || []).map(a => ({
                    email: a.email!,
                    displayName: a.displayName || a.email!,
                    responseStatus: a.responseStatus as any,
                })),
                attachments: [], // Attachments need more complex handling
                createdBy: 'system-sync',
                createdAt: Timestamp.fromDate(new Date(event.created!)),
                lastUpdated: Timestamp.fromDate(new Date(event.updated!)),
                priority: 'badge-priority-normal', // Default priority
                workspaceId: input.workspaceId,
                // These fields need a mapping strategy from Google event data
                projectId: '', 
                roleAssignments: {},
            };
            
            batch.set(eventDocRef, newEventData, { merge: true });
        }
        
        await batch.commit();

        console.log(`Successfully synced ${events.length} events to Firestore.`);

        return {
            syncedEventCount: events.length,
        };

    } catch (err: any) {
      console.error('The API returned an error: ' + err.message, err);
      throw new Error('Failed to fetch calendar events.');
    }
  }
);
