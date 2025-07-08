
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
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { getOwnershipContext } from '@/lib/permissions';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

// Wrapper to fix issues with react-beautiful-dnd and React 18 Strict Mode
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};


function CompactSearchIconPicker({
  icon,
  color,
  onUpdateIcon,
  buttonClassName,
  iconClassName,
  disabled = false,
  weight,
}: {
  icon: string,
  color?: string,
  onUpdateIcon: (iconName: string) => void,
  buttonClassName?: string,
  iconClassName?: string,
  disabled?: boolean,
  weight?: number,
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
        <button
          className={cn("p-0 flex items-center justify-center", buttonClassName)}
          style={color ? { color } : {}}
          disabled={disabled}
        >
          <GoogleSymbol name={icon} className={cn("text-3xl", iconClassName)} weight={weight} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center gap-1 p-2 border-b">
            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
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


function BadgeDisplayItem({ badge, viewMode, onUpdateBadge, onDelete, collectionId, teamId, isSharedPreview = false, isCollectionOwned = false }: { badge: Badge, viewMode: BadgeCollection['viewMode'], onUpdateBadge: (badgeData: Partial<Badge>) => void, onDelete: () => void, collectionId: string, teamId: string, isSharedPreview?: boolean, isCollectionOwned: boolean }) {
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
        if (isSharedPreview) return false;
        return badgeOwner?.userId === viewAsUser.userId;
    }, [isSharedPreview, badgeOwner, viewAsUser]);

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
    
    const colorPickerContent = (
        <PopoverContent className="w-auto p-2">
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

    if (viewMode === 'detailed') {
      return (
        <div className="group relative h-full flex flex-col rounded-lg">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <CompactSearchIconPicker 
                                                icon={badge.icon} 
                                                color={badge.color} 
                                                onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                                                disabled={!isEditable}
                                                iconClassName="text-2xl" 
                                            />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner."}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild disabled={!isEditable}>
                                                <button
                                                    className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card", isEditable && "cursor-pointer")}
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
                                            <span onClick={() => isEditable && setIsEditingName(true)} className={cn("text-base break-words font-normal", isEditable && "cursor-pointer")}>{badge.name}</span>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 flex-grow">
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
                                    onClick={() => isEditable && setIsEditingDescription(true)}
                                >
                                    {badge.description || (isEditable ? 'Click to add description.' : 'No description.')}
                                </p>
                            </TooltipTrigger>
                             <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </CardContent>
            {isCollectionOwned && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GoogleSymbol name="delete" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isThisTheOriginalInstance ? "Delete Badge Permanently" : "Unlink Badge from Collection"}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             )}
        </div>
      );
    }
    
    const inlineNameEditor = isEditingName && isEditable ? (
      <Input
        ref={nameInputRef}
        value={currentName}
        onMouseDown={(e) => e.stopPropagation()}
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
                        onClick={(e) => {
                        e.stopPropagation();
                        if (isEditable) {
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
        <div className="group flex w-full items-start gap-4 p-2 rounded-md hover:bg-muted/50">
            <div className="relative">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <CompactSearchIconPicker 
                                    icon={badge.icon} 
                                    color={badge.color} 
                                    onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                                    disabled={!isEditable}
                                    iconClassName="text-xl" 
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner."}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild disabled={!isEditable}>
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
                                <p className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isEditable && "cursor-text")} onClick={() => isEditable && setIsEditingDescription(true)}>
                                    {badge.description || (isEditable ? 'Click to add description.' : 'No description.')}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </div>
            {isCollectionOwned && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <GoogleSymbol name="delete" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isThisTheOriginalInstance ? "Delete Badge Permanently" : "Unlink Badge from Collection"}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
      );
    }
    
    // Assorted View
    return (
        <div className="group relative p-1.5">
            <UiBadge
                variant={'outline'}
                style={{ color: badge.color, borderColor: badge.color }}
                className="flex items-center gap-1.5 p-1 pl-2 pr-2 rounded-full text-sm border-2 h-8"
            >
                <div className="relative">
                    <CompactSearchIconPicker
                        icon={badge.icon}
                        onUpdateIcon={(icon) => onUpdateBadge({ icon })}
                        iconClassName="text-base"
                        disabled={!isEditable}
                    />
                     <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild disabled={!isEditable}>
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
                </div>
                {inlineNameEditor}
            </UiBadge>
            
             {isCollectionOwned && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={onDelete}
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

function BadgeCollectionCard({ collection, allBadges, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, onToggleShare, dragHandleProps, isSharedPreview = false, contextTeam }: {
    collection: BadgeCollection;
    allBadges: Badge[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    onToggleShare: (collectionId: string) => void;
    dragHandleProps?: any;
    isSharedPreview?: boolean;
    contextTeam?: Team;
}) {
    const { viewAsUser, users, updateUser, updateTeam } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const isOwned = useMemo(() => {
        if (isSharedPreview) return false;
        if (!viewAsUser) return false;
        if (collection.owner.type === 'user') {
            return collection.owner.id === viewAsUser.userId;
        }
        if (collection.owner.type === 'team' && contextTeam) {
            return contextTeam.teamAdmins?.includes(viewAsUser.userId) || contextTeam.owner.id === viewAsUser.userId;
        }
        return false;
    }, [collection.owner, viewAsUser, isSharedPreview, contextTeam]);
    
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
    
    return (
        <Card className="h-full flex flex-col bg-transparent">
            <div {...dragHandleProps}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative">
                                <CompactSearchIconPicker 
                                    icon={collection.icon} 
                                    color={collection.color} 
                                    onUpdateIcon={(icon) => onUpdateCollection(collection.id, { icon })}
                                    disabled={!isOwned}
                                    iconClassName="text-6xl"
                                    weight={100}
                                />
                                <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                    <PopoverTrigger asChild disabled={!isOwned}><button className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background", !isOwned ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: collection.color }} /></PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
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
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {isEditingName ? (
                                        <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"/>
                                    ) : (
                                        <CardTitle onClick={() => isOwned && setIsEditingName(true)} className={cn("text-2xl font-headline font-thin break-words", isOwned && "cursor-pointer")}>{collection.name}</CardTitle>
                                    )}
                                    <StrictModeDroppable droppableId={`duplicate-badge-zone:${collection.id}`} type="badge" isDropDisabled={!isOwned} isCombineEnabled={false}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={cn(
                                                "rounded-full p-0.5",
                                                snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                                            )}
                                        >
                                            {isOwned && !isSharedPreview && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => onAddBadge(collection.id)}><GoogleSymbol name="add_circle" className="text-4xl" weight={100} /><span className="sr-only">Add Badge</span></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Badge'}</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    )}
                                    </StrictModeDroppable>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" weight={100} /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'assorted' })}><GoogleSymbol name="view_module" className="mr-2 text-lg" />Assorted View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'detailed' })}><GoogleSymbol name="view_comfy_alt" className="mr-2 text-lg" />Detailed View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'list' })}><GoogleSymbol name="view_list" className="mr-2 text-lg" />List View</DropdownMenuItem>
                                    {isOwned && <DropdownMenuSeparator />}
                                    {isOwned && <DropdownMenuItem onClick={() => onToggleShare(collection.id)}><GoogleSymbol name={collection.isShared ? 'share_off' : 'share'} className="mr-2 text-lg"/>{collection.isShared ? 'Unshare Collection' : 'Share Collection'}</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => isOwned ? onDeleteCollection(collection) : handleUnlink()} 
                                        className={cn(isOwned && "text-destructive focus:text-destructive")}
                                    >
                                        <GoogleSymbol name={isOwned ? "delete" : "link_off"} className="mr-2 text-lg"/>
                                        {isOwned ? "Delete Collection" : "Unlink Collection"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="pt-2">
                        {!isSharedPreview && isOwned && (
                            <div className="flex items-center gap-1 mb-2">
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
                        {collection.description && <CardDescription>{collection.description}</CardDescription>}
                    </div>
                </CardHeader>
            </div>
            <CardContent className="flex-grow">
                <StrictModeDroppable droppableId={collection.id} type="badge" isDropDisabled={!isOwned && !isSharedPreview} isCombineEnabled={false}>
                    {(provided, snapshot) => (
                         <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[60px] rounded-md border-2 border-dashed border-transparent p-2",
                                collection.viewMode === 'assorted' && "flex flex-wrap gap-2 items-start",
                                collection.viewMode === 'list' && "flex flex-col gap-1",
                                collection.viewMode === 'detailed' && "flex flex-wrap -m-2"
                            )}>
                            {collectionBadges.map((badge, index) => (
                                <Draggable key={`${badge.id}::${collection.id}`} draggableId={`${badge.id}::${collection.id}`} index={index} isDragDisabled={false} ignoreContainerClipping={false}>
                                    {(provided, snapshot) => (
                                    <div 
                                      ref={provided.innerRef} 
                                      {...provided.draggableProps} 
                                      {...provided.dragHandleProps} 
                                      className={cn(
                                        snapshot.isDragging && "opacity-80",
                                        collection.viewMode === 'detailed' && 'w-full md:w-1/2 p-2'
                                      )}
                                    >
                                        <BadgeDisplayItem 
                                            badge={badge} 
                                            viewMode={collection.viewMode} 
                                            onUpdateBadge={(data) => onUpdateBadge({ ...data, id: badge.id })}
                                            onDelete={() => onDeleteBadge(collection.id, badge.id)}
                                            collectionId={collection.id}
                                            teamId={contextTeam?.id || ''}
                                            isSharedPreview={isSharedPreview}
                                            isCollectionOwned={isOwned}
                                        />
                                    </div>)}
                                </Draggable>
                                ))}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </CardContent>
        </Card>
    );
}

export function BadgeManagement({ team, tab, page }: { team?: Team, tab: AppTab, page: AppPage }) {
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
        let baseCollections;
        let linkedCollectionIds: string[] = [];

        if (team) {
            // Team context: Display collections owned by ANY team member, or by the team itself.
            const teamMemberIds = new Set(team.members);
            baseCollections = allBadgeCollections.filter(c => 
                (c.owner.type === 'user' && teamMemberIds.has(c.owner.id)) ||
                (c.owner.type === 'team' && c.owner.id === team.id)
            );
            linkedCollectionIds = team.linkedCollectionIds || [];
        } else {
            // User context (non-team page): Display collections owned by the USER.
            // If the static page is associated with a team, show that team's collections too.
            if (page.access?.teams?.length > 0) {
                const contextTeamId = page.access.teams[0];
                const contextTeam = teams.find(t => t.id === contextTeamId);
                const contextTeamMemberIds = new Set(contextTeam?.members || []);
                baseCollections = allBadgeCollections.filter(c => 
                    (c.owner.type === 'team' && c.owner.id === contextTeamId) ||
                    (c.owner.type === 'user' && contextTeamMemberIds.has(c.owner.id))
                );
                linkedCollectionIds = contextTeam?.linkedCollectionIds || [];
            } else {
                 baseCollections = allBadgeCollections.filter(c => c.owner.type === 'user' && c.owner.id === viewAsUser.userId);
                 linkedCollectionIds = viewAsUser.linkedCollectionIds || [];
            }
        }

        const linkedCollections = allBadgeCollections.filter(c => linkedCollectionIds.includes(c.id));
        
        const combined = [...baseCollections, ...linkedCollections];
        const uniqueIds = new Set();
        const uniqueCollections = combined.filter(c => {
            if (uniqueIds.has(c.id)) {
                return false;
            }
            uniqueIds.add(c.id);
            return true;
        });

        return uniqueCollections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allBadgeCollections, team, viewAsUser, searchTerm, page.access.teams, teams]);

    const sharedCollections = useMemo(() => {
        const collectionsOnBoardIds = new Set(collectionsToDisplay.map(c => c.id));
        return allBadgeCollections
            .filter(c => c.isShared && !collectionsOnBoardIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [allBadgeCollections, collectionsToDisplay, sharedSearchTerm]);

    const handleAddCollection = () => {
      const owner = getOwnershipContext(page, viewAsUser);
      addBadgeCollection(owner);
    };
    
    const handleDeleteCollection = (collection: BadgeCollection) => {
        setCollectionToDelete(collection);
    };

    const confirmDeleteCollection = () => {
        if (!collectionToDelete) return;
        deleteBadgeCollection(collectionToDelete.id);
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
    }, [allBadges, allBadgeCollections, updateBadgeCollection, toast, confirmPermanentDelete]);
    
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId, type } = result;
    
        if (!destination) return;

        // --- Dragging from ANYWHERE to the SHARED PANEL ---
        if (type === 'collection' && destination.droppableId === 'shared-collections-panel') {
            const collectionToDrop = allBadgeCollections.find(c => c.id === draggableId);
            if (collectionToDrop) {
                const isOwned = collectionToDrop.owner.type === 'user' && collectionToDrop.owner.id === viewAsUser.userId;
                if (isOwned && !collectionToDrop.isShared) {
                    handleToggleShare(collectionToDrop.id);
                } else if (!isOwned) { // Unlinking a linked collection
                     if (team) {
                        const updatedIds = (team.linkedCollectionIds || []).filter(id => id !== draggableId);
                        updateTeam(team.id, { linkedCollectionIds: updatedIds });
                    } else {
                        const updatedIds = (viewAsUser.linkedCollectionIds || []).filter(id => id !== draggableId);
                        updateUser(viewAsUser.userId, { linkedCollectionIds: updatedIds });
                    }
                    toast({ title: 'Collection Unlinked' });
                }
            }
            return;
        }

        // --- Dragging from SHARED PANEL to MAIN BOARD (Linking) ---
        if (type === 'collection' && source.droppableId === 'shared-collections-panel' && destination.droppableId === 'collections-list') {
            if (team) {
                updateTeam(team.id, { linkedCollectionIds: [...(team.linkedCollectionIds || []), draggableId] });
            } else {
                updateUser(viewAsUser.userId, { linkedCollectionIds: [...(viewAsUser.linkedCollectionIds || []), draggableId] });
            }
            toast({ title: 'Collection Linked' });
            return;
        }

        // --- DUPLICATING a collection ---
        if (type === 'collection' && destination.droppableId === 'duplicate-collection-zone') {
             const sourceCollection = allBadgeCollections.find(c => c.id === draggableId);
             if (sourceCollection) {
                 const owner = getOwnershipContext(page, viewAsUser);
                 addBadgeCollection(owner, sourceCollection);
                 toast({ title: 'Collection Copied', description: 'An independent copy was created.' });
             }
             return;
        }

        const badgeId = draggableId.split('::')[0];
        const sourceCollectionId = source.droppableId;
        
        // --- DUPLICATING a badge ---
        if (destination.droppableId.startsWith('duplicate-badge-zone:')) {
            const collectionId = destination.droppableId.split(':')[1];
            const sourceBadge = allBadges.find(b => b.id === badgeId);
  
            if (sourceBadge && collectionId) {
                addBadge(collectionId, sourceBadge);
                toast({ title: 'Badge Duplicated' });
            }
            return;
        }

        // --- MOVING a badge ---
        const destCollectionId = destination.droppableId;
        const sourceCollection = allBadgeCollections.find(c => c.id === sourceCollectionId);
        const destCollection = allBadgeCollections.find(c => c.id === destCollectionId);
    
        if (!sourceCollection || !destCollection) return;
        
        // --- Reordering within the same collection ---
        if (source.droppableId === destination.droppableId) {
            const reorderedIds = Array.from(sourceCollection.badgeIds);
            const [movedId] = reorderedIds.splice(source.index, 1);
            reorderedIds.splice(destination.index, 0, movedId);
            updateBadgeCollection(sourceCollection.id, { badgeIds: reorderedIds });
        } else { // --- Linking to a different collection ---
             if (destCollection.owner.id !== viewAsUser.userId) {
                toast({ variant: 'destructive', title: 'Cannot Add Badge', description: 'You can only add badges to collections you own.' });
                return;
            }

            const newDestIds = Array.from(destCollection.badgeIds);
            const badgeIsAlreadyInDest = newDestIds.includes(badgeId);

            if (badgeIsAlreadyInDest) {
                toast({ variant: 'default', title: 'Already linked', description: 'This badge is already in the destination collection.'});
                return;
            }

            newDestIds.splice(destination.index, 0, badgeId);
            updateBadgeCollection(destCollection.id, { badgeIds: newDestIds });
            toast({ title: 'Badge Shared', description: 'A link to the badge has been added to the new collection.' });
        }
    };


    return (
        <DragDropContext onDragEnd={onDragEnd}>
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
                            <StrictModeDroppable droppableId="duplicate-collection-zone" type="collection" isDropDisabled={false} isCombineEnabled={false}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "rounded-full p-0.5",
                                        snapshot.isDraggingOver && "ring-1 ring-border ring-inset"
                                    )}
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={handleAddCollection}>
                                                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                                    <span className="sr-only">Add New Collection or Drop to Duplicate</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Collection'}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                            </StrictModeDroppable>
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
                        </div>
                    </div>
                    
                    <StrictModeDroppable droppableId="collections-list" type="collection" isDropDisabled={false} isCombineEnabled={false}>
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className={cn(
                                    "flex flex-wrap -m-2 transition-all duration-300",
                                    snapshot.isDraggingOver && "ring-1 ring-border ring-inset p-2 rounded-lg"
                                )}
                            >
                                {collectionsToDisplay.map((collection, index) => (
                                    <Draggable key={collection.id} draggableId={collection.id} index={index} ignoreContainerClipping={false}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={cn(
                                                    "p-2 w-full transition-all duration-300",
                                                    isSharedPanelOpen ? "lg:w-1/2" : "lg:w-1/3"
                                                )}
                                            >
                                                <BadgeCollectionCard
                                                    dragHandleProps={provided.dragHandleProps}
                                                    key={collection.id}
                                                    collection={collection}
                                                    allBadges={allBadges}
                                                    onUpdateCollection={updateBadgeCollection}
                                                    onDeleteCollection={handleDeleteCollection}
                                                    onAddBadge={addBadge}
                                                    onUpdateBadge={updateBadge}
                                                    onDeleteBadge={handleDeleteBadge}
                                                    onToggleShare={handleToggleShare}
                                                    contextTeam={team}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
                
                 <div className={cn(
                    "transition-all duration-300",
                    isSharedPanelOpen ? "w-96 p-2" : "w-0"
                )}>
                    <StrictModeDroppable droppableId="shared-collections-panel" type="collection" isDropDisabled={!allBadgeCollections.some(c => c.isShared)}>
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className={cn("h-full rounded-lg transition-all", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                            >
                                <Card className={cn("transition-opacity duration-300 h-full bg-transparent", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
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
                                        <div className="space-y-2">
                                            {sharedCollections.map((collection, index) => {
                                                return (
                                                    <Draggable key={collection.id} draggableId={collection.id} index={index} isDragDisabled={false} ignoreContainerClipping={false}>
                                                        {(provided, snapshot) => (
                                                            <div 
                                                                ref={provided.innerRef} 
                                                                {...provided.draggableProps} 
                                                                className={cn("w-full cursor-grab", snapshot.isDragging && "shadow-xl opacity-80")}
                                                            >
                                                                <BadgeCollectionCard
                                                                    dragHandleProps={provided.dragHandleProps}
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
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                            {sharedCollections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No collections are being shared by other teams.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
                <Dialog open={!!collectionToDelete && collectionToDelete.owner.id === viewAsUser.userId} onOpenChange={() => setCollectionToDelete(null)}>
                    <DialogContent className="max-w-md">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 p-0" onClick={confirmDeleteCollection}>
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
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { if (badgeToDelete) confirmPermanentDelete(badgeToDelete.badgeId); }}>
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
        </DragDropContext>
    );
}
