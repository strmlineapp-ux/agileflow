'use client';

import * as React from 'react';
import { format, isToday } from 'date-fns';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { type Task, type User } from '@/types';
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
import { TaskPriorityIcon } from './task-priority-icon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';


const mockUsers: User[] = [
    { userId: '1', displayName: 'Alice Johnson', email: 'alice@example.com', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Product Manager', location: 'New York, USA', phone: '123-456-7890' },
    { userId: '2', displayName: 'Bob Williams', email: 'bob@example.com', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'Lead Engineer', location: 'San Francisco, USA' },
    { userId: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Software Engineer', location: 'Austin, USA' },
];

const mockTasks: Task[] = [
  { taskId: '1', title: 'Design new dashboard layout', assignedTo: [mockUsers[0]], dueDate: new Date(), priority: 'P1', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '2', title: 'Develop authentication API', assignedTo: [mockUsers[1], mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), priority: 'P0', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '3', title: 'Write documentation for components', assignedTo: [mockUsers[2]], dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), priority: 'P2', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '4', title: 'Fix login page CSS bug', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), priority: 'P3', status: 'completed', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '5', title: 'Setup CI/CD pipeline', assignedTo: [mockUsers[0], mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'P1', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '6', title: 'User testing for new features', assignedTo: [mockUsers[2]], dueDate: new Date(), priority: 'P2', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '7', title: 'Update project dependencies', assignedTo: [mockUsers[1]], dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), priority: 'P4', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

const statusOrder: Task['status'][] = ['in_progress', 'awaiting_review', 'not_started', 'blocked', 'completed'];

const statusLabels: Record<Task['status'], string> = {
  in_progress: 'In Progress',
  awaiting_review: 'Awaiting Review',
  not_started: 'Not Started',
  blocked: 'Blocked',
  completed: 'Completed',
};

const currentUserId = '2'; // Assuming Bob is the logged in user

export function TaskList({ limit }: { limit?: number }) {
  const renderTable = (tasks: Task[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="-ml-4">
                  Task
                  <ArrowUpDown className="ml-2 h-4 w-4" />
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
            {tasks.map((task) => (
              <TableRow key={task.taskId}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div>
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
                  <TaskPriorityIcon priority={task.priority} />
                </TableCell>
                <TableCell>{isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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

  const renderGroupedTasks = (tasks: Task[]) => {
    const groupedTasks = tasks.reduce((acc, task) => {
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
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                           <span>{statusLabels[status]}</span>
                           <Badge variant="secondary">{tasksInGroup.length}</Badge>
                        </h3>
                        {renderTable(tasksInGroup)}
                    </div>
                );
            })}
        </div>
    );
  };
  
  if(limit) {
    const sortedTasks = [...mockTasks].sort((a, b) => {
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

  const allTasks = mockTasks;
  const myTasks = mockTasks.filter(task => task.assignedTo.some(user => user.userId === currentUserId));

  return (
    <Tabs defaultValue="my-tasks">
        <TabsList>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="my-tasks" className="mt-4">
           {renderGroupedTasks(myTasks)}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
            {renderGroupedTasks(allTasks)}
        </TabsContent>
    </Tabs>
  )
}
