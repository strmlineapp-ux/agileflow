

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/context/user-context';
import { type User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';

export function NotificationList() {
  const { toast } = useToast();
  const { realUser, users, addUser, notifications, setNotifications } = useUser();
  const isAdmin = realUser.isAdmin;
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleApproval = (notificationId: string, approved: boolean) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.type !== 'access_request' || !notification.data) return;

    if (approved) {
      const newUser: User = {
        userId: crypto.randomUUID(),
        email: notification.data.email,
        displayName: notification.data.displayName,
        isAdmin: false,
        accountType: 'Viewer',
        googleCalendarLinked: false,
        avatarUrl: `https://placehold.co/40x40.png`,
        roles: [],
        directReports: []
      };
      addUser(newUser);
      toast({ title: 'User Approved', description: `${newUser.displayName} has been added to the system.` });
    } else {
      toast({ title: 'User Rejected', description: `Access request for ${notification.data.displayName} has been rejected.`, variant: 'destructive' });
    }

    setNotifications(prevNotifications => prevNotifications.map(n =>
      n.id === notificationId
        ? { ...n, status: approved ? 'approved' : 'rejected', read: true }
        : n
    ));
  };

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
                 {notification.type === 'access_request' && isAdmin && (
                    <div className="flex items-center gap-2 mt-2">
                      {notification.status === 'pending' && (
                        <>
                           <Button size="sm" onClick={() => handleApproval(notification.id, true)}>
                             <GoogleSymbol name="check" className="mr-2" />
                             Allow
                           </Button>
                           <Button size="sm" variant="destructive" onClick={() => handleApproval(notification.id, false)}>
                             <GoogleSymbol name="close" className="mr-2" />
                             Reject
                           </Button>
                        </>
                      )}
                      {notification.status === 'approved' && (
                        <span className="text-sm font-normal text-green-600">Approved</span>
                      )}
                      {notification.status === 'rejected' && (
                        <span className="text-sm font-normal text-red-600">Rejected</span>
                      )}
                    </div>
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
