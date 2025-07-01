
import { LoginForm } from '@/components/auth/login-form';
import Logo from '@/components/icons/logo';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo
              className="mb-4 text-card-foreground"
              iconClassName="text-primary"
            />
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
