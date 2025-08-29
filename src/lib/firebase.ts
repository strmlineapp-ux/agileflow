
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Define a type for our tenant-specific configurations
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// A mock database of Firebase configurations for different tenants.
// In a real multi-tenant application, this would be a secure, dynamic lookup.
const tenantConfigs: Record<string, FirebaseConfig> = {
  default: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  // Example of another tenant's configuration
  // 'tenant-b': { ... }
};

// Store app instances in a map to support multiple tenants
const firebaseApps = new Map<string, FirebaseApp>();
const authInstances = new Map<string, Auth>();
const firestoreInstances = new Map<string, Firestore>();

/**
 * Determines the current tenant ID based on the window's hostname.
 * In a server context or during build, it safely falls back to 'default'.
 * @returns The current tenant ID.
 */
function getCurrentTenantId(): string {
  // Check if we are running in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Handle localhost for development
    if (hostname === 'localhost') {
      return 'default';
    }
    // Extract subdomain (e.g., 'acme' from 'acme.agileflow.app')
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      const tenantId = parts[0];
      // Check if a configuration exists for this tenant
      if (tenantConfigs[tenantId]) {
        return tenantId;
      }
    }
  }
  
  // Fallback for server-side rendering or non-subdomain access
  return 'default';
}

/**
 * Gets the Firebase configuration for a specific tenant.
 * @param tenantId The ID of the tenant.
 * @returns The Firebase configuration object.
 * @throws If the tenant configuration is not found.
 */
export function getFirebaseConfig(tenantId: string): FirebaseConfig {
  const config = tenantConfigs[tenantId];
  if (!config) {
    throw new Error(`Configuration for tenant "${tenantId}" not found.`);
  }
  return config;
}

/**
 * A robust singleton pattern to initialize and retrieve the Firebase app instance
 * for a specific tenant.
 * @param tenantId The ID of the tenant.
 * @returns The initialized Firebase app instance for the given tenant.
 */
export function getFirebaseAppForTenant(tenantId: string): FirebaseApp {
  if (firebaseApps.has(tenantId)) {
    return firebaseApps.get(tenantId)!;
  }

  const config = getFirebaseConfig(tenantId);
  const appName = `tenant-${tenantId}`;
  
  // Avoid re-initializing an app with the same name
  const existingApp = getApps().find(app => app.name === appName);
  const app = existingApp || initializeApp(config, appName);

  firebaseApps.set(tenantId, app);
  return app;
}


/**
 * A safe getter for the initialized Firestore instance for the current tenant.
 * @returns {Firestore} The initialized Firestore instance.
 */
export function getDb(): Firestore {
  const tenantId = getCurrentTenantId();
  if (firestoreInstances.has(tenantId)) {
    return firestoreInstances.get(tenantId)!;
  }
  const app = getFirebaseAppForTenant(tenantId);
  const db = getFirestore(app);
  firestoreInstances.set(tenantId, db);
  return db;
}

/**
 * A safe getter for the initialized Auth instance for the current tenant.
 * @returns {Auth} The initialized Auth instance.
 */
export function getAuthInstance(): Auth {
  const tenantId = getCurrentTenantId();
  if (authInstances.has(tenantId)) {
    return authInstances.get(tenantId)!;
  }
  const app = getFirebaseAppForTenant(tenantId);
  const auth = getAuth(app);
  authInstances.set(tenantId, auth);
  return auth;
}
