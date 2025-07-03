
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab } from '@/types';

const stats = [
  { title: 'Active Tasks', value: '12', icon: 'checklist' },
  { title: 'Due this week', value: '5', icon: 'schedule' },
  { title: 'Completed', value: '28', icon: 'check_circle' },
  { title: 'Team Members', value: '8', icon: 'group' },
];

export function OverviewContent({ tab }: { tab: AppTab }) {
  // The header is now rendered by the dynamic page component.
  // This component just needs to render the overview content.
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-muted-foreground text-2xl" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Recent Tasks</h2>
        <TaskList limit={5} />
      </div>
    </div>
  );
}
