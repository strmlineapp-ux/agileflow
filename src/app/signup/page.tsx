
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/signup-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Separator } from '@/components/ui/separator';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center text-center">
            <Logo className="mb-4" />
            <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
            <CardDescription>Enter your details below to create your AgileFlow account.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <Separator />
             <Button asChild variant="ghost" className="text-sm font-normal text-muted-foreground hover:text-primary hover:bg-transparent">
                <Link href="/login">
                    <GoogleSymbol name="login" opticalSize={20} />
                    Already have an account? Sign in
                </Link>
              </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
