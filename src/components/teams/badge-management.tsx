

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '@/components/ui/badge';

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
}: {
  icon: string;
  color?: string;
  onUpdateIcon: (iconName: string) => void;
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);
  
  useEffect(() => {
      if (!isPopoverOpen) {
          setIsSearching(false);
          setIconSearch('');
      }
  }, [isPopoverOpen]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  const handleBlurSearch = () => {
    if (!iconSearch) {
      setIsSearching(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-3xl"
          style={color ? { color } : {}}
        >
          <GoogleSymbol name={icon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center gap-1 p-2 border-b">
           {!isSearching ? (
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setIsSearching(true)}
              >
                <GoogleSymbol name="search" />
              </Button>
           ) : (
            <div className="flex items-center gap-1 w-full">
              <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
              <input
                ref={searchInputRef}
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                onBlur={handleBlurSearch}
                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
              />
            </div>
           )}
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.slice(0, 300).map((iconName) => (
              <Button
                key={iconName}
                variant={icon === iconName ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  onUpdateIcon(iconName);
                  setIsPopoverOpen(false);
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
  );
}


function BadgeDisplayItem({ badge, viewMode, onUpdateBadge, onDelete, collectionId, teamId }: { badge: Badge; viewMode: BadgeCollection['viewMode']; onUpdateBadge: (badgeData: Partial<Badge>) => void; onDelete: () => void; collectionId: string; teamId: string; }) {
    const { toast } = useToast();
    const { teams } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const [currentName, setCurrentName] = useState(badge.name);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    const ownerTeam = useMemo(() => {
        for (const t of teams) {
          if (t.allBadges.some(b => b.id === badge.id)) {
            const foundBadge = t.allBadges.find(b => b.id === badge.id)!;
            const collectionOwner = t.badgeCollections.find(c => c.id === foundBadge.ownerCollectionId);
            if (collectionOwner) {
                return t;
            }
          }
        }
        return teams.find(t => t.id === teamId);
    }, [teams, badge, teamId]);
    
    const isOwnedByMyTeam = ownerTeam?.id === teamId;

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

    const isSharedToOtherTeams = useMemo(() => {
        if (!isOwnedByMyTeam) return false;
        return teams.some(t => {
            if (t.id === teamId) return false;
            return t.badgeCollections.some(c => c.badgeIds.includes(badge.id));
        });
    }, [teams, badge.id, isOwnedByMyTeam, teamId]);
    
    const isThisTheOriginalInstance = badge.ownerCollectionId === collectionId;
    const isLinkedInternally = useMemo(() => {
        if (!isOwnedByMyTeam) return false;
        const currentTeam = teams.find(t => t.id === teamId);
        if (!currentTeam) return false;
        const count = currentTeam.badgeCollections.reduce((acc, c) => acc + (c.badgeIds.includes(badge.id) ? 1 : 0), 0);
        return count > 1;
    }, [teams, badge.id, teamId, isOwnedByMyTeam]);

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor = ownerTeam?.color;

    if (isSharedToOtherTeams) {
        shareIcon = 'upload';
        shareIconTitle = `Owned by this team and shared externally`;
    } else if (!isOwnedByMyTeam) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared from ${ownerTeam?.name || 'another team'}`;
    } else if (isLinkedInternally && !isThisTheOriginalInstance) {
        shareIcon = 'change_circle';
        shareIconTitle = 'Linked from another collection in this team';
    }


    if (viewMode === 'detailed') {
      return (
        <Card className="group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <CompactSearchIconPicker icon={badge.icon} color={badge.color} onUpdateIcon={(icon) => onUpdateBadge({ icon })} />
                             <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild disabled={!isOwnedByMyTeam}><div className={cn("absolute -bottom-1 -right-0 h-5 w-5 rounded-full border-2 border-card", !isOwnedByMyTeam ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: badge.color }} /></PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateBadge({ color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdateBadge({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                                </PopoverContent>
                            </Popover>
                            {shareIcon && (
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-white"
                                    title={shareIconTitle}
                                    style={{ backgroundColor: shareIconColor }}
                                >
                                    <GoogleSymbol name={shareIcon} style={{ fontSize: '14px' }}/>
                                </div>
                            )}
                        </div>
                        {isEditingName ? (
                            <Input
                                ref={nameInputRef}
                                value={currentName}
                                onMouseDown={(e) => e.stopPropagation()}
                                onChange={(e) => setCurrentName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        ) : (
                            <CardTitle onClick={() => isOwnedByMyTeam && setIsEditingName(true)} className={cn(isOwnedByMyTeam && "cursor-pointer")}>{badge.name}</CardTitle>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <GoogleSymbol name="delete" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                 {isEditingDescription ? (
                    <Textarea 
                        ref={descriptionTextareaRef} 
                        defaultValue={badge.description} 
                        onBlur={handleSaveDescription} 
                        onKeyDown={handleDescriptionKeyDown} 
                        className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" 
                        disabled={!isOwnedByMyTeam}
                    />
                 ) : (
                    <p 
                        className={cn("text-sm text-muted-foreground min-h-[20px]", isOwnedByMyTeam && "cursor-text")} 
                        onClick={() => isOwnedByMyTeam && setIsEditingDescription(true)}
                    >
                        {badge.description || (isOwnedByMyTeam ? 'Click to add description.' : 'No description.')}
                    </p>
                 )}
            </CardContent>
        </Card>
      );
    }
    
    const sharedIconAndColorEditor = (
        <div className="relative">
            <CompactSearchIconPicker icon={badge.icon} color={badge.color} onUpdateIcon={(icon) => onUpdateBadge({ icon })} />
             <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                <PopoverTrigger asChild disabled={!isOwnedByMyTeam}><div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-muted", !isOwnedByMyTeam ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: badge.color }} /></PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateBadge({ color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdateBadge({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                </PopoverContent>
            </Popover>
            {shareIcon && (
                <div
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card text-white flex items-center justify-center"
                    title={shareIconTitle}
                    style={{ backgroundColor: shareIconColor }}
                >
                    <GoogleSymbol name={shareIcon} style={{fontSize: '12px'}}/>
                </div>
            )}
        </div>
    );
    
    const inlineNameEditor = isEditingName ? (
      <Input
        ref={nameInputRef}
        value={currentName}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => setCurrentName(e.target.value)}
        onKeyDown={handleNameKeyDown}
        className={cn(
          "h-auto p-0 font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
          viewMode === 'list' && 'text-base',
          viewMode === 'assorted' && 'text-xs'
        )}
      />
    ) : (
      <span
        className={cn("font-semibold", isOwnedByMyTeam && "cursor-text", viewMode === 'assorted' && 'text-xs')}
        onClick={(e) => {
          e.stopPropagation();
          if (isOwnedByMyTeam) {
            setIsEditingName(true);
          }
        }}
      >
        {badge.name}
      </span>
    );


    if (viewMode === 'list') {
      return (
        <div className="group flex w-full items-start gap-4 p-2 rounded-md hover:bg-muted/50">
            {sharedIconAndColorEditor}
            <div className="flex-1 space-y-1">
                {inlineNameEditor}
                {isEditingDescription ? (
                    <Textarea 
                        ref={descriptionTextareaRef}
                        defaultValue={badge.description}
                        onBlur={handleSaveDescription}
                        onKeyDown={handleDescriptionKeyDown}
                        className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                        placeholder="Click to add a description."
                        disabled={!isOwnedByMyTeam}
                    />
                ) : (
                    <p className={cn("text-sm text-muted-foreground min-h-[20px]", isOwnedByMyTeam && "cursor-text")} onClick={() => isOwnedByMyTeam && setIsEditingDescription(true)}>
                        {badge.description || (isOwnedByMyTeam ? 'Click to add a description.' : 'No description.')}
                    </p>
                )}
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <GoogleSymbol name="delete" />
            </Button>
        </div>
      );
    }
    
    // Assorted View
    return (
        <div className="group relative inline-flex items-center gap-1.5 rounded-full border-2 py-1 px-2" style={{ borderColor: badge.color, color: badge.color }}>
            <div className="relative flex items-center justify-center">
                <GoogleSymbol name={badge.icon} style={{color: badge.color}} className="text-sm" />
                {shareIcon && (
                    <div
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background text-white flex items-center justify-center"
                        title={shareIconTitle}
                        style={{ backgroundColor: shareIconColor }}
                    >
                        <GoogleSymbol name={shareIcon} style={{fontSize: '10px'}}/>
                    </div>
                )}
            </div>
            {inlineNameEditor}
            <button type="button" onClick={onDelete} className="ml-1 h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete ${badge.name}`}>
                <GoogleSymbol name="close" className="text-sm" />
            </button>
        </div>
    );
}

function BadgeCollectionCard({ collection, allBadgesInTeam, allCollectionsInAllTeams, teamId, teams, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge }: {
    collection: BadgeCollection;
    allBadgesInTeam: Badge[];
    allCollectionsInAllTeams: BadgeCollection[];
    teamId: string;
    teams: Team[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collectionId: string) => void;
    onAddBadge: (collectionId: string) => void;
    onUpdateBadge: (badgeData: Partial<Badge>) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
}) {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    useEffect(() => {
        if (isEditingName && nameInputRef.current) { nameInputRef.current.focus(); nameInputRef.current.select(); }
    }, [isEditingName]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value || collection.name;
        if (newName.trim() !== collection.name) {
            onUpdateCollection(collection.id, { name: newName.trim() });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    const collectionBadges = collection.badgeIds.map(id => allBadgesInTeam.find(b => b.id === id)).filter((b): b is Badge => !!b);
    
    const APPLICATIONS: { key: BadgeApplication, icon: string, label: string }[] = [
        { key: 'users', icon: 'group', label: 'Users' },
        { key: 'events', icon: 'calendar_month', label: 'Events' },
        { key: 'tasks', icon: 'checklist', label: 'Tasks' },
        { key: 'badges', icon: 'style', label: 'Badges' },
    ];

    const handleToggleApplication = (application: BadgeApplication) => {
        const currentApplications = collection.applications || [];
        const newApplications = currentApplications.includes(application)
            ? currentApplications.filter(app => app !== application)
            : [...currentApplications, application];
        onUpdateCollection(collection.id, { applications: newApplications });
    };

    const isOwned = collection.ownerTeamId === teamId;
    const isSharedToThisTeam = !isOwned;
    const ownerTeam = teams.find(t => t.id === collection.ownerTeamId);
    
    const isSharedFromThisTeam = useMemo(() => {
        if (!isOwned) return false;
        return teams.some(t => t.id !== teamId && (t.sharedCollectionIds || []).includes(collection.id));
    }, [teams, collection.id, teamId, isOwned]);
    
    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    let shareIconColor = ownerTeam?.color;

    if (isSharedFromThisTeam) {
        shareIcon = 'upload';
        shareIconTitle = 'Owned by this team and shared externally';
    } else if (isSharedToThisTeam) {
        shareIcon = 'downloading';
        shareIconTitle = `Shared from ${ownerTeam?.name || 'another team'}`;
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <CompactSearchIconPicker 
                                icon={collection.icon} 
                                color={collection.color} 
                                onUpdateIcon={(icon) => onUpdateCollection(collection.id, { icon })}
                            />
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild disabled={isSharedToThisTeam}>
                                    <div className={cn("absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card", isSharedToThisTeam ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: collection.color }} />
                                </PopoverTrigger>
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
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-white"
                                    title={shareIconTitle}
                                    style={{ backgroundColor: shareIconColor }}
                                >
                                    <GoogleSymbol name={shareIcon} style={{ fontSize: '14px' }}/>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            {isEditingName ? (
                                <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => !isSharedToThisTeam && setIsEditingName(true)} className={cn(!isSharedToThisTeam && "cursor-pointer", "truncate")}>{collection.name}</CardTitle>
                            )}
                            {!isSharedToThisTeam && (
                                 <StrictModeDroppable droppableId={`duplicate-badge-zone:${collection.id}`} type="badge" isDropDisabled={!!isSharedToThisTeam}>
                                     {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={cn("rounded-full", snapshot.isDraggingOver && "ring-2 ring-primary")}
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onAddBadge(collection.id)}><GoogleSymbol name="add_circle" className="text-xl" /><span className="sr-only">Add Badge</span></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Badge'}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )}
                                </StrictModeDroppable>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center gap-1">
                        {!isSharedToThisTeam && APPLICATIONS.map(app => (
                            <TooltipProvider key={app.key}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-7 w-7", (collection.applications || []).includes(app.key) ? 'text-primary' : 'text-muted-foreground')}
                                            onClick={() => handleToggleApplication(app.key)}
                                        >
                                            <GoogleSymbol name={app.icon} className="text-xl" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Associate with {app.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'assorted' })}><GoogleSymbol name="view_module" className="mr-2" />Assorted View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'detailed' })}><GoogleSymbol name="view_comfy_alt" className="mr-2" />Detailed View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'list' })}><GoogleSymbol name="view_list" className="mr-2" />List View</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDeleteCollection(collection.id)} className="text-destructive focus:text-destructive">
                                    <GoogleSymbol name={isSharedToThisTeam ? 'link_off' : 'delete'} className="mr-2"/>
                                    {isSharedToThisTeam ? 'Unshare Collection' : 'Delete Collection'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                 {collection.description && <CardDescription className="pt-2">{collection.description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <StrictModeDroppable droppableId={collection.id} type="badge" isDropDisabled={isSharedToThisTeam}>
                    {(provided) => (
                         <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[60px] rounded-md border-2 border-dashed border-transparent p-2",
                                collection.viewMode === 'assorted' && "flex flex-wrap gap-2 items-start",
                                collection.viewMode === 'list' && "flex flex-col gap-1",
                                collection.viewMode === 'detailed' && "grid grid-cols-1 md:grid-cols-2 gap-4"
                            )}>
                            {collectionBadges.map((badge, index) => (
                                <Draggable key={`${badge.id}::${collection.id}`} draggableId={`${badge.id}::${collection.id}`} index={index}>
                                    {(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <BadgeDisplayItem 
                                            badge={badge} 
                                            viewMode={collection.viewMode} 
                                            onUpdateBadge={(data) => onUpdateBadge({ ...data, id: badge.id })}
                                            onDelete={() => onDeleteBadge(collection.id, badge.id)}
                                            collectionId={collection.id}
                                            teamId={teamId}
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

function ShareCollectionDialog({ isOpen, onClose, team, teams, onShareCollection }: { isOpen: boolean, onClose: () => void, team: Team, teams: Team[], onShareCollection: (collectionId: string) => void }) {
    
    const allBadgesFromAllTeams = useMemo(() => {
        return teams.flatMap(t => t.allBadges || []);
    }, [teams]);

    const groupedSharedCollections = useMemo(() => {
        const sharedTeamIds = team.sharedTeamIds || [];
        const currentSharedCollectionIds = team.sharedCollectionIds || [];

        const otherCollections = teams
            .filter(t => sharedTeamIds.includes(t.id))
            .flatMap(t => t.badgeCollections.map(c => ({
                ...c,
                teamName: t.name,
                teamIcon: t.icon,
                teamColor: t.color
            })))
            .filter(c => !currentSharedCollectionIds.includes(c.id));

        return otherCollections.reduce((acc, collection) => {
            const teamName = collection.teamName || 'Unknown Team';
            if (!acc[teamName]) {
                acc[teamName] = [];
            }
            acc[teamName].push({
                ...collection,
                badges: collection.badgeIds.map(id => allBadgesFromAllTeams.find(b => b.id === id)).filter((b): b is Badge => !!b)
            });
            return acc;
        }, {} as Record<string, (BadgeCollection & { teamName: string, teamIcon: string, teamColor: string, badges: Badge[] })[]>);
    }, [teams, team, allBadgesFromAllTeams]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <UIDialogTitle>Share a Collection</UIDialogTitle>
                    <DialogDescription>Select a collection from a shared team to make its badges available to the "{team.name}" team.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6">
                    <div className="px-6 py-2 space-y-4">
                    {Object.keys(groupedSharedCollections).length > 0 ? (
                        Object.entries(groupedSharedCollections).map(([teamName, collections]) => {
                            const sourceTeam = teams.find(t => t.name === teamName);
                            return (
                                <div key={teamName}>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        {sourceTeam && <GoogleSymbol name={sourceTeam.icon} style={{color: sourceTeam.color}} />}
                                        {teamName}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {collections.map(collection => (
                                        <Card key={collection.id} className="cursor-pointer hover:border-primary" onClick={() => onShareCollection(collection.id)}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                            <GoogleSymbol name={collection.icon} style={{color: collection.color}} />
                                            {collection.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
                                            {collection.badges.slice(0, 5).map(badge => (
                                                <UiBadge key={badge.id} variant="outline" style={{ color: badge.color, borderColor: badge.color, backgroundColor: `${badge.color}1A`}} className="gap-1 rounded-full text-xs">
                                                    <GoogleSymbol name={badge.icon} className="text-sm" />
                                                    <span className="font-normal">{badge.name}</span>
                                                </UiBadge>
                                            ))}
                                            {collection.badges.length > 5 && <UiBadge variant="outline" className="rounded-full text-xs">... and more</UiBadge>}
                                            </div>
                                        </CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="flex items-center justify-center h-48">
                            <p className="text-sm text-center text-muted-foreground">No new collections available from shared teams.</p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export function BadgeManagement({ team, tab }: { team: Team, tab: AppTab }) {
    const { teams, updateTeam, updateAppTab } = useUser();
    const { toast } = useToast();
    
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
    const [badgeToDelete, setBadgeToDelete] = useState<{ collectionId: string, badgeId: string } | null>(null);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

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
        const newCollection: BadgeCollection = {
            id: crypto.randomUUID(),
            ownerTeamId: team.id,
            name: newName,
            icon: 'category',
            color: '#64748B',
            viewMode: 'assorted',
            badgeIds: [],
            applications: [],
            description: '',
        };
        const newCollections = [...team.badgeCollections, newCollection];
        updateTeam(team.id, { badgeCollections: newCollections });
        toast({ title: 'Collection Added', description: `"${newName}" has been created.`});
    };
    
    const handleDeleteOrUnlinkCollection = (collectionId: string) => {
        const collection = displayedCollections.find(c => c.id === collectionId);
        if (!collection) return;

        if (collection.ownerTeamId !== team.id) {
            const newSharedCollectionIds = (team.sharedCollectionIds || []).filter(id => id !== collectionId);
            updateTeam(team.id, { sharedCollectionIds: newSharedCollectionIds });
            toast({ title: 'Collection Unshared' });
            return;
        }

        setCollectionToDelete(collectionId);
    };

    const confirmDeleteCollection = () => {
        if (!collectionToDelete) return;
        
        const collection = team.badgeCollections.find(c => c.id === collectionToDelete);
        if (!collection) return;

        const newCollections = team.badgeCollections.filter(c => c.id !== collectionToDelete);
        
        const ownedBadgeIds = new Set(team.allBadges.filter(b => b.ownerCollectionId === collectionToDelete).map(b => b.id));
        const newAllBadges = team.allBadges.filter(b => !ownedBadgeIds.has(b.id));

        updateTeam(team.id, { badgeCollections: newCollections, allBadges: newAllBadges });

        teams.forEach(otherTeam => {
            if (otherTeam.id !== team.id && otherTeam.sharedCollectionIds?.includes(collectionToDelete)) {
                const newSharedIds = otherTeam.sharedCollectionIds.filter(id => id !== collectionToDelete);
                updateTeam(otherTeam.id, { sharedCollectionIds: newSharedIds });
            }
        });

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
        const allBadgesFromAllTeams = teams.flatMap(t => t.allBadges);
        const badgeMap = new Map<string, Badge>();
        
        team.allBadges.forEach(b => badgeMap.set(b.id, b));
        
        const sharedCollectionIds = new Set(team.sharedCollectionIds || []);
        teams.forEach(t => {
            if (t.id !== team.id) {
                t.badgeCollections.forEach(c => {
                    if (sharedCollectionIds.has(c.id)) {
                        c.badgeIds.forEach(badgeId => {
                            if (!badgeMap.has(badgeId)) {
                                const badge = allBadgesFromAllTeams.find(b => b.id === badgeId);
                                if (badge) badgeMap.set(badge.id, badge);
                            }
                        })
                    }
                })
            }
        });

        return Array.from(badgeMap.values());
    }, [team.allBadges, team.sharedCollectionIds, teams]);

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
    
    
    const handleDuplicateCollection = (sourceCollectionId: string) => {
        let sourceCollection;
        for (const t of teams) {
            const found = t.badgeCollections.find(c => c.id === sourceCollectionId);
            if (found) {
                sourceCollection = found;
                break;
            }
        }
        if (!sourceCollection) return;
    
        const newCollectionId = crypto.randomUUID();
        
        const newBadges: Badge[] = [];
        const sourceTeam = teams.find(t => t.id === sourceCollection.ownerTeamId)!;
        const sourceBadges = sourceTeam.allBadges.filter(b => sourceCollection.badgeIds.includes(b.id));

        const newBadgeIds = sourceBadges.map(badge => {
            const newBadgeId = crypto.randomUUID();
            newBadges.push({
                ...badge,
                id: newBadgeId,
                ownerCollectionId: newCollectionId,
            });
            return newBadgeId;
        });
    
        const newCollection: BadgeCollection = {
            ...sourceCollection,
            id: newCollectionId,
            ownerTeamId: team.id,
            name: `${sourceCollection.name} (Copy)`,
            badgeIds: newBadgeIds,
        };
        
        const updatedCollections = [...team.badgeCollections, newCollection];
        const updatedAllBadges = [...team.allBadges, ...newBadges];
        
        updateTeam(team.id, {
            badgeCollections: updatedCollections,
            allBadges: updatedAllBadges,
        });
    
        toast({
            title: 'Collection Duplicated',
            description: `"${newCollection.name}" has been created.`,
        });
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId, type } = result;
    
        if (!destination) return;
    
        if (destination.droppableId.startsWith('duplicate-collection-zone')) {
            if (type === 'collection') {
                handleDuplicateCollection(draggableId);
            }
            return;
        }

        const badgeId = draggableId.split('::')[0];

        if (destination.droppableId.startsWith('duplicate-badge-zone:')) {
            const collectionId = destination.droppableId.split(':')[1];
            const allBadgesFromAllTeams = teams.flatMap(t => t.allBadges);
            const sourceBadge = allBadgesFromAllTeams.find(b => b.id === badgeId);
  
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

        if (type === 'collection') {
            return;
        }
    
        const sourceCollection = displayedCollections.find(c => c.id === source.droppableId);
        const destCollection = displayedCollections.find(c => c.id === destination.droppableId);
    
        if (!sourceCollection || !destCollection) return;
        
        if (destCollection.ownerTeamId !== team.id) {
            return;
        }
    
        if (source.droppableId === destination.droppableId) {
            const reorderedIds = Array.from(sourceCollection.badgeIds);
            const [movedId] = reorderedIds.splice(source.index, 1);
            reorderedIds.splice(destination.index, 0, movedId);
    
            const newCollections = team.badgeCollections.map(c => c.id === sourceCollection.id ? { ...c, badgeIds: reorderedIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
        } else {
            const newDestIds = Array.from(destCollection.badgeIds);
            const badgeIsAlreadyInDest = newDestIds.includes(badgeId);

            if (badgeIsAlreadyInDest) {
                toast({ variant: 'default', title: 'Already shared', description: 'This badge is already in the destination collection.'});
                return;
            }

            newDestIds.splice(destination.index, 0, badgeId);
            
            const newCollections = team.badgeCollections.map(c => c.id === destCollection.id ? { ...c, badgeIds: newDestIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Badge Shared', description: 'A link to the badge has been added to the new collection.' });
        }
    };

    const handleShareCollection = (collectionId: string) => {
        const newSharedIds = [...(team.sharedCollectionIds || []), collectionId];
        updateTeam(team.id, { sharedCollectionIds: newSharedIds });
        toast({ title: 'Collection Shared' });
        setIsShareDialogOpen(false);
    }
    
    const sharedCollections = useMemo(() => {
        const sharedIds = new Set(team.sharedCollectionIds || []);
        if (sharedIds.size === 0) return [];
        const allCollectionsFromAllTeams = teams.flatMap(t => t.badgeCollections);
        return allCollectionsFromAllTeams.filter(c => sharedIds.has(c.id));
    }, [teams, team.sharedCollectionIds]);

    const displayedCollections = useMemo(() => {
        const allVisibleCollections = [...team.badgeCollections, ...sharedCollections];
        return allVisibleCollections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [team.badgeCollections, sharedCollections, searchTerm]);
    
    const allCollectionsFromAllTeams = useMemo(() => {
        return teams.flatMap(t => t.badgeCollections || []);
    }, [teams]);


    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                        <Input
                            ref={titleInputRef}
                            defaultValue={tab.name}
                            onBlur={handleSaveTitle}
                            onKeyDown={handleTitleKeyDown}
                            className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    ) : (
                        <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>
                            {tab.name}
                        </h2>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <StrictModeDroppable droppableId="duplicate-collection-zone" type="collection">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "rounded-full transition-all p-1",
                                        snapshot.isDraggingOver && "ring-2 ring-primary ring-offset-2 bg-accent"
                                    )}
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleAddCollection}>
                                                    <GoogleSymbol name="add_circle" className="text-xl" />
                                                    <span className="sr-only">New Collection or Drop to Duplicate</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Collection'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </StrictModeDroppable>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setIsShareDialogOpen(true)}>
                                        <GoogleSymbol name="change_circle" className="text-xl" />
                                        <span className="sr-only">Share Collection</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Share Collection from another team</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)} className={cn(isSearching && "hidden")}>
                            <GoogleSymbol name="search" />
                        </Button>
                        <div className={cn("flex items-center gap-1", !isSearching && "hidden")}>
                            <GoogleSymbol name="search" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search collections..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onBlur={() => { if (!searchTerm) setIsSearching(false); }}
                                className="w-56 h-8 border-0 border-b rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>
                </div>
                <StrictModeDroppable droppableId="collections-list" type="collection">
                    {(provided) => (
                        <div className="flex flex-col gap-6" ref={provided.innerRef} {...provided.droppableProps}>
                        {displayedCollections.map((collection, index) => (
                            <Draggable key={collection.id} draggableId={collection.id} index={index}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={cn(snapshot.isDragging && "shadow-xl")}
                                    >
                                        <BadgeCollectionCard
                                            key={collection.id}
                                            collection={collection}
                                            allBadgesInTeam={allBadgesAvailableToTeam}
                                            allCollectionsInAllTeams={allCollectionsFromAllTeams}
                                            teamId={team.id}
                                            teams={teams}
                                            onUpdateCollection={handleUpdateCollection}
                                            onDeleteCollection={handleDeleteOrUnlinkCollection}
                                            onAddBadge={handleAddBadge}
                                            onUpdateBadge={handleUpdateBadge}
                                            onDeleteBadge={handleDeleteBadge}
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
            <AlertDialog open={!!collectionToDelete} onOpenChange={(isOpen) => !isOpen && setCollectionToDelete(null)}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the collection and all badges it owns.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDeleteCollection}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!badgeToDelete} onOpenChange={(isOpen) => !isOpen && setBadgeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shared Badge?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This badge is shared. Deleting it will remove it from all collections and teams. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => { if (badgeToDelete) confirmPermanentDelete(badgeToDelete.badgeId); }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ShareCollectionDialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                team={team}
                teams={teams}
                onShareCollection={handleShareCollection}
            />
        </DragDropContext>
    );
}

    
