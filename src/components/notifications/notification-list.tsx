

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import type { Notification } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Helper function to format distance to now
const formatDistanceToNow = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

async function approveAccessRequest(variables: { workspaceId: string; notificationId: string; targetUserId: string; approvedBy: string; approved: boolean; }) {
    const { workspaceId, notificationId, targetUserId, approvedBy, approved } = variables;
    const db = getDb();
    const userRef = doc(db, 'users', targetUserId);
    const notificationRef = doc(db, 'notifications', notificationId);

    const batch = writeBatch(db);
    
    if (approved) {
        batch.update(userRef, { accountType: 'Full', approvedBy });
        batch.update(notificationRef, { status: 'approved' });
    } else {
        batch.delete(userRef);
        batch.update(notificationRef, { status: 'rejected' });
    }
    await batch.commit();
}


export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const { realUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = realUser?.isAdmin;

  const mutation = useMutation({
    mutationFn: approveAccessRequest,
    onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', variables.workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['users', variables.workspaceId] });
        toast({ title: variables.approved ? 'User Approved' : 'User Rejected' });
    },
    onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });
  
  const handleApprove = (notificationId: string, approved: boolean) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || !notification.data?.userId || !realUser) return;
    
    mutation.mutate({
      workspaceId: realUser.workspaceId,
      notificationId: notification.id,
      targetUserId: notification.data.userId,
      approvedBy: realUser.userId,
      approved
    });
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const db = getDb();
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications', realUser?.workspaceId] });
  }

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>You have {unreadCount} unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {notifications.map((notification) => (
            <div key={notification.id} className={cn('flex items-start gap-4 p-3', !notification.read && 'bg-accent/20')}>
              <Avatar className="h-10 w-10">
                 <AvatarImage src={notification.user.avatarUrl} alt={notification.user.displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{notification.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1 flex-1">
                <p className="text-sm">
                  <span>{notification.user.displayName}</span>
                  {' '}
                  {notification.content}
                </p>
                <p className="text-xs">
                  {formatDistanceToNow(notification.time)}
                </p>
                {notification.type === 'access_request' && notification.status === 'pending' && isAdmin && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleApprove(notification.id, true)} disabled={mutation.isPending}>Approve</Button>
                    <Button size="sm" variant="default" className="text-destructive" onClick={() => handleApprove(notification.id, false)} disabled={mutation.isPending}>Reject</Button>
                  </div>
                )}
                 {notification.type === 'access_request' && notification.status !== 'pending' && (
                  <p className="text-xs">{notification.status === 'approved' ? 'Access Approved' : 'Access Rejected'}</p>
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
