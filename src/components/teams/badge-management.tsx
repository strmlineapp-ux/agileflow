
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppTab, type BadgeCollectionOwner, type AppPage } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { getOwnershipContext } from '@/lib/permissions';

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
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '../ui/checkbox';


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


function BadgeDisplayItem({ badge, viewMode, onUpdateBadge, onDelete, collectionId, teamId, isSharedPreview = false, isCollectionOwned = false, isViewer = false, isDragging }: { badge: Badge, viewMode: BadgeCollection['viewMode'], onUpdateBadge: (badgeData: Partial<Badge>) => void, onDelete: () => void, collectionId: string, teamId: string, isSharedPreview?: boolean, isCollectionOwned: boolean, isViewer?: boolean, isDragging?: boolean }) {
    const { toast } = useToast();
    const { teams, users, viewAsUser, allBadges } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [currentName, setCurrentName] = useState(badge.name);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    const badgeOwner = useMemo(() => {
        const ownerCollection = allBadges.find(b => b.id === badge.id)?.ownerCollectionId;
        if (!ownerCollection) return null;

        for (const team of teams) {
            const collection = team.badgeCollections.find(c => c.id === ownerCollection);
            if (collection) {
                return users.find(u => u.userId === collection.owner.id);
            }
        }
        return null; // Should not happen if data is consistent
    }, [badge.id, allBadges, teams, users]);

    const isEditable = useMemo(() => {
        if (isSharedPreview || isViewer) return false;
        return badgeOwner?.userId === viewAsUser.userId;
    }, [isSharedPreview, isViewer, badgeOwner, viewAsUser]);

    useEffect(() => {
        setCurrentName(badge.name);
    }, [badge.name]);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.select();
        }
    }, [isEditingDescription]);

    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim() || '';
        if (newName === '') {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
            setCurrentName(badge.name); 
        } else if (newName && newName !== badge.name) {
            onUpdateBadge({ name: newName });
        }
        setIsEditingName(false);
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
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);
    
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') {
            setCurrentName(badge.name);
            setIsEditingName(false);
        }
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
        for (const team of teams) {
            const collection = team.badgeCollections.find(c => c.id === badge.ownerCollectionId);
            if (collection?.isShared) return true;
        }
        return false;
    }, [badge.ownerCollectionId, teams]);
    
    const isThisTheOriginalInstance = badge.ownerCollectionId === collectionId;

    const isLinkedInternally = useMemo(() => {
        const currentTeam = teams.find(t => t.id === teamId);
        if (!currentTeam) return false;
        const count = currentTeam.badgeCollections.reduce((acc, c) => acc + (c.badgeIds.includes(badge.id) ? 1 : 0), 0);
        return count > 1;
    }, [teams, badge.id, teamId]);

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
        <PopoverContent className="w-auto p-2" onPointerDown={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-8 gap-1">
                {predefinedColors.map(c => (
                    <button
                        key={c}
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: c }}
                        onClick={() => {
                            onUpdateBadge({ color: c });
                            setIsColorPopoverOpen(false);
                        }}
                    />
                ))}
                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                    <GoogleSymbol name="colorize" className="text-muted-foreground" />
                    <Input
                        type="color"
                        value={badge.color}
                        onChange={(e) => onUpdateBadge({ color: e.target.value })}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                        aria-label="Custom color picker"
                    />
                </div>
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
                                                buttonClassName="h-10 w-10"
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
                                                            className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card", isEditable && "cursor-pointer")}
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
                                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center text-white"
                                                        style={{ backgroundColor: shareIconColor }}
                                                    >
                                                        <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}}/>
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
                                    value={currentName}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setCurrentName(e.target.value)}
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
        value={currentName}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setCurrentName(e.target.value)}
        onKeyDown={handleNameKeyDown}
        className={cn(
          "h-auto p-0 border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words",
          "text-sm font-normal"
        )}
      />
    ) : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn("font-normal break-words text-sm", isEditable && "cursor-text")}
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
                                    buttonClassName="h-10 w-10"
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
                                                className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background", isEditable && "cursor-pointer")}
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
                                            className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center text-white"
                                            style={{ backgroundColor: shareIconColor }}
                                        >
                                            <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}} />
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
                className="flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm border-2 h-8"
            >
                <div className="relative">
                     <CompactSearchIconPicker
                        icon={badge.icon}
                        onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                        iconClassName="text-base"
                        disabled={!isEditable}
                        weight={100}
                        style={{ color: badge.color }}
                    />
                     {!isViewer && (
                        <>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!isEditable} onPointerDown={(e) => e.stopPropagation()}>
                                                <button
                                                    className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background", isEditable && "cursor-pointer")}
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
                                                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center text-white"
                                                style={{ backgroundColor: shareIconColor }}
                                            >
                                                <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}} />
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
                "min-h-[60px] rounded-md border-2 border-dashed border-transparent p-2",
                isOver && "border-primary bg-primary/10",
                collection.viewMode === 'assorted' && "flex flex-wrap gap-2 items-start",
                collection.viewMode === 'list' && "flex flex-col gap-1",
                collection.viewMode === 'detailed' && "flex flex-wrap -m-2"
            )}
        >
            {children}
        </div>
    );
}

