
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type UserStatus } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StatusConfig = {
  base: string;
  am?: string;
  pm?: string;
  full: string;
};

// Using inline colors for purple and green as they are not part of the main theme
const statusStyles: Record<string, StatusConfig> = {
  'PTO': {
    base: 'border-destructive/30 text-destructive',
    full: 'bg-destructive/10',
    am: 'bg-gradient-to-r from-destructive/20 to-transparent',
    pm: 'bg-gradient-to-l from-destructive/20 to-transparent',
  },
  'TOIL': {
    base: 'border-purple-500/30 text-purple-700 dark:text-purple-400 dark:border-purple-500/50',
    full: 'bg-purple-500/10 dark:bg-purple-500/20',
    am: 'bg-gradient-to-r from-purple-500/20 to-transparent dark:from-purple-500/30',
    pm: 'bg-gradient-to-l from-purple-500/20 to-transparent dark:from-purple-500/30',
  },
  'Sick': {
    base: 'border-green-500/30 text-green-700 dark:text-green-400 dark:border-green-500/50',
    full: 'bg-green-500/10 dark:bg-green-500/20',
  },
  'Offsite': {
    base: 'border-muted-foreground/30 text-muted-foreground',
    full: 'bg-muted',
  },
  'Training': {
    base: 'border-primary/30 text-primary',
    full: 'bg-primary/10',
  },
};

export function UserStatusBadge({ status, children }: { status: UserStatus, children: React.ReactNode }) {
  const statusKey = status.replace(/ \((AM|PM)\)/, '');
  const config = statusStyles[statusKey];

  if (!config) {
    return <Badge variant="outline">{children}</Badge>;
  }

  let styleClass = config.full;
  if (status.includes('(AM)') && config.am) {
    styleClass = config.am;
  } else if (status.includes('(PM)') && config.pm) {
    styleClass = config.pm;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'rounded-full h-8 font-medium',
              config.base,
              styleClass
            )}
          >
            <span className="truncate">{children}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
