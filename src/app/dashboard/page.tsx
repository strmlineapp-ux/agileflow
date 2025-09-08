
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function DashboardRootPage() {
  const { loading, realUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Once the user state is resolved, redirect to the overview page.
    // This prevents users from ever landing on a blank /dashboard page.
    if (!loading && realUser) {
      router.push('/dashboard/overview');
    }
  }, [loading, realUser, router]);

  // Display a loading spinner while the redirect is being prepared.
  return (
    <div className="flex h-full w-full items-center justify-center">
      <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
    </div>
  );
}
