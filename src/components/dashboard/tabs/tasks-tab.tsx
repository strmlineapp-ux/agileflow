

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Task, type AppPage, type AppTab } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser } from '@/context/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CenteredTabList } from '@/components/common/centered-tab-list';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';
import { getDb } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// A new form component will be needed for adding/editing tasks. Let's assume its creation.
// For now, we'll imagine a placeholder. A real implementation would require a TaskForm component.


async function fetchTasks(workspaceId: string): Promise<Task[]> {
  const db = getDb();
  const q = query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    taskId: doc.id,
    ...doc.data(),
    dueDate: (doc.data().dueDate as Timestamp).toDate(),
  } as Task));
}

async function addTask(taskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>): Promise<Task> {
    const db = getDb();
    const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        createdAt: new Date(),
        lastUpdated: new Date(),
    });
    return { ...taskData, taskId: docRef.id, createdAt: new Date(), lastUpdated: new Date() };
}

async function updateTask({ taskId, updatedData }: { taskId: string, updatedData: Partial<Task> }) {
    const db = getDb();
    await updateDoc(doc(db, 'tasks', taskId), {
        ...updatedData,
        lastUpdated: new Date(),
    });
}

async function deleteTask(taskId: string) {
    const db = getDb();
    await deleteDoc(doc(db, 'tasks', taskId));
}

export function TasksContent({ initialTasks, page, tab }: { initialTasks: Task[], page?: AppPage, tab?: AppTab }) {
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'all'>('my-tasks');
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks = initialTasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', viewAsUser.workspaceId],
    queryFn: () => fetchTasks(viewAsUser.workspaceId),
    initialData: initialTasks,
    enabled: !!viewAsUser.workspaceId,
  });
  
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', viewAsUser.workspaceId] });
      toast({ title: "Success", description: "Your changes have been saved." });
      setIsFormOpen(false);
      setEditingTask(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  };

  const addTaskMutation = useMutation({
    mutationFn: addTask,
    ...mutationOptions
  });
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    ...mutationOptions
  });
  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    ...mutationOptions
  });
  

  const title = page?.displayTitle ?? tab?.name ?? 'Tasks';
  const canManagePage = viewAsUser.isAdmin;
  
  const handleTitleSave = (newTitle: string) => {
    if (page) {
      updateUser(page.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (page && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updateUser(page.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  const handleTaskAdded = async (taskData: Omit<Task, 'taskId' | 'createdAt' | 'lastUpdated'>) => {
    const dataWithContext = {
      ...taskData,
      workspaceId: viewAsUser.workspaceId,
      createdBy: viewAsUser.userId,
    };
    addTaskMutation.mutate(dataWithContext as any);
  };
  
  const handleTaskUpdated = async (taskId: string, updatedData: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updatedData });
  };
  
  const handleTaskDeleted = async (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };
  
  const openNewTaskForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };
  
  const openEditTaskForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const filteredTasks = activeTab === 'my-tasks'
    ? tasks.filter(task => task.assignedTo.some(user => user.userId === viewAsUser.userId))
    : tasks;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <PageTitle 
              title={title}
              onSave={handleTitleSave}
              onReset={handleTitleReset}
              disabled={!canManagePage || !page}
            />
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" onClick={openNewTaskForm}>
                            <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                            <span className="sr-only">New Task</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>New Task</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </DialogTrigger>
                <DialogContent>
                    {/* A proper TaskForm component would go here, this is a conceptual placeholder */}
                    <p>Task Form Placeholder</p>
                    <p>{editingTask ? `Editing: ${editingTask.title}` : 'Creating new task'}</p>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      
       <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full flex flex-col flex-1 min-h-0">
          <CenteredTabList>
              <TabsList>
                  <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
              </TabsList>
          </CenteredTabList>
          <div className="flex-1 overflow-y-auto pt-6 hide-scrollbar">
            <TabsContent value="my-tasks" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
              ) : (
                <TaskList 
                    tasks={filteredTasks} 
                    onEdit={openEditTaskForm}
                    onDelete={handleTaskDeleted}
                />
              )}
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
              ) : (
                <TaskList 
                    tasks={filteredTasks} 
                    onEdit={openEditTaskForm}
                    onDelete={handleTaskDeleted}
                />
              )}
            </TabsContent>
          </div>
      </Tabs>
    </div>
  );
}
