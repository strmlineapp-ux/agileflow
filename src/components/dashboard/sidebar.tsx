
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuLabel } from '../ui/dropdown-menu';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '../icons/google-symbol';
import { ScrollArea } from '../ui/scroll-area';
import { hasAccess } from '@/lib/permissions';


export function Sidebar() {
  const { realUser, viewAsUser, users, loading, notifications, linkGoogleCalendar, teams, setViewAsUser: setContextViewAsUser, appSettings } = useUser();
  
  const setViewAsUser = (userId: string) => {
    setContextViewAsUser(userId);
  };

  const isViewingAsSomeoneElse = realUser?.userId !== viewAsUser?.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const { adminPage, notificationsPage, otherPages } = useMemo(() => {
    if (!viewAsUser) return { adminPage: null, notificationsPage: null, otherPages: [] };
    
    const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');
    const notificationsPage = appSettings.pages.find(p => p.id === 'page-notifications');
    const otherPages = appSettings.pages
      .filter(page => page.id !== 'page-admin-management' && page.id !== 'page-notifications' && page.id !== 'page-settings')
      .filter(page => hasAccess(viewAsUser, page));

    return { adminPage, notificationsPage, otherPages };
  }, [viewAsUser, appSettings.pages]);
  
  if (loading || !viewAsUser || !realUser) {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r bg-card sm:flex" />
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r bg-card sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 pt-4 pb-2">
            <Link href="/dashboard/overview" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg text-primary-foreground md:h-8 md:w-8 md:text-base">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="sr-only">AgileFlow</span>
            </Link>
            {adminPage && hasAccess(viewAsUser, adminPage) && (
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={adminPage.path}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8',
                          usePathname().startsWith(adminPage.path) && 'text-primary'
                        )}
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
                const pathname = usePathname();
                const isActive = pathname.startsWith(item.path);

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.path}
                        className={cn(
                          'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8',
                          isActive && 'text-primary'
                        )}
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
        {notificationsPage && hasAccess(viewAsUser, notificationsPage) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={notificationsPage.path}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8',
                      usePathname().startsWith(notificationsPage.path) && 'text-primary'
                    )}
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
            <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full md:h-8 md:w-8 focus-visible:outline-none">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={viewAsUser.avatarUrl} alt={viewAsUser.displayName} data-ai-hint="user avatar" />
                                <AvatarFallback>{viewAsUser.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span 
                              className={cn(
                                "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                viewAsUser.googleCalendarLinked ? "bg-green-500" : "bg-gray-400",
                                realUser.userId === viewAsUser.userId && !viewAsUser.googleCalendarLinked && "cursor-pointer"
                              )}
                              onClick={(e) => {
                                if (realUser.userId === viewAsUser.userId && !viewAsUser.googleCalendarLinked) {
                                  e.stopPropagation();
                                  linkGoogleCalendar(realUser.userId);
                                }
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Google Calendar: {viewAsUser.googleCalendarLinked ? 'Connected' : realUser.userId === viewAsUser.userId ? 'Click to connect' : 'Not Connected'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm leading-none">{viewAsUser.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{viewAsUser.email}</p>
                    </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />

                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <GoogleSymbol name="settings" className="mr-2 text-lg" />
                        <span>Account Settings</span>
                    </Link>
                </DropdownMenuItem>

                {realUser.isAdmin && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <GoogleSymbol name="how_to_reg" className="mr-2 text-lg" />
                      <span>View as</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {isViewingAsSomeoneElse && (
                          <>
                            <DropdownMenuItem onSelect={() => setViewAsUser(realUser.userId)}>
                              Return to your view ({realUser.displayName})
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
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
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login">
                        <GoogleSymbol name="logout" className="mr-2 text-lg" />
                        <span>Logout</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}
