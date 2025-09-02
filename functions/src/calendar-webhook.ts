
'use server';
/**
 * @fileOverview This file contains the Cloud Function that will serve as the
 * webhook for Google Calendar push notifications.
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { syncCalendar } from './ai/flows/sync-calendar-flow.js';


/**
 * Finds the internal calendar document and its workspaceId based on the googleCalendarId.
 * @param {string} googleCalendarId The Google Calendar ID from the webhook notification.
 * @return {Promise<{workspaceId: string} | null>} A promise that resolves to the workspace ID or null if not found.
 */
async function getWorkspaceForCalendar(googleCalendarId: string): Promise<{ workspaceId: string } | null> {
    const db = getFirestore();
    const calendarsRef = db.collection('calendars');
    const q = calendarsRef.where('googleCalendarId', '==', googleCalendarId).limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
        functions.logger.warn(`No internal calendar found for googleCalendarId: ${googleCalendarId}`);
        return null;
    }

    const calendarDoc = snapshot.docs[0];
    const calendarData = calendarDoc.data();

    if (!calendarData.workspaceId) {
        functions.logger.error(`Internal calendar ${calendarDoc.id} is missing a workspaceId.`);
        return null;
    }

    return { workspaceId: calendarData.workspaceId };
}


/**
 * This function is triggered by an HTTP POST request from the Google Calendar API.
 * It processes the notification and triggers a sync for the relevant calendar.
 */
export const calendarWebhook = onRequest(async (request, response) => {
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
    // Find the workspace associated with this Google Calendar ID.
    const context = await getWorkspaceForCalendar(googleCalendarId);
    if (!context) {
      response.status(404).send('No workspace configured for this calendar.');
      return;
    }

    const { workspaceId } = context;

    // Trigger the Genkit sync flow with the required workspace context.
    await syncCalendar({ googleCalendarId, workspaceId });

    functions.logger.info(`Successfully triggered sync for calendar: ${googleCalendarId} in workspace: ${workspaceId}`);
    response.status(200).send('Sync triggered successfully.');
  } catch (error) {
    functions.logger.error(`Failed to trigger sync for calendar ${googleCalendarId}`, error);
    response.status(500).send('Internal Server Error.');
  }
});
