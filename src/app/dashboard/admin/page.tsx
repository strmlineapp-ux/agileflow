
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type PageConfig } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';

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

const PageConfiguration = ({ pageConfig, onSave }: { pageConfig: PageConfig, onSave: (data: Partial<PageConfig>) => void }) => {
    const [tempName, setTempName] = useState(pageConfig.name);
    const [tempIcon, setTempIcon] = useState(pageConfig.icon);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    const handleSaveChanges = () => {
        onSave({ name: tempName, icon: tempIcon });
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Page Configuration</CardTitle>
                <CardDescription>
                    Customize the display name and icon for the App Manager page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <GoogleSymbol name={tempIcon} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                            <div className="p-2 border-b">
                                <Input
                                    placeholder="Search icons..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-64">
                            <div className="grid grid-cols-6 gap-1 p-2">
                                {filteredIcons.slice(0, 300).map((iconName) => (
                                <Button
                                    key={iconName}
                                    variant={tempIcon === iconName ? "default" : "ghost"}
                                    size="icon"
                                    onClick={() => {
                                        setTempIcon(iconName);
                                        setIsIconPopoverOpen(false);
                                    }}
                                    className="text-2xl"
                                >
                                    <GoogleSymbol name={iconName} />
                                </Button>
                                ))}
                            </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Input id="page-name" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Page Name" />
                    <Button onClick={handleSaveChanges} size="icon">
                        <GoogleSymbol name="check" />
                        <span className="sr-only">Save Configuration</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
  const { toast } = useToast();
  const { realUser, users, pageConfigs, updatePageConfig, updateUser } = useUser();
  
  const isAdmin = useMemo(() => realUser.roles?.includes('Admin'), [realUser.roles]);
  const sdmConfig = useMemo(() => pageConfigs.find(p => p.id === 'service-delivery'), [pageConfigs]);

  // 2FA Dialog State
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // This is a protected page. If the user is not an admin, show an access denied message.
  // This is safer than a useEffect-based redirect which can violate the rules of hooks.
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <GoogleSymbol name="lock" className="text-6xl text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the Admin Panel.</p>
      </div>
    );
  }

  const handleSavePageConfig = (data: Partial<PageConfig>) => {
    if(sdmConfig) {
        updatePageConfig(sdmConfig.id, data);
        toast({ title: 'Success', description: 'App Manager page configuration has been updated.' });
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
  
  // The sdmConfig should always exist, but this check makes it safe.
  if (!sdmConfig) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl font-semibold">Admin Panel</h1>
        
        <Tabs defaultValue="admins" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admins">Admin Management</TabsTrigger>
                <TabsTrigger value="app-manager">App Manager</TabsTrigger>
            </TabsList>
            <TabsContent value="admins" className="mt-6">
                <UserRoleManager
                    title="Manage Admins"
                    description="Assign or revoke Admin privileges. This action requires 2FA."
                    allUsers={users}
                    roleName="Admin"
                    onRoleToggle={(user) => handleRoleToggle(user, 'Admin')}
                />
            </TabsContent>
            <TabsContent value="app-manager" className="mt-6 space-y-6">
                  <UserRoleManager
                    title={`Manage ${sdmConfig.name}s`}
                    description={`Assign or revoke ${sdmConfig.name} privileges. This action requires 2FA.`}
                    allUsers={users}
                    roleName="Service Delivery Manager"
                    onRoleToggle={(user) => handleRoleToggle(user, 'Service Delivery Manager')}
                    />
                <PageConfiguration pageConfig={sdmConfig} onSave={handleSavePageConfig} />
            </TabsContent>
        </Tabs>
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
