'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCalendarPage = pathname.startsWith('/dashboard/calendar');

  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <Sidebar />
        <div className="flex flex-1 flex-col sm:pl-14">
          <Header />
          <main
            className={cn(
              'flex-1 p-4 sm:p-6',
              isCalendarPage && 'flex flex-col overflow-hidden'
            )}
          >
            {children}
          </main>
        </div>
      </div>
  );
}
