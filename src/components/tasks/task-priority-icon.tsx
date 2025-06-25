import { ArrowDown, Minus, ArrowUp } from 'lucide-react';
import { type Task } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type PriorityConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  low: { label: 'Low', icon: ArrowDown, color: 'text-gray-500' },
  medium: { label: 'Medium', icon: Minus, color: 'text-yellow-500' },
  high: { label: 'High', icon: ArrowUp, color: 'text-red-500' },
};

export function TaskPriorityIcon({ priority }: { priority: Task['priority'] }) {
  const { label, icon: Icon, color } = priorityConfig[priority];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="sr-only">{label} Priority</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} Priority</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
