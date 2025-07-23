
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppPage } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '../ui/badge';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { googleSymbolNames } from '@/lib/google-symbols';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  DragOverlay,
  type DragStartEvent,
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

function BadgeDisplayItem({ 
    badge, 
    viewMode, 
    onUpdateBadge, 
    onDelete,
    isViewer = false, 
    predefinedColors,
    isOwner,
    isLinked,
    allCollections,
    isEditingName,
    setIsEditingName,
    isEditingDescription,
    setIsEditingDescription,
    isCollectionEditing,
    dragHandleProps,
}: { 
    badge: Badge;
    viewMode: BadgeCollection['viewMode'];
    onUpdateBadge: (badgeId: string, badgeData: Partial<Badge>) => void;
    onDelete: (badgeId: string) => void;
    isViewer?: boolean;
    predefinedColors: string[];
    isOwner: boolean;
    isLinked: boolean;
    allCollections: BadgeCollection[];
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
    isEditingDescription: boolean;
    setIsEditingDescription: (isEditing: boolean) => void;
    isCollectionEditing: boolean;
    dragHandleProps?: any;
}) {
    const { users } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [color, setColor] = useState(badge.color);

    const handleUpdate = useCallback((data: Partial<Badge>) => {
        onUpdateBadge(badge.id, data);
    }, [badge.id, onUpdateBadge]);

    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim() || '';
        if (newName && newName !== badge.name) {
            handleUpdate({ name: newName });
        }
        setIsEditingName(false);
    }, [badge.name, handleUpdate, setIsEditingName]);
    
    const handleSaveDescription = useCallback(() => {
        const newDescription = descriptionTextareaRef.current?.value.trim();
        if (newDescription !== (badge.description || '')) {
            handleUpdate({ description: newDescription });
        }
        setIsEditingDescription(false);
    }, [badge.description, handleUpdate, setIsEditingDescription]);

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
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isEditingName, handleSaveName]);
    
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
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isEditingDescription, handleSaveDescription]);

    useEffect(() => {
        if (isIconPopoverOpen) {
          setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
          setIconSearch('');
        }
    }, [isIconPopoverOpen]);
    
    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
        else if (e.key === 'Escape') { e.preventDefault(); setIsEditingName(false); }
    };
    
    const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); handleSaveDescription(); }
    };
    
    const ownerUser = users.find(u => u.userId === badge.owner.id);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);
    
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
                                handleUpdate({ color: c });
                                setColor(c);
                                setIsColorPopoverOpen(false);
                            }}
                        />
                    ))}
                </div>
                <Button onClick={() => { handleUpdate({ color }); setIsColorPopoverOpen(false); }} className="w-full">Set Color</Button>
            </div>
        </PopoverContent>
    );

    const iconPickerContent = (
         <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 p-2 border-b">
                <CompactSearchInput
                    searchTerm={iconSearch}
                    setSearchTerm={setIconSearch}
                    placeholder="Search icons..."
                    inputRef={iconSearchInputRef}
                    autoFocus={true}
                />
            </div>
            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{googleSymbolNames.slice(0, 300).map((iconName) => (
            <TooltipProvider key={iconName}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={badge.icon === iconName ? "default" : "ghost"}
                    size="icon"
                    onClick={() => {
                        handleUpdate({ icon: iconName });
                        setIsIconPopoverOpen(false);
                    }}
                    className="h-8 w-8 p-0"
                    >
                    <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{iconName}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            ))}</div></ScrollArea>
        </PopoverContent>
    );
        
    const nameEditorElement = (
         <div onClick={(e) => { if(isOwner) {e.stopPropagation(); setIsEditingName(true);}}}>
            {isEditingName && isOwner ? (
                <Input
                    ref={nameInputRef}
                    defaultValue={badge.name}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleSaveName}
                    className={cn(
                        "h-auto p-0 border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words",
                         viewMode === 'detailed' ? "text-base font-normal font-headline font-thin" : "text-sm font-thin"
                    )}
                />
            ) : (
                <span className={cn("break-words", viewMode === 'detailed' ? "text-base font-normal font-headline font-thin" : "font-thin text-sm", isOwner && "cursor-pointer")}>
                    {badge.name}
                </span>
            )}
        </div>
    );

     const descriptionEditorElement = (
         <div onClick={(e) => { if(isOwner) {e.stopPropagation(); setIsEditingDescription(true);}}}>
            {isEditingDescription && isOwner ? (
                <Textarea 
                    ref={descriptionTextareaRef} 
                    defaultValue={badge.description} 
                    onBlur={handleSaveDescription}
                    onKeyDown={handleDescriptionKeyDown} 
                    className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" 
                    placeholder="Click to add a description." 
                />
             ) : (
                 <p className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isOwner && "cursor-text")}>
                    {badge.description || (isLinked ? <span className="italic text-muted-foreground/50">No description</span> : isOwner ? 'Click to add description.' : '')}
                </p>
             )}
       </div>
   );
    
    if (viewMode === 'detailed' || viewMode === 'list') {
      return (
        <div className="flex items-start gap-4 p-2" {...dragHandleProps}>
            <div className="relative">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-10 w-12 flex items-center justify-center p-0">
                                <GoogleSymbol name={badge.icon} weight={100} grade={-25} opticalSize={20} style={{ fontSize: '36px', color: badge.color }} />
                            </Button>
                        </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Change Icon</p></TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                    {iconPickerContent}
                </Popover>
                {!isViewer && (
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}><button className={cn("absolute -bottom-1 -right-3 h-4 w-4 rounded-full border-0", isOwner && "cursor-pointer")} style={{ backgroundColor: badge.color }} aria-label="Change badge color" /></PopoverTrigger></TooltipTrigger><TooltipContent><p>Change Color</p></TooltipContent></Tooltip></TooltipProvider>
                        {colorPickerContent}
                    </Popover>
                )}
                 {isLinked && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: ownerUser?.primaryColor || '#64748B' }}>
                                    <GoogleSymbol name="link" style={{fontSize: '16px'}}/>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Owned by {ownerUser?.displayName}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <div className="flex-1 space-y-1">
                {nameEditorElement}
                {descriptionEditorElement}
            </div>
        </div>
      );
    }
    
    // Compact View
    return (
        <div className="p-1.5" {...dragHandleProps}>
             <UiBadge
                variant={'outline'}
                style={{ color: badge.color, borderColor: badge.color }}
                className="flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8 font-thin"
            >
                <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                             <Button
                                variant="ghost"
                                className="h-auto p-0 hover:bg-transparent"
                                style={{ color: badge.color }}
                            >
                                <GoogleSymbol name={badge.icon} style={{ fontSize: '28px' }} weight={100} />
                            </Button>
                        </PopoverTrigger>
                        {iconPickerContent}
                    </Popover>
                     {!isViewer && (
                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                                <button
                                    className={cn("absolute -bottom-1 -right-3 h-4 w-4 rounded-full border-0", isOwner && "cursor-pointer")}
                                    style={{ backgroundColor: badge.color }}
                                    aria-label="Change badge color"
                                />
                            </PopoverTrigger>
                            {colorPickerContent}
                        </Popover>
                     )}
                     {isLinked && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: ownerUser?.primaryColor || '#64748B' }}>
                                        <GoogleSymbol name="link" style={{fontSize: '16px'}}/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>Owned by {ownerUser?.displayName}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                {nameEditorElement}
            </UiBadge>
        </div>
    );
}

