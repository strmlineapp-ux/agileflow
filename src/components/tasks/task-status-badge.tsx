import { Badge } from '@/components/ui/badge';
import { type Task } from '@/types';
import { cn } from '@/lib/utils';

type StatusConfig = {
  label: string;
  color: string;
};

const statusConfig: Record<Task['status'], StatusConfig> = {
  not_started: { label: 'Not Started', color: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500' },
  awaiting_review: { label: 'Awaiting Review', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  blocked: { label: 'Blocked', color: 'bg-red-500' },
};

export function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = statusConfig[status];

  return (
    <Badge
      className={cn('text-white hover:text-white border-transparent', config.color)}
    >
      {config.label}
    </Badge>
  );
}
