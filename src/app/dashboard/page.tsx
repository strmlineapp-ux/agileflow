import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Clock, CheckCircle, Users } from 'lucide-react';
import { TaskList } from '@/components/tasks/task-list';

const stats = [
  { title: 'Active Tasks', value: '12', icon: ListChecks },
  { title: 'Due this week', value: '5', icon: Clock },
  { title: 'Completed', value: '28', icon: CheckCircle },
  { title: 'Team Members', value: '8', icon: Users },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
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
