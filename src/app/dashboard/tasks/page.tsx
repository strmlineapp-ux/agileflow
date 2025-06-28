import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold">Tasks</h1>
        <Button>
          <GoogleSymbol name="add_circle" className="mr-2" />
          New Task
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
