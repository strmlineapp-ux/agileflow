
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
  const title = isSingleTabPage ? pageConfig.name : tab.name;
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <GoogleSymbol name={pageConfig.icon} className="text-6xl" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="font-headline text-3xl font-thin">{title}</h1>
              </TooltipTrigger>
              {pageConfig.description && (
                <TooltipContent>
                  <p className="max-w-xs">{pageConfig.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-2xl" />
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
