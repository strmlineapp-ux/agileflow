
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to handle user logout.
 *
 * This endpoint clears the authentication cookie, effectively logging the user
 * out from the server's perspective. The client-side code will handle redirecting
 * the user after calling this endpoint.
 */
export async function POST() {
  try {
    // To log the user out, we clear the cookie by setting its value to empty
    // and maxAge to 0.
    cookies().set('firebaseIdToken', '', { maxAge: 0 });

    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in logout API route:', error);
    // Even if there's an error, we should try to clear the cookie on the client
    // as a fallback. The client will redirect anyway.
    return NextResponse.json({ success: false, message: 'An error occurred during logout.' }, { status: 500 });
  }
}
