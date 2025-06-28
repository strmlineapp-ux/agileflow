

import { Badge } from '@/components/ui/badge';
import { type Priority } from '@/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function PriorityBadge({ priorityId, className }: { priorityId: Priority['id']; className?: string }) {
  const { getPriorityById } = useUser();
  const priority = getPriorityById(priorityId);

  if (!priority) {
    return <Badge className={cn('bg-muted text-muted-foreground', className)}>Unknown</Badge>;
  }

  const badge = (
    <Badge
      variant="default"
      style={{ backgroundColor: priority.color, color: 'white' }}
      className={cn(
        'border-transparent',
        priority.shape === 'rounded-full' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {priority.label}
    </Badge>
  );

  if (priority.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{priority.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
