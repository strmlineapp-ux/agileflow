
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';

export function NotificationList() {
  const { realUser, notifications, setNotifications } = useUser();
  const isAdmin = realUser?.isAdmin;
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
     setNotifications(prevNotifications => prevNotifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>You have {unreadCount} unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <div key={notification.id} className={cn('flex items-start gap-4 p-3', !notification.read && 'bg-accent/20')}>
              <Avatar className="h-10 w-10 border">
                 <AvatarImage src={notification.user.avatarUrl} alt={notification.user.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{notification.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1 flex-1">
                <p className="text-sm font-normal">
                  <span className="font-normal">{notification.user.displayName}</span>
                  {' '}
                  {notification.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.time, { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Mark as read</Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
