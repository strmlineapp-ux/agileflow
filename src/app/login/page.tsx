import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-4" />
            <CardTitle className="font-headline text-3xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to AgileFlow</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
