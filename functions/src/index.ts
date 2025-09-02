import * as admin from 'firebase-admin';
admin.initializeApp();

// This is the single entry point for all functions.
// We export all the functions from their individual files here.
export { onNewUserCreated } from './user-management.js';
export { sendInvitation } from './send-invitation.js';
export { calendarWebhook } from './calendar-webhook.js';
