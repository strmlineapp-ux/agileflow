
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppPage, type BadgeCollectionOwner } from '@/types';
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
}) {
    const { users } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

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
    
    const originalCollection = allCollections.find(c => c.id === badge.ownerCollectionId);
    
    const ownerUser = users.find(u => u.userId === originalCollection?.owner.id);

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
    
    const deleteButton = (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onPointerDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); onDelete(badge.id); }}
                    >
                        <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isOwner ? "Delete Badge" : "Unlink Badge"}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
    
    const nameEditorElement = (
         <div onPointerDown={(e) => {if(isOwner) e.stopPropagation();}} onClick={() => isOwner && setIsEditingName(true)}>
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
         <div onPointerDown={(e) => {if(isOwner) e.stopPropagation();}} onClick={() => isOwner && setIsEditingDescription(true)}>
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
        <div className="group relative h-full flex items-start gap-4 rounded-lg p-2 hover:bg-muted/50" onPointerDown={(e) => e.stopPropagation()}>
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
            {deleteButton}
        </div>
      );
    }
    
    // Compact View
    return (
        <div className="group relative p-1.5" onPointerDown={(e) => e.stopPropagation()}>
             <UiBadge
                variant={'outline'}
                style={{ color: badge.color, borderColor: badge.color }}
                className="flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8 font-thin"
            >
                <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild disabled={!isOwner}>
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
                            <PopoverTrigger asChild disabled={!isOwner}>
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
            {deleteButton}
        </div>
    );
}

