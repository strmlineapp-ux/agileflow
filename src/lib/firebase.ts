// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Single-Tenant Configuration (Current) ---
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Multi-Tenant Configuration (New Approach) ---

// In a real multi-tenant app, this would come from a secure master database
// that maps a tenant ID (like a subdomain) to their specific Firebase config.
const tenantConfigs: Record<string, FirebaseOptions> = {
  // This is our default/primary tenant, using the environment variables.
  default: firebaseConfig,
  // Example for a second tenant. In a real scenario, these values would be different.
  'company-b': {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_B,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_B,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_B,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_B,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_B,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_B,
  }
};

/**
 * Dynamically gets the initialized Firebase app for a given tenant.
 * This prevents re-initializing the same app on every request.
 * @param tenantId The identifier for the tenant (e.g., a subdomain).
 * @returns The initialized FirebaseApp instance for that tenant.
 */
export function getFirebaseAppForTenant(tenantId: string = 'default'): FirebaseApp {
  const appName = `tenant-${tenantId}`;
  const apps = getApps();
  const existingApp = apps.find(app => app.name === appName);
  
  if (existingApp) {
    return existingApp;
  }
  
  const config = tenantConfigs[tenantId] || tenantConfigs.default;

  return initializeApp(config, appName);
}


// To maintain compatibility with existing single-tenant code, we export a default setup.
// In a full refactor, all calls would use getFirebaseAppForTenant(currentTenantId).
const defaultApp = getFirebaseAppForTenant('default');
const auth = getAuth(defaultApp);
const db = getFirestore(defaultApp);

export { auth, db, GoogleAuthProvider };
// The 'app' export is deprecated in favor of the dynamic getFirebaseAppForTenant
// but kept for now to avoid breaking existing imports if any.
export const app = defaultApp;
