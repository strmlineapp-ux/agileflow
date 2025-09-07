
import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, saveCredentials } from '@/lib/google-auth-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing required parameters: code or state' }, { status: 400 });
  }

  try {
    const userId = state; // We encoded the userId in the state parameter
    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Save the tokens securely against the user's ID
    await saveCredentials(userId, tokens);

    // Redirect user back to the settings page after successful authorization
    const redirectUrl = new URL('/dashboard/settings', request.nextUrl.origin);
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error handling Google auth callback:', error);
    return NextResponse.json({ error: 'Failed to exchange authorization code for tokens.', details: error.message }, { status: 500 });
  }
}

    