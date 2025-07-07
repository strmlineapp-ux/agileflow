

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
  icon: string;
  color?: string;
  onUpdateIcon: (iconName: string) => void;
  buttonClassName?: string;
  iconClassName?: string;
  disabled?: boolean;
  weight?: number;
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


function BadgeDisplayItem({ badge, viewMode, onUpdateBadge, onDelete, collectionId, teamId, isSharedPreview = false }: { badge: Badge; viewMode: BadgeCollection['viewMode']; onUpdateBadge: (badgeData: Partial<Badge>) => void; onDelete: () => void; collectionId: string; teamId: string; isSharedPreview?: boolean; }) {
    const { toast } = useToast();
    const { teams, viewAsUser } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [currentName, setCurrentName] = useState(badge.name);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    // The team that actually holds this badge in its `allBadges` array.
    const ownerTeam = useMemo(() => teams.find(t => (t.allBadges || []).some(b => b.id === badge.id)), [teams, badge.id]);

    const isEditable = useMemo(() => {
        if (isSharedPreview) return false;
        if (!ownerTeam) return false; // Not editable if owner can't be found
        if (viewAsUser.isAdmin) return true;
        return (ownerTeam.teamAdmins || []).includes(viewAsUser.userId);
    }, [isSharedPreview, ownerTeam, viewAsUser]);

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
        if (!ownerTeam) return false;
        const ownerCollection = ownerTeam.badgeCollections.find(c => c.id === badge.ownerCollectionId);
        return !!ownerCollection?.isShared;
    }, [badge.ownerCollectionId, ownerTeam]);
    
    const isThisTheOriginalInstance = badge.ownerCollectionId === collectionId;

    const isLinkedInternally = useMemo(() => {
        const currentTeam = teams.find(t => t.id === teamId);
        if (!currentTeam) return false;
        const count = currentTeam.badgeCollections.reduce((acc, c) => acc + (c.badgeIds.includes(badge.id) ? 1 : 0), 0);
        return count > 1;
    }, [teams, badge.id, teamId]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor = ownerTeam?.color;

    if (ownerTeam?.id === teamId && isShared) {
        shareIcon = 'upload';
        shareIconTitle = `Owned by this team and shared externally`;
    } else if (ownerTeam?.id !== teamId) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared from ${ownerTeam?.name || 'another team'}`;
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
        <div className="group h-full flex flex-col rounded-lg">
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
                                    <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner team."}</p></TooltipContent>
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
                                        <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner team.'}</p></TooltipContent>
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
                                        <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner team."}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GoogleSymbol name="delete" />
                    </Button>
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
                             <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner team."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </CardContent>
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
                <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner team."}</p></TooltipContent>
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
                        <TooltipContent><p>{isEditable ? "Change Icon" : "Properties are managed by the owner team."}</p></TooltipContent>
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
                            <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner team.'}</p></TooltipContent>
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
                            <TooltipContent><p>{isEditable ? "Click to edit" : "Properties are managed by the owner team."}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 )}
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <GoogleSymbol name="delete" />
            </Button>
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
                                <TooltipContent><p>{isEditable ? 'Change Color' : 'Properties are managed by the owner team.'}</p></TooltipContent>
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
            
            <button
                type="button"
                className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
                aria-label={`Delete ${badge.name}`}
            >
                <GoogleSymbol name="close" className="text-xs" />
            </button>
        </div>
    );
}

function BadgeCollectionCard({ collection, allBadgesInTeam, teamId, teams, users, appSettings, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, onToggleShare, dragHandleProps, isSharedPreview = false }: {
    collection: BadgeCollection;
    allBadgesInTeam: Badge[];
    teamId: string;
    teams: Team[];
    users: User[];
    appSettings: AppSettings;
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collectionId: string) => void;
    onAddBadge: (collectionId: string) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    onToggleShare: (collectionId: string) => void;
    dragHandleProps?: any;
    isSharedPreview?: boolean;
}) {
    const { viewAsUser } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const isOwned = useMemo(() => {
        if (isSharedPreview) return false;
        if (!viewAsUser) return false;
        
        switch (collection.owner.type) {
            case 'team':
                const team = teams.find(t => t.id === collection.owner.id);
                return team?.teamAdmins?.includes(viewAsUser.userId) || viewAsUser.isAdmin;
            case 'admin_group':
                const userAdminGroupIds = new Set(appSettings.adminGroups.filter(ag => (viewAsUser.roles || []).includes(ag.name)).map(ag => ag.id));
                return viewAsUser.isAdmin || userAdminGroupIds.has(collection.owner.id);
            case 'user':
                return collection.owner.id === viewAsUser.userId;
            default:
                return false;
        }
    }, [collection.owner, teams, viewAsUser, isSharedPreview, appSettings.adminGroups]);
    
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
        return collection.badgeIds.map(id => allBadgesInTeam.find(b => b.id === id)).filter((b): b is Badge => !!b);
    }, [collection.badgeIds, allBadgesInTeam]);
    
    const APPLICATIONS: { key: BadgeApplication, icon: string, label: string }[] = [
        { key: 'team members', icon: 'group', label: 'Team Members' },
        { key: 'events', icon: 'calendar_month', label: 'Events' },
        { key: 'tasks', icon: 'checklist', label: 'Tasks' },
        { key: 'badges', icon: 'style', label: 'Badges' },
    ];

    const isShared = collection.isShared;
    const isMyTeamOwner = collection.owner.type === 'team' && collection.owner.id === teamId;
    
    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor: string | undefined = '#64748B'; // Default color

    if (isMyTeamOwner && isShared) {
        const ownerTeam = teams.find(t => t.id === teamId);
        shareIcon = 'upload';
        shareIconTitle = 'Owned by this team and shared with all teams';
        shareIconColor = ownerTeam?.color;
    } else if (!isMyTeamOwner) {
        shareIcon = 'downloading';
        const owner = collection.owner;
        if(owner.type === 'team') {
            const ownerTeam = teams.find(t => t.id === owner.id);
            shareIconTitle = `Shared from ${ownerTeam?.name || 'another team'}`;
            shareIconColor = ownerTeam?.color;
        } else if (owner.type === 'admin_group') {
            const ownerGroup = appSettings.adminGroups.find(g => g.id === owner.id);
            shareIconTitle = `Shared from ${ownerGroup?.name || 'an admin group'}`;
            shareIconColor = ownerGroup?.color;
        } else if (owner.type === 'user') {
            const ownerUser = users.find(u => u.userId === owner.id);
            shareIconTitle = `Shared by ${ownerUser?.displayName || 'a user'}`;
            shareIconColor = ownerUser?.primaryColor;
        }
    }
    
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
                                    {isOwned && !isSharedPreview && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => onAddBadge(collection.id)}><GoogleSymbol name="add_circle" className="text-4xl" weight={100} /><span className="sr-only">Add Badge</span></Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Add New Badge</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
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
                                    <DropdownMenuItem onClick={() => onDeleteCollection(collection.id)} className="text-destructive focus:text-destructive">
                                        <GoogleSymbol name="delete" className="mr-2 text-lg"/>
                                        {isOwned ? "Delete Collection" : "Unlink Collection"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="pt-2">
                        {!isSharedPreview && (
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
                                                        disabled={isSharedPreview || !isOwned}
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
                <StrictModeDroppable droppableId={collection.id} type="badge" isDropDisabled={isSharedPreview} isCombineEnabled={false}>
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
                                <Draggable key={`${badge.id}::${collection.id}`} draggableId={`${badge.id}::${collection.id}`} index={index} isDragDisabled={isSharedPreview} ignoreContainerClipping={false}>
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
                                            teamId={teamId}
                                            isSharedPreview={isSharedPreview}
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
    const { teams, users, appSettings, updateTeam, updateAppTab, viewAsUser } = useUser();
    const { toast } = useToast();
    
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
    const [badgeToDelete, setBadgeToDelete] = useState<{ collectionId: string, badgeId: string } | null>(null);
    
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const [isSharedSearching, setIsSharedSearching] = useState(false);
    const sharedSearchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

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

    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);
    
    useEffect(() => {
        if (isSharedSearching && sharedSearchInputRef.current) {
            sharedSearchInputRef.current.focus();
        }
    }, [isSharedSearching]);

    if (!team) {
        return (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No team context provided for badge management.</p>
            </div>
        );
    }

    const handleUpdateCollection = (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => {
        const newCollections = team.badgeCollections.map(collection => 
            collection.id === collectionId ? { ...collection, ...newValues } : collection
        );
        updateTeam(team.id, { badgeCollections: newCollections });
    };

    const handleAddCollection = () => {
      const newName = `New Collection ${team.badgeCollections.length + 1}`;
      if (team.badgeCollections.some(c => c.name === newName)) {
          toast({ variant: 'destructive', title: 'Error', description: 'A collection with this name already exists.' });
          return;
      }
      const owner = getOwnershipContext(page, viewAsUser, teams, appSettings.adminGroups);
      const newCollection: BadgeCollection = {
          id: crypto.randomUUID(),
          name: newName,
          owner: owner,
          icon: 'category',
          color: '#64748B',
          viewMode: 'detailed',
          badgeIds: [],
          applications: [],
          description: '',
          isShared: false,
      };
      const newCollections = [...team.badgeCollections, newCollection];
      updateTeam(team.id, { badgeCollections: newCollections });
      toast({ title: 'Collection Added', description: `"${newName}" has been created.`});
    };
    
    const handleDeleteCollection = (collectionId: string) => {
        const collection = team.badgeCollections.find(c => c.id === collectionId);
        if (!collection) return;

        const isOwned = collection.owner.type === 'team' && collection.owner.id === team.id;

        if (isOwned) {
            setCollectionToDelete(collectionId);
        } else {
            const newCollections = team.badgeCollections.filter(c => c.id !== collectionId);
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Collection Unlinked', description: `"${collection.name}" is no longer linked to your team.` });
        }
    };

    const confirmDeleteCollection = () => {
        if (!collectionToDelete) return;
        
        const collection = team.badgeCollections.find(c => c.id === collectionToDelete);
        if (!collection) return;

        const newCollections = team.badgeCollections.filter(c => c.id !== collectionToDelete);
        
        const ownedBadgeIds = new Set(team.allBadges.filter(b => b.ownerCollectionId === collectionToDelete).map(b => b.id));
        const newAllBadges = team.allBadges.filter(b => !ownedBadgeIds.has(b.id));

        updateTeam(team.id, { badgeCollections: newCollections, allBadges: newAllBadges });

        toast({ title: 'Collection Deleted', description: `"${collection.name}" and all its owned badges have been deleted.`});
        setCollectionToDelete(null);
    };

    const handleAddBadge = (collectionId: string) => {
        const badgeCount = team.allBadges.length;
        const newBadge: Badge = {
            id: crypto.randomUUID(),
            ownerCollectionId: collectionId,
            name: `New Badge ${badgeCount + 1}`,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
        };
        const newAllBadges = [...team.allBadges, newBadge];
        const newCollections = team.badgeCollections.map(c => {
            if (c.id === collectionId) {
                return { ...c, badgeIds: [...c.badgeIds, newBadge.id] };
            }
            return c;
        });
        updateTeam(team.id, { allBadges: newAllBadges, badgeCollections: newCollections });
    };
    
    const handleUpdateBadge = (badgeData: Partial<Badge>) => {
        const newAllBadges = team.allBadges.map(b => b.id === badgeData.id ? {...b, ...badgeData} : b);
        updateTeam(team.id, { allBadges: newAllBadges });
    };
    
    const allBadgesAvailableToTeam = useMemo(() => {
      const badgeMap = new Map<string, Badge>();
      teams.forEach(t => {
          (t.allBadges || []).forEach(badge => {
              if (!badgeMap.has(badge.id)) {
                  badgeMap.set(badge.id, badge);
              }
          });
      });
      (appSettings.globalBadges || []).forEach(badge => {
        if (!badgeMap.has(badge.id)) {
          badgeMap.set(badge.id, badge);
        }
      });
      return Array.from(badgeMap.values());
    }, [teams, appSettings.globalBadges]);
    
    const linkedCollectionIds = useMemo(() => new Set(team.badgeCollections.map(c => c.id)), [team.badgeCollections]);

    const sharedCollectionsFromOthers = useMemo(() => {
        const otherTeamCollections = teams
            .filter(t => t.id !== team.id)
            .flatMap(t => t.badgeCollections || []);
            
        const globalCollections = appSettings.globalBadges ? [{
            id: 'global-p-scale',
            name: 'P# Scale',
            icon: 'rule',
            color: '#94A3B8',
            owner: { type: 'admin_group', id: 'service-admin-main' },
            viewMode: 'assorted',
            applications: ['events', 'tasks'],
            description: 'Standard P-number priority system for criticality.',
            badgeIds: appSettings.globalBadges.filter(b => b.ownerCollectionId === 'global-p-scale').map(b => b.id),
            isShared: true,
        },
        {
            id: 'global-star-system',
            name: 'Star Rating',
            icon: 'stars',
            color: '#FBBF24',
            owner: { type: 'admin_group', id: 'service-admin-main' },
            viewMode: 'assorted',
            applications: ['tasks'],
            description: 'A 5-star rating system for tasks and feedback.',
            badgeIds: appSettings.globalBadges.filter(b => b.ownerCollectionId === 'global-star-system').map(b => b.id),
            isShared: true,
        },
        {
            id: 'global-effort',
            name: 'Effort',
            icon: 'scale',
            color: '#A855F7',
            owner: { type: 'admin_group', id: 'service-admin-main' },
            viewMode: 'assorted',
            applications: ['tasks'],
            description: 'T-shirt sizing for estimating task effort.',
            badgeIds: appSettings.globalBadges.filter(b => b.ownerCollectionId === 'global-effort').map(b => b.id),
            isShared: true,
        }] as BadgeCollection[] : [];

        return [...otherTeamCollections, ...globalCollections]
            .filter(c => c.isShared && !linkedCollectionIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [teams, team.id, linkedCollectionIds, sharedSearchTerm, appSettings.globalBadges]);
    
    const displayedCollections = useMemo(() => {
        const all = team?.badgeCollections || [];
        return all.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [team.badgeCollections, searchTerm]);

    const confirmPermanentDelete = useCallback((badgeId: string) => {
        const badgeToDelete = allBadgesAvailableToTeam.find(b => b.id === badgeId);
        if (!badgeToDelete) return;

        teams.forEach(t => {
            const teamHasBadge = t.allBadges.some(b => b.id === badgeId);
            const teamHasLinks = t.badgeCollections.some(c => c.badgeIds.includes(badgeId));
            
            if (teamHasBadge || teamHasLinks) {
                const newAllBadges = t.allBadges.filter(b => b.id !== badgeId);
                const newCollections = t.badgeCollections.map(c => ({
                    ...c,
                    badgeIds: c.badgeIds.filter(id => id !== badgeId),
                }));
                updateTeam(t.id, { allBadges: newAllBadges, badgeCollections: newCollections });
            }
        });

        toast({ title: 'Badge Deleted', description: `"${badgeToDelete.name}" was permanently deleted.` });
        if (badgeToDelete) setBadgeToDelete(null);
    }, [allBadgesAvailableToTeam, teams, toast, updateTeam]);

    const handleDeleteBadge = useCallback((collectionId: string, badgeId: string) => {
        const badge = allBadgesAvailableToTeam.find(b => b.id === badgeId);
        if (!badge) return;
    
        const isOriginalInstance = badge.ownerCollectionId === collectionId;
    
        let linkCount = 0;
        teams.forEach(t => {
            t.badgeCollections.forEach(c => {
                if (c.badgeIds.includes(badgeId)) {
                    linkCount++;
                }
            });
        });
    
        if (isOriginalInstance && linkCount > 1) {
            setBadgeToDelete({ collectionId, badgeId });
        } else if (!isOriginalInstance) {
            const newCollections = team.badgeCollections.map(c => {
                if (c.id === collectionId) {
                    return { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) };
                }
                return c;
            });
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Badge Unlinked' });
        } else {
            confirmPermanentDelete(badgeId);
        }
    }, [allBadgesAvailableToTeam, teams, team.badgeCollections, updateTeam, toast, confirmPermanentDelete]);
    
    const handleToggleShare = (collectionId: string) => {
        const collection = team.badgeCollections.find(c => c.id === collectionId);
        if (!collection) return;
        
        const newCollections = team.badgeCollections.map(c => 
            c.id === collectionId ? { ...c, isShared: !c.isShared } : c
        );
        updateTeam(team.id, { badgeCollections: newCollections });
        toast({ title: collection.isShared ? 'Collection Unshared' : 'Collection Shared', description: `"${collection.name}" is now ${collection.isShared ? 'private.' : 'visible to all teams.'}`});
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId, type } = result;
    
        if (!destination) return;

        // --- Dragging from ANYWHERE to the SHARED PANEL ---
        if (type === 'collection' && destination.droppableId === 'shared-collections-panel') {
            const collectionToShare = team.badgeCollections.find(c => c.id === draggableId);
            if (collectionToShare && !collectionToShare.isShared) {
                handleToggleShare(collectionToShare.id);
            }
            return;
        }

        // --- Dragging from SHARED PANEL to MAIN BOARD ---
        if (type === 'collection' && source.droppableId === 'shared-collections-panel' && destination.droppableId === 'collections-list') {
            const collectionToLink = sharedCollectionsFromOthers.find(c => c.id === draggableId);
            if (collectionToLink) {
                 const newCollections = [...team.badgeCollections, collectionToLink];
                 const badgesToAdd = allBadgesAvailableToTeam.filter(b => collectionToLink.badgeIds.includes(b.id));
                 const currentBadgeIds = new Set(team.allBadges.map(b => b.id));
                 const newBadges = badgesToAdd.filter(b => !currentBadgeIds.has(b.id));

                 updateTeam(team.id, {
                     badgeCollections: newCollections,
                     allBadges: [...team.allBadges, ...newBadges],
                 });
                 toast({ title: 'Collection Linked', description: `"${collectionToLink.name}" is now linked to your team.` });
            }
            return;
        }

        // --- DUPLICATING a collection ---
        if (type === 'collection' && destination.droppableId === 'duplicate-collection-zone') {
             const sourceCollection = [...(team.badgeCollections || []), ...sharedCollectionsFromOthers].find(c => c.id === draggableId);
             if (sourceCollection) {
                 const newId = crypto.randomUUID();
                 const newBadges = sourceCollection.badgeIds.map(bId => {
                     const originalBadge = allBadgesAvailableToTeam.find(b => b.id === bId);
                     return { 
                         ...(originalBadge || {}), 
                         id: crypto.randomUUID(), 
                         ownerCollectionId: newId 
                     };
                 });
                 
                 const newCollection: BadgeCollection = {
                     ...JSON.parse(JSON.stringify(sourceCollection)),
                     id: newId,
                     name: `${sourceCollection.name} (Copy)`,
                     owner: { type: 'team', id: team.id },
                     isShared: false,
                     badgeIds: newBadges.map(b => b.id),
                 };

                 updateTeam(team.id, { 
                     badgeCollections: [...team.badgeCollections, newCollection],
                     allBadges: [...team.allBadges, ...newBadges],
                 });
                 toast({ title: 'Collection Copied', description: 'An independent copy was created.' });
             }
             return;
        }

        const badgeId = draggableId.split('::')[0];
        const sourceCollectionId = source.droppableId;
        
        // --- DUPLICATING a badge ---
        if (destination.droppableId.startsWith('duplicate-badge-zone:')) {
            const collectionId = destination.droppableId.split(':')[1];
            const sourceBadge = allBadgesAvailableToTeam.find(b => b.id === badgeId);
  
            if (sourceBadge && collectionId) {
                const newBadge = {
                    ...JSON.parse(JSON.stringify(sourceBadge)),
                    id: crypto.randomUUID(),
                    name: `${sourceBadge.name} (Copy)`,
                    ownerCollectionId: collectionId,
                };
                
                const newAllBadges = [...team.allBadges, newBadge];
                const newCollections = team.badgeCollections.map(c => {
                    if (c.id === collectionId) {
                        return { ...c, badgeIds: [newBadge.id, ...c.badgeIds] };
                    }
                    return c;
                });
                
                updateTeam(team.id, { allBadges: newAllBadges, badgeCollections: newCollections });
                toast({ title: 'Badge Duplicated' });
            }
            return;
        }

        // --- MOVING a badge ---
        const destCollectionId = destination.droppableId;
        const allCollections = [...(team.badgeCollections || []), ...sharedCollectionsFromOthers];
        const sourceCollection = allCollections.find(c => c.id === sourceCollectionId);
        const destCollection = (team.badgeCollections || []).find(c => c.id === destCollectionId);
    
        if (!sourceCollection || !destCollection) return;
        
        // --- Reordering within the same collection ---
        if (source.droppableId === destination.droppableId) {
            const reorderedIds = Array.from(sourceCollection.badgeIds);
            const [movedId] = reorderedIds.splice(source.index, 1);
            reorderedIds.splice(destination.index, 0, movedId);
    
            const newCollections = team.badgeCollections.map(c => c.id === sourceCollection.id ? { ...c, badgeIds: reorderedIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
        } else { // --- Linking to a different collection ---
             if (destCollection.owner.type !== 'team' || destCollection.owner.id !== team.id) {
                toast({ variant: 'destructive', title: 'Cannot Add Badge', description: 'You can only add badges to collections owned by your team.' });
                return;
            }

            const newDestIds = Array.from(destCollection.badgeIds);
            const badgeIsAlreadyInDest = newDestIds.includes(badgeId);

            if (badgeIsAlreadyInDest) {
                toast({ variant: 'default', title: 'Already linked', description: 'This badge is already in the destination collection.'});
                return;
            }

            newDestIds.splice(destination.index, 0, badgeId);
            
            const newCollections = team.badgeCollections.map(c => c.id === destCollection.id ? { ...c, badgeIds: newDestIds } : c);
            
            const badgeToAdd = allBadgesAvailableToTeam.find(b => b.id === badgeId);
            if (!badgeToAdd) return;
            
            const isBadgeOwnedByTeam = team.allBadges.some(b => b.id === badgeId);

            if (isBadgeOwnedByTeam) {
                 updateTeam(team.id, { badgeCollections: newCollections });
            } else {
                updateTeam(team.id, { 
                    allBadges: [...team.allBadges, badgeToAdd],
                    badgeCollections: newCollections 
                });
            }
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
                                            <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
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
                                <div className="flex items-center gap-1">
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
                                {displayedCollections.map((collection, index) => (
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
                                                    allBadgesInTeam={allBadgesAvailableToTeam}
                                                    teamId={team.id}
                                                    teams={teams}
                                                    users={users}
                                                    appSettings={appSettings}
                                                    onUpdateCollection={handleUpdateCollection}
                                                    onDeleteCollection={handleDeleteCollection}
                                                    onAddBadge={handleAddBadge}
                                                    onUpdateBadge={handleUpdateBadge}
                                                    onDeleteBadge={handleDeleteBadge}
                                                    onToggleShare={handleToggleShare}
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
                    <StrictModeDroppable droppableId="shared-collections-panel" type="collection" isDropDisabled={false} isCombineEnabled={false}>
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                className={cn("h-full rounded-lg transition-all", snapshot.isDraggingOver && "ring-1 ring-border ring-inset")}
                            >
                                <Card className={cn("transition-opacity duration-300 h-full bg-transparent", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>Shared Collections</CardTitle>
                                            {!isSharedSearching ? (
                                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setIsSharedSearching(true)}>
                                                    <GoogleSymbol name="search" />
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                <GoogleSymbol name="search" className="text-muted-foreground" />
                                                <input
                                                    ref={sharedSearchInputRef}
                                                    placeholder="Search..."
                                                    value={sharedSearchTerm}
                                                    onChange={(e) => setSharedSearchTerm(e.target.value)}
                                                    onBlur={() => !sharedSearchTerm && setIsSharedSearching(false)}
                                                    className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                                />
                                                </div>
                                            )}
                                        </div>
                                        <CardDescription>Drag a collection to link it to your team.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-full">
                                        <div className="space-y-2">
                                            {sharedCollectionsFromOthers.map((collection, index) => {
                                                return (
                                                    <Draggable key={collection.id} draggableId={collection.id} index={index} ignoreContainerClipping={false}>
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
                                                                    allBadgesInTeam={allBadgesAvailableToTeam}
                                                                    teamId={team.id}
                                                                    teams={teams}
                                                                    users={users}
                                                                    appSettings={appSettings}
                                                                    onUpdateCollection={handleUpdateCollection}
                                                                    onDeleteCollection={handleDeleteCollection}
                                                                    onAddBadge={handleAddBadge}
                                                                    onUpdateBadge={handleUpdateBadge}
                                                                    onDeleteBadge={handleDeleteBadge}
                                                                    onToggleShare={handleToggleShare}
                                                                    isSharedPreview={true}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                            {sharedCollectionsFromOthers.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No collections are being shared by other teams.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </StrictModeDroppable>
                </div>
                <Dialog open={!!collectionToDelete} onOpenChange={(isOpen) => !isOpen && setCollectionToDelete(null)}>
                    <DialogContent className="max-w-md">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={confirmDeleteCollection}>
                                <GoogleSymbol name="delete" />
                                <span className="sr-only">Delete Collection</span>
                            </Button>
                        </div>
                        <DialogHeader>
                            <UIDialogTitle>Delete Collection?</UIDialogTitle>
                            <DialogDescription>
                                This will permanently delete the collection and all badges it owns from this team.
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
