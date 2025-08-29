
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type Task } from '@/types';
import { useUser } from '@/context/user-context';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { title: 'Active Tasks', value: '12', icon: 'checklist' },
  { title: 'Due this week', value: '5', icon: 'schedule' },
  { title: 'Completed', value: '28', icon: 'check_circle' },
  { title: 'Team Members', value: '8', icon: 'group' },
];

export function OverviewContent() {
  const { fetchTasks } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks || []);
      setLoading(false);
    };
    loadTasks();
  }, [fetchTasks]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-2xl text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl">{stat.value}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="font-headline text-2xl font-thin mb-4 text-muted-foreground">Recent Tasks</h2>
        {loading ? (
            <Card><CardHeader className="h-64"><Skeleton className="h-full w-full" /></CardHeader></Card>
        ) : (
            <TaskList tasks={tasks} limit={5} />
        )}
      </div>
    </div>
  );
}
