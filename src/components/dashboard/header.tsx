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
import { type AppPage, type Team, type User } from '@/types';

const hasAccess = (user: User, page: AppPage, teams: Team[]): boolean => {
    if (user.isAdmin) return true;
    if (page.access.users.includes(user.userId)) return true;
    if (page.access.roles.some(role => user.roles?.includes(role))) return true;

    const userTeamIds = teams.filter(t => t.members.includes(user.userId)).map(t => t.id);
    if (page.access.teams.some(teamId => userTeamIds.includes(teamId))) return true;
    
    return false;
};

export function Header() {
  const { realUser, viewAsUser, teams, notifications, appSettings, allRoles } = useUser();
  const isViewingAsSomeoneElse = realUser.userId !== viewAsUser.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const visiblePages = useMemo(() => {
    return appSettings.pages.filter(page => hasAccess(viewAsUser, page, teams));
  }, [viewAsUser, appSettings.pages, teams]);
  
  const userManagedTeams = useMemo(() => {
      if(viewAsUser.isAdmin || allRoles.some(r => viewAsUser.roles?.includes(r.name))) {
          return teams;
      }
      return teams.filter(team => team.teamAdmins?.includes(viewAsUser.userId));
  }, [viewAsUser, teams, allRoles]);

  const mainNavItems = [
    { href: '/dashboard/calendar', icon: 'calendar_month', label: 'Calendar' },
    { href: '/dashboard', icon: 'dashboard', label: 'Overview' },
    { href: '/dashboard/tasks', icon: 'checklist', label: 'Tasks' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isViewingAsSomeoneElse && (
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900/50 p-2 rounded-md absolute left-1/2 -translate-x-1/2">
          <GoogleSymbol name="compare_arrows" />
          <span>Viewing as {viewAsUser.displayName}</span>
        </div>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <GoogleSymbol name="menu" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-all group-hover:scale-110"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="sr-only">AgileFlow</span>
            </Link>
            {mainNavItems.map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <GoogleSymbol name={item.icon} className="text-2xl" />
                    {item.label}
                </Link>
            ))}
            {viewAsUser.isAdmin && (
                 <Link href="/dashboard/admin" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <GoogleSymbol name="shield_person" className="text-2xl" />
                    Admin
                </Link>
            )}

            {/* Dynamic Pages */}
            {visiblePages.map(page => {
              if (page.isDynamic) {
                  return userManagedTeams.map(team => (
                    <Link key={`${page.id}-${team.id}`} href={`${page.path}/${team.id}`} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                        <GoogleSymbol name={team.icon} className="text-2xl" />
                        {team.name}
                    </Link>
                  ))
              }
              return (
                <Link key={page.id} href={page.path} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <GoogleSymbol name={page.icon} className="text-2xl" />
                    {page.name}
                </Link>
              )
            })}
            
            <Link href="/dashboard/notifications" className="flex items-center justify-between gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-4">
                <GoogleSymbol name="notifications" className="text-2xl" />
                Notifications
              </div>
              {unreadCount > 0 && (
                <Badge variant="default" className="flex h-5 w-5 items-center justify-center rounded-full p-0">
                  {unreadCount}
                </Badge>
              )}
            </Link>
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
