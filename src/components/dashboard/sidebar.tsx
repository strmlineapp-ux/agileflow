
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '../icons/google-symbol';
import { ScrollArea } from '../ui/scroll-area';
import { hasAccess } from '@/lib/permissions';
import Logo from '../icons/logo';
import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { type Notification } from '@/types';


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


export function Sidebar() {
  const { realUser, viewAsUser, users, loading, setViewAsUser: setContextViewAsUser, appSettings, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  const { data: notifications = [] } = useQuery<Notification[]>({
      queryKey: ['notifications', viewAsUser.workspaceId],
      queryFn: () => fetchNotifications(viewAsUser.workspaceId),
      enabled: !!viewAsUser.workspaceId,
  });

  const setViewAsUser = (userId: string) => {
    setContextViewAsUser(userId);
  };

  const isViewingAsSomeoneElse = realUser?.userId !== viewAsUser?.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const { adminPage, notificationsPage, otherPages } = useMemo(() => {
    if (!viewAsUser || !appSettings.pages) return { adminPage: null, notificationsPage: null, otherPages: [] };
    
    const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');
    const notificationsPage = appSettings.pages.find(p => p.id === 'page-notifications');
    const otherPages = appSettings.pages
      .filter(page => page.id !== 'page-admin-management' && page.id !== 'page-notifications' && page.id !== 'page-settings')
      .filter(page => hasAccess(viewAsUser, page))
      .filter(page => page.associatedTabs && page.associatedTabs.length > 0) // Ensure page has tabs
      .filter(page => !!page.path); // Ensure page has a path

    return { adminPage, notificationsPage, otherPages };
  }, [viewAsUser, appSettings.pages]);
  
  if (loading || !viewAsUser || !realUser) {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col bg-card sm:flex" />
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col bg-card sm:flex shadow-lg">
        <nav className="flex flex-col items-center gap-4 px-2 pt-4 pb-2">
            <Link
              href="/dashboard/overview"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg md:h-8 md:w-8 md:text-base"
            >
              <Logo iconOnly className="text-primary-foreground" />
              <span className="sr-only">Strm</span>
            </Link>
            {adminPage && hasAccess(viewAsUser, adminPage) && adminPage.path && (
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={adminPage.path}
                        className={cn('font-emphasis flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors md:h-8 md:w-8', {
                            'bg-accent text-accent-foreground': pathname.startsWith(adminPage.path),
                        })}
                      >
                        <GoogleSymbol name={adminPage.icon} className="text-4xl" />
                        <span className="sr-only">{adminPage.name}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{adminPage.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
        </nav>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col items-center gap-4 px-2 pt-2 pb-4">
          <TooltipProvider>
            {otherPages.map((item) => {
                if (!item) return null;
                const isNotifications = item.id === 'page-notifications';
                const isActive = pathname.startsWith(item.path);

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.path}
                        className={cn('font-emphasis relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors md:h-8 md:w-8', {
                          'bg-accent text-accent-foreground': isActive,
                        })}
                      >
                        <GoogleSymbol name={item.icon} className="text-4xl" />
                        {isNotifications && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                            {unreadCount}
                          </span>
                        )}
                        <span className="sr-only">{item.name}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                );
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
        {notificationsPage && hasAccess(viewAsUser, notificationsPage) && notificationsPage.path && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={notificationsPage.path}
                    className={cn('font-emphasis relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors md:h-8 md:w-8', {
                      'bg-accent text-accent-foreground': pathname.startsWith(notificationsPage.path),
                    })}
                  >
                    <GoogleSymbol name={notificationsPage.icon} className="text-4xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">{notificationsPage.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{notificationsPage.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
        )}
         <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <div className="font-emphasis flex h-9 w-9 items-center justify-center rounded-full md:h-8 md:w-8">
                                <div className="relative">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={viewAsUser.avatarUrl} alt={viewAsUser.displayName} data-ai-hint="user avatar" />
                                        <AvatarFallback>{viewAsUser.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span 
                                    className={cn(
                                        "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                        viewAsUser.googleCalendarLinked ? "bg-green-500" : "bg-gray-400"
                                    )}
                                    />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Google Calendar: {viewAsUser.googleCalendarLinked ? 'Connected' : 'Not Connected'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm leading-none">{viewAsUser.displayName}</p>
                        <p className="text-xs leading-none text-foreground">{viewAsUser.email}</p>
                    </div>
                </DropdownMenuLabel>
                
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <GoogleSymbol name="settings" className="mr-2 text-lg" />
                        <span>Account Settings</span>
                    </Link>
                </DropdownMenuItem>

                {realUser.isAdmin && users.length > 1 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <GoogleSymbol name="how_to_reg" className="mr-2 text-lg" />
                      <span>View as</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {isViewingAsSomeoneElse && (
                          <DropdownMenuItem onSelect={() => setViewAsUser(realUser.userId)}>
                            Return to your view ({realUser.displayName})
                          </DropdownMenuItem>
                        )}
                        {users.filter(u => u.userId !== realUser.userId).map(user => (
                          <DropdownMenuItem key={user.userId} onSelect={() => setViewAsUser(user.userId)}>
                            {user.displayName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                
                <DropdownMenuItem onSelect={() => logout(router)}>
                    <GoogleSymbol name="logout" className="mr-2 text-lg" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}
