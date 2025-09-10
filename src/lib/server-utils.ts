
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';
import { type User } from '@/types';

/**
 * Gets the authenticated user's data from the server-side.
 * 
 * This function uses the Firebase Admin SDK to verify the authentication token
 * from the request cookies. If the token is valid, it fetches the user's
 * profile from Firestore.
 * 
 * @returns A Promise that resolves to the User object or null if not authenticated.
 */
export async function getServerUser(): Promise<User | null> {
  const token = cookies().get('firebaseIdToken')?.value;

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.warn(`User document not found for authenticated user ID: ${userId}`);
      return null;
    }

    // We manually construct the User object to ensure it matches our type definition.
    const userData = userDoc.data();
    return {
      userId: userDoc.id,
      email: userData?.email || '',
      displayName: userData?.displayName || '',
      avatarUrl: userData?.avatarUrl || '',
      isAdmin: userData?.isAdmin || false,
      accountType: userData?.accountType || 'Viewer',
      createdAt: userData?.createdAt?.toDate() || new Date(),
      workspaceId: userData?.workspaceId || '',
      approvedBy: userData?.approvedBy || '',
      memberOfTeamIds: userData?.memberOfTeamIds || [],
      theme: userData?.theme || 'light',
      defaultCalendarView: userData?.defaultCalendarView || 'day',
      modifierKey: userData?.modifierKey || 'shift',
      primaryColor: userData?.primaryColor || '',
      easyBooking: userData?.easyBooking || false,
      timeFormat: userData?.timeFormat || '12h',
      googleCalendarLinked: userData?.googleCalendarLinked || false,
    } as User;

  } catch (error) {
    // This can happen if the token is expired or invalid.
    // We'll treat it as the user being unauthenticated.
    console.log('Error verifying auth token:', error);
    return null;
  }
}
