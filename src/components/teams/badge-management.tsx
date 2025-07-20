
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppTab, type AppPage } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '../ui/badge';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function CompactSearchIconPicker({
  icon,
  onUpdateIcon,
  buttonClassName,
  iconClassName,
  disabled = false,
  weight,
  style,
}: {
  icon: string,
  onUpdateIcon: (iconName: string) => void,
  buttonClassName?: string,
  iconClassName?: string,
  disabled?: boolean,
  weight?: number,
  style?: React.CSSProperties,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPopoverOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
        setIconSearch('');
    }
  }, [isPopoverOpen]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn("p-0 flex items-center justify-center", buttonClassName)}
          disabled={disabled}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <GoogleSymbol name={icon} className={cn(iconClassName)} weight={weight} style={style} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 p-2 border-b">
            <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} />
            <input
              ref={searchInputRef}
              placeholder="Search icons..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
            />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.slice(0, 300).map((iconName) => (
                <TooltipProvider key={iconName}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={icon === iconName ? "default" : "ghost"}
                                size="icon"
                                onClick={() => {
                                onUpdateIcon(iconName);
                                setIsPopoverOpen(false);
                                }}
                                className="h-8 w-8 p-0"
                            >
                                <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{iconName}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}


function SortableBadgeItem({ badge, ...props }: { badge: Badge, [key: string]: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `badge::${badge.id}::${props.collectionId}`,
        data: { type: 'badge', badge, collectionId: props.collectionId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div 
          ref={setNodeRef} 
          style={style} 
          {...attributes} 
          {...listeners}
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (props.viewMode === 'detailed') {
              props.onEdit();
            }
          }}
          className={cn(props.collection.viewMode === 'detailed' && 'w-full md:w-1/2 p-2')}>
             <BadgeDisplayItem badge={badge} {...props} isDragging={isDragging} />
        </div>
    );
}