function SortableBadgeItem({ badge, ...props }: { badge: Badge, [key: string]: any }) {
    const isOwner = props.isOwner;
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `badge::${badge.id}::${props.collectionId}`,
        data: { type: 'badge', badge, collectionId: props.collectionId, isSharedPreview: props.isSharedPreview },
        disabled: !isOwner || isEditingName || isEditingDescription
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    
    const itemContent = (
        <BadgeDisplayItem 
            badge={badge}
            isOwner={isOwner}
            isEditingName={isEditingName}
            setIsEditingName={setIsEditingName}
            isEditingDescription={isEditingDescription}
            setIsEditingDescription={setIsEditingDescription}
            {...props} 
        />
    );
    
    if (props.viewMode === 'detailed') {
        return (
            <div 
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="p-1 basis-full md:basis-1/2 flex-grow-0 flex-shrink-0"
            >
                {itemContent}
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {itemContent}
        </div>
    )
}

function DroppableCollectionContent({ collection, children, onAddBadge }: { collection: BadgeCollection, children: React.ReactNode, onAddBadge: () => void }) {
    const { setNodeRef, isOver } = useDroppable({ id: collection.id, data: { type: 'collection', collection }});
    
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
            {children}
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
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    dragHandleProps?: any;
    isSharedPreview?: boolean;
    contextTeam?: Team;
    isViewer?: boolean;
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
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
    dragHandleProps, 
    isSharedPreview = false, 
    contextTeam, 
    isViewer = false,
    isEditingName,
    setIsEditingName
}: BadgeCollectionCardProps) {
    const { viewAsUser, users, updateTeam, allBadgeCollections } = useUser();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    const [color, setColor] = useState(collection.color);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    
    const isOwner = useMemo(() => collection.owner.id === viewAsUser.userId, [collection.owner.id, viewAsUser.userId]);

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
    }, [collection, onUpdateCollection]);
    
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

    const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); handleSaveDescription(); }
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
    
    const descriptionEditorElement = (
        <div onPointerDown={(e) => {if(isOwner) e.stopPropagation();}} onClick={() => isOwner && setIsEditingDescription(true)}>
           {isEditingDescription && isOwner ? (
               <Textarea 
                   ref={descriptionTextareaRef} 
                   defaultValue={collection.description} 
                   onBlur={handleSaveDescription} 
                   onKeyDown={handleDescriptionKeyDown}
                   className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" 
                   placeholder="Click to add a description." 
               />
            ) : (
                <p className={cn("text-sm text-muted-foreground min-h-[20px] break-words", isOwner && "cursor-text")}>
                   {collection.description || (isOwner ? 'Click to add a description.' : '')}
               </p>
            )}
       </div>
   );

    return (
        <Card className="h-full flex flex-col bg-transparent relative">
             <div {...dragHandleProps}>
                <CardHeader className="group">
                     {!isSharedPreview && (
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onPointerDown={(e) => { e.stopPropagation(); }}
                                    onClick={(e) => { e.stopPropagation(); onDeleteCollection(collection); }}
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
                            <div className="flex-1 min-w-0" onPointerDown={(e) => { if(isOwner) e.stopPropagation(); }}>
                                <div className="flex items-center justify-between">
                                    {isEditingName && isOwner ? (
                                        <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"/>
                                    ) : (
                                        <CardTitle onClick={() => { if(isOwner) setIsEditingName(true);}} className={cn("text-2xl font-headline font-thin break-words", isOwner && "cursor-pointer")}>{collection.name}</CardTitle>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                           {isOwner && !isSharedPreview && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => onAddBadge(collection.id)} disabled={!isOwner || isViewer} className="h-8 w-8 text-muted-foreground" onPointerDown={(e) => e.stopPropagation()}>
                                                <GoogleSymbol name="add_circle" weight={100} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Add New Badge</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <Popover>
                                <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <GoogleSymbol name={viewModeOptions.find(o => o.mode === collection.viewMode)?.icon || 'view_module'} weight={100} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1 flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                                    {viewModeOptions.map(({mode, icon, label}) => (
                                        <TooltipProvider key={mode}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onUpdateCollection(collection.id, { viewMode: mode })}
                                                        className={cn(
                                                            "h-8 w-8",
                                                            collection.viewMode === mode ? "text-primary" : ""
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
                        </div>
                    </div>
                </CardHeader>
            </div>
             {isExpanded && (
                <CardContent className="flex-grow pt-0 flex flex-col min-h-0" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="mb-2">{descriptionEditorElement}</div>
                    <SortableContext items={collection.badgeIds.map(id => `badge::${id}::${collection.id}`)} strategy={rectSortingStrategy}>
                        <DroppableCollectionContent collection={collection} onAddBadge={() => onAddBadge(collection.id)}>
                            {collectionBadges.map((badge) => {
                                const badgeIsOwned = badge.ownerCollectionId === collection.id;
                                return (
                                <SortableBadgeItem
                                    key={badge.id}
                                    badge={badge}
                                    collectionId={collection.id}
                                    viewMode={collection.viewMode}
                                    onUpdateBadge={onUpdateBadge}
                                    onDelete={onDeleteBadge}
                                    isViewer={isViewer}
                                    predefinedColors={predefinedColors}
                                    isOwner={badgeIsOwned}
                                    isLinked={!badgeIsOwned}
                                    allCollections={allBadgeCollections}
                                />
                                )
                            })}
                        </DroppableCollectionContent>
                    </SortableContext>
                </CardContent>
             )}
            {!isSharedPreview && (
                <CardFooter className="flex items-center justify-between gap-2 p-2 mt-auto" onPointerDown={(e) => e.stopPropagation()}>
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
            <div className="absolute -bottom-1 right-0">
                <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                    <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                </Button>
            </div>
        </Card>
    );
}

function SortableCollectionCard({ collection, ...props }: { collection: BadgeCollection, [key: string]: any }) {
    const [isEditingName, setIsEditingName] = useState(false);
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `collection::${collection.id}`,
        data: { type: 'collection', collection, isSharedPreview: props.isSharedPreview },
        disabled: isEditingName,
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
                {...props}
                collection={collection} 
                dragHandleProps={{...attributes, ...listeners}}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
            />
        </div>
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

function DuplicateZone({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
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
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onPointerDown={(e) => e.stopPropagation()} onClick={onAdd} disabled={disabled}>
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
        users,
        updateAppTab, 
        allBadgeCollections,
        allBadges,
        addBadgeCollection,
        updateBadgeCollection,
        deleteBadgeCollection,
        addBadge,
        updateBadge: contextUpdateBadge,
        deleteBadge,
        reorderBadges,
        updateTeam,
        predefinedColors,
    } = useUser();

    const { toast } = useToast();
    
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

    const { canManage, canCreateCollection, isViewer, collectionsToDisplay } = useMemo(() => {
        let canManage = false;
        let canCreateCollection = false;
        let isViewer = false;
        let collections: BadgeCollection[] = [];

        if (isTeamContext && contextTeam) {
            const hasAdmins = contextTeam.teamAdmins && contextTeam.teamAdmins.length > 0;
            const relevantUserIds = new Set(hasAdmins ? contextTeam.teamAdmins : contextTeam.members);
            
            canManage = viewAsUser.isAdmin || relevantUserIds.has(viewAsUser.userId);
            canCreateCollection = canManage;
            isViewer = !canManage;
            
            collections = allBadgeCollections.filter(c => relevantUserIds.has(c.owner.id));
            
        } else {
            canManage = true;
            canCreateCollection = true;
            isViewer = false;
            const myCollections = allBadgeCollections.filter(c => c.owner.id === viewAsUser.userId);
            const linkedCollectionIds = new Set(viewAsUser.linkedCollectionIds || []);
            const linkedCollections = allBadgeCollections.filter(c => linkedCollectionIds.has(c.id));
            collections = [...myCollections, ...linkedCollections];
        }
  
        if (searchTerm) {
          collections = collections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const uniqueCollections = Array.from(new Map(collections.map(c => [c.id, c])).values());

        return { canManage, canCreateCollection, isViewer, collectionsToDisplay: uniqueCollections };
    }, [isTeamContext, contextTeam, viewAsUser, allBadgeCollections, searchTerm]);
    
    
    useEffect(() => {
        if (isEditingTitle) titleInputRef.current?.focus();
    }, [isEditingTitle]);

    useEffect(() => {
        if (isSharedPanelOpen) {
            setTimeout(() => sharedSearchInputRef.current?.focus(), 100);
        }
    }, [isSharedPanelOpen]);

    const handleUpdateBadge = useCallback((badgeId: string, badgeData: Partial<Badge>) => {
        const badgeToUpdate = allBadges.find(b => b.id === badgeId);
        if (!badgeToUpdate) return;
        contextUpdateBadge({ ...badgeToUpdate, ...badgeData });
    }, [allBadges, contextUpdateBadge]);


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

    const handleAddCollection = useCallback((sourceCollection?: BadgeCollection) => {
        if (!canCreateCollection) return;
        addBadgeCollection(viewAsUser, sourceCollection, contextTeam);
    }, [addBadgeCollection, viewAsUser, contextTeam, canCreateCollection]);
    
    const handleDeleteCollection = (collection: BadgeCollection) => {
        if (isViewer) return;
        setCollectionToDelete(collection);
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
            handleAddCollection(sourceCollection);
            return;
        }

        if (activeType === 'collection') {
            // handleCollectionDragEnd(event);
        } else if (activeType === 'badge') {
            handleBadgeDragEnd(event);
        }
    };
    
    const handleBadgeDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
    
        const activeCollectionId = active.data.current?.collectionId;
        const overData = over.data.current;
        const overCollectionId = overData?.type === 'badge' ? overData.collectionId : (overData?.type === 'collection' ? over.id : null);
          
        const activeBadge = active.data.current?.badge as Badge;
    
        if (!activeBadge || !overCollectionId) return;
    
        if (activeCollectionId !== overCollectionId) {
            const toCollection = allBadgeCollections.find(c => c.id === overCollectionId);
            if(toCollection && !toCollection.badgeIds.includes(activeBadge.id)) {
                const newToBadgeIds = [...toCollection.badgeIds, activeBadge.id];
                updateBadgeCollection(toCollection.id, { badgeIds: newToBadgeIds });
                toast({ title: "Badge Linked" });
            }
        } else {
            const collection = allBadgeCollections.find(c => c.id === activeCollectionId);
            if (collection && collection.owner.id === viewAsUser.userId) {
                const oldIndex = collection.badgeIds.indexOf(active.id.toString().split('::')[2]);
                const newIndex = overData.type === 'badge' ? collection.badgeIds.indexOf(over.id.toString().split('::')[2]) : collection.badgeIds.length;
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
                                <DuplicateZone onAdd={() => handleAddCollection()} disabled={!canCreateCollection} />
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
                                        {collectionsToDisplay.map((collection) => (
                                                <div
                                                    key={collection.id}
                                                    className={cn(
                                                        "p-2 w-full transition-all duration-300",
                                                        isSharedPanelOpen ? "lg:w-1/2" : "lg:w-1/3",
                                                    )}
                                                >
                                                    <div className="h-full">
                                                        <SortableCollectionCard
                                                            collection={collection}
                                                            allBadges={allBadges}
                                                            onUpdateCollection={updateBadgeCollection}
                                                            onDeleteCollection={handleDeleteCollection}
                                                            onAddBadge={addBadge}
                                                            onUpdateBadge={handleUpdateBadge}
                                                            onDeleteBadge={handleDeleteBadge}
                                                            contextTeam={team}
                                                            isViewer={isViewer}
                                                            predefinedColors={predefinedColors}
                                                            allCollections={allBadgeCollections}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}
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
                                                    {sharedCollections.map((collection) => (
                                                        <SortableCollectionCard
                                                            key={collection.id}
                                                            collection={collection}
                                                            allBadges={allBadges}
                                                            onUpdateCollection={updateBadgeCollection}
                                                            onDeleteCollection={handleDeleteCollection}
                                                            onAddBadge={addBadge}
                                                            onUpdateBadge={handleUpdateBadge}
                                                            onDeleteBadge={handleDeleteBadge}
                                                            isSharedPreview={true}
                                                            contextTeam={team}
                                                            isViewer={isViewer}
                                                            predefinedColors={predefinedColors}
                                                            allCollections={allBadgeCollections}
                                                        />
                                                    ))}
                                                    {sharedCollections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No collections are being shared by other users.</p>}
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
                            <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-transparent p-0" onClick={confirmDeleteCollection}>
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
                <DragOverlay>
                    {activeDragItem?.type === 'collection' ? (
                        <div className='w-96'>
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
                            predefinedColors={predefinedColors}
                            allCollections={allBadgeCollections}
                            isEditingName={false}
                            setIsEditingName={() => {}}
                        />
                        </div>
                    ) : activeDragItem?.type === 'badge' ? (
                        <div className='bg-background rounded-full'>
                         <BadgeDisplayItem
                            badge={activeDragItem.badge}
                            viewMode={'compact'}
                            onUpdateBadge={() => {}}
                            onDelete={() => {}}
                            isViewer={false}
                            predefinedColors={predefinedColors}
                            isOwner={false}
                            isLinked={false}
                            allCollections={allBadgeCollections}
                            isEditingName={false}
                            setIsEditingName={() => {}}
                            isEditingDescription={false}
                            setIsEditingDescription={() => {}}
                        />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
