
'use client';

import React from 'react';
import { type User } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserCardProps {
    user: User;
    isDeletable?: boolean;
    onDelete?: (user: User) => void;
    className?: string;
}

export function UserCard({ user, isDeletable, onDelete, className }: UserCardProps) {

    return (
        <Card className={cn("group transition-colors bg-transparent", className)}>
            <CardHeader className="p-2 flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                      <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-muted-foreground">{user.displayName}</CardTitle>
                        <CardDescription>{user.title || 'No title provided'}</CardDescription>
                    </div>
                </div>
                {isDeletable && onDelete && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); onDelete(user); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <GoogleSymbol name="cancel" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete User</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardHeader>
        </Card>
    );
}

// We need to import useUser here, since it's used in the component.
// In a real project, this might be handled differently to avoid circular deps if needed.
import { useUser } from '@/context/user-context';
