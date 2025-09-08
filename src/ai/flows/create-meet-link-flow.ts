
'use server';
/**
 * @fileOverview A flow for creating a Google Meet link for an event.
 *
 * - createMeetLink - A function that handles the Google Meet link creation process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuthorizedClient } from '@/lib/google-auth-service';
import { google } from 'googleapis';

const CreateMeetLinkInputSchema = z.object({
  userId: z.string().describe('The ID of the user initiating the request.'),
  summary: z.string().describe('The summary or title for the calendar event.'),
  startTime: z.string().datetime().describe('The start time for the event in ISO format.'),
  endTime: z.string().datetime().describe('The end time for the event in ISO format.'),
});

export const CreateMeetLinkOutputSchema = z.object({
  meetLink: z.string().url().describe('The generated Google Meet link.'),
});

export type CreateMeetLinkInput = z.infer<typeof CreateMeetLinkInputSchema>;
export type CreateMeetLinkOutput = z.infer<typeof CreateMeetLinkOutputSchema>;

export async function createMeetLink(
  input: CreateMeetLinkInput
): Promise<CreateMeetLinkOutput> {
  return await createMeetLinkFlow(input);
}


const createMeetLinkFlow = ai.defineFlow(
  {
    name: 'createMeetLinkFlow',
    inputSchema: CreateMeetLinkInputSchema,
    outputSchema: CreateMeetLinkOutputSchema,
  },
  async ({ userId, summary, startTime, endTime }) => {
    try {
      const oAuth2Client = await getAuthorizedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      const event = {
        summary,
        start: { dateTime: startTime, timeZone: 'America/New_York' },
        end: { dateTime: endTime, timeZone: 'America/New_York' },
        conferenceData: {
          createRequest: {
            requestId: `strm-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      // We use the "primary" calendar of the authenticated user to create a temporary
      // event which generates the Meet link. We don't store this event.
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });
      
      const meetLink = res.data.hangoutLink;
      
      if (!meetLink) {
        throw new Error('Google Meet link was not created.');
      }
      
      // We can optionally delete the temporary event from the user's calendar immediately.
      // For now, we'll leave it as it can be useful for tracking.
      // if (res.data.id) {
      //   await calendar.events.delete({ calendarId: 'primary', eventId: res.data.id });
      // }
      
      return { meetLink };
    } catch (error: any) {
      console.error('Error creating Google Meet link:', error);
      // Check for auth-related errors and provide a more specific message
      if (error.message.includes('No auth tokens') || error.message.includes('invalid_grant')) {
          throw new Error('Authentication failed. Please try signing in again to refresh your connection to Google.');
      }
      throw new Error(`Failed to create Google Meet link. Please ensure you have granted calendar permissions.`);
    }
  }
);
