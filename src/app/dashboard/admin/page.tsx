

'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Component to manage a list of users with a specific role via pills
const UserRoleManager = ({
  title,
  description,
  allUsers,
  roleName,
  onRoleToggle,
}: {
  title: string;
  description: string;
  allUsers: User[];
  roleName: string;
  onRoleToggle: (user: User) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-2 min-h-[56px]">
          {allUsers.map(user => {
            const hasRole = user.roles?.includes(roleName);
            return (
              <Badge
                key={user.userId}
                variant={hasRole ? 'default' : 'secondary'}
                className={cn('gap-1.5 p-1 pl-2 cursor-pointer rounded-full', hasRole && 'shadow-md')}
                onClick={() => onRoleToggle(user)}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.displayName}</span>
              </Badge>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-right pr-2 mt-2">Click user pills to toggle their role status.</p>
      </CardContent>
    </Card>
  );
};

export default function AdminPage() {
  const { toast } = useToast();
  const { viewAsUser, users, updateUser } = useUser();
  
  const isAdmin = useMemo(() => viewAsUser.roles?.includes('Admin'), [viewAsUser.roles]);

  // 2FA Dialog State
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // This check must happen after all hooks are called.
  if (!isAdmin) {
    // This is now a safe return because nav is filtered.
    // This case handles loading states or direct URL access attempts.
    return null;
  }

  const handleRoleToggle = (user: User) => {
    const action = () => {
      const currentRoles = new Set(user.roles || []);
      const roleName = 'Admin';
      if (currentRoles.has(roleName)) {
        currentRoles.delete(roleName);
      } else {
        currentRoles.add(roleName);
      }
      updateUser(user.userId, { roles: Array.from(currentRoles) });
      toast({ title: 'Success', description: `${user.displayName}'s roles have been updated.` });
    };

    // Require 2FA for 'Admin' role
    setOn2faSuccess(() => action);
    setIs2faDialogOpen(true);
  };

  const handleVerify2fa = () => {
    if (twoFactorCode === '123456') { // Mock 2FA code
      on2faSuccess?.();
      close2faDialog();
    } else {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'The provided 2FA code is incorrect. Please try again.',
      });
      setTwoFactorCode('');
    }
  };

  const close2faDialog = () => {
    setIs2faDialogOpen(false);
    setTwoFactorCode('');
    setOn2faSuccess(null);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl font-semibold">Admin Management</h1>
        
        <UserRoleManager
            title="Manage Admins"
            description="Assign or revoke Admin privileges. This action requires 2FA."
            allUsers={users}
            roleName="Admin"
            onRoleToggle={handleRoleToggle}
        />
      </div>

      <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication Required</DialogTitle>
            <DialogDescription>
              Changing a privileged role requires secondary authentication. Enter the code from your authenticator app to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="2fa-code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close2faDialog}>Cancel</Button>
            <Button onClick={handleVerify2fa}>Verify & Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
