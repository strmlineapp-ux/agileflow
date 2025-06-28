
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '@/components/icons/google-symbol';
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
                className={cn('gap-1.5 p-1 pl-2 cursor-pointer', hasRole && 'shadow-md')}
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
  const router = useRouter();
  const { toast } = useToast();
  const { realUser, users, appManagerRoleName, setAppManagerRoleName, updateUser } = useUser();
  const [tempRoleName, setTempRoleName] = useState(appManagerRoleName);

  // 2FA Dialog State
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const isAdmin = useMemo(() => realUser.roles?.includes('Admin'), [realUser.roles]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/calendar');
    }
  }, [isAdmin, router]);

  const handleSaveRoleName = () => {
    if (tempRoleName.trim()) {
      setAppManagerRoleName(tempRoleName.trim());
      toast({ title: 'Success', description: 'App Manager role name has been updated.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Role name cannot be empty.' });
    }
  };

  const handleRoleToggle = (user: User, roleName: string) => {
    const action = () => {
      const currentRoles = new Set(user.roles || []);
      if (currentRoles.has(roleName)) {
        currentRoles.delete(roleName);
      } else {
        currentRoles.add(roleName);
      }
      updateUser(user.userId, { roles: Array.from(currentRoles) });
      toast({ title: 'Success', description: `${user.displayName}'s roles have been updated.` });
    };

    // Require 2FA for both 'Admin' and 'Service Delivery Manager' roles
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

  if (!isAdmin) {
    return null; // or a loading spinner
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl font-semibold">Admin Panel</h1>

        <UserRoleManager
          title="Manage Admins"
          description="Assign or revoke Admin privileges. This action requires 2FA."
          allUsers={users}
          roleName="Admin"
          onRoleToggle={(user) => handleRoleToggle(user, 'Admin')}
        />

        <Card>
          <CardHeader>
            <CardTitle>App Manager Role Configuration</CardTitle>
            <CardDescription>
              Define the name for the app-wide manager role. The current name is "{appManagerRoleName}".
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Label htmlFor="role-name" className="sr-only">Role Display Name</Label>
            <Input
              id="role-name"
              placeholder="e.g., Service Delivery Manager"
              value={tempRoleName}
              onChange={(e) => setTempRoleName(e.target.value)}
            />
            <Button onClick={handleSaveRoleName}>Save</Button>
          </CardContent>
        </Card>

        <UserRoleManager
          title={`Manage ${appManagerRoleName}s`}
          description={`Assign or revoke ${appManagerRoleName} privileges. This action requires 2FA.`}
          allUsers={users}
          roleName="Service Delivery Manager"
          onRoleToggle={(user) => handleRoleToggle(user, 'Service Delivery Manager')}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="2fa-code" className="text-right">Code</Label>
              <Input id="2fa-code" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} className="col-span-3" placeholder="123456" />
            </div>
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