function SortableBadgeItem({ badge, collection, onDelete, ...props }: { badge: Badge, collection: BadgeCollection, onDelete: (badgeId: string, collectionId: string) => void, [key: string]: any }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `badge::${badge.id}::${collection.id}`,
        data: { type: 'badge', badge, collectionId: collection.id, isSharedPreview: props.isSharedPreview },
        disabled: isEditingName || isEditingDescription || props.isCollectionEditing,
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    
    const canManage = !props.isViewer;

    return (
        <div ref={setNodeRef} style={style} className={cn(props.viewMode === 'detailed' && "p-1 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0")}>
            <div className="group relative flex w-full">
                <div className="flex-grow">
                    <BadgeDisplayItem 
                        badge={badge} 
                        isEditingName={isEditingName} 
                        setIsEditingName={setIsEditingName}
                        isEditingDescription={isEditingDescription}
                        setIsEditingDescription={setIsEditingDescription}
                        onDelete={onDelete}
                        dragHandleProps={{...attributes, ...listeners}}
                        {...props} 
                    />
                </div>
                {!props.isSharedPreview && canManage && (
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent"
                                        onPointerDown={(e) => { e.stopPropagation(); onDelete(badge.id, collection.id); }}
                                    >
                                        <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{props.isOwner ? "Delete Badge" : "Unlink Badge"}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
        </div>
    );
}

function DroppableCollectionContent({ collection, children }: { collection: BadgeCollection, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: collection.id, data: { type: 'collection', collection }});
    
    let strategy;
    switch(collection.viewMode) {
      case 'list':
        strategy = verticalListSortingStrategy;
        break;
      case 'detailed':
      case 'compact':
        strategy = rectSortingStrategy;
        break;
      default:
        strategy = rectSortingStrategy;
        break;
    }
    
    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "min-h-[60px] rounded-md p-2 transition-all",
                isOver && "ring-1 ring-border ring-inset",
                collection.viewMode === 'compact' && "flex flex-wrap gap-2 items-start",
                collection.viewMode === 'list' && "flex flex-col gap-1",
                collection.viewMode === 'detailed' && "flex flex-wrap -m-1"
            )}
        >
            <SortableContext items={collection.badgeIds.map(id => `badge::${id}::${collection.id}`)} strategy={strategy}>
                {children}
            </SortableContext>
        </div>
    );
}

