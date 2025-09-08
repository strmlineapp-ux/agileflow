
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { Badge } from '@/components/ui/badge';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Logo from '../icons/logo';
import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { type Notification, type AppSettings } from '@/types';

async function fetchNotifications(workspaceId: string): Promise<Notification[]> {
    if (!workspaceId) return [];
    const db = getDb();
    const q = query(
        collection(db, 'notifications'),
        where('workspaceId', '==', workspaceId),
        orderBy('time', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: (doc.data().time as Timestamp).toDate(),
    } as Notification));
}

async function fetchAppSettings(workspaceId: string): Promise<AppSettings | null> {
    if (!workspaceId) return null;
    const db = getDb();
    const docRef = doc(db, 'app-settings', workspaceId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as AppSettings : null;
}


export function Header() {
  const { realUser, viewAsUser } = useUser();
  const isViewingAsSomeoneElse = realUser?.userId !== viewAsUser?.userId;
  
  const { data: notifications = [] } = useQuery<Notification[]>({
      queryKey: ['notifications', viewAsUser.workspaceId],
      queryFn: () => fetchNotifications(viewAsUser.workspaceId),
      enabled: !!viewAsUser.workspaceId,
  });

  const { data: appSettings } = useQuery<AppSettings | null>({
    queryKey: ['appSettings', viewAsUser.workspaceId],
    queryFn: () => fetchAppSettings(viewAsUser.workspaceId),
    enabled: !!viewAsUser.workspaceId,
  });

  const unreadCount = notifications.filter((n) => !n.read && n.type === 'standard').length;
  
  const orderedNavItems = useMemo(() => {
    if (!viewAsUser || !appSettings?.pages) return [];

    return appSettings.pages.filter(page => {
        if (!page.isSystemPage) return false;
        if (page.id === 'page-admin-management') return viewAsUser.isAdmin;
        return true; 
    });
  }, [viewAsUser, appSettings?.pages]);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-card px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isViewingAsSomeoneElse && viewAsUser && (
        <div className="flex items-center gap-2 text-sm font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/50 p-2 rounded-md absolute left-1/2 -translate-x-1/2">
          <GoogleSymbol name="compare_arrows" />
          <span>Viewing as {viewAsUser.displayName}</span>
        </div>
      )}
      <Sheet>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                            <GoogleSymbol name="menu" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Toggle Menu</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-normal">
            <Link
              href="/dashboard/overview"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg md:text-base"
            >
              <Logo className="text-primary-foreground" />
              <span className="sr-only">Strm</span>
            </Link>

            {orderedNavItems.map(item => (
                <Link key={item.id} href={item.path} className="flex items-center justify-between gap-4 px-2.5 text-foreground hover:text-foreground">
                  <div className="flex items-center gap-4">
                    <GoogleSymbol name={item.icon} className="text-2xl" />
                    {item.name}
                  </div>
                  {item.id === 'page-notifications' && unreadCount > 0 && (
                    <Badge variant="default" className="flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="hidden sm:block">
      </div>
      
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Placeholder for future search bar */}
      </div>
    </header>
  );
}
