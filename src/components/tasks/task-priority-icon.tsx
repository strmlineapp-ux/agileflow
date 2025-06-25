import { ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown } from 'lucide-react';
import { type Task } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type PriorityConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
};

const priorityConfig: Record<Task['priority'], PriorityConfig> = {
  P0: { label: 'P0 - Highest', icon: ChevronsUp, color: 'text-red-600' },
  P1: { label: 'P1 - High', icon: ChevronUp, color: 'text-orange-500' },
  P2: { label: 'P2 - Medium', icon: Minus, color: 'text-yellow-500' },
  P3: { label: 'P3 - Low', icon: ChevronDown, color: 'text-gray-500' },
  P4: { label: 'P4 - Lowest', icon: ChevronsDown, color: 'text-gray-400' },
};

export function TaskPriorityIcon({ priority }: { priority: Task['priority'] }) {
  const { label, icon: Icon, color } = priorityConfig[priority];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
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
