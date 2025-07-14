
'use client';

import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TasksContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  const title = isSingleTabPage ? pageConfig.name : tab.name;
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoogleSymbol name={pageConfig.icon} style={{fontSize: '60px'}} weight={100}/>
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-headline text-3xl font-thin">{title}</h1>
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
