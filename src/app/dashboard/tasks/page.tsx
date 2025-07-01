
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <GoogleSymbol name="checklist" className="text-3xl text-muted-foreground" />
        <h1 className="font-headline text-3xl font-semibold">Tasks</h1>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <GoogleSymbol name="add_circle" className="text-2xl" />
          <span className="sr-only">New Task</span>
        </Button>
      </div>
      <TaskList />
    </div>
  );
}
