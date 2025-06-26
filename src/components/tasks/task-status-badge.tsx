import { Badge, type BadgeProps } from '@/components/ui/badge';
import { type Task } from '@/types';
import { cn } from '@/lib/utils';

type StatusConfig = {
  label: string;
  variant: BadgeProps['variant'];
  className?: string;
};

const statusConfig: Record<Task['status'], StatusConfig> = {
  not_started: { label: 'Not Started', variant: 'outline', className: "text-muted-foreground" },
  in_progress: { label: 'In Progress', variant: 'default', className: 'bg-primary text-primary-foreground' },
  awaiting_review: { label: 'Awaiting Review', variant: 'secondary', className: 'bg-warning text-warning-foreground border-transparent' },
  completed: { label: 'Completed', variant: 'secondary', className: 'bg-accent text-accent-foreground border-transparent' },
  blocked: { label: 'Blocked', variant: 'destructive', className: 'bg-destructive text-destructive-foreground' },
};

export function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn('border-transparent', config.className)}
    >
      {config.label}
    </Badge>
  );
}
