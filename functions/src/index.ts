import * as admin from 'firebase-admin';
admin.initializeApp();

// This is the single entry point for all functions.
// We export all the functions from their individual files here.
export * from './user-management';
export * from './send-invitation';
export * from './calendar-webhook';
