
'use client';

import * as React from 'react';
import { format, isToday } from 'date-fns';
import { type Task, type Badge } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TaskStatusBadge } from './task-status-badge';
import { Badge as UiBadge } from '@/components/ui/badge';
import { useUser } from '@/context/user-context';
import { PriorityBadge } from '../calendar/priority-badge';
import { GoogleSymbol } from '../icons/google-symbol';


const statusOrder: Task['status'][] = ['in_progress', 'awaiting_review', 'not_started', 'blocked', 'completed'];

const statusLabels: Record<Task['status'], string> = {
  in_progress: 'In Progress',
  awaiting_review: 'Awaiting Review',
  not_started: 'Not Started',
  blocked: 'Blocked',
  completed: 'Completed',
};

export function TaskList({ tasks, limit, onEdit, onDelete }: { tasks: Task[], limit?: number, onEdit?: (task: Task) => void, onDelete?: (taskId: string) => void }) {
  const { allBadgeCollections, allBadges } = useUser();

  const taskPriorities = React.useMemo(() => {
    const taskPriorityCollection = allBadgeCollections.find(c => c.applications?.includes('tasks'));
    if (!taskPriorityCollection) return [];
    return taskPriorityCollection.badgeIds.map(id => allBadges.find(b => b.id === id)).filter((b): b is Badge => !!b);
  }, [allBadgeCollections, allBadges]);

  const renderTable = (tasksToRender: Task[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="-ml-4 text-muted-foreground">
                  Task
                  <GoogleSymbol name="swap_vert" className="ml-2" weight={100} />
                </Button>
              </TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksToRender.map((task) => (
              <TableRow key={task.taskId}>
                <TableCell className="font-light text-muted-foreground">{task.title}</TableCell>
                <TableCell>
                  <div className="text-muted-foreground font-light">
                    {task.assignedTo.map((user) => {
                      const nameParts = user.displayName.split(' ');
                      const formattedName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` : nameParts[0];
                      return <div key={user.userId}>{formattedName}</div>;
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priorityId={task.priority} />
                </TableCell>
                <TableCell className="text-muted-foreground font-light">{isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <GoogleSymbol name="more_horiz" weight={100} />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onEdit?.(task)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => onDelete?.(task.taskId)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderGroupedTasks = (tasksToGroup: Task[]) => {
    const groupedTasks = tasksToGroup.reduce((acc, task) => {
        const status = task.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<Task['status'], Task[]>);

    return (
        <div className="space-y-8">
            {statusOrder.map(status => {
                let tasksInGroup = groupedTasks[status];
                if (!tasksInGroup || tasksInGroup.length === 0) return null;
                
                tasksInGroup = tasksInGroup.sort((a, b) => {
                    const aIsToday = isToday(a.dueDate);
                    const bIsToday = isToday(b.dueDate);
                    if (aIsToday && !bIsToday) return -1;
                    if (!aIsToday && bIsToday) return 1;
            
                    return a.dueDate.getTime() - b.dueDate.getTime();
                });

                return (
                    <div key={status}>
                        <h3 className="text-xl font-light mb-4 flex items-center gap-2 text-muted-foreground">
                           <span>{statusLabels[status]}</span>
                           <UiBadge variant="secondary">{tasksInGroup.length}</UiBadge>
                        </h3>
                        {renderTable(tasksInGroup)}
                    </div>
                );
            })}
        </div>
    );
  };
  
  if(limit) {
    const sortedTasks = [...tasks].sort((a, b) => {
        const aIsToday = isToday(a.dueDate);
        const bIsToday = isToday(b.dueDate);

        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;

        const statusAIndex = statusOrder.indexOf(a.status);
        const statusBIndex = statusOrder.indexOf(b.status);

        if (statusAIndex !== statusBIndex) {
            return statusAIndex - statusBIndex;
        }

        return a.dueDate.getTime() - b.dueDate.getTime();
    });
    return renderTable(sortedTasks.slice(0, limit));
  }

  return renderGroupedTasks(tasks);
}
