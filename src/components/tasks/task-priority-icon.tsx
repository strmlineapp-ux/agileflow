
import { type Task } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type PriorityConfig = {
  label: string;
  colorClass: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  P0: { label: 'P0 - Highest', colorClass: 'bg-destructive' },
  P1: { label: 'P1 - High', colorClass: 'bg-warning' },
  P2: { label: 'P2 - Medium', colorClass: 'bg-primary' },
  P3: { label: 'P3 - Low', colorClass: 'bg-accent' },
  P4: { label: 'P4 - Lowest', colorClass: 'bg-muted-foreground' },
};

export function TaskPriorityIcon({ priority }: { priority: Task['priority'] }) {
  const { label, colorClass } = priorityConfig[priority];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', colorClass)} />
            <span>{priority}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} Priority</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
