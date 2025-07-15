import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo
              className="mb-2 text-muted-foreground"
              iconClassName="text-primary"
            />
            <CardDescription>Sign in to your AgileFlow workspace</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
