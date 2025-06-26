'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockUsers } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

const notifications = [
  {
    id: '1',
    user: mockUsers[1],
    action: 'assigned you to a new task:',
    subject: 'Develop authentication API',
    time: new Date(new Date().setHours(new Date().getHours() - 1)),
    read: false,
  },
  {
    id: '2',
    user: mockUsers[0],
    action: 'mentioned you in a comment on',
    subject: 'Project Kickoff',
    time: new Date(new Date().setDate(new Date().getDate() - 1)),
    read: false,
  },
  {
    id: '3',
    user: mockUsers[2],
    action: 'completed the task:',
    subject: 'Fix login page CSS bug',
    time: new Date(new Date().setDate(new Date().getDate() - 2)),
    read: true,
  },
  {
    id: '4',
    user: { displayName: 'System', avatarUrl: 'https://placehold.co/40x40.png', userId: 'system', email: 'system', googleCalendarLinked: false },
    action: 'has a new update:',
    subject: 'New features are now available in the Calendar view.',
    time: new Date(new Date().setDate(new Date().getDate() - 3)),
    read: true,
  }
];

export function NotificationList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>You have {notifications.filter(n => !n.read).length} unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <div key={notification.id} className={`flex items-start gap-4 p-4 ${!notification.read ? 'bg-accent/20' : ''}`}>
              <Avatar className="h-10 w-10 border">
                 <AvatarImage src={notification.user.avatarUrl} alt={notification.user.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{notification.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{notification.user.displayName}</span>
                  {' '}
                  {notification.action}
                  {' '}
                  <span className="font-semibold text-primary">{notification.subject}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.time, { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                <Button variant="outline" size="sm">Mark as read</Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
