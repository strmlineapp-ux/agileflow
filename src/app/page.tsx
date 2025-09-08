
'use client';

import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { realUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && realUser) {
      router.push('/dashboard/overview');
    }
  }, [loading, realUser, router]);
  
  // While loading, or if user is found and redirecting, don't show the form
  if (loading || realUser) {
    return null; 
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
            <CardDescription>Sign in to your AgileFlow workspace</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
