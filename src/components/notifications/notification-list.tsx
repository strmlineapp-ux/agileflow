
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';

export function NotificationList() {
  const { realUser, notifications, setNotifications, handleApproveAccessRequest } = useUser();
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
                {notification.type === 'access_request' && notification.status === 'pending' && isAdmin && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleApproveAccessRequest(notification.id, true)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleApproveAccessRequest(notification.id, false)}>Reject</Button>
                  </div>
                )}
                 {notification.type === 'access_request' && notification.status !== 'pending' && (
                  <p className="text-xs font-semibold text-muted-foreground">{notification.status === 'approved' ? 'Access Approved' : 'Access Rejected'}</p>
                )}
              </div>
              {!notification.read && notification.type === 'standard' && (
                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Mark as read</Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
