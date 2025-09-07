
'use server';
import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { type Credentials, OAuth2Client } from 'google-auth-library';

/**
 * Saves the user's API credentials securely in Firestore.
 * @param userId The user's unique ID.
 * @param credential The OAuth2 credential object from Firebase.
 */
export async function saveCredentials(userId: string, credential: { accessToken?: string, idToken?: string }): Promise<void> {
  const db = getDb();
  const tokenDocRef = doc(db, 'google-auth-tokens', userId);
  
  if (!credential.accessToken) {
    throw new Error('No access token found in credential.');
  }

  await setDoc(tokenDocRef, { 
    userId: userId,
    accessToken: credential.accessToken,
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
  const accessToken = tokens.accessToken;

  if (!accessToken) {
    console.warn(`Access token is missing for user: ${userId}`);
    return null;
  }
  
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: accessToken });
  
  return oAuth2Client;
}