function BadgeDisplayItem({ badge, viewMode, onUpdateBadge, onDelete, collectionId, teamId, isSharedPreview = false, isViewer = false, isDragging }: { badge: Badge, viewMode: BadgeCollection['viewMode'], onUpdateBadge: (badgeData: Partial<Badge>) => void, onDelete: () => void, collectionId: string, teamId: string, isSharedPreview?: boolean, isViewer?: boolean, isDragging?: boolean }) {
    const { toast } = useUser();
    const { teams, users, viewAsUser, allBadges, allBadgeCollections } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [color, setColor] = useState(badge.color);
    
    const badgeOwner = useMemo(() => {
        const ownerCollection = allBadgeCollections.find(c => c.id === badge.ownerCollectionId);
        if (!ownerCollection) return null;
        return users.find(u => u.userId === ownerCollection.owner.id) || null;
    }, [badge.ownerCollectionId, allBadgeCollections, users]);
    

    const isEditable = useMemo(() => {
        if (isSharedPreview || isViewer) return false;
        return badgeOwner?.userId === viewAsUser.userId;
    }, [isSharedPreview, isViewer, badgeOwner, viewAsUser]);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.select();
        }
    }, [isEditingDescription]);

    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim() || '';
        if (newName === '') {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
            setIsEditingName(false);
        } else if (newName && newName !== badge.name) {
            onUpdateBadge({ name: newName });
            setIsEditingName(false);
        } else {
            setIsEditingName(false);
        }
    }, [badge.name, onUpdateBadge, toast]);

     useEffect(() => {
        if (!isEditingName) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                handleSaveName();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);
    
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    const handleSaveDescription = () => {
        const newDescription = descriptionTextareaRef.current?.value.trim();
        if (newDescription !== badge.description) {
            onUpdateBadge({ description: newDescription });
        }
        setIsEditingDescription(false);
    };
    
    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSaveDescription();
        } else if (e.key === 'Escape') {
          setIsEditingDescription(false);
        }
    };
    
    const isShared = useMemo(() => {
        const ownerCollection = allBadgeCollections.find(c => c.id === badge.ownerCollectionId);
        return ownerCollection?.isShared || false;
    }, [badge.ownerCollectionId, allBadgeCollections]);
    
    const isThisTheOriginalInstance = badge.ownerCollectionId === collectionId;

    const isLinkedInternally = useMemo(() => {
        const currentTeam = teams.find(t => t.id === teamId);
        if (!currentTeam) return false;
        const count = allBadgeCollections
            .filter(c => c.owner.id === currentTeam.owner.id) // Only count collections owned by the team context owner
            .reduce((acc, c) => acc + (c.badgeIds.includes(badge.id) ? 1 : 0), 0);
        return count > 1;
    }, [allBadgeCollections, badge.id, teamId, teams]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor = badgeOwner?.primaryColor || '#64748B';

    if (badgeOwner?.userId === viewAsUser.userId && isShared) {
        shareIcon = 'upload';
        shareIconTitle = 'Owned by you and shared with all teams';
    } else if (badgeOwner?.userId !== viewAsUser.userId) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared by ${badgeOwner?.displayName || 'another user'}`;
    } else if (isLinkedInternally && !isThisTheOriginalInstance) {
        shareIcon = 'change_circle';
        shareIconTitle = 'Linked from another collection in this team';
    }
    
    const canBeDeleted = !isViewer && !isSharedPreview;
    
    const colorPickerContent = (
        <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
            <div className="space-y-4">
                <HexColorPicker color={color} onChange={setColor} className="!w-full" />
                <div className="flex items-center gap-2">
                    <span className="p-2 border rounded-md shadow-sm" style={{ backgroundColor: color }} />
                    <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
                </div>
                <div className="grid grid-cols-8 gap-1">
                    {predefinedColors.map(c => (
                        <button
                            key={c}
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: c }}
                            onClick={() => {
                                onUpdateBadge({ color: c });
                                setColor(c);
                                setIsColorPopoverOpen(false);
                            }}
                        />
                    ))}
                </div>
                <Button onClick={() => { onUpdateBadge({ color }); setIsColorPopoverOpen(false); }} className="w-full">Set Color</Button>
            </div>
        </PopoverContent>
    );

    const deleteButton = (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="absolute top-0 right-0 h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
                        aria-label={`Delete ${badge.name}`}
                    >
                        <GoogleSymbol name="close" className="text-xs" />
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>{isThisTheOriginalInstance ? "Delete Badge Permanently" : "Unlink Badge from Collection"}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    if (viewMode === 'detailed') {
      return (
        <div className="group relative h-full flex flex-col rounded-lg">
            <CardHeader onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <CompactSearchIconPicker 
                                                icon={badge.icon} 
                                                onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                                                disabled={!isEditable}
                                                weight={100}
                                                grade={-25}
                                                buttonClassName="h-10 w-12"
                                                style={{ fontSize: '36px', color: badge.color }}
                                            />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner."}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {!isViewer && (
                                <>
                                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <PopoverTrigger asChild disabled={!isEditable} onPointerDown={(e) => e.stopPropagation()}>
                                                        <button
                                                            className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-0", isEditable && "cursor-pointer")}
                                                            style={{ backgroundColor: badge.color }}
                                                            aria-label="Change badge color"
                                                        />
                                                    </PopoverTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner.'}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {colorPickerContent}
                                    </Popover>
                                    {shareIcon && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div 
                                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                                        style={{ backgroundColor: shareIconColor }}
                                                    >
                                                        <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}}/>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            {isEditingName && isEditable ? (
                                <Input
                                    ref={nameInputRef}
                                    defaultValue={badge.name}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onBlur={handleSaveName}
                                    onKeyDown={handleNameKeyDown}
                                    className="h-auto p-0 text-base font-normal border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                />
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span onPointerDown={(e) => {e.stopPropagation(); if (isEditable && !isDragging) setIsEditingName(true)}} className={cn("text-base break-words font-normal", isEditable && "cursor-pointer")}>{badge.name}</span>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 flex-grow" onPointerDown={(e) => e.stopPropagation()}>
                 {isEditingDescription && isEditable ? (
                    <Textarea 
                        ref={descriptionTextareaRef} 
                        defaultValue={badge.description} 
                        onBlur={handleSaveDescription} 
                        onKeyDown={handleDescriptionKeyDown} 
                        className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" 
                        placeholder="Click to add a description."
                        disabled={!isEditable}
                    />
                 ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p 
                                    className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isEditable && "cursor-text")} 
                                    onPointerDown={(e) => { e.stopPropagation(); if (isEditable && !isDragging) setIsEditingDescription(true);}}
                                >
                                    {badge.description || (isEditable ? 'Click to add description.' : 'No description.')}
                                </p>
                            </TooltipTrigger>
                             <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </CardContent>
            {canBeDeleted && deleteButton}
        </div>
      );
    }
    
    const inlineNameEditor = isEditingName && isEditable ? (
      <Input
        ref={nameInputRef}
        defaultValue={badge.name}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={handleNameKeyDown}
        onBlur={handleSaveName}
        className={cn(
          "h-auto p-0 border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words",
          "text-sm font-thin"
        )}
      />
    ) : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn("font-thin break-words text-sm", isEditable && "cursor-text")}
                        onPointerDown={(e) => {
                        e.stopPropagation();
                        if (isEditable && !isDragging) {
                            setIsEditingName(true);
                        }
                        }}
                    >
                        {badge.name}
                    </span>
                </TooltipTrigger>
                <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    if (viewMode === 'list') {
      return (
        <div className="group relative flex w-full items-start gap-4 p-2 rounded-md hover:bg-muted/50" onPointerDown={(e) => e.stopPropagation()}>
            <div className="relative">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <CompactSearchIconPicker 
                                    icon={badge.icon} 
                                    onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                                    disabled={!isEditable}
                                    weight={100}
                                    grade={-25}
                                    buttonClassName="h-10 w-12"
                                    style={{ fontSize: '36px', color: badge.color }}
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner."}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                {!isViewer && (
                    <>
                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild disabled={!isEditable} onPointerDown={(e) => e.stopPropagation()}>
                                            <button
                                                className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-0", isEditable && "cursor-pointer")}
                                                style={{ backgroundColor: badge.color }}
                                                aria-label="Change badge color"
                                            />
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner.'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {colorPickerContent}
                        </Popover>
                        {shareIcon && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                            style={{ backgroundColor: shareIconColor }}
                                        >
                                            <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </>
                )}
            </div>
            <div className="flex-1 space-y-1">
                {inlineNameEditor}
                 {isEditingDescription && isEditable ? (
                    <Textarea 
                        ref={descriptionTextareaRef}
                        defaultValue={badge.description}
                        onBlur={handleSaveDescription}
                        onKeyDown={handleDescriptionKeyDown}
                        className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                        placeholder="Click to add a description."
                        disabled={!isEditable}
                    />
                 ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isEditable && "cursor-text")} onPointerDown={(e) => {e.stopPropagation(); if (isEditable && !isDragging) setIsEditingDescription(true);}}>
                                    {badge.description || (isEditable ? 'Click to add description.' : 'No description.')}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </div>
            {canBeDeleted && deleteButton}
        </div>
      );
    }
    
    // Assorted View
    return (
        <div className="group relative p-1.5" onPointerDown={(e) => e.stopPropagation()}>
             <UiBadge
                variant={'outline'}
                style={{ color: badge.color, borderColor: badge.color }}
                className="flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8 font-thin"
            >
                <div className="relative">
                     <CompactSearchIconPicker
                        icon={badge.icon}
                        onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                        iconClassName="text-base"
                        disabled={!isEditable}
                        weight={100}
                        style={{ color: badge.color, fontSize: '28px' }}
                    />
                     {!isViewer && (
                        <>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!isEditable} onPointerDown={(e) => e.stopPropagation()}>
                                                <button
                                                    className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-0", isEditable && "cursor-pointer")}
                                                    style={{ backgroundColor: badge.color }}
                                                    aria-label="Change badge color"
                                                />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner.'}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {colorPickerContent}
                            </Popover>
                            {shareIcon && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                                style={{ backgroundColor: shareIconColor }}
                                            >
                                                <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </>
                    )}
                </div>
                {inlineNameEditor}
            </UiBadge>
            
             {canBeDeleted && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <button
                                type="button"
                                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-destructive hover:text-destructive-foreground hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                aria-label={`Delete ${badge.name}`}
                            >
                                <GoogleSymbol name="close" className="text-xs" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isThisTheOriginalInstance ? "Delete Badge Permanently" : "Unlink Badge from Collection"}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

function DroppableCollectionContent({ collection, children }: { collection: BadgeCollection, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: collection.id, data: { type: 'collection', collection }});
    
    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "min-h-[60px] rounded-md p-2 transition-all",
                isOver && "ring-1 ring-border ring-inset",
                collection.viewMode === 'assorted' && "flex flex-wrap gap-2 items-start",
                collection.viewMode === 'list' && "flex flex-col gap-1",
                collection.viewMode === 'detailed' && "flex flex-wrap -m-2"
            )}
        >
            {children}
        </div>
    );
}

function SortableCollectionCard({ collection, allBadges, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, contextTeam, isViewer = false, isSharedPreview = false }: {
    collection: BadgeCollection;
    allBadges: Badge[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string, sourceBadge?: Badge) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    contextTeam?: Team;
    isViewer?: boolean;
    isSharedPreview?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `collection::${collection.id}`,
        data: { type: 'collection', collection, isSharedPreview }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 20 : 'auto',
    };
    
    return (
        <div ref={setNodeRef} style={style}>
            <BadgeCollectionCard 
                collection={collection} 
                allBadges={allBadges}
                onUpdateCollection={onUpdateCollection}
                onDeleteCollection={onDeleteCollection}
                onAddBadge={onAddBadge}
                onUpdateBadge={onUpdateBadge}
                onDeleteBadge={onDeleteBadge}
                dragHandleProps={{...attributes, ...listeners}}
                isSharedPreview={isSharedPreview}
                contextTeam={contextTeam}
                isViewer={isViewer}
            />
        </div>
    );
}


function BadgeCollectionCard({ collection, allBadges, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, dragHandleProps, isSharedPreview = false, contextTeam, isViewer = false }: {
    collection: BadgeCollection;
    allBadges: Badge[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string, sourceBadge?: Badge) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    dragHandleProps?: any;
    isSharedPreview?: boolean;
    contextTeam?: Team;
    isViewer?: boolean;
}) {
    const { viewAsUser, users, updateUser, updateTeam } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [color, setColor] = useState(collection.color);
    
    const isOwned = useMemo(() => {
        if (isSharedPreview || isViewer) return false;
        if (!viewAsUser) return false;
        return collection.owner.id === viewAsUser.userId;
    }, [collection.owner, viewAsUser, isSharedPreview, isViewer]);
    
    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value || collection.name;
        if (newName.trim() !== collection.name) {
            onUpdateCollection(collection.id, { name: newName.trim() });
        }
        setIsEditingName(false);
    }, [collection.name, collection.id, onUpdateCollection]);
    
    useEffect(() => {
        if (!isEditingName) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                handleSaveName();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);


    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    const collectionBadges = useMemo(() => {
        return collection.badgeIds.map(id => allBadges.find(b => b.id === id)).filter((b): b is Badge => !!b);
    }, [collection.badgeIds, allBadges]);
    
    const APPLICATIONS: { key: BadgeApplication, icon: string, label: string }[] = [
        { key: 'team members', icon: 'group', label: 'Team Members' },
        { key: 'events', icon: 'calendar_month', label: 'Events' },
        { key: 'tasks', icon: 'checklist', label: 'Tasks' },
        { key: 'badges', icon: 'style', label: 'Badges' },
    ];

    const ownerUser = users.find(u => u.userId === collection.owner.id);
    
    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor: string | undefined = ownerUser?.primaryColor || '#64748B'; // Default color

    if (isOwned && collection.isShared) {
        shareIcon = 'upload';
        shareIconTitle = 'Owned by you and shared with all teams';
    } else if (!isOwned && !isSharedPreview) { // Is a linked collection
        shareIcon = 'downloading';
        shareIconTitle = `Shared by ${ownerUser?.displayName || 'another user'}`;
    }

    const handleToggleApplication = (application: BadgeApplication) => {
        const currentApplications = new Set(collection.applications || []);
        if (currentApplications.has(application)) {
            currentApplications.delete(application);
        } else {
            currentApplications.add(application);
        }
        onUpdateCollection(collection.id, { applications: Array.from(currentApplications) });
    };
    
    const handleToggleCollectionActive = () => {
        if (!contextTeam || isViewer) return;
        const wasActive = contextTeam.activeBadgeCollections?.includes(collection.id);
        const currentActive = new Set(contextTeam.activeBadgeCollections || []);
        if (wasActive) {
            currentActive.delete(collection.id);
        } else {
            currentActive.add(collection.id);
        }
        updateTeam(contextTeam.id, { activeBadgeCollections: Array.from(currentActive) });
    };
    
    const isActive = contextTeam && contextTeam.activeBadgeCollections?.includes(collection.id);

    const viewModeOptions: {mode: BadgeCollection['viewMode'], icon: string, label: string}[] = [
        { mode: 'assorted', icon: 'view_module', label: 'Assorted View' },
        { mode: 'detailed', icon: 'view_comfy_alt', label: 'Detailed View' },
        { mode: 'list', icon: 'view_list', label: 'List View' }
    ];

    return (
        <>
            <Card className="h-full flex flex-col bg-transparent group relative">
                 <div {...dragHandleProps}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
                                    <CompactSearchIconPicker 
                                        icon={collection.icon} 
                                        onUpdateIcon={(icon) => onUpdateCollection(collection.id, { icon })}
                                        disabled={!isOwned}
                                        weight={100}
                                        grade={-25}
                                        style={{ fontSize: '36px' }}
                                        buttonClassName="h-10 w-12"
                                    />
                                    {!isViewer && (
                                        <>
                                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                                <PopoverTrigger asChild disabled={!isOwned} onPointerDown={(e) => e.stopPropagation()}><button className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-0", !isOwned ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: collection.color }} /></PopoverTrigger>
                                                <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
                                                    <div className="space-y-4">
                                                        <HexColorPicker color={color} onChange={setColor} className="!w-full" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="p-2 border rounded-md shadow-sm" style={{ backgroundColor: color }} />
                                                            <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
                                                        </div>
                                                        <div className="grid grid-cols-8 gap-1">
                                                            {predefinedColors.map(c => (
                                                                <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateCollection(collection.id, { color: c }); setIsColorPopoverOpen(false);}}/>
                                                            ))}
                                                        </div>
                                                        <Button onClick={() => { onUpdateCollection(collection.id, { color }); setIsColorPopoverOpen(false); }} className="w-full">Set Color</Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            {shareIcon && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                                                style={{ backgroundColor: shareIconColor }}
                                                            >
                                                                <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}}/>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        {isEditingName && isOwned ? (
                                            <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} onPointerDown={(e) => e.stopPropagation()} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"/>
                                        ) : (
                                            <CardTitle onPointerDown={(e) => { e.stopPropagation(); if(isOwned) setIsEditingName(true);}} className={cn("text-2xl font-headline font-thin break-words", isOwned && "cursor-pointer")}>{collection.name}</CardTitle>
                                        )}
                                        <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <GoogleSymbol name={viewModeOptions.find(o => o.mode === collection.viewMode)?.icon || 'view_module'} weight={100} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {viewModeOptions.map(({mode, icon, label}) => (
                                                        <DropdownMenuItem key={mode} onClick={() => onUpdateCollection(collection.id, { viewMode: mode })}>
                                                            <GoogleSymbol name={icon} className="mr-2" />
                                                            <span>{label}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            {isOwned && (
                                                <Button variant="ghost" size="icon" onClick={() => onAddBadge(collection.id)} disabled={!isOwned || isViewer} className="h-8 w-8 text-muted-foreground"><GoogleSymbol name="add" weight={100} /><span className="sr-only">Add Badge</span></Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="flex-grow">
                    <SortableContext items={collection.badgeIds.map(id => `badge::${id}::${collection.id}`)} strategy={rectSortingStrategy}>
                        <DroppableCollectionContent collection={collection}>
                            {collectionBadges.map((badge, index) => (
                                <SortableBadgeItem
                                    key={`${badge.id}::${collection.id}`}
                                    badge={badge}
                                    viewMode={collection.viewMode}
                                    onUpdateBadge={(data) => onUpdateBadge({ ...data, id: badge.id })}
                                    onDelete={() => onDeleteBadge(collection.id, badge.id)}
                                    onEdit={() => setEditingBadge(badge)}
                                    collectionId={collection.id}
                                    teamId={contextTeam?.id || ''}
                                    isSharedPreview={isSharedPreview}
                                    isViewer={isViewer}
                                    collection={collection}
                                />
                            ))}
                        </DroppableCollectionContent>
                    </SortableContext>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2 p-2 border-t mt-auto">
                    <div>
                        {contextTeam && !isViewer && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-8 w-8", isActive ? 'text-primary' : 'text-muted-foreground')}
                                            onClick={handleToggleCollectionActive}
                                        >
                                            <GoogleSymbol name={isActive ? 'check_circle' : 'circle'} weight={100} filled={isActive}/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isActive ? 'Deactivate' : 'Activate'} for Team</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {APPLICATIONS.map(app => (
                            <TooltipProvider key={app.key}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-8 w-8", collection.applications?.includes(app.key) ? 'text-primary' : 'text-muted-foreground')}
                                            onClick={() => handleToggleApplication(app.key)}
                                            disabled={!isOwned}
                                        >
                                            <GoogleSymbol name={app.icon} weight={100} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{app.label}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </CardFooter>
            </Card>
            {editingBadge && (
                <Dialog open={!!editingBadge} onOpenChange={(isOpen) => !isOpen && setEditingBadge(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Badge</DialogTitle>
                        </DialogHeader>
                        {/* Placeholder for a more detailed badge editing form */}
                        <div className="p-4">Editing form for "{editingBadge.name}" would go here.</div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

function DuplicateZone({ onAdd }: { onAdd: () => void; }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'duplicate-collection-zone' });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all p-0.5",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={onAdd} onPointerDown={(e) => e.stopPropagation()}>
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                    <span className="sr-only">New Collection or Drop to Duplicate</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{isOver ? 'Drop to Duplicate' : 'Add New Collection'}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
}


export function BadgeManagement({ team, tab, page, isTeamSpecificPage = false }: { team?: Team, tab: AppTab, page: AppPage, isTeamSpecificPage?: boolean }) {
    const { 
        viewAsUser, 
        teams,
        users, 
        updateAppTab, 
        allBadgeCollections,
        allBadges,
        addBadgeCollection,
        updateBadgeCollection,
        deleteBadgeCollection,
        addBadge,
        updateBadge,
        deleteBadge,
        reorderBadges,
        updateTeam
    } = useUser();

    const { toast } = useUser();
    
    const [collectionToDelete, setCollectionToDelete] = useState<BadgeCollection | null>(null);
    const [badgeToDelete, setBadgeToDelete] = useState<{ collectionId: string, badgeId: string } | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const sharedSearchInputRef = useRef<HTMLInputElement>(null);

    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    
    const contextTeam = team;
    const isTeamContext = isTeamSpecificPage && !!contextTeam;

    const canCreateCollection = useMemo(() => {
        if (!isTeamContext) return true; // User context can always create for self
        if (viewAsUser.isAdmin) return true;
        if (contextTeam?.teamAdmins && contextTeam.teamAdmins.length > 0) {
            return contextTeam.teamAdmins.includes(viewAsUser.userId);
        }
        return (contextTeam?.members || []).includes(viewAsUser.userId);
    }, [isTeamContext, contextTeam, viewAsUser]);
    
    const isViewer = useMemo(() => {
        if (!isTeamContext || !contextTeam) return false;
        if (viewAsUser.isAdmin) return false;
        if (contextTeam.teamAdmins && contextTeam.teamAdmins.length > 0) {
            return !contextTeam.teamAdmins.includes(viewAsUser.userId);
        }
        return !contextTeam.members.includes(viewAsUser.userId);
    }, [isTeamContext, contextTeam, viewAsUser]);

    const collectionsToDisplay = useMemo(() => {
        let collections: BadgeCollection[];
        if (isTeamContext && contextTeam) {
            const ownerIds = new Set(
                (contextTeam.teamAdmins && contextTeam.teamAdmins.length > 0)
                    ? contextTeam.teamAdmins
                    : contextTeam.members
            );
            collections = allBadgeCollections.filter(c => ownerIds.has(c.owner.id));

            if (contextTeam.linkedCollectionIds) {
                const linked = contextTeam.linkedCollectionIds.map(id => allBadgeCollections.find(c => c.id === id)).filter((c): c is BadgeCollection => !!c);
                collections = [...collections, ...linked];
            }
        } else {
            collections = allBadgeCollections.filter(c => c.owner.id === viewAsUser.userId);
        }

        if (searchTerm) {
            collections = collections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return Array.from(new Map(collections.map(c => [c.id, c])).values());
    }, [allBadgeCollections, isTeamContext, contextTeam, viewAsUser, searchTerm]);
    
    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    useEffect(() => {
        if (isSharedPanelOpen) {
            setTimeout(() => sharedSearchInputRef.current?.focus(), 100);
        }
    }, [isSharedPanelOpen]);


    const handleSaveTitle = () => {
        const newName = titleInputRef.current?.value.trim();
        if (newName && newName !== tab.name) {
            updateAppTab(tab.id, { name: newName });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        else if (e.key === 'Escape') setIsEditingTitle(false);
    };
    
    const sharedCollections = useMemo(() => {
        const collectionsOnBoardIds = new Set(collectionsToDisplay.map(c => c.id));
        return allBadgeCollections
            .filter(c => c.isShared && !collectionsOnBoardIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [allBadgeCollections, collectionsToDisplay, sharedSearchTerm]);

    const handleAddCollection = (sourceCollection?: BadgeCollection) => {
        addBadgeCollection(viewAsUser, sourceCollection, contextTeam);
    };

    const handleDuplicateCollection = (sourceCollection: BadgeCollection) => {
        if (isViewer) return;
        handleAddCollection(sourceCollection);
    };
    
    const handleDeleteCollection = (collection: BadgeCollection) => {
        if (isViewer) return;
        
        let isOwned = collection.owner.id === viewAsUser.userId;

        if (!isOwned) {
            if (contextTeam) {
                const updatedIds = (contextTeam.linkedCollectionIds || []).filter(id => id !== collection.id);
                updateTeam(contextTeam.id, { linkedCollectionIds: updatedIds });
            } else {
                const updatedIds = (viewAsUser.linkedCollectionIds || []).filter(id => id !== collection.id);
                updateUser(viewAsUser.userId, { linkedCollectionIds: updatedIds });
            }
            toast({ title: 'Collection Unlinked' });
        } else {
            setCollectionToDelete(collection);
        }
    };

    const confirmDeleteCollection = () => {
        if (!collectionToDelete) return;
        deleteBadgeCollection(collectionToDelete.id);
        toast({ title: 'Collection Deleted', description: `"${collectionToDelete.name}" and all its owned badges have been deleted.`});
        setCollectionToDelete(null);
    };

    const confirmPermanentDelete = useCallback((badgeId: string) => {
        const badgeToDelete = allBadges.find(b => b.id === badgeId);
        if (!badgeToDelete) return;
        deleteBadge(badgeId);
        toast({ title: 'Badge Deleted', description: `"${badgeToDelete.name}" was permanently deleted.` });
        if (badgeToDelete) setBadgeToDelete(null);
    }, [allBadges, deleteBadge, toast]);

    const handleDeleteBadge = useCallback((collectionId: string, badgeId: string) => {
        const badge = allBadges.find(b => b.id === badgeId);
        if (!badge) return;
    
        const isOriginalInstance = badge.ownerCollectionId === collectionId;
    
        let linkCount = allBadgeCollections.reduce((acc, c) => acc + (c.badgeIds.includes(badgeId) ? 1 : 0), 0);
    
        if (isOriginalInstance && linkCount > 1) {
            setBadgeToDelete({ collectionId, badgeId });
        } else if (!isOriginalInstance) {
            const collection = allBadgeCollections.find(c => c.id === collectionId);
            if(collection) {
                const updatedBadgeIds = collection.badgeIds.filter(id => id !== badgeId);
                updateBadgeCollection(collectionId, { badgeIds: updatedBadgeIds });
                toast({ title: 'Badge Unlinked' });
            }
        } else {
            confirmPermanentDelete(badgeId);
        }
    }, [allBadgeCollections, allBadges, updateBadgeCollection, toast, confirmPermanentDelete]);
    
    const onDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;

        const activeType = active.data.current?.type;
        
        if (over.id === 'duplicate-collection-zone' && activeType === 'collection') {
            const sourceCollection = active.data.current?.collection as BadgeCollection;
            handleDuplicateCollection(sourceCollection);
            // Smart unlinking if duplicating a linked collection
            if (active.data.current?.isSharedPreview) {
                if (contextTeam) {
                    const newLinkedIds = (contextTeam.linkedCollectionIds || []).filter(id => id !== sourceCollection.id);
                    updateTeam(contextTeam.id, { linkedCollectionIds: newLinkedIds });
                } else {
                    const newLinkedIds = (viewAsUser.linkedCollectionIds || []).filter(id => id !== sourceCollection.id);
                    updateUser(viewAsUser.userId, { linkedCollectionIds: newLinkedIds });
                }
                toast({ title: 'Collection Copied', description: 'The original linked collection has been removed.' });
            }
            return;
        }

        if (activeType === 'collection') {
            handleCollectionDragEnd(event);
        } else if (activeType === 'badge') {
            handleBadgeDragEnd(event);
        }
    };
    
    const handleCollectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
    
        const activeCollection = active.data.current?.collection as BadgeCollection;
        if (!activeCollection) return;
        
        if (over.id === 'shared-collections-panel') {
            const isOwner = activeCollection.owner.id === viewAsUser.userId;
            if (isOwner) {
                updateBadgeCollection(activeCollection.id, { isShared: !activeCollection.isShared });
                toast({ title: activeCollection.isShared ? 'Collection Unshared' : 'Collection Shared' });
            }
            return;
        }
    
        if (active.data.current?.isSharedPreview && over.id === 'main-collections-grid') {
             if (isTeamContext && contextTeam) {
                const newLinkedIds = [...(contextTeam.linkedCollectionIds || []), activeCollection.id];
                updateTeam(contextTeam.id, { linkedCollectionIds: Array.from(new Set(newLinkedIds)) });
            } else {
                const newLinkedIds = [...(viewAsUser.linkedCollectionIds || []), activeCollection.id];
                updateUser(viewAsUser.userId, { linkedCollectionIds: Array.from(new Set(newLinkedIds)) });
            }
            toast({ title: 'Collection Linked' });
        }
    };
    
    const handleBadgeDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
    
        const activeCollectionId = active.data.current?.collectionId;
        const overCollectionId = over.data.current?.collectionId || (over.data.current?.collection as BadgeCollection)?.id;
        const activeBadge = active.data.current?.badge as Badge;
    
        if (!activeBadge) return;
    
        if (activeCollectionId === overCollectionId) {
            // Reordering within the same collection
            const collection = allBadgeCollections.find(c => c.id === activeCollectionId);
            if (collection) {
                const oldIndex = collection.badgeIds.indexOf(active.id.toString().split('::')[1]);
                const newIndex = collection.badgeIds.indexOf(over.id.toString().split('::')[1]);
                if (oldIndex > -1 && newIndex > -1) {
                    const reordered = arrayMove(collection.badgeIds, oldIndex, newIndex);
                    reorderBadges(collection.id, reordered);
                }
            }
        }
    };
    
    const onDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current);
    }
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex gap-4 h-full">
                 <div className="flex-1 overflow-hidden">
                  <div className="flex flex-col gap-6 h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isEditingTitle ? (
                                    <Input
                                        ref={titleInputRef}
                                        defaultValue={tab.name}
                                        onBlur={handleSaveTitle}
                                        onKeyDown={handleTitleKeyDown}
                                        className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                ) : (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                                            </TooltipTrigger>
                                            {tab.description && (
                                            <TooltipContent>
                                                <p className="max-w-xs">{tab.description}</p>
                                            </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {canCreateCollection && (
                                    <DuplicateZone id="duplicate-collection-zone" onAdd={() => handleAddCollection()} />
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search collections..." autoFocus={false} />
                                {!isViewer && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                                    <GoogleSymbol name="dynamic_feed" weight={100} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Show Shared Collections</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                        
                         <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <TeamManagementDropZone id="main-collections-grid" type="collection-grid" className="h-full">
                                <SortableContext items={collectionsToDisplay.map(c => `collection::${c.id}`)} strategy={rectSortingStrategy}>
                                    <div className={cn("flex flex-wrap -m-2 transition-all duration-300")}>
                                        {collectionsToDisplay.map((collection, index) => {
                                            const isActive = isTeamContext && contextTeam?.activeBadgeCollections?.includes(collection.id);
                                            const canToggle = isTeamContext && !isViewer;
                                            
                                            return (
                                                <div
                                                    key={collection.id}
                                                    className={cn(
                                                        "p-2 w-full transition-all duration-300",
                                                        isSharedPanelOpen ? "lg:w-1/2" : "lg:w-1/3",
                                                    )}
                                                >
                                                    <div className={cn("h-full", (canToggle && !isActive) && "opacity-40 hover:opacity-100")}>
                                                        <SortableCollectionCard
                                                            collection={collection}
                                                            allBadges={allBadges}
                                                            onUpdateCollection={updateBadgeCollection}
                                                            onDeleteCollection={handleDeleteCollection}
                                                            onAddBadge={addBadge}
                                                            onUpdateBadge={updateBadge}
                                                            onDeleteBadge={handleDeleteBadge}
                                                            contextTeam={team}
                                                            isViewer={isViewer}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </SortableContext>
                                </TeamManagementDropZone>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
                
                {!isViewer && (
                     <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96" : "w-0")}>
                         <div className={cn("h-full rounded-lg transition-all", isSharedPanelOpen ? "p-2" : "p-0")}>
                            <TeamManagementDropZone id="shared-collections-panel" type="collection-panel" className="h-full">
                                <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-headline font-thin text-xl">Shared Collections</CardTitle>
                                            <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." inputRef={sharedSearchInputRef} autoFocus={isSharedPanelOpen} tooltipText="Search Shared Collections" />
                                        </div>
                                        <CardDescription>Drag a collection to your board to link it.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-2 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <SortableContext items={sharedCollections.map(c => `collection::${c.id}`)} strategy={verticalListSortingStrategy}>
                                                <div className="space-y-2">
                                                    {sharedCollections.map((collection, index) => {
                                                        return (
                                                            <SortableCollectionCard
                                                                key={collection.id}
                                                                collection={collection}
                                                                allBadges={allBadges}
                                                                onUpdateCollection={updateBadgeCollection}
                                                                onDeleteCollection={handleDeleteCollection}
                                                                onAddBadge={addBadge}
                                                                onUpdateBadge={updateBadge}
                                                                onDeleteBadge={handleDeleteBadge}
                                                                isSharedPreview={true}
                                                                contextTeam={team}
                                                                isViewer={isViewer}
                                                            />
                                                        )
                                                    })}
                                                    {sharedCollections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No collections are being shared by other teams.</p>}
                                                </div>
                                            </SortableContext>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TeamManagementDropZone>
                         </div>
                    </div>
                )}
                <Dialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
                    <DialogContent className="max-w-md">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 p-0" onPointerDown={confirmDeleteCollection}>
                                <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                                <span className="sr-only">Delete Collection</span>
                            </Button>
                        </div>
                        <DialogHeader>
                            <UIDialogTitle>Delete "{collectionToDelete?.name}"?</UIDialogTitle>
                            <DialogDescription>
                                {collectionToDelete?.isShared 
                                    ? "This collection is shared. Deleting it will remove it and its badges from all teams that use it. This action cannot be undone."
                                    : `This will permanently delete the collection "${collectionToDelete?.name}" and all badges it owns from this team.`
                                }
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
                <Dialog open={!!badgeToDelete} onOpenChange={(isOpen) => !isOpen && setBadgeToDelete(null)}>
                    <DialogContent>
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onPointerDown={() => { if (badgeToDelete) confirmPermanentDelete(badgeToDelete.badgeId); }}>
                                <GoogleSymbol name="delete" />
                                <span className="sr-only">Delete Badge Permanently</span>
                            </Button>
                        </div>
                        <DialogHeader>
                            <UIDialogTitle>Delete Shared Badge?</UIDialogTitle>
                            <DialogDescription>
                                This badge is shared. Deleting it will remove it from all collections and teams. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
                <DragOverlay>
                    {activeDragItem?.type === 'collection' ? (
                        <BadgeCollectionCard 
                            collection={activeDragItem.collection}
                            allBadges={allBadges}
                            onUpdateCollection={() => {}}
                            onDeleteCollection={() => {}}
                            onAddBadge={() => {}}
                            onUpdateBadge={() => {}}
                            onDeleteBadge={() => {}}
                            isSharedPreview={activeDragItem.isSharedPreview}
                            contextTeam={contextTeam}
                            isViewer={isViewer}
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}

function TeamManagementDropZone({id, type, children, className}: {id: string, type: string, children: React.ReactNode, className?: string}) {
    const { setNodeRef, isOver } = useDroppable({ id, data: { type } });
    
    return (
        <div ref={setNodeRef} className={cn(className, isOver && "ring-1 ring-border ring-inset", "transition-all rounded-lg")}>
            {children}
        </div>
    )
}
