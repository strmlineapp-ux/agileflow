
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

export function Sidebar() {
  const pathname = usePathname();
  const { realUser, viewAsUser, setViewAsUser, users, teams, notifications, appSettings, allRoles } = useUser();
  const isViewingAsSomeoneElse = realUser.userId !== viewAsUser.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const visiblePages = useMemo(() => {
    return appSettings.pages.filter(page => hasAccess(viewAsUser, page, teams, appSettings.customAdminRoles));
  }, [viewAsUser, appSettings.pages, teams, appSettings.customAdminRoles]);
  
  const userManagedTeams = useMemo(() => {
      if(viewAsUser.isAdmin || allRoles.some(r => viewAsUser.roles?.includes(r.name))) {
          return teams;
      }
      return teams.filter(team => team.teamAdmins?.includes(viewAsUser.userId));
  }, [viewAsUser, teams, allRoles]);

  const mainNavItems = [
    { href: '/dashboard/calendar', icon: 'calendar_month', label: 'Calendar', visible: true },
    { href: '/dashboard', icon: 'dashboard', label: 'Overview', visible: true },
    { href: '/dashboard/tasks', icon: 'checklist', label: 'Tasks', visible: true },
  ];

  const bottomNavItems = [
    { href: '/dashboard/notifications', icon: 'notifications', label: 'Notifications', visible: true },
  ];
  
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        <Link href="/dashboard/calendar" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sr-only">AgileFlow</span>
        </Link>
        <TooltipProvider>
          {mainNavItems.map((item) => (
           item.visible && (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith(item.href) && item.href !== '/dashboard' && 'bg-accent text-accent-foreground',
                    pathname === '/dashboard' && item.href === '/dashboard' && 'bg-accent text-accent-foreground'
                  )}
                >
                  <GoogleSymbol name={item.icon} className="text-2xl" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
           )
          ))}

          {/* Dynamic Pages */}
          {visiblePages.map(page => {
              if (page.isDynamic) {
                  return userManagedTeams.map(team => (
                    <Tooltip key={`${page.id}-${team.id}`}>
                        <TooltipTrigger asChild>
                            <Link href={`${page.path}/${team.id}`} className={cn('relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8', pathname.startsWith(`${page.path}/${team.id}`) && 'bg-accent text-accent-foreground' )}>
                                <GoogleSymbol name={team.icon} className="text-2xl" />
                                <span className="sr-only">{team.name}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{page.name}: {team.name}</TooltipContent>
                    </Tooltip>
                  ))
              }
              return (
                <Tooltip key={page.id}>
                    <TooltipTrigger asChild>
                        <Link href={page.path} className={cn('relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8', pathname.startsWith(page.path) && 'bg-accent text-accent-foreground' )}>
                            <GoogleSymbol name={page.icon} className="text-2xl" />
                            <span className="sr-only">{page.name}</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{page.name}</TooltipContent>
                </Tooltip>
              )
          })}


          {bottomNavItems.map((item) => (
           item.visible && (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith(item.href) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <GoogleSymbol name={item.icon} className="text-2xl" />
                  {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
           )
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
         <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <button className="flex h-9 w-9 items-center justify-center rounded-full md:h-8 md:w-8">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={viewAsUser.avatarUrl} alt={viewAsUser.displayName} data-ai-hint="user avatar" />
                                <AvatarFallback>{viewAsUser.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">User Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent side="right" align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{viewAsUser.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{viewAsUser.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground mb-2">Roles & Badges</p>
                    <div className="flex flex-wrap gap-1">
                        {(viewAsUser.roles && viewAsUser.roles.length > 0) ? (
                            viewAsUser.roles.map(roleName => {
                                const roleInfo = allRoles.find(r => r.name === roleName);
                                return (
                                    <Badge
                                        key={roleName}
                                        variant="outline"
                                        style={roleInfo ? { color: roleInfo.color, borderColor: roleInfo.color } : {}}
                                        className={cn(
                                            "rounded-full gap-1 text-xs py-0.5 px-2",
                                            !roleInfo && "opacity-75"
                                        )}
                                    >
                                        {roleInfo && <GoogleSymbol name={roleInfo.icon} className="text-sm" />}
                                        <span>{roleName}</span>
                                    </Badge>
                                )
                            })
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No roles or badges assigned</p>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <GoogleSymbol name="manage_accounts" className="mr-2 text-lg" />
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