type BadgeCollectionCardProps = {
    collection: BadgeCollection;
    allBadges: Badge[];
    predefinedColors: string[];
    onUpdateCollection: (collectionId: string, newValues: Partial<BadgeCollection>) => void;
    onDeleteCollection: (collection: BadgeCollection) => void;
    onAddBadge: (collectionId: string, sourceBadge?: Badge) => void;
    onUpdateBadge: (badgeId: string, badgeData: Partial<Badge>) => void;
    onDeleteBadge: (badgeId: string, collectionId: string) => void;
    isSharedPreview?: boolean;
    contextTeam?: Team;
    isViewer?: boolean;
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
    isEditingDescription: boolean;
    setIsEditingDescription: (isEditing: boolean) => void;
    isCollapsed?: boolean;
};

function BadgeCollectionCard({ 
    collection, 
    allBadges, 
    predefinedColors, 
    onUpdateCollection, 
    onDeleteCollection, 
    onAddBadge, 
    onUpdateBadge, 
    onDeleteBadge, 
    isSharedPreview = false, 
    contextTeam, 
    isViewer = false, 
    isEditingName,
    setIsEditingName,
    isEditingDescription,
    setIsEditingDescription,
    isCollapsed = false,
    ...props
}: BadgeCollectionCardProps) {
    const { viewAsUser, users, updateTeam, allBadgeCollections } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isViewModePopoverOpen, setIsViewModePopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    const [color, setColor] = useState(collection.color);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const isOwner = useMemo(() => collection.owner.id === viewAsUser.userId, [collection.owner.id, viewAsUser.userId]);
    const showDetails = isCollapsed ? false : isExpanded;

    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim() || '';
        if (newName && newName !== collection.name) {
            onUpdateCollection(collection.id, { name: newName });
        }
        setIsEditingName(false);
    }, [collection.name, collection.id, onUpdateCollection, setIsEditingName]);

    const handleSaveDescription = useCallback(() => {
        const newDescription = descriptionTextareaRef.current?.value.trim();
        if (newDescription !== (collection.description || '')) {
            onUpdateCollection(collection.id, { description: newDescription });
        }
        setIsEditingDescription(false);
    }, [collection, onUpdateCollection, setIsEditingDescription]);
    
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
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isEditingName, handleSaveName]);

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
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isEditingDescription, handleSaveDescription]);

    useEffect(() => {
        if (isIconPopoverOpen) {
          setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
          setIconSearch('');
        }
      }, [isIconPopoverOpen]);
    
    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
        else if (e.key === 'Escape') { e.preventDefault(); setIsEditingName(false); }
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveDescription(); }
        else if (e.key === 'Escape') { e.preventDefault(); setIsEditingDescription(false); }
    };
    
    const collectionBadges = useMemo(() => {
        return collection.badgeIds
            .map(id => allBadges.find(b => b?.id === id))
            .filter((b): b is Badge => !!b);
    }, [collection.badgeIds, allBadges]);
    
    const APPLICATIONS: { key: BadgeApplication, icon: string, label: string }[] = [
        { key: 'team members', icon: 'group', label: 'Team Members' },
        { key: 'events', icon: 'calendar_month', label: 'Events' },
        { key: 'tasks', icon: 'checklist', label: 'Tasks' },
        { key: 'badges', icon: 'style', label: 'Badges' },
    ];

    const ownerUser = useMemo(() => {
        return users.find(u => u.userId === collection.owner.id);
    }, [collection.owner.id, users]);
    
    const ownerName = ownerUser?.displayName || 'System';
    const ownerColor = ownerUser?.primaryColor || '#64748B';

    let shareIcon: string | null = null;
    let shareIconTitle: string = '';
    
    if (isOwner && collection.isShared) {
        shareIcon = 'change_circle';
        shareIconTitle = `Owned & Shared by You`;
    } else if (!isOwner && !isSharedPreview) { // Is a linked collection on main board
        shareIcon = 'link';
        shareIconTitle = `Owned by ${ownerName}`;
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
        { mode: 'compact', icon: 'view_module', label: 'Compact View' },
        { mode: 'detailed', icon: 'view_comfy_alt', label: 'Detailed View' },
        { mode: 'list', icon: 'view_list', label: 'List View' }
    ];

    return (
        <Card className="h-full flex flex-col bg-transparent relative" {...props}>
            <div {...props.dragHandleProps}>
                <CardHeader className="group">
                     {!isSharedPreview && !isCollapsed && (
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onPointerDown={(e) => { e.stopPropagation(); onDeleteCollection(collection); }}
                                >
                                    <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{isOwner ? "Delete Collection" : "Unlink Collection"}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative">
                                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                    <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" className="h-10 w-12 flex items-center justify-center p-0">
                                            <GoogleSymbol name={collection.icon} weight={100} grade={-25} opticalSize={20} style={{ fontSize: '36px' }} />
                                            </Button>
                                        </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Icon</p></TooltipContent>
                                    </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 p-2 border-b">
                                        <CompactSearchInput
                                        searchTerm={iconSearch}
                                        setSearchTerm={setIconSearch}
                                        placeholder="Search icons..."
                                        inputRef={iconSearchInputRef}
                                        autoFocus={true}
                                        />
                                    </div>
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                            <TooltipProvider key={iconName}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                <Button
                                                    variant={collection.icon === iconName ? "default" : "ghost"}
                                                    size="icon"
                                                    onClick={() => {
                                                        onUpdateCollection(collection.id, { icon: iconName });
                                                        setIsIconPopoverOpen(false);
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                                </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{iconName}</p></TooltipContent>
                                            </Tooltip>
                                            </TooltipProvider>
                                        ))}</div></ScrollArea>
                                    </PopoverContent>
                                </Popover>
                                {!isViewer && (
                                    <>
                                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}><button className={cn("absolute -bottom-1 -right-3 h-4 w-4 rounded-full border-0", !isOwner ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: collection.color }} /></PopoverTrigger></TooltipTrigger><TooltipContent><p>Change Color</p></TooltipContent></Tooltip></TooltipProvider>
                                            <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <div className="space-y-4">
                                                    <HexColorPicker color={color} onChange={setColor} className="!w-full" />
                                                    <div className="flex items-center gap-2">
                                                        <span className="p-2 border rounded-md shadow-sm" style={{ backgroundColor: color }} />
                                                        <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
                                                    </div>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {predefinedColors.map(c => (
                                                            <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdateCollection(collection.id, { color: c }); setIsColorPopoverOpen(false);}}></button>
                                                        ))}
                                                    </div>
                                                    <Button onClick={() => { onUpdateCollection(collection.id, { color }); setIsColorPopoverOpen(false); }} className="w-full">Set Color</Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {shareIcon && (
                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: ownerColor }}><GoogleSymbol name={shareIcon} style={{fontSize: '16px'}}/></div></TooltipTrigger><TooltipContent><p>{shareIconTitle}</p></TooltipContent></Tooltip></TooltipProvider>
                                        )}
                                    </>
                                )}
                            </div>
                             <div className="flex-1 min-w-0">
                                <div onClick={() => { if(isOwner) setIsEditingName(true);}} className={cn("font-headline text-2xl font-thin break-words", isOwner && "cursor-pointer")}>
                                {isEditingName ? (
                                    <Input
                                        ref={nameInputRef}
                                        defaultValue={collection.name}
                                        onBlur={handleSaveName}
                                        onKeyDown={handleNameKeyDown}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                                    />
                                ) : (
                                    <CardTitle>{collection.name}</CardTitle>
                                )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                           {!isCollapsed && isOwner && !isSharedPreview && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => onAddBadge(collection.id)} disabled={!isOwner || isViewer} onPointerDown={(e) => e.stopPropagation()} className="h-8 w-8 text-muted-foreground">
                                                <GoogleSymbol name="add_circle" weight={100} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Add New Badge</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {!isCollapsed && (
                                <Popover open={isViewModePopoverOpen} onOpenChange={setIsViewModePopoverOpen}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <PopoverTrigger onPointerDown={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <GoogleSymbol name={viewModeOptions.find(o => o.mode === collection.viewMode)?.icon || 'view_module'} weight={100} />
                                                    </Button>
                                                </PopoverTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Change View Mode</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-auto p-1 flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                                        {viewModeOptions.map(({mode, icon, label}) => (
                                            <TooltipProvider key={mode}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                onUpdateCollection(collection.id, { viewMode: mode });
                                                                setIsViewModePopoverOpen(false);
                                                            }}
                                                            className={cn(
                                                                "h-8 w-8",
                                                                collection.viewMode === mode && "text-primary"
                                                            )}
                                                        >
                                                            <GoogleSymbol name={icon} weight={100} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{label}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </div>
             {showDetails && (
                <>
                    <CardContent className="flex-grow pt-0 flex flex-col min-h-0">
                         <div className="min-h-[20px]" onClick={() => { if(isOwner) setIsEditingDescription(true);}}>
                            {isEditingDescription ? (
                            <Textarea 
                                ref={descriptionTextareaRef} 
                                defaultValue={collection.description} 
                                onBlur={handleSaveDescription} 
                                onKeyDown={handleDescriptionKeyDown}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" 
                                placeholder="Click to add a description." 
                            />
                            ) : (
                                <p className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isOwner && "cursor-text")}>
                                {collection.description || (isOwner ? 'Click to add a description.' : '')}
                            </p>
                            )}
                        </div>
                        <DroppableCollectionContent collection={collection}>
                            {collectionBadges.map((badge) => {
                                const badgeIsOwned = badge.owner.id === viewAsUser.userId;
                                return (
                                <SortableBadgeItem
                                    key={badge.id}
                                    badge={badge}
                                    collection={collection}
                                    viewMode={collection.viewMode}
                                    onUpdateBadge={onUpdateBadge}
                                    onDelete={onDeleteBadge}
                                    isViewer={isViewer}
                                    predefinedColors={predefinedColors}
                                    isOwner={badgeIsOwned}
                                    isLinked={!badgeIsOwned}
                                    allCollections={allBadgeCollections}
                                    isCollectionEditing={isEditingName || isEditingDescription}
                                />
                                )
                            })}
                        </DroppableCollectionContent>
                    </CardContent>
                    {!isSharedPreview && (
                        <CardFooter className="flex items-center justify-between gap-2 p-2 mt-auto">
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
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    disabled={!isOwner}
                                                >
                                                    <GoogleSymbol name={app.icon} weight={100} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Associated with {app.label}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                            {contextTeam && !isViewer && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-8 w-8", isActive ? 'text-primary' : 'text-muted-foreground')}
                                                onClick={handleToggleCollectionActive}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                <GoogleSymbol name={isActive ? 'check_circle' : 'circle'} weight={100} filled={isActive}/>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{isActive ? 'Deactivate' : 'Activate'} for Team</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </CardFooter>
                    )}
                </>
             )}
            {!isCollapsed && (
                 <div className="absolute -bottom-1 right-0">
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                        <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                </div>
            )}
        </Card>
    );
}

function SortableCollectionCard({ collection, ...props }: { collection: BadgeCollection, [key: string]: any }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: collection.id,
        data: { type: 'collection-card', collection, isSharedPreview: props.isSharedPreview },
        disabled: isEditingName || isEditingDescription,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={cn(
                "p-2 flex-grow-0 flex-shrink-0 transition-all duration-300",
                props.isSharedPreview 
                    ? "w-full" 
                    : "basis-full sm:basis-1/2 md:basis-1/3",
                isDragging && "opacity-80 shadow-2xl z-50"
            )}
        >
            <BadgeCollectionCard 
                collection={collection} 
                {...props} 
                dragHandleProps={{...attributes, ...listeners}}
                isDragging={isDragging}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                isEditingDescription={isEditingDescription}
                setIsEditingDescription={setIsEditingDescription}
            />
        </div>
    );
}


function DuplicateZone({ id, onAdd }: { id: string; onAdd: () => void; }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
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

function CollectionDropZone({ id, type, children, className }: { id: string; type: string; children: React.ReactNode; className?: string; }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type } });

  return (
    <div ref={setNodeRef} className={cn(className, "transition-all rounded-lg", isOver && "ring-1 ring-border ring-inset")}>
      {children}
    </div>
  );
}


