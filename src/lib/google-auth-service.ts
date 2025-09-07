
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { type Credentials } from 'google-auth-library';

// These should be stored securely in environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/**
 * Creates and configures a Google OAuth2 client.
 */
export function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth environment variables are not set.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generates the authorization URL for the user to grant permissions.
 * @param userId The ID of the user initiating the authorization.
 * @returns The authorization URL.
 */
export async function getAuthServiceUrl(userId: string): Promise<string> {
  const oAuth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar' // Read/write access
  ];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token
    prompt: 'consent',     // Ensure the user is prompted for consent every time
    scope: scopes,
    state: userId,         // Pass the userId to identify the user on callback
  });
}

/**
 * Saves the user's API credentials securely in Firestore.
 * @param userId The user's unique ID.
 * @param tokens The OAuth2 tokens.
 */
export async function saveCredentials(userId: string, tokens: Credentials): Promise<void> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  await setDoc(tokenDocRef, { 
    userId: userId,
    ...tokens,
    // Add expiry_date for easier management if not already present
    expiry_date: tokens.expiry_date || Date.now() + (tokens.expires_in || 0) * 1000,
   });
  // Also update the user's main document to indicate they are authorized
  await setDoc(doc(db, 'users', userId), { googleApiAuthorized: true }, { merge: true });
}

/**
 * Retrieves an authorized OAuth2 client for making API calls on behalf of a user.
 * It will handle token refreshing automatically.
 * @param userId The ID of the user.
 * @returns An authorized OAuth2 client or null if credentials are not found.
 */
export async function getAuthorizedClient(userId: string): Promise<any | null> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  const tokenDoc = await getDoc(tokenDocRef);

  if (!tokenDoc.exists()) {
    console.warn(`No auth tokens found for user: ${userId}`);
    return null;
  }

  const tokens = tokenDoc.data() as Credentials;
  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials(tokens);

  // The googleapis library handles token refreshing automatically if a refresh_token is present.
  
  return oAuth2Client;
}

    