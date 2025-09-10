
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { UserProvider } from '@/context/user-context';
import { getServerUser } from '@/lib/server-utils';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  // If no user is found on the server, redirect to the login page.
  if (!user) {
    redirect('/');
  }

  // If the user is awaiting approval, show the pending approval page.
  if (user.accountType === 'Viewer') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-center">
        <div>
          <h1 className="text-2xl font-headline mb-4">Awaiting Approval</h1>
          <p className="text-muted-foreground">Your account is currently awaiting administrator approval. <br/> Please check back later.</p>
        </div>
      </div>
    );
  }

  // The user is authenticated and approved. Render the main dashboard.
  // We pass the server-fetched user data to the UserProvider.
  return (
    <UserProvider user={user}>
      <div className="min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex flex-col sm:pl-14 h-screen">
          <Header />
          <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
