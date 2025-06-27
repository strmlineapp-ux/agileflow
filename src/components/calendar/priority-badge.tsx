import { Badge } from '@/components/ui/badge';
import { type Task } from '@/types';
import { cn } from '@/lib/utils';

type PriorityConfig = {
  label: string;
  className: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  P0: { label: 'P0', className: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' },
  P1: { label: 'P1', className: 'bg-warning text-warning-foreground hover:bg-warning/90 border-transparent' },
  P2: { label: 'P2', className: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  P3: { label: 'P3', className: 'bg-accent text-accent-foreground hover:bg-accent/90 border-transparent' },
  P4: { label: 'P4', className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80' },
};

export function PriorityBadge({ priority, className }: { priority: Task['priority']; className?: string }) {
  const config = priorityConfig[priority];

  return (
    <Badge
      variant="default"
      className={cn('border-transparent rounded-md px-2 py-0.5 leading-none', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
