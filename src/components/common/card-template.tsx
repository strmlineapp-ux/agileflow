

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { cn, getReadableColor } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditor } from './inline-editor';
import { Separator } from '../ui/separator';
import { IconColorPicker } from './icon-color-picker';
import { useTheme } from 'next-themes';

interface CardTemplateProps {
  entity: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: React.ReactNode;
    isShared?: boolean;
    owner?: { type: string, id: string };
  };
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (entity: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  canManage: boolean;
  isPinned?: boolean;
  isSharedPreview?: boolean;
  shareIcon?: string;
  shareIconTitle?: string;
  shareIconColor?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  headerControls?: React.ReactNode;
  dragHandleProps?: any;
}

export function CardTemplate({
  entity,
  onUpdate,
  onDelete,
  isExpanded,
  onToggleExpand,
  canManage,
  isPinned,
  isSharedPreview,
  shareIcon,
  shareIconTitle,
  shareIconColor,
  body,
  footer,
  headerControls,
  dragHandleProps,
}: CardTemplateProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { theme } = useTheme();
    const readableColor = getReadableColor(entity.color, theme);
    
    return (
        <>
            <Card className="group relative bg-transparent flex flex-col h-full" {...dragHandleProps}>
                {!isPinned && canManage && !isSharedPreview && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <GoogleSymbol name="cancel" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{canManage ? `Delete ${entity.name}` : `Unlink ${entity.name}`}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                )}
                <CardHeader className="p-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative">
                                <IconColorPicker
                                    icon={entity.icon}
                                    color={entity.color}
                                    onUpdateIcon={(newIcon) => onUpdate(entity.id, { icon: newIcon })}
                                    onUpdateColor={(newColor) => onUpdate(entity.id, { color: newColor })}
                                    disabled={!canManage}
                                />
                                {shareIcon && shareIconTitle && (
                                  <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <div className="absolute -top-0 -left-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: shareIconColor }}><GoogleSymbol name={shareIcon} style={{fontSize: '16px'}} /></div>
                                          </TooltipTrigger>
                                          <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                            <div onPointerDown={(e) => { e.stopPropagation(); }} className="flex-1 min-w-0">
                                <InlineEditor 
                                    value={entity.name} 
                                    onSave={(newName) => onUpdate(entity.id, { name: newName })}
                                    disabled={!canManage}
                                    className="break-words text-muted-foreground"
                                />
                            </div>
                            <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
                                {headerControls}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                {isExpanded && (entity.description || body) && (
                    <CardContent className="p-2 pt-0 flex-grow flex flex-col gap-2">
                        {entity.description && (
                            <p className="text-sm text-muted-foreground">{entity.description}</p>
                        )}
                        {body}
                    </CardContent>
                )}
                {footer && <CardFooter className="p-2 pt-0">{footer}</CardFooter>}
                {(body || entity.description) && (
                    <div className="absolute -bottom-1 right-0">
                        <Button variant="ghost" size="icon" onClick={onToggleExpand} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                            <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                        </Button>
                    </div>
                )}
            </Card>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
                    <div className="absolute top-4 right-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={() => { onDelete(entity); setIsDeleteDialogOpen(false); }}>
                              <GoogleSymbol name="delete" className="text-4xl" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