function SortableCollectionCard({ collection, allBadges, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, onToggleShare, contextTeam, isViewer = false, isSharedPreview = false }: {
    collection: BadgeCollection;
    allBadges: Badge[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string, sourceBadge?: Badge) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    onToggleShare: (collectionId: string) => void;
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
                onToggleShare={onToggleShare}
                dragHandleProps={{...attributes, ...listeners}}
                isSharedPreview={isSharedPreview}
                contextTeam={contextTeam}
                isViewer={isViewer}
            />
        </div>
    );
}


function BadgeCollectionCard({ collection, allBadges, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, onToggleShare, dragHandleProps, isSharedPreview = false, contextTeam, isViewer = false }: {
    collection: BadgeCollection;
    allBadges: Badge[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string, sourceBadge?: Badge) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    onToggleShare: (collectionId: string) => void;
    dragHandleProps?: any;
    isSharedPreview?: boolean;
    contextTeam?: Team;
    isViewer?: boolean;
}) {
    const { viewAsUser, users, updateUser, updateTeam } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    
    const isOwned = useMemo(() => {
        if (isSharedPreview || isViewer) return false;
        if (!viewAsUser) return false;
        if (collection.owner.type === 'user') {
            return collection.owner.id === viewAsUser.userId;
        }
        if (collection.owner.type === 'team' && contextTeam) {
            return contextTeam.teamAdmins?.includes(viewAsUser.userId) || contextTeam.owner.id === viewAsUser.userId || (contextTeam.teamAdmins || []).length === 0;
        }
        return false;
    }, [collection.owner, viewAsUser, isSharedPreview, contextTeam, isViewer]);
    
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
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);
    
    const handleSaveDescription = useCallback(() => {
        const newDescription = descriptionTextareaRef.current?.value || collection.description;
        if (newDescription?.trim() !== collection.description) {
            onUpdateCollection(collection.id, { description: newDescription?.trim() });
        }
        setIsEditingDescription(false);
    }, [collection.description, collection.id, onUpdateCollection]);
    
    useEffect(() => {
        if (!isEditingDescription) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (descriptionTextareaRef.current && !descriptionTextareaRef.current.contains(event.target as Node)) {
                handleSaveDescription();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        descriptionTextareaRef.current?.focus();
        descriptionTextareaRef.current?.select();
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isEditingDescription, handleSaveDescription]);


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

    const isShared = collection.isShared;
    const isMyTeamOwner = collection.owner.id === viewAsUser.userId;
    const ownerUser = users.find(u => u.userId === collection.owner.id);
    
    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor: string | undefined = ownerUser?.primaryColor || '#64748B'; // Default color

    if (isMyTeamOwner && isShared) {
        shareIcon = 'upload';
        shareIconTitle = 'Owned by you and shared with all teams';
    } else if (!isMyTeamOwner) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared by ${ownerUser?.displayName || 'another user'}`;
    }

     const handleUnlink = () => {
        if (contextTeam) {
            const updatedIds = (contextTeam.linkedCollectionIds || []).filter(id => id !== collection.id);
            updateTeam(contextTeam.id, { linkedCollectionIds: updatedIds });
        } else {
            const updatedIds = (viewAsUser.linkedCollectionIds || []).filter(id => id !== collection.id);
            updateUser(viewAsUser.userId, { linkedCollectionIds: updatedIds });
        }
    };
    
    const canUnlink = !isOwned && !isSharedPreview && !isViewer;
    const canShare = isOwned && !isSharedPreview;

    return (
        <>
            <Card className="h-full flex flex-col bg-transparent">
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
                                        style={{ fontSize: '32px' }}
                                        buttonClassName="h-8 w-8"
                                    />
                                    {!isViewer && (
                                        <>
                                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                                <PopoverTrigger asChild disabled={!isOwned} onPointerDown={(e) => e.stopPropagation()}><button className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background", !isOwned ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: collection.color }} /></PopoverTrigger>
                                                <PopoverContent className="w-auto p-2" onPointerDown={(e) => e.stopPropagation()}>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {predefinedColors.map(color => (
                                                            <button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => {onUpdateCollection(collection.id, { color }); setIsColorPopoverOpen(false);}}/>
                                                        ))}
                                                        <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={collection.color} onChange={(e) => onUpdateCollection(collection.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            {shareIcon && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center text-white"
                                                                style={{ backgroundColor: shareIconColor }}
                                                            >
                                                                <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}}/>
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
                                    <div className="flex items-center gap-2">
                                        {isEditingName && isOwned ? (
                                            <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} onPointerDown={(e) => e.stopPropagation()} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"/>
                                        ) : (
                                            <CardTitle onPointerDown={(e) => { e.stopPropagation(); if(isOwned) setIsEditingName(true);}} className={cn("text-2xl font-headline font-thin break-words", isOwned && "cursor-pointer")}>{collection.name}</CardTitle>
                                        )}
                                        <DroppableDuplicateZone id={`duplicate-badge-zone:${collection.id}`} disabled={!isOwned || isViewer}>
                                            <Button variant="ghost" size="icon" onPointerDown={(e) => { e.stopPropagation(); onAddBadge(collection.id);}}><GoogleSymbol name="add_circle" className="text-4xl" weight={100} /><span className="sr-only">Add Badge</span></Button>
                                        </DroppableDuplicateZone>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
                                <DropdownMenu open={isViewMenuOpen} onOpenChange={setIsViewMenuOpen}>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" weight={100} /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                         <DropdownMenuItem onSelect={() => { onUpdateCollection(collection.id, { viewMode: 'assorted' }); setIsViewMenuOpen(false); }}><GoogleSymbol name="view_module" className="mr-2 text-lg" />Assorted View</DropdownMenuItem>
                                         <DropdownMenuItem onSelect={() => { onUpdateCollection(collection.id, { viewMode: 'detailed' }); setIsViewMenuOpen(false); }}><GoogleSymbol name="view_comfy_alt" className="mr-2 text-lg" />Detailed View</DropdownMenuItem>
                                         <DropdownMenuItem onSelect={() => { onUpdateCollection(collection.id, { viewMode: 'list' }); setIsViewMenuOpen(false); }}><GoogleSymbol name="view_list" className="mr-2 text-lg" />List View</DropdownMenuItem>
                                        
                                        {(canShare || canUnlink || (isOwned && !isSharedPreview)) && <DropdownMenuSeparator />}
                                        
                                        {canShare && (
                                            <DropdownMenuItem disabled={isViewer} onClick={() => onToggleShare(collection.id)}>
                                                <GoogleSymbol name={collection.isShared ? 'share_off' : 'share'} className="mr-2 text-lg"/>
                                                {collection.isShared ? 'Unshare Collection' : 'Share Collection'}
                                            </DropdownMenuItem>
                                        )}
                                        
                                        {canUnlink && (
                                            <DropdownMenuItem onClick={handleUnlink}>
                                                <GoogleSymbol name="link_off" className="mr-2 text-lg"/>
                                                Unlink Collection
                                            </DropdownMenuItem>
                                        )}

                                        {isOwned && !isSharedPreview && (
                                            <DropdownMenuItem 
                                                disabled={isViewer}
                                                onClick={() => onDeleteCollection(collection)} 
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <GoogleSymbol name="delete" className="mr-2 text-lg"/>
                                                Delete Collection
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="pt-2">
                            {!isSharedPreview && isOwned && !isViewer && (
                                <div className="flex items-center gap-1 mb-2" onPointerDown={(e) => e.stopPropagation()}>
                                    {APPLICATIONS.map(app => (
                                        <TooltipProvider key={app.key}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("p-0", (collection.applications || []).includes(app.key) ? 'text-primary' : 'text-muted-foreground')}
                                                            onClick={() => onUpdateCollection(collection.id, { applications: (collection.applications || []).includes(app.key) ? (collection.applications || []).filter(a => a !== app.key) : [...(collection.applications || []), app.key] })}
                                                        >
                                                            <GoogleSymbol name={app.icon} className="text-4xl" weight={100} />
                                                        </Button>
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Associate with {app.label}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            )}
                            {isEditingDescription && isOwned ? (
                                <Textarea
                                    ref={descriptionTextareaRef}
                                    defaultValue={collection.description}
                                    onBlur={handleSaveDescription}
                                    className="text-sm"
                                />
                            ) : (
                                <CardDescription
                                    className={isOwned ? "cursor-pointer" : ""}
                                    onClick={() => { if (isOwned) setIsEditingDescription(true); }}
                                >
                                    {collection.description || 'Badge Collection description'}
                                </CardDescription>
                            )}
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
                                    isCollectionOwned={isOwned}
                                    isViewer={isViewer}
                                    collection={collection}
                                />
                            ))}
                        </DroppableCollectionContent>
                    </SortableContext>
                </CardContent>
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

function DroppableDuplicateZone({ id, disabled, children }: { id: string, disabled: boolean, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled });
    const tooltipText = isOver ? 'Drop to Duplicate' : 'Add New Badge';
    
    return (
        <div 
            ref={setNodeRef}
            className={cn("rounded-full p-0.5 transition-all", isOver && "ring-1 ring-border ring-inset")}
        >
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {children}
                    </TooltipTrigger>
                    <TooltipContent><p>{tooltipText}</p></TooltipContent>
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
        updateTeam,
        updateUser,
    } = useUser();

    const { toast } = useToast();
    
    const [collectionToDelete, setCollectionToDelete] = useState<BadgeCollection | null>(null);
    const [badgeToDelete, setBadgeToDelete] = useState<{ collectionId: string, badgeId: string } | null>(null);
    
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const sharedSearchInputRef = useRef<HTMLInputElement>(null);
    
    const contextTeam = team;
    const isTeamContext = isTeamSpecificPage && !!contextTeam;

    const canManageCollections = useMemo(() => {
        if (!contextTeam) return true; // User context is always manageable by the user
        const admins = contextTeam.teamAdmins || [];
        if (admins.length > 0) {
            return admins.includes(viewAsUser.userId);
        }
        return contextTeam.members.includes(viewAsUser.userId);
    }, [contextTeam, viewAsUser]);
    
    const isViewer = useMemo(() => {
        if (!isTeamContext) return false;
        return !canManageCollections;
    }, [isTeamContext, canManageCollections]);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);
    
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
    
    const collectionsToDisplay = useMemo(() => {
        const collectionsMap = new Map<string, BadgeCollection>();

        if (isTeamContext && contextTeam) {
             (contextTeam.badgeCollections || []).forEach(c => collectionsMap.set(c.id, c));
             (contextTeam.linkedCollectionIds || []).forEach(id => {
                const linked = allBadgeCollections.find(c => c.id === id);
                if (linked) collectionsMap.set(id, linked);
            });
        } else {
            (allBadgeCollections.filter(c => c.owner.id === viewAsUser.userId)).forEach(c => collectionsMap.set(c.id, c));
            (viewAsUser.linkedCollectionIds || []).forEach(id => {
                const linked = allBadgeCollections.find(c => c.id === id);
                if (linked) collectionsMap.set(id, linked);
            });
        }

        let finalCollections = Array.from(collectionsMap.values());
        
        if (searchTerm) {
            finalCollections = finalCollections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (isViewer && contextTeam) {
            finalCollections = finalCollections.filter(c => contextTeam.activeBadgeCollections?.includes(c.id));
        }
        
        return finalCollections;
    }, [allBadgeCollections, isTeamContext, contextTeam, viewAsUser, isViewer, searchTerm]);

    const handleToggleCollectionActive = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, collectionId: string) => {
        if (!isTeamContext || !canManageCollections || !contextTeam) return;
        
        const target = e.target as HTMLElement;
        const isInteractiveElement = target.closest('button, a, input, [role="menuitem"], [role="option"], [role="tooltip"], [role="dialog"], [draggable="true"]');
        if (isInteractiveElement) {
            return;
        }
    
        const wasActive = contextTeam.activeBadgeCollections?.includes(collectionId);
        const currentActive = new Set(contextTeam.activeBadgeCollections || []);
        
        if (wasActive) {
            currentActive.delete(collectionId);
        } else {
            currentActive.add(collectionId);
        }
        
        updateTeam(contextTeam.id, { activeBadgeCollections: Array.from(currentActive) });
        toast({
            title: `Collection ${wasActive ? 'Deactivated' : 'Activated'}`,
            description: `The collection is now ${wasActive ? 'inactive' : 'active'} for the team.`
        });
    };

    const sharedCollections = useMemo(() => {
        const collectionsOnBoardIds = new Set(collectionsToDisplay.map(c => c.id));
        return allBadgeCollections
            .filter(c => c.isShared && !collectionsOnBoardIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [allBadgeCollections, collectionsToDisplay, sharedSearchTerm]);

    const handleAddCollection = () => {
      const owner = getOwnershipContext(page, viewAsUser, contextTeam);
      addBadgeCollection(owner, undefined, contextTeam);
    };
    
    const handleDeleteCollection = (collection: BadgeCollection) => {
        if (isViewer) return;
        
        let isOwned = collection.owner.id === viewAsUser.userId;
        if(isTeamContext && contextTeam) {
            isOwned = collection.owner.id === contextTeam.id || collection.owner.id === viewAsUser.userId;
        }

        if (!isOwned) {
            // Unlink if not owner
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
        deleteBadgeCollection(collectionToDelete.id, contextTeam);
        toast({ title: 'Collection Deleted', description: `"${collectionToDelete.name}" and all its owned badges have been deleted.`});
        setCollectionToDelete(null);
    };

    const handleToggleShare = (collectionId: string) => {
        const collection = allBadgeCollections.find(c => c.id === collectionId);
        if (collection) {
            updateBadgeCollection(collectionId, { isShared: !collection.isShared });
            toast({ title: collection.isShared ? 'Collection Unshared' : 'Collection Shared', description: `"${collection.name}" is now ${collection.isShared ? 'private.' : 'visible to all teams.'}`});
        }
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
    
    
    const onDragEnd = (result: DragEndEvent) => {
        const { active, over } = result;

        if (!over) return;
        
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // --- Dragging a COLLECTION ---
        if (activeType === 'collection') {
            const collectionId = active.data.current?.collection.id;

            // To Shared Panel (Unsharing or Unlinking)
            if (over.id === 'shared-collections-panel') {
                const collection = allBadgeCollections.find(c => c.id === collectionId);
                if (collection && collection.owner.id === viewAsUser.userId) {
                    handleToggleShare(collectionId);
                } else if (collection) {
                    handleDeleteCollection(collection); // This handles unlinking
                }
                return;
            }

            // From Shared Panel (Linking)
            if (active.data.current?.isSharedPreview && over.id === 'collections-list') {
                if (team) {
                    updateTeam(team.id, { linkedCollectionIds: [...(team.linkedCollectionIds || []), collectionId] });
                } else {
                    updateUser(viewAsUser.userId, { linkedCollectionIds: [...(viewAsUser.linkedCollectionIds || []), collectionId] });
                }
                toast({ title: 'Collection Linked' });
                return;
            }

            // Duplicating a collection
            if (over.id === 'duplicate-collection-zone') {
                const sourceCollection = allBadgeCollections.find(c => c.id === collectionId);
                if (sourceCollection) {
                    const owner = getOwnershipContext(page, viewAsUser, contextTeam);
                    addBadgeCollection(owner, sourceCollection, contextTeam);
                    toast({ title: 'Collection Copied' });
                }
                return;
            }

            // Reordering collections
            if (overType === 'collection') {
                const activeIndex = collectionsToDisplay.findIndex(c => c.id === collectionId);
                const overIndex = collectionsToDisplay.findIndex(c => c.id === over.data.current?.collection.id);
                // TODO: Implement reordering logic if needed.
            }
            return;
        }

        // --- Dragging a BADGE ---
        if (activeType === 'badge') {
            const badge = active.data.current?.badge as Badge;
            const sourceCollectionId = active.data.current?.collectionId;
            
            // Duplicating a badge
            if (over.id === `duplicate-badge-zone:${sourceCollectionId}`) {
                addBadge(sourceCollectionId, badge);
                toast({ title: 'Badge Duplicated' });
                return;
            }

            // Moving a badge
            if (overType === 'collection' || overType === 'badge') {
                const overCollectionId = over.data.current?.collection.id || over.data.current?.collectionId;
                const overCollection = allBadgeCollections.find(c => c.id === overCollectionId);
                if (!overCollection) return;

                // Move within the same collection
                if (sourceCollectionId === overCollectionId) {
                    const sourceIndex = overCollection.badgeIds.indexOf(badge.id);
                    const overIndex = over.data.current?.type === 'badge' ? overCollection.badgeIds.indexOf(over.data.current.badge.id) : overCollection.badgeIds.length;
                    
                    if (sourceIndex !== -1) {
                        const reorderedIds = Array.from(overCollection.badgeIds);
                        reorderedIds.splice(sourceIndex, 1);
                        reorderedIds.splice(overIndex, 0, badge.id);
                        updateBadgeCollection(overCollectionId, { badgeIds: reorderedIds });
                    }
                } else { // Move to a different collection
                    if (overCollection.badgeIds.includes(badge.id)) {
                        toast({ variant: 'default', title: 'Already linked'});
                        return;
                    }
                    const newDestIds = Array.from(overCollection.badgeIds);
                    newDestIds.push(badge.id);
                    updateBadgeCollection(overCollection.id, { badgeIds: newDestIds });
                    toast({ title: 'Badge Shared' });
                }
            }
        }
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <DndContext sensors={sensors} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="flex gap-4">
                <div className="flex-1 transition-all duration-300 flex flex-col gap-6">
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
                            {!isViewer && (
                                <DroppableDuplicateZone id="duplicate-collection-zone" disabled={isViewer}>
                                    <Button variant="ghost" size="icon" onPointerDown={(e) => { e.stopPropagation(); handleAddCollection(); }} onClick={handleAddCollection}>
                                        <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                        <span className="sr-only">Add New Collection or Drop to Duplicate</span>
                                    </Button>
                                </DroppableDuplicateZone>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {!isSearching ? (
                                <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className="text-muted-foreground">
                                    <GoogleSymbol name="search" />
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1 border-b">
                                    <GoogleSymbol name="search" className="text-muted-foreground" />
                                    <input
                                        ref={searchInputRef}
                                        placeholder="Search collections..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onBlur={() => { if (!searchTerm) setIsSearching(false); }}
                                        className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                    />
                                </div>
                            )}
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
                    
                    <SortableContext items={collectionsToDisplay.map(c => `collection::${c.id}`)} strategy={rectSortingStrategy}>
                        <div className={cn("flex flex-wrap -m-2 transition-all duration-300")}>
                            {collectionsToDisplay.map((collection, index) => {
                                 const isActive = !isTeamContext || !contextTeam?.activeBadgeCollections || contextTeam.activeBadgeCollections.includes(collection.id);
                                 const canToggle = isTeamContext && canManageCollections;

                                return (
                                    <div
                                        key={collection.id}
                                        className={cn(
                                            "p-2 w-full transition-all duration-300",
                                            isSharedPanelOpen ? "lg:w-1/2" : "lg:w-1/3",
                                            (canToggle && !isActive) && "opacity-40 hover:opacity-100",
                                        )}
                                    >
                                        <div 
                                            className={cn("h-full", (canToggle && !isActive) && "cursor-pointer")}
                                            onPointerDown={(e) => {
                                               if (canToggle && !isActive) {
                                                   handleToggleCollectionActive(e, collection.id);
                                               }
                                            }}
                                        >
                                            <SortableCollectionCard
                                                collection={collection}
                                                allBadges={allBadges}
                                                onUpdateCollection={updateBadgeCollection}
                                                onDeleteCollection={handleDeleteCollection}
                                                onAddBadge={addBadge}
                                                onUpdateBadge={updateBadge}
                                                onDeleteBadge={handleDeleteBadge}
                                                onToggleShare={handleToggleShare}
                                                contextTeam={team}
                                                isViewer={isViewer}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </SortableContext>
                </div>
                
                {!isViewer && (
                     <div className={cn(
                        "transition-all duration-300",
                        isSharedPanelOpen ? "w-96 p-2" : "w-0"
                    )}>
                        <div 
                            className={cn("h-full rounded-lg transition-all")}
                        >
                            <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-headline font-thin text-xl">Shared Collections</CardTitle>
                                        <div className="flex items-center gap-1">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-lg" />
                                            <input
                                                ref={sharedSearchInputRef}
                                                placeholder="Search shared..."
                                                value={sharedSearchTerm}
                                                onChange={(e) => setSharedSearchTerm(e.target.value)}
                                                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                            />
                                        </div>
                                    </div>
                                    <CardDescription>Drag a collection to link it to your team.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-full">
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
                                                            onToggleShare={handleToggleShare}
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
            </div>
        </DndContext>
    );
}
