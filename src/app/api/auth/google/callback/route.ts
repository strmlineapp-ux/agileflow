
import { getOAuth2Client, saveCredentials } from '@/lib/google-auth-service';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state from Google' }, { status: 400 });
  }

  try {
    const { userId } = JSON.parse(state);
    if (!userId) {
        throw new Error('User ID not found in state');
    }

    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    
    // The 'tokens' object contains access_token, refresh_token, expiry_date, etc.
    // We can now save these securely, associated with the userId.
    await saveCredentials(userId, tokens);

    // After successfully exchanging the code, close the popup window.
    // A simple HTML page with a script to close the window is sufficient.
    const closerPage = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <p>Authentication successful! You can close this window.</p>
          <script>
            window.close();
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(closerPage, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('Error during Google OAuth callback:', error);
    const errorMessage = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Authentication Failed</h1>
          <p>${error.message || 'An unknown error occurred.'}</p>
        </body>
      </html>
    `;
    return new NextResponse(errorMessage, { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
    });
  }
}
