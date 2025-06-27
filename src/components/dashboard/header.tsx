
'use client';

import Link from 'next/link';
import { Calendar, ListChecks, PanelLeft, Settings, LayoutDashboard, ArrowLeftRight, Bell, Briefcase } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import { useUser } from '@/context/user-context';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon, type IconName } from '@/components/icons/dynamic-icon';

export function Header() {
  const { realUser, viewAsUser, teams, notifications } = useUser();
  const isViewingAsSomeoneElse = realUser.userId !== viewAsUser.userId;
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const isSdm = viewAsUser.roles?.includes('Service Delivery Manager') || viewAsUser.roles?.includes('Admin');

  const userTeams = teams.filter(team => 
    isSdm || team.managers?.includes(viewAsUser.userId)
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isViewingAsSomeoneElse && (
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900/50 p-2 rounded-md absolute left-1/2 -translate-x-1/2">
          <ArrowLeftRight className="h-4 w-4" />
          <span>Viewing as {viewAsUser.displayName}</span>
        </div>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Logo className="mb-4" />
            <Link href="/dashboard/calendar" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Calendar className="h-5 w-5" />
              Calendar
            </Link>
            <Link href="/dashboard" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="h-5 w-5" />
              Overview
            </Link>
            <Link href="/dashboard/tasks" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <ListChecks className="h-5 w-5" />
              Tasks
            </Link>
             {isSdm && (
                <Link href="/dashboard/service-delivery" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Briefcase className="h-5 w-5" />
                    Service Delivery
                </Link>
            )}
            {userTeams.map(team => (
              <Link key={team.id} href={`/dashboard/teams/${team.id}`} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <DynamicIcon name={team.icon as IconName} className="h-5 w-5" />
                {team.name}
              </Link>
            ))}
            <Link href="/dashboard/notifications" className="flex items-center justify-between gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-4">
                <Bell className="h-5 w-5" />
                Notifications
              </div>
              {unreadCount > 0 && (
                <Badge variant="default" className="flex h-5 w-5 items-center justify-center rounded-full p-0">
                  {unreadCount}
                </Badge>
              )}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
              Settings
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
