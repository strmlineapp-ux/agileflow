

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDescriptionUI, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogTitle as UIDialogTitle, DialogContent as DialogContentUI, DialogDescription as UIDialogDescription, DialogHeader as UIDialogHeader } from '@/components/ui/dialog';
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

function BadgeDisplayItem({ badge, viewMode, isOwned, onUpdateBadge, onDelete }: { badge: Badge; viewMode: BadgeCollection['viewMode']; isOwned: boolean; onUpdateBadge: (badgeData: Partial<Badge>) => void; onDelete: () => void; }) {
    const { toast } = useToast();
    const { teams } = useUser();
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.focus();
            descriptionTextareaRef.current.select();
        }
    }, [isEditingDescription]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value.trim();
        if (newName === '') {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
        } else if (newName && newName !== badge.name) {
            onUpdateBadge({ name: newName });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') {
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

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName => iconName.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);
    
    const isBadgeShared = useMemo(() => {
        for (const t of teams) {
            for (const c of t.badgeCollections) {
                // If this collection is NOT the badge's owner collection, but contains the badge, it's shared.
                if (c.id !== badge.ownerCollectionId && c.badgeIds.includes(badge.id)) {
                    return true;
                }
            }
        }
        return false;
    }, [teams, badge.id, badge.ownerCollectionId]);

    const showUploadIcon = isOwned && isBadgeShared;
    const showDownloadIcon = !isOwned;
    const shareStatusIcon = showUploadIcon ? 'upload' : 'downloading';
    
    if (viewMode === 'detailed') {
      return (
        <Card className="group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl" style={{ color: badge.color }}>
                                        <GoogleSymbol name={badge.icon} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                    <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateBadge({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                             <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild><div className="absolute -bottom-1 -right-0 h-5 w-5 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: badge.color }} /></PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateBadge({ color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdateBadge({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                                </PopoverContent>
                            </Popover>
                            {(showUploadIcon || showDownloadIcon) && (
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center bg-muted text-muted-foreground"
                                    title={isOwned ? "Owned Badge" : "Shared Badge"}
                                >
                                    <GoogleSymbol name={shareStatusIcon} style={{ fontSize: '14px' }}/>
                                </div>
                            )}
                        </div>
                        {isEditingName ? (
                            <Input ref={nameInputRef} defaultValue={badge.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                        ) : (
                            <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{badge.name}</CardTitle>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <GoogleSymbol name="delete" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                 {isEditingDescription ? (
                    <Textarea ref={descriptionTextareaRef} defaultValue={badge.description} onBlur={handleSaveDescription} onKeyDown={handleDescriptionKeyDown} />
                 ) : (
                    <p className="text-sm text-muted-foreground cursor-text min-h-[20px]" onClick={() => setIsEditingDescription(true)}>
                        {badge.description || 'Click to add description.'}
                    </p>
                 )}
            </CardContent>
        </Card>
      );
    }
    
    const sharedIconAndColorEditor = (
        <div className="relative">
            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-2xl" style={{ color: badge.color }}>
                        <GoogleSymbol name={badge.icon} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                    <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateBadge({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                </PopoverContent>
            </Popover>
             <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                <PopoverTrigger asChild><div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-muted cursor-pointer" style={{ backgroundColor: badge.color }} /></PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateBadge({ color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdateBadge({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                </PopoverContent>
            </Popover>
            {(showUploadIcon || showDownloadIcon) && (
                <div
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center"
                    title={isOwned ? "Owned Badge" : "Shared Badge"}
                >
                    <GoogleSymbol name={shareStatusIcon} style={{fontSize: '12px'}}/>
                </div>
            )}
        </div>
    );
    
    const inlineNameEditor = isEditingName ? (
        <Input 
            ref={nameInputRef}
            defaultValue={badge.name}
            onBlur={handleSaveName}
            onKeyDown={handleNameKeyDown}
            className={cn(
                "h-auto p-0 font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                viewMode === 'list' && 'text-base',
                viewMode === 'assorted' && 'text-sm'
            )}
        />
    ) : (
        <span className={cn("font-semibold cursor-text", viewMode === 'assorted' && 'text-sm')} onClick={() => setIsEditingName(true)}>{badge.name}</span>
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
                        className="text-sm"
                        placeholder="Click to add a description."
                    />
                ) : (
                    <p className="text-sm text-muted-foreground cursor-text min-h-[20px]" onClick={() => setIsEditingDescription(true)}>
                        {badge.description || 'Click to add a description.'}
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
        <div className="group relative inline-flex items-center gap-2 rounded-full border-2 p-1 pr-2" style={{ borderColor: badge.color, color: badge.color }}>
            <div className="relative">
                 <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-base" style={{ color: 'inherit' }}>
                           <GoogleSymbol name={badge.icon} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                        <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                        <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateBadge({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                    </PopoverContent>
                </Popover>
                 <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <PopoverTrigger asChild><div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-background cursor-pointer" style={{ backgroundColor: badge.color }} /></PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateBadge({ color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdateBadge({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                    </PopoverContent>
                </Popover>
                {(showUploadIcon || showDownloadIcon) && (
                    <div
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-muted text-muted-foreground flex items-center justify-center"
                        title={isOwned ? "Owned Badge" : "Shared Badge"}
                    >
                        <GoogleSymbol name={shareStatusIcon} style={{fontSize: '10px'}}/>
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
    
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName => iconName.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

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
    const isSharedFromThisTeam = isOwned && teams.some(t => t.id !== teamId && (t.sharedCollectionIds || []).includes(collection.id));

    const showUploadIcon = isSharedFromThisTeam;
    const showDownloadIcon = isSharedToThisTeam;
    const shareStatusIcon = showUploadIcon ? 'upload' : 'downloading';
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild disabled={isSharedToThisTeam}>
                                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 text-2xl", isSharedToThisTeam && "cursor-not-allowed")} style={{ color: collection.color }}>
                                        <GoogleSymbol name={collection.icon} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                    <div className="p-2 border-b">
                                        <Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} />
                                    </div>
                                    <ScrollArea className="h-64">
                                        <div className="grid grid-cols-6 gap-1 p-2">
                                            {filteredIcons.slice(0, 300).map((iconName) => (
                                                <Button key={iconName} variant={collection.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateCollection(collection.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl">
                                                    <GoogleSymbol name={iconName} />
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
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
                            {(showUploadIcon || showDownloadIcon) && (
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center bg-muted text-muted-foreground"
                                    title={isOwned ? "Owned Collection" : "Shared Collection"}
                                >
                                    <GoogleSymbol name={shareStatusIcon} style={{ fontSize: '14px' }}/>
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
                                 <StrictModeDroppable droppableId={`duplicate-badge-zone:${collection.id}`} type="badge">
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
                <StrictModeDroppable droppableId={collection.id} type="badge">
                    {(provided) => (
                         <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[60px] rounded-md border-2 border-dashed border-transparent p-2",
                                collection.viewMode === 'assorted' && "flex flex-wrap gap-2",
                                collection.viewMode === 'list' && "flex flex-col gap-1",
                                collection.viewMode === 'detailed' && "grid grid-cols-1 md:grid-cols-2 gap-4"
                            )}>
                            {collectionBadges.map((badge, index) => {
                                 const allCollectionsFromAllTeams = teams.flatMap(t => t.badgeCollections);
                                 const ownerCollection = allCollectionsFromAllTeams.find(c => c.id === badge.ownerCollectionId);
                                 const isOwnedByThisTeam = ownerCollection?.ownerTeamId === teamId;

                                return (
                                <Draggable key={badge.id} draggableId={badge.id} index={index}>
                                    {(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <BadgeDisplayItem 
                                            badge={badge} 
                                            viewMode={collection.viewMode} 
                                            isOwned={isOwnedByThisTeam}
                                            onUpdateBadge={(data) => onUpdateBadge({ ...data, id: badge.id })}
                                            onDelete={() => onDeleteBadge(collection.id, badge.id)}
                                        />
                                    </div>)}
                                </Draggable>
                                );
                            })}
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
            <DialogContentUI className="max-w-3xl">
                <UIDialogHeader>
                    <UIDialogTitle>Share a Collection</UIDialogTitle>
                    <UIDialogDescription>Select a collection from a shared team to make its badges available to the "{team.name}" team.</UIDialogDescription>
                </UIDialogHeader>
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
                                                <TooltipProvider key={badge.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="p-1">
                                                                <GoogleSymbol name={badge.icon} style={{ color: badge.color }} className="text-xl" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{badge.name}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
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
            </DialogContentUI>
        </Dialog>
    );
}

export function BadgeManagement({ team }: { team: Team }) {
    const { teams, updateTeam } = useUser();
    const { toast } = useToast();
    
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

        // This handles unlinking
        if (collection.ownerTeamId !== team.id) {
            const newSharedCollectionIds = (team.sharedCollectionIds || []).filter(id => id !== collectionId);
            updateTeam(team.id, { sharedCollectionIds: newSharedCollectionIds });
            toast({ title: 'Collection Unshared' });
            return;
        }

        // This handles opening the confirmation dialog for permanent deletion
        setCollectionToDelete(collectionId);
    };

    const confirmDeleteCollection = () => {
        if (!collectionToDelete) return;
        
        const collection = team.badgeCollections.find(c => c.id === collectionToDelete);
        if (!collection) return;

        // 1. Remove the collection itself from the owner team
        const newCollections = team.badgeCollections.filter(c => c.id !== collectionToDelete);
        
        // 2. Find and remove all badges owned by this collection
        const ownedBadgeIds = new Set(team.allBadges.filter(b => b.ownerCollectionId === collectionToDelete).map(b => b.id));
        const newAllBadges = team.allBadges.filter(b => !ownedBadgeIds.has(b.id));

        updateTeam(team.id, { badgeCollections: newCollections, allBadges: newAllBadges });

        // 3. Remove links from all other teams
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

    const handleDeleteBadge = (collectionId: string, badgeId: string) => {
        const badge = team.allBadges.find(b => b.id === badgeId);
        if (!badge) return;

        // If the badge is owned by the current collection, it's a full delete
        if (badge.ownerCollectionId === collectionId) {
            // Remove from allBadges
            const newAllBadges = team.allBadges.filter(b => b.id !== badgeId);
            
            // Remove from all collections in the current team that might be linking it
            const newCollections = team.badgeCollections.map(c => ({
                ...c,
                badgeIds: c.badgeIds.filter(id => id !== badgeId)
            }));
            
            updateTeam(team.id, { allBadges: newAllBadges, badgeCollections: newCollections });
            toast({ title: 'Badge Deleted', description: `"${badge.name}" was permanently deleted.` });
        } else { // If not owned, it's just an unlink
            const newCollections = team.badgeCollections.map(c => {
                if (c.id === collectionId) {
                    return { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) };
                }
                return c;
            });
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Badge Unlinked', description: `"${badge.name}" was unlinked from this collection.` });
        }
    };
    
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

        if (destination.droppableId.startsWith('duplicate-badge-zone:')) {
            const collectionId = destination.droppableId.split(':')[1];
            const allBadgesFromAllTeams = teams.flatMap(t => t.allBadges);
            const sourceBadge = allBadgesFromAllTeams.find(b => b.id === draggableId);
  
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
                        return { ...c, badgeIds: [...c.badgeIds, newBadge.id] };
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
    
        if (source.droppableId === destination.droppableId) {
            const reorderedIds = Array.from(sourceCollection.badgeIds);
            const [movedId] = reorderedIds.splice(source.index, 1);
            reorderedIds.splice(destination.index, 0, movedId);
    
            const newCollections = team.badgeCollections.map(c => c.id === sourceCollection.id ? { ...c, badgeIds: reorderedIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
        } else {
            if (destCollection.badgeIds.includes(draggableId)) {
                toast({ variant: 'default', title: 'Already shared', description: 'This badge is already in the destination collection.'});
                return;
            }
            const newDestIds = Array.from(destCollection.badgeIds);
            newDestIds.splice(destination.index, 0, draggableId);
            
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

    const allBadgesAvailableToTeam = useMemo(() => {
        const allBadgesFromAllTeams = teams.flatMap(t => t.allBadges);
        const ownedBadgeIds = new Set(team.allBadges.map(b => b.id));
        const sharedBadges = allBadgesFromAllTeams.filter(b => !ownedBadgeIds.has(b.id));
        return [...team.allBadges, ...sharedBadges];
    }, [team.allBadges, teams]);


    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight">Badge Collections</h2>
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
                                {(provided) => (
                                    <div 
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
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
                        <AlertDialogDescriptionUI>
                        This action cannot be undone. This will permanently delete the collection and all badges it owns.
                        </AlertDialogDescriptionUI>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
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
