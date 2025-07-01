

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
import { hasAccess } from '@/lib/permissions';

export function Header() {
  const { realUser, viewAsUser, teams, notifications, appSettings, allRolesAndBadges } = useUser();
  const isViewingAsSomeoneElse = realUser.userId !== viewAsUser.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const dynamicPage = useMemo(() => {
    return appSettings.pages.find(page => page.isDynamic);
  }, [appSettings.pages]);

  const { adminPage, staticPages, teamManagementPage } = useMemo(() => {
    const adminPage = appSettings.pages.find(p => p.id === 'page-admin-management');
    const teamManagementPage = appSettings.pages.find(p => p.id === 'page-team-management');
    const staticPages = appSettings.pages.filter(page => 
        !page.isDynamic &&
        page.id !== 'page-admin-management' &&
        page.id !== 'page-team-management' &&
        hasAccess(viewAsUser, page, teams, appSettings.adminGroups)
    );

    return {
        adminPage: adminPage && hasAccess(viewAsUser, adminPage, teams, appSettings.adminGroups) ? adminPage : null,
        staticPages,
        teamManagementPage: teamManagementPage && hasAccess(viewAsUser, teamManagementPage, teams, appSettings.adminGroups) ? teamManagementPage : null,
    };
  }, [viewAsUser, appSettings.pages, teams, appSettings.adminGroups]);

  const userManagedTeams = useMemo(() => {
      if(viewAsUser.isAdmin || appSettings.adminGroups.some(r => viewAsUser.roles?.includes(r.name))) {
          return teams;
      }
      return teams.filter(team => team.teamAdmins?.includes(viewAsUser.userId));
  }, [viewAsUser, teams, appSettings.adminGroups]);

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

            {adminPage && (
              <Link href={adminPage.path} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <GoogleSymbol name={adminPage.icon} className="text-2xl" />
                {adminPage.name}
              </Link>
            )}

            {staticPages.map(page => (
                <Link key={page.id} href={page.path} className="flex items-center justify-between gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-4">
                    <GoogleSymbol name={page.icon} className="text-2xl" />
                    {page.name}
                  </div>
                  {page.id === 'page-notifications' && unreadCount > 0 && (
                    <Badge variant="default" className="flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
            ))}

            {teamManagementPage && userManagedTeams.map(team => (
              <Link key={`${teamManagementPage.id}-${team.id}`} href={`${teamManagementPage.path}/${team.id}`} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <GoogleSymbol name={team.icon} className="text-2xl" />
                  {team.name}
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
