
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppPage } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const stats = [
  { title: 'Active Tasks', value: '12', icon: 'checklist' },
  { title: 'Due this week', value: '5', icon: 'schedule' },
  { title: 'Completed', value: '28', icon: 'check_circle' },
  { title: 'Team Members', value: '8', icon: 'group' },
];

export function OverviewContent({ tab: pageConfig, isSingleTabPage }: { tab: AppPage, isSingleTabPage?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
       {isSingleTabPage && (
          <div className="flex items-center gap-3">
             <h1 className="font-headline text-3xl font-thin flex items-center gap-3">
                <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
                <span>{pageConfig.name}</span>
              </h1>
          </div>
       )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-thin">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-2xl" weight={100} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-thin">{stat.value}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="font-headline text-2xl font-thin mb-4">Recent Tasks</h2>
        <TaskList limit={5} />
      </div>
    </div>
  );
}
