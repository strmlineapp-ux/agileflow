
'use client';

import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppPage } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TasksContent({ tab: pageConfig }: { tab: AppPage }) {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoogleSymbol name={pageConfig.icon} className="text-6xl" />
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-headline text-3xl font-thin">{pageConfig.name}</h1>
              </TooltipTrigger>
              {pageConfig.description && (
                <TooltipContent>
                  <p className="max-w-xs">{pageConfig.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button>
          <GoogleSymbol name="add_circle" className="mr-2" />
          New Task
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
