
'use server';
/**
 * @fileOverview This file contains the Cloud Function that will serve as the
 * webhook for Google Calendar push notifications.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { syncCalendar } from '../../ai/flows/sync-calendar-flow';

/**
 * This function is triggered by an HTTP POST request from the Google Calendar API.
 * It processes the notification and triggers a sync for the relevant calendar.
 */
export const calendarWebhook = functions.https.onRequest(async (request, response) => {
  // Google sends a 'sync' header to verify the webhook endpoint upon creation.
  if (request.headers['x-goog-channel-state'] === 'sync') {
    functions.logger.info('Received sync request from Google Calendar API, webhook is verified.');
    response.status(200).send();
    return;
  }

  // Extract the calendar ID from the notification headers
  const googleCalendarId = request.headers['x-goog-resource-id'];

  if (typeof googleCalendarId !== 'string') {
    functions.logger.warn('Received a notification without a valid resource ID.', { headers: request.headers });
    response.status(400).send('Bad Request: Missing Google Calendar resource ID.');
    return;
  }

  functions.logger.info(`Received update notification for calendar: ${googleCalendarId}`);

  try {
    // In a real implementation, you would first find the internal calendar
    // associated with this googleCalendarId to pass more context if needed.

    // Trigger the Genkit sync flow for the specific calendar.
    await syncCalendar({ googleCalendarId });

    functions.logger.info(`Successfully triggered sync for calendar: ${googleCalendarId}`);
    response.status(200).send('Sync triggered successfully.');
  } catch (error) {
    functions.logger.error(`Failed to trigger sync for calendar ${googleCalendarId}`, error);
    response.status(500).send('Internal Server Error.');
  }
});
