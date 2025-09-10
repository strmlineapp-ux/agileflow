
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function ensures we initialize the app only once.
// On the client, it behaves like a singleton.
// On the server, it prevents re-initialization on every hot-reload during development.
function getClientApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  const app = initializeApp(firebaseConfig);
  return app;
}

// These getters provide a clean and consistent way to access Firebase services.
// They ensure the app is initialized before any service is used.
export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}

export function getClientDb(): Firestore {
  return getFirestore(getClientApp());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getClientApp());
}

/**
 * Note on Server-Side Firebase:
 * 
 * For server-side operations (in API Routes or getServerSideProps), especially those requiring
 * elevated privileges or bypassing security rules (like admin tasks), it is STRONGLY
 * recommended to use the Firebase Admin SDK.
 * 
 * The client-side SDK initialized here is intended for client-facing operations and will
 * adhere to your security rules from the user's perspective. For any backend logic,
 * the Admin SDK provides a secure and privileged environment.
 * 
 * You would typically initialize the Admin SDK in a separate file, e.g., `firebase-admin.ts`.
 */
