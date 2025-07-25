
'use client';

import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab, type AppPage } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TasksContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  const title = isSingleTabPage ? pageConfig.name : "Tasks";
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-thin tracking-tight">Tasks</h2>
        <Button>
          <GoogleSymbol name="add_circle" className="mr-2" />
          New Task
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
