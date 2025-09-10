
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// This is a standard Firebase configuration object.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function ensures that we initialize Firebase only once.
function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Call the initialization function immediately.
initializeFirebase();

/**
 * A safe getter for the initialized Firestore instance.
 * @returns {Firestore} The initialized Firestore instance.
 */
export function getDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

/**
 * A safe getter for the initialized Auth instance.
 * @returns {Auth} The initialized Auth instance.
 */
export function getAuthInstance(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

/**
 * Since this is a single-workspace application, this function
 * simply returns the globally configured project ID. It's a placeholder
 * to maintain consistency with multi-workspace patterns if needed later.
 * @returns The workspace ID (Firebase Project ID).
 */
export function getCurrentWorkspaceId(): string {
  if (!firebaseConfig.projectId) {
    throw new Error("Firebase Project ID is not configured. Please check your environment variables.");
  }
  return firebaseConfig.projectId;
}
