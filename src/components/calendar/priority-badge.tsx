
import { Badge } from '@/components/ui/badge';
import { type Task } from '@/types';
import { cn } from '@/lib/utils';

type PriorityConfig = {
  label: string;
  className: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  P0: { label: 'P0', className: 'bg-red-600 text-white hover:bg-red-600/90 border-transparent' },
  P1: { label: 'P1', className: 'bg-orange-500 text-white hover:bg-orange-500/90 border-transparent' },
  P2: { label: 'P2', className: 'bg-yellow-400 text-yellow-950 hover:bg-yellow-400/90 border-transparent' },
  P3: { label: 'P3', className: 'bg-green-600 text-white hover:bg-green-600/90 border-transparent' },
  P4: { label: 'P4', className: 'bg-gray-500 text-white hover:bg-gray-500/80 border-transparent' },
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
