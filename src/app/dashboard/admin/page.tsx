
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';


// A card to display a user with a specific role.
const UserRoleCard = ({ user, onRemove }: { user: User; onRemove: (user: User) => void }) => {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
            <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onRemove(user)} aria-label={`Remove role from ${user.displayName}`}>
          <GoogleSymbol name="cancel" className="text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
};

// A button that opens a popover to add a user to a role.
const AddUserToRoleButton = ({ usersToAdd, onAdd, roleName }: { usersToAdd: User[], onAdd: (user: User) => void, roleName: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (user: User) => {
    onAdd(user);
    setIsOpen(false);
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <GoogleSymbol name="add_circle" className="text-2xl" />
            <span className="sr-only">Assign {roleName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80">
        <ScrollArea className="h-64">
           <div className="p-1">
            {usersToAdd.length > 0 ? usersToAdd.map(user => (
              <div key={user.userId} onClick={() => handleSelect(user)} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-sm text-muted-foreground p-4">All users are assigned.</p>
            )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default function AdminPage() {
  const { toast } = useToast();
  const { viewAsUser, users, updateUser, appSettings, updateAppSettings } = useUser();
  
  const isAdmin = useMemo(() => viewAsUser.isAdmin, [viewAsUser]);

  // Dialog & Popover States
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  
  const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    const input = nameInputRef.current;
    if (!input || !input.value.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Display name cannot be empty.' });
      setIsEditingName(false);
      return;
    }
    if (input.value.trim() !== appSettings.displayName) {
      updateAppSettings({ displayName: input.value.trim() });
      toast({ title: 'Success', description: 'Display name updated.' });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };


  const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
  ];
  
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);


  // This check must happen after all hooks are called.
  if (!isAdmin) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const adminUsers = useMemo(() => users.filter(u => u.isAdmin), [users]);
  const serviceAdminUsers = useMemo(() => users.filter(u => u.roles?.includes('Service Admin')), [users]);
  
  const nonAdminUsers = useMemo(() => users.filter(u => !u.isAdmin), [users]);
  const nonServiceAdminUsers = useMemo(() => users.filter(u => !u.roles?.includes('Service Admin')), [users]);

  const handleAdminToggle = (user: User) => {
    const action = () => {
      updateUser(user.userId, { isAdmin: !user.isAdmin });
      toast({ title: 'Success', description: `${user.displayName}'s admin status has been updated.` });
    };
    setOn2faSuccess(() => action);
    setIs2faDialogOpen(true);
  };
  
  const handleServiceAdminToggle = (user: User) => {
    const action = () => {
        const currentRoles = user.roles || [];
        const isServiceAdmin = currentRoles.includes('Service Admin');
        const newRoles = isServiceAdmin
          ? currentRoles.filter(role => role !== 'Service Admin')
          : [...currentRoles, 'Service Admin'];

        updateUser(user.userId, { roles: newRoles });
        toast({ title: 'Success', description: `${user.displayName}'s Service Admin status has been updated.` });
    };

    setOn2faSuccess(() => action);
    setIs2faDialogOpen(true);
  };

  const handleVerify2fa = () => {
    // Mock 2FA code
    if (twoFactorCode === '123456') { 
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

  const handleIconSelect = (newIcon: string) => {
    updateAppSettings({ icon: newIcon });
    setIsIconPopoverOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <h1 className="font-headline text-3xl font-semibold">Admin Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Admins Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Admins</CardTitle>
                <AddUserToRoleButton usersToAdd={nonAdminUsers} onAdd={handleAdminToggle} roleName="Admin" />
              </div>
              <CardDescription>Assign or revoke Admin privileges. This is the highest level of access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminUsers.map(user => (
                <UserRoleCard key={user.userId} user={user} onRemove={handleAdminToggle} />
              ))}
            </CardContent>
          </Card>
          
          {/* Service Admins Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-2xl text-muted-foreground hover:text-foreground">
                          <GoogleSymbol name={appSettings.icon} />
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
                                        variant={appSettings.icon === iconName ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => handleIconSelect(iconName)}
                                        className="text-2xl"
                                    >
                                        <GoogleSymbol name={iconName} />
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                  </Popover>
                   <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card cursor-pointer" aria-label="Change service admin color">
                        <div
                          className="h-full w-full rounded-full"
                          style={{ backgroundColor: appSettings.serviceAdminColor || '#8B5CF6' }}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              updateAppSettings({ serviceAdminColor: color });
                              setIsColorPopoverOpen(false);
                            }}
                            aria-label={`Set color to ${color}`}
                          />
                        ))}
                        <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                          <GoogleSymbol name="colorize" className="text-muted-foreground" />
                          <Input
                            type="color"
                            value={appSettings.serviceAdminColor || '#8B5CF6'}
                            onChange={(e) => updateAppSettings({ serviceAdminColor: e.target.value })}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                            aria-label="Custom color picker"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {isEditingName ? (
                   <Input
                        ref={nameInputRef}
                        defaultValue={appSettings.displayName}
                        onBlur={handleSaveName}
                        onKeyDown={handleNameKeyDown}
                        className="font-body h-auto p-0 text-2xl font-semibold leading-none tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                ) : (
                    <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">
                        {appSettings.displayName}
                    </CardTitle>
                )}
                <AddUserToRoleButton usersToAdd={nonServiceAdminUsers} onAdd={handleServiceAdminToggle} roleName={appSettings.displayName} />
              </div>
              <CardDescription>Assign or revoke {appSettings.displayName} privileges for managing app-wide settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceAdminUsers.map(user => (
                <UserRoleCard key={user.userId} user={user} onRemove={handleServiceAdminToggle} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleVerify2fa}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Verify & Change</span>
              </Button>
          </div>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the code from your authenticator app and click the checkmark to confirm the role change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="2fa-code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
