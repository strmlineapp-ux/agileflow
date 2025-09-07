
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { OAuth2Client, type Credentials } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/**
 * Creates and configures a Google OAuth2 client.
 */
export async function getOAuth2Client(): Promise<OAuth2Client> {
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
 * Saves the user's API credentials securely in Firestore.
 * This now expects an OAuthCredential object.
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
    // Note: Refresh tokens are typically only provided on the very first authorization.
    // The current flow will re-prompt for consent to ensure we always get a valid access token.
  }, { merge: true });
}

/**
 * Retrieves an authorized OAuth2 client for making API calls on behalf of a user.
 * @param userId The ID of the user.
 * @returns An authorized OAuth2 client or null if credentials are not found.
 */
export async function getAuthorizedClient(userId: string): Promise<OAuth2Client | null> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  const tokenDoc = await getDoc(tokenDocRef);

  if (!tokenDoc.exists()) {
    console.warn(`No auth tokens found for user: ${userId}`);
    return null;
  }

  const tokens = tokenDoc.data();
  if (!tokens.accessToken) {
    console.warn(`Stored tokens for user ${userId} are missing an access token.`);
    return null;
  }

  const oAuth2Client = await getOAuth2Client();
  oAuth2Client.setCredentials({
    access_token: tokens.accessToken,
  });
  
  return oAuth2Client;
}
