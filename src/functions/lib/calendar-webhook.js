"use strict";
'use server';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarWebhook = void 0;
/**
 * @fileOverview This file contains the Cloud Function that will serve as the
 * webhook for Google Calendar push notifications.
 */
const https_1 = require("firebase-functions/v2/https");
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const sync_calendar_flow_1 = require("./sync-calendar-flow");
/**
 * Finds the internal calendar document and its workspaceId based on the googleCalendarId.
 * @param {string} googleCalendarId The Google Calendar ID from the webhook notification.
 * @return {Promise<{workspaceId: string} | null>} A promise that resolves to the workspace ID or null if not found.
 */
async function getWorkspaceForCalendar(googleCalendarId) {
    const db = (0, firestore_1.getFirestore)();
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
exports.calendarWebhook = (0, https_1.onRequest)(async (request, response) => {
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
        await (0, sync_calendar_flow_1.syncCalendar)({ googleCalendarId, workspaceId });
        functions.logger.info(`Successfully triggered sync for calendar: ${googleCalendarId} in workspace: ${workspaceId}`);
        response.status(200).send('Sync triggered successfully.');
    }
    catch (error) {
        functions.logger.error(`Failed to trigger sync for calendar ${googleCalendarId}`, error);
        response.status(500).send('Internal Server Error.');
    }
});
//# sourceMappingURL=calendar-webhook.js.map