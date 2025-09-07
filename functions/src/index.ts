
import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Export functions from their individual files
export { handleNewUserCreated as onNewUserCreated } from './user-management.js';
export { handleSendInvitation } from './send-invitation.js';
export { calendarWebhook } from './calendar-webhook.js';
