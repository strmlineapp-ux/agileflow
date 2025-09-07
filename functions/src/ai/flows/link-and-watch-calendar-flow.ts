
'use server';
/**
 * @fileOverview A master flow for linking a Google Calendar and immediately setting up a watch channel.
 *
 * - linkAndWatchCalendar - The primary function to handle the linking and watching process.
 * - LinkAndWatchCalendarInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase-admin/firestore';
import { watchGoogleCalendar, WatchGoogleCalendarOutput } from './watch-google-calendar-flow';

const LinkAndWatchCalendarInputSchema = z.object({
  calendarId: z.string().describe('The internal Firestore ID of the calendar document.'),
  googleCalendarId: z.string().describe('The ID of the Google Calendar to link and watch.'),
});
export type LinkAndWatchCalendarInput = z.infer<typeof LinkAndWatchCalendarInputSchema>;

export async function linkAndWatchCalendar(
  input: LinkAndWatchCalendarInput
): Promise<WatchGoogleCalendarOutput> {
  return await linkAndWatchCalendarFlow(input);
}


const linkAndWatchCalendarFlow = ai.defineFlow(
  {
    name: 'linkAndWatchCalendarFlow',
    inputSchema: LinkAndWatchCalendarInputSchema,
    outputSchema: WatchGoogleCalendarOutput,
  },
  async (input) => {
    console.log(`Starting link and watch process for internal calendar ${input.calendarId}`);

    const db = getFirestore();
    const calendarDocRef = doc(db, 'calendars', input.calendarId);
    const calendarDoc = await getDoc(calendarDocRef);

    if (!calendarDoc.exists()) {
        throw new Error(`Internal calendar with ID ${input.calendarId} not found.`);
    }

    const calendarData = calendarDoc.data();
    const ownerId = calendarData?.owner?.id;

    if (!ownerId) {
        throw new Error(`Calendar ${input.calendarId} does not have an owner.`);
    }

    // 1. Update the Firestore document with the Google Calendar ID.
    await updateDoc(calendarDocRef, {
      googleCalendarId: input.googleCalendarId,
    });
    
    console.log(`Successfully linked Google Calendar ID ${input.googleCalendarId} to internal calendar ${input.calendarId}.`);

    // 2. Set up the watch channel using the other flow.
    // In a real app, this URL would be dynamically configured and secured.
    const webhookUrl = `https://us-central1-agileflow-mlf18.cloudfunctions.net/calendarWebhook`;
    
    const watchResult = await watchGoogleCalendar({
      googleCalendarId: input.googleCalendarId,
      webhookUrl: webhookUrl,
      userId: ownerId, // Pass the owner's ID for authorization
    });

    console.log('Successfully set up watch channel.');

    return watchResult;
  }
);
