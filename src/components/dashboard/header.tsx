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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { realUser, viewAsUser, teams, notifications, appSettings } = useUser();
  const isViewingAsSomeoneElse = realUser.userId !== viewAsUser.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const orderedNavItems = useMemo(() => {
    const visiblePages = appSettings.pages.filter(page => hasAccess(viewAsUser, page, teams));

    return visiblePages.flatMap(page => {
      if (!page.associatedTabs || page.associatedTabs.length === 0) {
        return null;
      }
      
      if (page.isDynamic) {
        const relevantTeams = teams.filter(team => {
            const isMemberOrAdmin = team.members.includes(viewAsUser.userId) || (team.teamAdmins || []).includes(viewAsUser.userId);
            const teamHasAccessToThisPage = page.access.teams.includes(team.id);
            return isMemberOrAdmin && teamHasAccessToThisPage;
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
  }, [appSettings.pages, viewAsUser, teams]);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isViewingAsSomeoneElse && (
        <div className="flex items-center gap-2 text-sm font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/50 p-2 rounded-md absolute left-1/2 -translate-x-1/2">
          <GoogleSymbol name="compare_arrows" weight={100} />
          <span>Viewing as {viewAsUser.displayName}</span>
        </div>
      )}
      <Sheet>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                            <GoogleSymbol name="menu" weight={100} />
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
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-normal text-primary-foreground md:text-base"
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

            {orderedNavItems.map(item => (
                <Link key={item.id} href={item.path} className="flex items-center justify-between gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-4">
                    <GoogleSymbol name={item.icon} className="text-2xl" weight={100} />
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
