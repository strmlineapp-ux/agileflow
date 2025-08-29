
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function DashboardRootPage() {
  const { loading, realUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && realUser) {
      router.push('/dashboard/overview');
    }
  }, [loading, realUser, router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
    </div>
  );
}
