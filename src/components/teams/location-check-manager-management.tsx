

'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function LocationCheckManagerManagement({ team }: { team: Team }) {
  const { users, updateTeam } = useUser();
  
  const assignableUsers = users; // Any user can be a location check manager
  const locationCheckManagers = new Set(team.locationCheckManagers || []);

  const handleToggleManager = (userId: string) => {
    const newManagers = new Set(locationCheckManagers);
    if (newManagers.has(userId)) {
      newManagers.delete(userId);
    } else {
      newManagers.add(userId);
    }
    updateTeam(team.id, { locationCheckManagers: Array.from(newManagers) });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Location Check Managers
          </CardTitle>
          <CardDescription>
            Assign users who can manage daily check assignments on the Production Schedule for this team's locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-2 min-h-[56px]">
            {assignableUsers.map(user => {
              const isManager = locationCheckManagers.has(user.userId);
              return (
                <Badge
                  key={user.userId}
                  variant={isManager ? 'default' : 'secondary'}
                  className={cn('gap-1.5 p-1 pl-2 cursor-pointer rounded-full', isManager && 'shadow-md')}
                  onClick={() => handleToggleManager(user.userId)}
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
          <p className="text-xs text-muted-foreground text-right pr-2 mt-2">
            Click a user pill to toggle their manager status.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
