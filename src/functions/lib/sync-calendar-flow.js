"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCalendar = syncCalendar;
/**
 * @fileOverview A flow for syncing events from a Google Calendar.
 *
 * - syncCalendar - A function that handles fetching events from Google Calendar.
 * - SyncCalendarInput - The input type for the syncCalendar function.
 * - SyncCalendarOutput - The return type for the syncCalendar function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const googleapis_1 = require("googleapis");
const firestore_1 = require("firebase-admin/firestore");
const date_fns_1 = require("date-fns");
const SyncCalendarInputSchema = genkit_2.z.object({
    googleCalendarId: genkit_2.z
        .string()
        .describe('The ID of the Google Calendar to sync.'),
    workspaceId: genkit_2.z
        .string()
        .describe('The ID of the workspace this calendar belongs to.'),
});
const SyncCalendarOutputSchema = genkit_2.z.object({
    syncedEventCount: genkit_2.z.number().describe('The number of events synced from the calendar.'),
});
async function syncCalendar(input) {
    return await syncCalendarFlow(input);
}
const syncCalendarFlow = genkit_1.ai.defineFlow({
    name: 'syncCalendarFlow',
    inputSchema: SyncCalendarInputSchema,
    outputSchema: SyncCalendarOutputSchema,
}, async (input) => {
    var _a, _b;
    console.log(`Starting REAL event sync for Google Calendar ID: ${input.googleCalendarId} in workspace ${input.workspaceId}`);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
    const db = (0, firestore_1.getFirestore)();
    try {
        const authClient = await auth.getClient();
        const calendarApi = googleapis_1.google.calendar({ version: 'v3', auth: authClient });
        const response = await calendarApi.events.list({
            calendarId: input.googleCalendarId,
            timeMin: ((0, date_fns_1.startOfDay)(new Date())).toISOString(),
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
        const internalCalendar = internalCalendarQuery.docs[0].data();
        const batch = db.batch();
        for (const event of events) {
            if (!event.id || !event.summary || !((_a = event.start) === null || _a === void 0 ? void 0 : _a.dateTime) || !((_b = event.end) === null || _b === void 0 ? void 0 : _b.dateTime)) {
                console.warn('Skipping event with missing data:', event.summary || 'No Title');
                continue;
            }
            // Use a consistent ID based on workspace and Google event ID
            const eventDocId = `${input.workspaceId}_${event.id}`;
            const eventDocRef = db.collection('events').doc(eventDocId);
            const newEventData = {
                title: event.summary,
                googleEventId: event.id,
                startTime: firestore_1.Timestamp.fromDate(new Date(event.start.dateTime)),
                endTime: firestore_1.Timestamp.fromDate(new Date(event.end.dateTime)),
                description: event.description || '',
                location: event.location || '',
                calendarId: internalCalendar.id, // Link to our internal calendar
                attendees: (event.attendees || []).map(a => ({
                    email: a.email,
                    displayName: a.displayName || a.email,
                    responseStatus: a.responseStatus,
                })),
                attachments: [], // Attachments need more complex handling
                createdBy: 'system-sync',
                createdAt: firestore_1.Timestamp.fromDate(new Date(event.created)),
                lastUpdated: firestore_1.Timestamp.fromDate(new Date(event.updated)),
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
    }
    catch (err) {
        console.error('The API returned an error: ' + err.message, err);
        throw new Error('Failed to fetch calendar events.');
    }
});
//# sourceMappingURL=sync-calendar-flow.js.map