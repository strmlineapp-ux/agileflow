import * as admin from 'firebase-admin';
admin.initializeApp();

// This is the single entry point for all functions.
// We export all the functions from their individual files here.
export * from './user-management.js';
export * from './send-invitation.js';
export * from './calendar-webhook.js';
