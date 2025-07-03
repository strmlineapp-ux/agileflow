
'use client';

import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab } from '@/types';

export function TasksContent({ tab }: { tab: AppTab }) {
  // The header is now rendered by the dynamic page component.
  // This component can still have its own sub-header for actions.
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-end">
         <Button>
          <GoogleSymbol name="add_circle" className="mr-2" />
          New Task
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
