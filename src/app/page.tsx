
'use client';

import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function LoginPage() {
  const { realUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && realUser) {
      router.push('/dashboard/overview');
    }
  }, [loading, realUser, router]);
  
  if (loading || realUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <GoogleSymbol name="progress_activity" className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center text-center">
            <Logo
              className="mb-2 text-muted-foreground"
              iconClassName="text-primary"
            />
            <CardDescription>Sign in to your Strm_ workspace</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
