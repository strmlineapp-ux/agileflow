
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, realUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !realUser) {
      router.push('/login');
    }
  }, [loading, realUser, router]);
  
  useEffect(() => {
    if (!loading && realUser && pathname === '/dashboard') {
      router.push('/dashboard/overview');
    }
  }, [loading, realUser, pathname, router]);

  if (loading || !realUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <GoogleSymbol name="progress_activity" className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (realUser.accountType === 'Viewer') {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background text-center">
              <div>
                  <h1 className="text-2xl font-headline mb-4">Awaiting Approval</h1>
                  <p className="text-muted-foreground">Your account is currently awaiting administrator approval. <br/> Please check back later.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 flex flex-col p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
