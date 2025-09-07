
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { OAuth2Client, type Credentials } from 'google-auth-library';
import type { OAuthCredential, User as FirebaseUser } from 'firebase/auth';

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

  // Dynamically determine the redirect URI.
  // VERCEL_URL is provided by Vercel deployments.
  // NEXT_PUBLIC_URL is for local development via .env.
  const vercelUrl = process.env.VERCEL_URL;
  const ngrokUrl = process.env.NGROK_URL; // Studio uses ngrok
  const baseUrl = ngrokUrl ? `https://${ngrokUrl}` : (vercelUrl ? `https://${vercelUrl}` : process.env.NEXT_PUBLIC_URL);
  
  if (!baseUrl) {
    throw new Error("Could not determine base URL for OAuth redirect URI.");
  }
  
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  console.log(`Using Google OAuth Redirect URI: ${redirectUri}`);

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Saves the user's API credentials securely in Firestore.
 * This should be called after a successful OAuth2 callback.
 * @param userId The user's unique ID.
 * @param tokens The OAuth2 tokens from Google.
 */
export async function saveCredentials(userId: string, tokens: Credentials): Promise<void> {
  const db = getDb();
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
  const db = getDb();
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