export function BadgeManagement({ team, tab: pageConfig, isSingleTabPage = false }: { team: Team; tab: AppTab; page: AppPage; isSingleTabPage?: boolean }) {
    const { viewAsUser, users, appSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, predefinedColors, updateUser } = useUser();
    const { toast } = useToast();
    const sharedSearchInputRef = useRef<HTMLInputElement>(null);

    const [activeDragItem, setActiveDragItem] = useState<{type: string, data: any} | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    
    useEffect(() => {
        if (isSharedPanelOpen) {
            setTimeout(() => sharedSearchInputRef.current?.focus(), 100);
        }
    }, [isSharedPanelOpen]);

    const title = appSettings.teamManagementLabel || tab.name;

    const displayedCollections = useMemo(() => {
        const owned = allBadgeCollections.filter(c => c.owner.id === viewAsUser.userId);
        const linked = (viewAsUser.linkedCollectionIds || [])
            .map(id => allBadgeCollections.find(c => c.id === id))
            .filter((c): c is BadgeCollection => !!c);
        
        return [...owned, ...linked].filter(c => c.name.toLowerCase().includes(mainSearchTerm.toLowerCase()));
    }, [allBadgeCollections, viewAsUser, mainSearchTerm]);

    const sharedCollections = useMemo(() => {
        const displayedIds = new Set(displayedCollections.map(c => c.id));
        return allBadgeCollections
            .filter(c => c.isShared && !displayedIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [allBadgeCollections, displayedCollections, sharedSearchTerm]);

    const handleDeleteCollection = useCallback((collection: BadgeCollection) => {
        const isOwner = collection.owner.id === viewAsUser.userId;
        if (isOwner) {
            deleteBadgeCollection(collection.id);
            toast({ title: 'Collection Deleted' });
        } else {
            const updatedLinkedIds = (viewAsUser.linkedCollectionIds || []).filter(id => id !== collection.id);
            updateUser(viewAsUser.userId, { linkedCollectionIds: updatedLinkedIds });
            toast({ title: 'Collection Unlinked' });
        }
    }, [viewAsUser, deleteBadgeCollection, updateUser, toast]);

    const handleDeleteBadge = useCallback((badgeId: string, collectionId: string) => {
        const badge = allBadges.find(b => b.id === badgeId);
        const isOwner = badge?.owner.id === viewAsUser.userId;
        
        if (isOwner) {
            deleteBadge(badgeId);
            toast({ title: 'Badge Deleted' });
        } else {
            const newBadgeIds = allBadgeCollections.find(c => c.id === collectionId)?.badgeIds.filter(id => id !== badgeId);
            if (newBadgeIds) {
                updateBadgeCollection(collectionId, { badgeIds: newBadgeIds });
                toast({ title: 'Badge Unlinked' });
            }
        }
    }, [allBadges, allBadgeCollections, viewAsUser, deleteBadge, updateBadgeCollection, toast]);

    const onDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;
        
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
        const activeCollectionId = active.data.current?.collectionId;
        const overCollectionId = over.data.current?.collectionId;

        if (activeType === 'badge' && overType === 'collection') {
            const badge = active.data.current?.badge as Badge;
            const targetCollection = over.data.current?.collection as BadgeCollection;

            if (activeCollectionId !== targetCollection.id) {
                // Remove from old collection
                updateBadgeCollection(activeCollectionId, { badgeIds: allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds.filter(id => id !== badge.id) });
                // Add to new collection
                updateBadgeCollection(targetCollection.id, { badgeIds: [badge.id, ...targetCollection.badgeIds] });
            } else {
                // Reorder within the same collection
                const oldIndex = allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds.indexOf(badge.id);
                const newIndex = allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds.indexOf(over.id as string) === -1 ? allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds.length : allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds.indexOf(over.id as string);
                reorderBadges(activeCollectionId, arrayMove(allBadgeCollections.find(c => c.id === activeCollectionId)!.badgeIds, oldIndex, newIndex));
            }
        }
        // Simplified drag logic for collections
    }, [updateBadgeCollection, allBadgeCollections, reorderBadges]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDragItem({ type: e.active.data.current?.type, data: e.active.data.current || {} })} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
           <div className="flex gap-4 h-full">
                 <div className="flex-1 overflow-hidden">
                    <div className="flex flex-col gap-6 h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                 <h2 className="font-headline text-2xl font-thin tracking-tight">{title}</h2>
                                <DuplicateZone id="duplicate-collection-zone" onAdd={() => addBadgeCollection(viewAsUser)} />
                            </div>
                            <div className="flex items-center gap-1">
                                <CompactSearchInput searchTerm={mainSearchTerm} setSearchTerm={setMainSearchTerm} placeholder="Search collections..." />
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
                        <div className="h-full overflow-y-auto">
                            <CollectionDropZone id="collections-list" type="collection-list" className="space-y-4">
                                <SortableContext items={displayedCollections.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    {displayedCollections.map(collection => (
                                        <SortableCollectionCard
                                            key={collection.id}
                                            collection={collection}
                                            allBadges={allBadges}
                                            predefinedColors={predefinedColors}
                                            onUpdateCollection={updateBadgeCollection}
                                            onDeleteCollection={handleDeleteCollection}
                                            onAddBadge={addBadge}
                                            onUpdateBadge={updateBadge}
                                            onDeleteBadge={handleDeleteBadge}
                                            contextTeam={team}
                                        />
                                    ))}
                                </SortableContext>
                            </CollectionDropZone>
                        </div>
                    </div>
                 </div>
                 <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96 p-2" : "w-0 p-0")}>
                    <CollectionDropZone id="shared-collections-panel" type="collection-panel" className="h-full">
                         <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-headline font-thin text-xl">Shared Collections</CardTitle>
                                    <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." inputRef={sharedSearchInputRef} autoFocus={isSharedPanelOpen} tooltipText="Search Shared" />
                                </div>
                                <CardDescription>Drag a collection you own here to share it. Drag a collection to your board to link it.</CardDescription>
                            </CardHeader>
                             <CardContent className="flex-1 p-2 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <SortableContext items={sharedCollections.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {sharedCollections.map(collection => (
                                                <SortableCollectionCard
                                                    key={collection.id}
                                                    collection={collection}
                                                    allBadges={allBadges}
                                                    predefinedColors={predefinedColors}
                                                    onUpdateCollection={updateBadgeCollection}
                                                    onDeleteCollection={handleDeleteCollection}
                                                    onAddBadge={addBadge}
                                                    onUpdateBadge={updateBadge}
                                                    onDeleteBadge={handleDeleteBadge}
                                                    isSharedPreview={true}
                                                    isViewer={true}
                                                />
                                            ))}
                                            {sharedCollections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No other collections are currently shared.</p>}
                                        </div>
                                    </SortableContext>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </CollectionDropZone>
                </div>
            </div>
             <DragOverlay>
                {activeDragItem?.type === 'collection-card' && activeDragItem?.data?.collection ? (
                     <SortableCollectionCard
                        collection={activeDragItem.data.collection}
                        allBadges={allBadges}
                        predefinedColors={predefinedColors}
                        onUpdateCollection={updateBadgeCollection}
                        onDeleteCollection={handleDeleteCollection}
                        onAddBadge={addBadge}
                        onUpdateBadge={updateBadge}
                        onDeleteBadge={handleDeleteBadge}
                        isSharedPreview={activeDragItem.data.isSharedPreview}
                        isViewer={activeDragItem.data.isSharedPreview}
                        isCollapsed={true}
                    />
                ) : activeDragItem?.type === 'badge' && activeDragItem?.data?.badge ? (
                    <BadgeDisplayItem 
                        badge={activeDragItem.data.badge}
                        viewMode={allBadgeCollections.find(c => c.id === activeDragItem.data.collectionId)?.viewMode || 'list'}
                        onUpdateBadge={() => {}}
                        onDelete={() => {}}
                        predefinedColors={predefinedColors}
                        isOwner={activeDragItem.data.badge.owner.id === viewAsUser.userId}
                        isLinked={activeDragItem.data.badge.owner.id !== viewAsUser.userId}
                        allCollections={allBadgeCollections}
                        isEditingName={false} setIsEditingName={() => {}}
                        isEditingDescription={false} setIsEditingDescription={() => {}}
                        isCollectionEditing={false}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

