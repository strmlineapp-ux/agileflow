

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn, getReadableColor } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditor } from './inline-editor';
import { IconColorPicker } from './icon-color-picker';
import { useTheme } from 'next-themes';
import { type User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/context/user-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ItemSelectionPopover, type ItemSelectionTab } from './item-selection-popover';

interface CardTemplateProps {
  entity: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    isShared?: boolean;
    owner?: { type: string, id: string };
  };
  user?: User; // Add user prop
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (entity: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  canManage: boolean;
  canDelete?: boolean; // Optional prop to control delete button
  isPinned?: boolean;
  isSharedPreview?: boolean;
  shareIcon?: string;
  shareIconTitle?: string;
  shareIconColor?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  headerControls?: React.ReactNode;
  dragHandleProps?: any;
  canChangeOwnership?: boolean;
}

export function CardTemplate({
  entity,
  user,
  onUpdate,
  onDelete,
  isExpanded,
  onToggleExpand,
  canManage,
  canDelete = canManage, // Default to canManage if not provided
  isPinned,
  isSharedPreview,
  shareIcon,
  shareIconTitle,
  shareIconColor,
  body,
  footer,
  headerControls,
  dragHandleProps,
  canChangeOwnership = false
}: CardTemplateProps) {
    const { viewAsUser, users } = useUser();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { theme } = useTheme();
    const readableColor = getReadableColor(entity.color || '', theme);
    
    const renderIconOrAvatar = () => {
        if (user) {
            return (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            )
        }
        if (entity.icon && entity.color) {
            return (
                <IconColorPicker
                    icon={entity.icon}
                    color={entity.color}
                    onUpdateIcon={(newIcon) => onUpdate(entity.id, { icon: newIcon })}
                    onUpdateColor={(newColor) => onUpdate(entity.id, { color: newColor })}
                    disabled={!canManage}
                />
            )
        }
        return null;
    }
    
    const handleOwnershipChange = (type: string, id: string) => {
        const newOwner = id === 'system' ? { type: 'system', id: 'system' } : { type: 'user', id };
        onUpdate(entity.id, { owner: newOwner });
    };
    
    const systemItem = { id: 'system', name: 'System Owned', icon: 'shield_person', iconType: 'symbol' as const, color: 'hsl(var(--muted-foreground))' };
    
    const userItemData = users.map(u => ({
        id: u.userId,
        name: u.displayName,
        icon: u.avatarUrl || '',
        iconType: 'avatar' as const,
    }));
    
    const ownershipTabs: ItemSelectionTab[] = [
        {
            value: 'users',
            label: 'Users',
            items: [systemItem, ...userItemData],
            selectedIds: [entity.owner?.id || ''],
        },
    ];
    
    const ownershipTrigger = (
      <div 
        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" 
        style={{ backgroundColor: shareIconColor }}
      >
        <GoogleSymbol name={shareIcon!} style={{fontSize: '16px'}} />
      </div>
    );
    
    return (
        <>
            <Card className="relative bg-card flex flex-col h-full shadow-md" {...dragHandleProps}>
                <CardHeader className="group p-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative">
                                {renderIconOrAvatar()}
                                {shareIcon && shareIconTitle && (
                                   canChangeOwnership ? (
                                        <ItemSelectionPopover
                                            tabs={ownershipTabs}
                                            onSelectionChange={handleOwnershipChange}
                                            trigger={ownershipTrigger}
                                            tooltip={shareIconTitle + '. Click to reassign.'}
                                        />
                                   ) : (
                                       <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              {ownershipTrigger}
                                            </TooltipTrigger>
                                            <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                          </Tooltip>
                                       </TooltipProvider>
                                   )
                                )}
                            </div>
                            <div className="flex-1 min-w-0" onPointerDown={(e) => { e.stopPropagation(); }}>
                                <InlineEditor 
                                    value={entity.name} 
                                    onSave={(newName) => onUpdate(entity.id, { name: newName })}
                                    disabled={!canManage}
                                    className="break-words text-muted-foreground font-emphasis"
                                />
                                {user?.title && <p className="text-sm text-foreground">{user.title}</p>}
                            </div>
                            <div className="flex items-center flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                                {headerControls}
                            </div>
                        </div>
                    </div>
                     {!isPinned && canDelete && !isSharedPreview && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onPointerDown={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-6 w-6 p-0 bg-card"
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                        >
                                            <GoogleSymbol name="cancel" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{canManage ? `Delete ${entity.name}` : `Unlink ${entity.name}`}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </CardHeader>
                {isExpanded && body && (
                    <CardContent className="p-2 pt-0 flex-grow flex flex-col gap-2">
                        {body}
                    </CardContent>
                )}
                {footer && <CardFooter className="p-2 pt-0">{footer}</CardFooter>}
                {body && (
                    <div className="absolute -bottom-1 right-0">
                        <Button variant="default" size="icon" onClick={onToggleExpand} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                            <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                        </Button>
                    </div>
                )}
            </Card>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
                    <div className="absolute top-4 right-4">
                        <Button variant="default" size="icon" className="hover:text-destructive p-0 hover:bg-transparent bg-card" onClick={() => { onDelete(entity); setIsDeleteDialogOpen(false); }}>
                            <GoogleSymbol name="delete" className="text-4xl" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <UIDialogTitle>Delete "{entity.name}"?</UIDialogTitle>
                        <DialogDescription>
                            This will permanently delete this item. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
