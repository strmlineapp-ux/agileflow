
'use client';

import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab, type AppPage } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TasksContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                <span className="sr-only">New Task</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <TaskList />
    </div>
  );
}
