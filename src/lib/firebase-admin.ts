
import * as admin from 'firebase-admin';

// Prevent re-initialization in development
if (!admin.apps.length) {
  // When deployed to Firebase, service account credentials will be automatically
  // discovered. For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
  // environment variable in your .env.development file.
  admin.initializeApp();
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
