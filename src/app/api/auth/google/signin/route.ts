
import { getOAuth2Client } from '@/lib/google-auth-service';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // A real app would get the user ID from the session
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    // In a real app, you might redirect to a login page or show an error
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const oAuth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/chat.messages'
  ];

  const state = JSON.stringify({ userId });

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: state,
  });

  return NextResponse.redirect(authUrl);
}
