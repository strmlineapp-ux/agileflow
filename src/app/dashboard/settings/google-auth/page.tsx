
'use client';

import { useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { getAuthServiceUrl } from '@/lib/google-auth-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function GoogleAuthPage() {
  const { realUser } = useUser();

  const handleConnect = async () => {
    if (!realUser) return;
    const authUrl = await getAuthServiceUrl(realUser.userId);
    // Redirect the user to Google's OAuth consent screen
    window.location.href = authUrl;
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Connect Your Google Account</CardTitle>
          <CardDescription>
            To enable advanced calendar features like real-time syncing, AgileFlow needs your permission to access your Google Calendar data. Your data will be kept secure and private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect}>
             <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.45.82 4.25 1.58l2.5-2.5C18.43 1.18 15.7.01 12.48.01 7.1 0 2.98 3.98 2.98 9.5s4.12 9.5 9.5 9.5c5.13 0 9.04-3.47 9.04-9.25 0-.8-.08-1.32-.19-1.84h-8.9v.01Z"></path></svg>
            Connect with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
