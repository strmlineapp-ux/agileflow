'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockNotifications } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';

export function NotificationList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>You have {mockNotifications.filter(n => !n.read).length} unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {mockNotifications.map((notification) => (
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
