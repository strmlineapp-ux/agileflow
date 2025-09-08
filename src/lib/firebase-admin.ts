
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    // If you're running this in a serverless environment (like Firebase Functions or Cloud Run),
    // and you've given the service account the right permissions, you don't need to provide credentials here.
    // The SDK will automatically find them.
  });
}

const firestore = admin.firestore();
const auth = admin.auth();

export { firestore, auth };
