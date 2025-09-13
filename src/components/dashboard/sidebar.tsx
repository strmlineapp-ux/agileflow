
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '../icons/google-symbol';
import { ScrollArea } from '../ui/scroll-area';
import { hasAccess } from '@/lib/permissions';
import Logo from '../icons/logo';
import { type Notification, type AppPage } from '@/types';
import { useDataQueries } from '@/hooks/use-data-queries';

export function Sidebar() {
  const { realUser, viewAsUser, loading, setViewAsUser, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  const { useFetchUsers, useFetchNotifications, useFetchPages } = useDataQueries();

  const { data: users = [] } = useFetchUsers(viewAsUser?.workspaceId);
  const { data: notifications = [] } = useFetchNotifications(viewAsUser?.workspaceId);
  const { data: allPages = [], isLoading: isLoadingPages } = useFetchPages(viewAsUser?.workspaceId);
  
  const setViewAsUserAndRedirect = (userId: string) => {
    setViewAsUser(userId);
    router.push('/dashboard/overview');
  };

  const isViewingAsSomeoneElse = realUser?.userId !== viewAsUser?.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const orderedNavItems = useMemo(() => {
    if (!viewAsUser || !allPages) return [];

    return allPages.filter(page => {
        if (!page.isSystemPage) return false;
        if (page.id === 'page-admin-management') return viewAsUser.isAdmin;
        return true; 
    });
  }, [viewAsUser, allPages]);
  
  const otherPages = useMemo(() => {
    if (!viewAsUser || !allPages) return [];
    return allPages
      .filter(page => !page.isSystemPage && hasAccess(viewAsUser, page) && page.associatedTabs?.length > 0 && page.path)
      .sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [viewAsUser, allPages]);

  const adminPage = useMemo(() => allPages.find(p => p.id === 'page-admin-management'), [allPages]);
  const notificationsPage = useMemo(() => allPages.find(p => p.id === 'page-notifications'), [allPages]);
  
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
              <span className="sr-only">Strm_</span>
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
            {isLoadingPages ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : otherPages.map((item) => {
                if (!item) return null;
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
                          <DropdownMenuItem onSelect={() => setViewAsUserAndRedirect(realUser.userId)}>
                            Return to your view ({realUser.displayName})
                          </DropdownMenuItem>
                        )}
                        {users.filter(u => u.userId !== realUser.userId).map(user => (
                          <DropdownMenuItem key={user.userId} onSelect={() => setViewAsUserAndRedirect(user.userId)}>
                            {user.displayName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                
                <DropdownMenuItem onSelect={() => logout()}>
                    <GoogleSymbol name="logout" className="mr-2 text-lg" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}

    