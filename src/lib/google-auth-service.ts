
import { google } from 'googleapis';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import { User } from '@/types';

// These should be coming from environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

export const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
};

export async function saveCredentials(userId: string, tokens: any) {
    const db = getDb();
    const tokenDocRef = doc(db, 'google-auth-tokens', userId);
    const userDocRef = doc(db, 'users', userId);

    const credentials = {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
    };
    
    await setDoc(tokenDocRef, credentials, { merge: true });
    
    // Also update the user's profile to reflect that they have linked their calendar
    await setDoc(userDocRef, { googleCalendarLinked: true }, { merge: true });
}


export async function getAuthorizedClient(userId: string) {
    const db = getDb();
    const tokenDocRef = doc(db, 'google-auth-tokens', userId);
    const tokenDoc = await getDoc(tokenDocRef);

    if (!tokenDoc.exists()) {
        throw new Error('No auth tokens for user');
    }

    const tokens = tokenDoc.data();
    const oAuth2Client = getOAuth2Client();

    oAuth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiryDate,
    });
    
    // Automatically handle token refresh
    if (oAuth2Client.isTokenExpiring()) {
        const { credentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(credentials);
        await saveCredentials(userId, { 
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            expiry_date: credentials.expiry_date
        });
    }

    return oAuth2Client;
}
