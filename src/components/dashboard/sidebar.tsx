
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ListChecks, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';

const navItems = [
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/tasks', icon: ListChecks, label: 'Tasks' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        <Link href="/dashboard/calendar" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-accent"
          >
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sr-only">AgileFlow</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/dashboard/calendar'))) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
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
                                <AvatarImage src="https://placehold.co/40x40.png" alt="@user" data-ai-hint="user avatar" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">User Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent side="right" align="end">
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </aside>
  );
}
