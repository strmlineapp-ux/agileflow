
'use server';
/**
 * @fileOverview A flow for setting up a push notification channel to watch a Google Calendar.
 *
 * - watchGoogleCalendar - A function that initiates the watch request.
 * - WatchGoogleCalendarInput - The input type for the watchGoogleCalendar function.
 * - WatchGoogleCalendarOutput - The return type for the watchGoogleCalendar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { getAuthorizedClient } from '../../google-auth-service';

const WatchGoogleCalendarInputSchema = z.object({
  googleCalendarId: z.string().describe('The ID of the Google Calendar to watch.'),
  webhookUrl: z.string().url().describe('The URL of the webhook to send notifications to.'),
  userId: z.string().describe('The ID of the user initiating the watch request.'),
});
export type WatchGoogleCalendarInput = z.infer<typeof WatchGoogleCalendarInputSchema>;

const WatchGoogleCalendarOutputSchema = z.object({
  channelId: z.string().describe('The ID of the created notification channel.'),
  resourceId: z.string().describe('The resource ID of the watched calendar.'),
  expiration: z.string().describe('The expiration date of the watch channel.'),
});
export type WatchGoogleCalendarOutput = z.infer<typeof WatchGoogleCalendarOutputSchema>;

export async function watchGoogleCalendar(
  input: WatchGoogleCalendarInput
): Promise<WatchGoogleCalendarOutput> {
  return await watchGoogleCalendarFlow(input);
}


const watchGoogleCalendarFlow = ai.defineFlow(
  {
    name: 'watchGoogleCalendarFlow',
    inputSchema: WatchGoogleCalendarInputSchema,
    outputSchema: WatchGoogleCalendarOutputSchema,
  },
  async (input) => {
    console.log(`Setting up a REAL watch on calendar: ${input.googleCalendarId} for user ${input.userId}`);
    
    const authClient = await getAuthorizedClient(input.userId);
    if (!authClient) {
      throw new Error(`User ${input.userId} is not authorized. Please connect your Google Account in settings.`);
    }

    const calendarApi = google.calendar({version: 'v3', auth: authClient});

    try {
      const response = await calendarApi.events.watch({
        calendarId: input.googleCalendarId,
        requestBody: {
          id: uuidv4(), // A unique ID for the channel
          type: 'web_hook',
          address: input.webhookUrl,
        },
      });

      const { id, resourceId, expiration } = response.data;
      if (!id || !resourceId || !expiration) {
        throw new Error('Incomplete response from Google Calendar API watch request.');
      }
      
      console.log(`Successfully created watch channel ${id} for calendar ${resourceId}. It expires on ${new Date(parseInt(expiration))}`);

      return {
        channelId: id,
        resourceId: resourceId,
        expiration: expiration,
      };

    } catch (err: any) {
      console.error('The API returned an error: ' + err);
      // Check for specific OAuth-related errors which might indicate expired tokens
      if (err.message.includes('invalid_grant') || err.message.includes('Token has been expired or revoked')) {
         throw new Error(`Authorization for user ${input.userId} has expired. Please re-authorize.`);
      }
      throw new Error(`Failed to set up watch for calendar ${input.googleCalendarId}. Error: ${err.message}`);
    }
  }
);
