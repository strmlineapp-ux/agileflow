
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Task, type AppPage, type AppTab } from '@/types';
import { useUser } from '@/context/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTitle } from '@/components/common/page-title';
import { useToast } from '@/hooks/use-toast';


const stats = [
  { title: 'Active Tasks', value: '12', icon: 'checklist' },
  { title: 'Due this week', value: '5', icon: 'schedule' },
  { title: 'Completed', value: '28', icon: 'check_circle' },
  { title: 'Team Members', value: '8', icon: 'group' },
];

export function OverviewContent({ page, tab }: { page?: AppPage, tab?: AppTab }) {
  const { fetchTasks, loading: userLoading, viewAsUser, updatePage } = useUser();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const title = page?.displayTitle ?? tab?.name ?? 'Overview';
  const canManagePage = viewAsUser.isAdmin;

  useEffect(() => {
    if (userLoading) return;
    const loadTasks = async () => {
      setLoading(true);
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks || []);
      setLoading(false);
    };
    loadTasks();
  }, [fetchTasks, userLoading]);

  const handleTitleSave = (newTitle: string) => {
    if (page) {
      updatePage(page.id, { displayTitle: newTitle });
    }
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (page && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        updatePage(page.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle 
        title={title}
        onSave={handleTitleSave}
        onReset={handleTitleReset}
        disabled={!canManagePage || !page}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-2xl" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl">{stat.value}</div>
              <p className="text-xs">this month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="text-2xl mb-4">Recent Tasks</h2>
        {loading ? (
            <Card><CardHeader className="h-64"><Skeleton className="h-full w-full" /></CardHeader></Card>
        ) : (
            <TaskList tasks={tasks} limit={5} />
        )}
      </div>
    </div>
  );
}
