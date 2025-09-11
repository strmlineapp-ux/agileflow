
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { OAuth2Client, type Credentials } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;

/**
 * Creates and configures a Google OAuth2 client.
 * The redirect URI is now dynamically determined based on the environment.
 */
export async function getOAuth2Client(): Promise<OAuth2Client> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth client environment variables are not set.');
  }

  // This is the function URL for the deployed callback.
  // In a more complex setup, this might be dynamically configured.
  const redirectUri = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/googleAuthCallback`;
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Saves the user's API credentials securely in Firestore.
 * @param userId The user's unique ID.
 * @param tokens The OAuth2 tokens from Google.
 */
export async function saveCredentials(userId: string, tokens: Credentials): Promise<void> {
  const db = getFirestore();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  
  if (!tokens.access_token) {
    console.warn('Attempted to save credentials without an access token.');
    return;
  }
  
  await setDoc(tokenDocRef, {
    userId,
    ...tokens
  }, { merge: true });
}

/**
 * Retrieves an authorized OAuth2 client for making API calls on behalf of a user.
 * @param userId The ID of the user.
 * @returns An authorized OAuth2 client.
 * @throws If tokens are not found or invalid, indicating re-authorization is needed.
 */
export async function getAuthorizedClient(userId: string): Promise<OAuth2Client> {
  const db = getFirestore();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  const tokenDoc = await getDoc(tokenDocRef);

  if (!tokenDoc.exists()) {
    throw new Error(`No auth tokens found for user: ${userId}. User needs to sign in again to grant permissions.`);
  }

  const tokens = tokenDoc.data();
  if (!tokens.access_token) {
    throw new Error(`Stored tokens for user ${userId} are missing an access token. User needs to sign in again.`);
  }

  const oAuth2Client = await getOAuth2Client();
  oAuth2Client.setCredentials(tokens as Credentials);
  
  return oAuth2Client;
}
