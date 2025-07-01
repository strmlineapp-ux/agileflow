import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-4" />
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="ghost" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              <Link href="/signup">
                <GoogleSymbol name="person_add" />
                Sign up
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
