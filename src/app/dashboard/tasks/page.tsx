import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { PlusCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Tasks</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
