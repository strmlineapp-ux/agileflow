
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab, type AppPage } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/context/user-context';

export function TasksContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'all'>('my-tasks');
  const { viewAsUser, tasks } = useUser();

  const filteredTasks = activeTab === 'my-tasks'
    ? tasks.filter(task => task.assignedTo.some(user => user.userId === viewAsUser.userId))
    : tasks;

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList>
                <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      <div className="flex">
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
      <TaskList tasks={filteredTasks} />
    </div>
  );
}
