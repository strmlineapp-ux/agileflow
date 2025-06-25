'use client';

import * as React from 'react';
import { format } from 'date-fns';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityIcon } from './task-priority-icon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"


const mockUsers: User[] = [
    { userId: '1', displayName: 'Alice Johnson', email: 'alice@example.com', role: 'manager', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png?text=AJ' },
    { userId: '2', displayName: 'Bob Williams', email: 'bob@example.com', role: 'team_member', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png?text=BW' },
    { userId: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', role: 'team_member', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png?text=CB' },
];

const mockTasks: Task[] = [
  { taskId: '1', title: 'Design new dashboard layout', assignedTo: [mockUsers[0]], dueDate: new Date('2024-08-15'), priority: 'high', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '2', title: 'Develop authentication API', assignedTo: [mockUsers[1], mockUsers[2]], dueDate: new Date('2024-08-20'), priority: 'high', status: 'awaiting_review', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '3', title: 'Write documentation for components', assignedTo: [mockUsers[2]], dueDate: new Date('2024-08-25'), priority: 'medium', status: 'not_started', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '4', title: 'Fix login page CSS bug', assignedTo: [mockUsers[1]], dueDate: new Date('2024-08-12'), priority: 'low', status: 'completed', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '5', title: 'Setup CI/CD pipeline', assignedTo: [mockUsers[0], mockUsers[1]], dueDate: new Date('2024-09-01'), priority: 'high', status: 'blocked', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
  { taskId: '6', title: 'User testing for new features', assignedTo: [mockUsers[2]], dueDate: new Date('2024-08-18'), priority: 'medium', status: 'in_progress', createdBy: '1', createdAt: new Date(), lastUpdated: new Date() },
];

export function TaskList({ limit }: { limit?: number }) {
  const tasksToShow = limit ? mockTasks.slice(0, limit) : mockTasks;

  const renderTable = () => (
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
            {tasksToShow.map((task) => (
              <TableRow key={task.taskId}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {task.assignedTo.map((user) => (
                      <Avatar key={user.userId} className="h-8 w-8 border-2 border-card -ml-2 first:ml-0">
                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.displayName.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityIcon priority={task.priority} />
                </TableCell>
                <TableCell>{format(task.dueDate, 'MMM dd, yyyy')}</TableCell>
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

  if(limit) {
    return renderTable();
  }

  return (
    <Tabs defaultValue="all">
        <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
           {renderTable()}
        </TabsContent>
        <TabsContent value="my-tasks" className="mt-4">
            {renderTable()}
        </TabsContent>
    </Tabs>
  )
}
