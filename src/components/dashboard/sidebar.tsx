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
import { Badge } from '../ui/badge';
import { hasAccess } from '@/lib/permissions';
import { Button } from '../ui/button';

export function Sidebar() {
  const { realUser, viewAsUser, users, loading, notifications, appSettings, linkGoogleCalendar, teams } = useUser();
  
  const isViewingAsSomeoneElse = realUser?.userId !== viewAsUser?.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const orderedNavItems = useMemo(() => {
    if (!viewAsUser) return [];

    const globalPages = ['page-overview', 'page-calendar', 'page-tasks', 'page-notifications'];
    const visiblePages = appSettings.pages.filter(page => {
      // 1. Always include global pages for authenticated users
      if (globalPages.includes(page.id)) {
        return true;
      }
      // 2. Only show admin page if the user is an admin
      if (page.id === 'page-admin-management') {
          return viewAsUser.isAdmin;
      }
      // 3. For all other pages, use the existing hasAccess check
      return hasAccess(viewAsUser, page);
    });

    return visiblePages.flatMap(page => {
      if (!page.associatedTabs || page.associatedTabs.length === 0) {
        return null;
      }
      
      if (page.isDynamic) {
        const relevantTeams = (viewAsUser.memberOfTeamIds || [])
          .map(teamId => teams.find(t => t.id === teamId))
          .filter((t): t is NonNullable<typeof t> => !!t)
          .filter(team => {
            const pageAccessTeams = page.access?.teams || [];
            if (pageAccessTeams.length === 0) return true;
            return pageAccessTeams.includes(team.id);
        });

        return relevantTeams.map(team => ({
          id: `${page.id}-${team.id}`,
          path: `${page.path}/${team.id}`,
          icon: team.icon,
          name: team.name,
          tooltip: `${page.name}: ${team.name}`,
        }));
      }

      return {
        id: page.id,
        path: page.path,
        icon: page.icon,
        name: page.name,
        tooltip: page.name,
      };
    }).filter((item): item is NonNullable<typeof item> => !!item);
  }, [appSettings.pages, viewAsUser, teams, hasAccess]);
  
  if (loading || !viewAsUser || !realUser) {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r bg-card sm:flex" />
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        <Link href="/dashboard/calendar" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-thin text-primary-foreground md:h-8 md:w-8 md:text-base">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sr-only">AgileFlow</span>
        </Link>
        <TooltipProvider>
          {orderedNavItems.map((item) => {
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
                      <GoogleSymbol name={item.icon} className="text-4xl" weight={100} />
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.tooltip}</TooltipContent>
                </Tooltip>
              );
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
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
                          <p>Google Calendar: {viewAsUser.googleCalendarLinked ? 'Connected' : (realUser.userId === viewAsUser.userId ? 'Click to connect' : 'Not Connected')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel className="font-thin">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-thin leading-none">{viewAsUser.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{viewAsUser.email}</p>
                    </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />

                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="font-thin">
                        <GoogleSymbol name="settings" className="mr-2 text-lg" weight={100} />
                        <span>Account Settings</span>
                    </Link>
                </DropdownMenuItem>

                {realUser.isAdmin && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="font-thin">
                      <GoogleSymbol name="how_to_reg" className="mr-2 text-lg" weight={100} />
                      <span>View as</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {isViewingAsSomeoneElse && (
                          <>
                            <DropdownMenuItem onSelect={() => setViewAsUser(realUser.userId)} className="font-thin">
                              Return to your view ({realUser.displayName})
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {users.filter(u => u.userId !== realUser.userId).map(user => (
                          <DropdownMenuItem key={user.userId} onSelect={() => setViewAsUser(user.userId)} className="font-thin">
                            {user.displayName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login" className="font-thin">
                        <GoogleSymbol name="logout" className="mr-2 text-lg" weight={100} />
                        <span>Logout</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}