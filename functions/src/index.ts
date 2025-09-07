
import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Export functions from their individual files
export { onNewUserCreated } from './user-management.js';
export { triggerSendInvitation as sendInvitation } from './send-invitation.js';
export { calendarWebhook } from './calendar-webhook.js';
