
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Define a type for our workspace-specific configurations
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// A mock database of Firebase configurations for different workspaces.
// In a real multi-workspace application, this would be a secure, dynamic lookup.
const workspaceConfigs: Record<string, FirebaseConfig> = {
  default: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  // Example for a premium workspace with a dedicated project
  // 'acme-corp': { ... new firebase config ... }
};

// Store app instances in a map to support multiple workspaces
const firebaseApps = new Map<string, FirebaseApp>();
const authInstances = new Map<string, Auth>();
const firestoreInstances = new Map<string, Firestore>();

/**
 * Determines the current workspace ID from the hostname.
 * Falls back to 'default' for localhost or non-subdomain access.
 * @returns The workspace ID for the current context.
 */
export function getCurrentWorkspaceId(): string {
  if (typeof window === 'undefined') {
    return 'default'; // Return default for server-side rendering
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || !hostname.includes('.')) {
    return 'default';
  }

  const parts = hostname.split('.');
  const workspaceId = parts[0];

  // If the derived workspaceId doesn't have a specific config, fall back to default
  if (workspaceConfigs[workspaceId]) {
    return workspaceId;
  }
  
  return 'default';
}

/**
 * Gets the Firebase configuration for a specific workspace.
 * @param workspaceId The ID of the workspace.
 * @returns The Firebase configuration object.
 * @throws If the workspace configuration is not found.
 */
export function getFirebaseConfig(workspaceId: string): FirebaseConfig {
  const config = workspaceConfigs[workspaceId];
  if (!config) {
    // Fallback to default if a specific workspace config isn't found.
    // In a production app, you might want to throw an error instead.
    return workspaceConfigs['default'];
  }
  return config;
}

/**
 * A robust singleton pattern to initialize and retrieve the Firebase app instance
 * for a specific workspace.
 * @param workspaceId The ID of the workspace.
 * @returns The initialized Firebase app instance for the given workspace.
 */
export function getFirebaseAppForWorkspace(workspaceId: string): FirebaseApp {
  if (firebaseApps.has(workspaceId)) {
    return firebaseApps.get(workspaceId)!;
  }

  const config = getFirebaseConfig(workspaceId);
  // Use projectId for app name to ensure uniqueness for dedicated projects
  const appName = config.projectId; 
  
  const existingApp = getApps().find(app => app.name === appName);
  const app = existingApp || initializeApp(config, appName);

  firebaseApps.set(workspaceId, app);
  return app;
}


/**
 * A safe getter for the initialized Firestore instance for the current workspace.
 * @returns {Firestore} The initialized Firestore instance.
 */
export function getDb(): Firestore {
  const workspaceId = getCurrentWorkspaceId();
  if (firestoreInstances.has(workspaceId)) {
    return firestoreInstances.get(workspaceId)!;
  }
  const app = getFirebaseAppForWorkspace(workspaceId);
  const db = getFirestore(app);
  firestoreInstances.set(workspaceId, db);
  return db;
}

/**
 * A safe getter for the initialized Auth instance for the current workspace.
 * @returns {Auth} The initialized Auth instance.
 */
export function getAuthInstance(): Auth {
  const workspaceId = getCurrentWorkspaceId();
  if (authInstances.has(workspaceId)) {
    return authInstances.get(workspaceId)!;
  }
  const app = getFirebaseAppForWorkspace(workspaceId);
  const auth = getAuth(app);
  authInstances.set(workspaceId, auth);
  return auth;
}
