

import { Badge } from '@/components/ui/badge';
import { type Priority } from '@/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function PriorityBadge({ priorityId, className }: { priorityId: string; className?: string }) {
  const { getPriorityDisplay } = useUser();
  const priorityInfo = getPriorityDisplay(priorityId);

  if (!priorityInfo) {
    return <Badge className={cn('bg-muted text-muted-foreground', className)}>Unknown</Badge>;
  }

  const badge = (
    <Badge
      variant="default"
      style={{ backgroundColor: priorityInfo.color, color: 'white' }}
      className={cn(
        'border-transparent',
        priorityInfo.shape === 'rounded-full' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {priorityInfo.label}
    </Badge>
  );

  if (priorityInfo.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{priorityInfo.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
