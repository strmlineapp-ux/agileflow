
import { type Task } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type PriorityConfig = {
  label: string;
  color: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  P0: { label: 'P0 - Highest', color: 'bg-red-500' },
  P1: { label: 'P1 - High', color: 'bg-orange-500' },
  P2: { label: 'P2 - Medium', color: 'bg-yellow-500' },
  P3: { label: 'P3 - Low', color: 'bg-green-500' },
  P4: { label: 'P4 - Lowest', color: 'bg-gray-700' },
};

export function TaskPriorityIcon({ priority }: { priority: Task['priority'] }) {
  const { label, color } = priorityConfig[priority];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${color}`} />
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
