
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { OAuth2Client } from 'google-auth-library';
import type { OAuthCredential } from 'firebase/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// The redirect URI is now handled internally by Firebase SDK, but we keep it for the client setup.
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/**
 * Creates and configures a Google OAuth2 client.
 */
export async function getOAuth2Client(): Promise<OAuth2Client> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth client environment variables are not set.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Saves the user's API credentials securely in Firestore.
 * @param userId The user's unique ID.
 * @param credential The OAuth2 credential from Google Sign-In.
 */
export async function saveCredentials(userId: string, credential: OAuthCredential): Promise<void> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  
  if (!credential.accessToken) {
    console.warn('Attempted to save credentials without an access token.');
    return;
  }
  
  await setDoc(tokenDocRef, {
    userId,
    accessToken: credential.accessToken,
  }, { merge: true });
}

/**
 * Retrieves an authorized OAuth2 client for making API calls on behalf of a user.
 * @param userId The ID of the user.
 * @returns An authorized OAuth2 client.
 * @throws If tokens are not found or invalid, indicating re-authorization is needed.
 */
export async function getAuthorizedClient(userId: string): Promise<OAuth2Client> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  const tokenDoc = await getDoc(tokenDocRef);

  if (!tokenDoc.exists()) {
    throw new Error(`No auth tokens found for user: ${userId}. User needs to sign in again to grant permissions.`);
  }

  const tokens = tokenDoc.data();
  if (!tokens.accessToken) {
    throw new Error(`Stored tokens for user ${userId} are missing an access token. User needs to sign in again.`);
  }

  const oAuth2Client = await getOAuth2Client();
  oAuth2Client.setCredentials({
    access_token: tokens.accessToken,
  });
  
  return oAuth2Client;
}
