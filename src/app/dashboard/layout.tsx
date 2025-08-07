
'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCalendarPage = pathname.startsWith('/dashboard/calendar');
  const { loading, realUser } = useUser();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }
  
  if (!realUser) {
    redirect('/login');
    return null; // Return null to prevent rendering anything while redirecting
  }

  return (
      <div className="min-h-screen w-full bg-muted/40">
        <Sidebar />
        <div className="flex flex-col sm:pl-14">
          <Header />
          <main
            className={cn(
              'p-4 sm:p-6',
              isCalendarPage && 'flex-1 flex flex-col overflow-hidden'
            )}
          >
            {children}
          </main>
        </div>
      </div>
  );
}

    