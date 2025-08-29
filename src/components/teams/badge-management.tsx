

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type BadgeApplication, type AppPage, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { cn, getContrastColor, getHueFromHsl, isHueInRange } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Badge as UiBadge } from '../ui/badge';
import { HslStringColorPicker } from 'react-colorful';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { googleSymbolNames } from '@/lib/google-symbols';
import { CardTemplate } from '@/components/common/card-template';

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
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { DraggableGrid } from '../common/draggable-grid';
import { InlineEditor } from '../common/inline-editor';
import { SortableItem } from '../common/sortable-item';

function BadgeDisplayItem({ 
    badge, 
    viewMode, 
    onUpdateBadge, 
    onDelete,
    isViewer = false, 
    predefinedColors,
    isOwner,
    isLinked,
    isSharedPreview,
    allCollections,
    isCollectionEditing,
    dragHandleProps,
    currentUserBadgeIds
}: { 
    badge: Badge;
    viewMode: BadgeCollection['viewMode'];
    onUpdateBadge: (badgeId: string, badgeData: Partial<Badge>) => void;
    onDelete: (badgeId: string) => void;
    isViewer?: boolean;
    predefinedColors: string[];
    isOwner: boolean;
    isLinked: boolean;
    isSharedPreview?: boolean;
    allCollections: BadgeCollection[];
    isCollectionEditing: boolean;
    dragHandleProps?: any;
    currentUserBadgeIds?: Set<string>;
}) {
    const { users } = useUser();
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);

    const handleUpdate = useCallback((data: Partial<Badge>) => {
        onUpdateBadge(badge.id, data);
    }, [badge.id, onUpdateBadge]);

    useEffect(() => {
        if (isIconPopoverOpen) {
          setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
          setIconSearch('');
        }
    }, [isIconPopoverOpen]);
        
    const ownerUser = users.find(u => u.userId === badge.owner.id);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);
    
    const colorPickerContent = (
        <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
            <div className="space-y-4">
                <HslStringColorPicker color={badge.color} onChange={(newColor) => handleUpdate({ color: newColor })} className="!w-full" />
                <div className="grid grid-cols-8 gap-1">
                    {predefinedColors.map(c => (
                        <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => { handleUpdate({ color: c }); setIsColorPopoverOpen(false); }} />
                    ))}
                </div>
            </div>
        </PopoverContent>
    );

    const iconPickerContent = (
         <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 p-2 border-b">
                <CompactSearchInput searchTerm={iconSearch} setSearchTerm={setIconSearch} placeholder="Search icons..." inputRef={iconSearchInputRef} />
            </div>
            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{googleSymbolNames.slice(0, 300).map((iconName) => (
            <TooltipProvider key={iconName}><Tooltip><TooltipTrigger asChild>
                <Button variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { handleUpdate({ icon: iconName }); setIsIconPopoverOpen(false); }} className="h-8 w-8 p-0">
                    <GoogleSymbol name={iconName} className="text-4xl" weight={100} opticalSize={20} />
                </Button>
            </TooltipTrigger><TooltipContent><p>{iconName}</p></TooltipContent></Tooltip></TooltipProvider>
            ))}</div></ScrollArea>
        </PopoverContent>
    );
        
    const nameEditorElement = (
        <InlineEditor
            value={badge.name}
            onSave={(newValue) => handleUpdate({ name: newValue })}
            disabled={!isOwner}
            className={cn("break-words", viewMode === 'grid' ? "text-base" : "text-sm", isOwner && "cursor-text")}
        />
    );

     const descriptionEditorElement = (
        <InlineEditor
            value={badge.description || ''}
            onSave={(newValue) => handleUpdate({ description: newValue })}
            disabled={!isOwner}
            placeholder={isLinked ? "No description" : "Click to add description."}
            className={cn("text-sm text-muted-foreground min-h-[20px] break-words", !badge.description && "italic")}
        />
   );
   
    const shouldShowLinkIcon = isLinked && (!isSharedPreview || (currentUserBadgeIds && currentUserBadgeIds.has(badge.id)));
    
    if (viewMode === 'grid' || viewMode === 'list') {
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
                {!isViewer && isOwner && (
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                                        <div className={cn("absolute -bottom-1 -right-3 h-4 w-4 rounded-full border-0", !isOwner ? "cursor-not-allowed" : "cursor-pointer")} style={{ backgroundColor: badge.color }} aria-label="Change badge color" />
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Color</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {colorPickerContent}
                    </Popover>
                )}
                 {shouldShowLinkIcon && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: '#64748B' }}>
                                    <GoogleSymbol name="link" style={{fontSize: '16px'}} weight={100} opticalSize={20}/>
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
                className="flex items-center gap-1.5 p-1 pl-2 rounded-full text-sm h-8"
            >
                <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                             <Button
                                variant="ghost"
                                className="h-auto p-0 hover:bg-transparent"
                                style={{ color: badge.color }}
                            >
                                <GoogleSymbol name={badge.icon} style={{ fontSize: '28px' }} weight={100} opticalSize={20} />
                            </Button>
                        </PopoverTrigger>
                        {iconPickerContent}
                    </Popover>
                     {!isViewer && isOwner && (
                        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <PopoverTrigger asChild disabled={!isOwner} onPointerDown={(e) => e.stopPropagation()}>
                                <div
                                    className={cn("absolute -bottom-1 -right-3 h-4 w-4 rounded-full border-0", !isOwner ? "cursor-not-allowed" : "cursor-pointer")}
                                    style={{ backgroundColor: badge.color }}
                                    aria-label="Change badge color"
                                />
                            </PopoverTrigger>
                            {colorPickerContent}
                        </Popover>
                     )}
                     {shouldShowLinkIcon && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white" style={{ backgroundColor: '#64748B' }}>
                                        <GoogleSymbol name="link" style={{fontSize: '16px'}} weight={100} opticalSize={20} />
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
    
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `badge::${badge.id}::${collection.id}`,
        data: { type: 'badge', badge, collectionId: collection.id, isSharedPreview: props.isSharedPreview },
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    
    const canManage = !props.isViewer;

    return (
        <div ref={setNodeRef} style={style} className={cn(props.viewMode === 'grid' && "break-inside-avoid")}>
            <div className="group relative flex w-full" {...listeners} {...attributes}>
                <div className="flex-grow">
                    <BadgeDisplayItem 
                        badge={badge}
                        onDelete={onDelete}
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
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onPointerDown={(e) => { e.stopPropagation(); onDelete(badge.id, collection.id); }}
                                    >
                                        <GoogleSymbol name="cancel" className="text-lg" weight={100} opticalSize={20} />
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
      case 'grid':
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
                collection.viewMode === 'grid' && "gap-4 [column-fill:_balance] columns-1 sm:columns-2"
            )}
        >
            <SortableContext items={collection.badgeIds.map(id => `badge::${id}::${collection.id}`)} strategy={strategy}>
                {children}
            </SortableContext>
        </div>
    );
}

function DuplicateBadgeZone({ collectionId, onAdd, isOwner }: { collectionId: string, onAdd: () => void, isOwner: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `duplicate-badge-zone-${collectionId}`,
    data: { type: 'duplicate-badge-zone', collectionId },
    disabled: !isOwner,
  });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all h-8 w-8 flex items-center justify-center",
        isOver && isOwner && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAdd}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-8 w-8 text-muted-foreground"
            >
              <GoogleSymbol name="add_circle" weight={100} opticalSize={20} />
              <span className="sr-only">New Badge or Drop to Duplicate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOver && isOwner ? 'Drop to Duplicate Badge' : 'Add New Badge'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
    isViewer?: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    dragHandleProps?: any;
    currentUserBadgeIds?: Set<string>;
    allCollections: BadgeCollection[];
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
    isViewer = false, 
    isExpanded,
    onToggleExpand,
    dragHandleProps,
    currentUserBadgeIds,
    allCollections,
    ...props
}: BadgeCollectionCardProps) {
    const { viewAsUser, users } = useUser();
    const [isViewModePopoverOpen, setIsViewModePopoverOpen] = useState(false);
    
    const isOwner = useMemo(() => collection.owner.id === viewAsUser.userId, [collection.owner.id, viewAsUser.userId]);
    
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

    const viewModeOptions: {mode: BadgeCollection['viewMode'], icon: string, label: string}[] = [
        { mode: 'compact', icon: 'view_module', label: 'Compact View' },
        { mode: 'grid', icon: 'view_comfy_alt', label: 'Grid View' },
        { mode: 'list', icon: 'view_list', label: 'List View' }
    ];

    const associationsToRender = isOwner
        ? APPLICATIONS
        : APPLICATIONS.filter(app => collection.applications?.includes(app.key));

    const handleToggleApplication = (application: BadgeApplication) => {
        const currentApplications = new Set(collection.applications || []);
        if (currentApplications.has(application)) {
            currentApplications.delete(application);
        } else {
            currentApplications.add(application);
        }
        onUpdateCollection(collection.id, { applications: Array.from(currentApplications) });
    };

    const headerControls = (
      <>
        {!isSharedPreview && isOwner && (
          <DuplicateBadgeZone collectionId={collection.id} onAdd={() => onAddBadge(collection.id)} isOwner={isOwner} />
        )}
        <Popover open={isViewModePopoverOpen} onOpenChange={setIsViewModePopoverOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <GoogleSymbol name={viewModeOptions.find(o => o.mode === collection.viewMode)?.icon || 'view_module'} weight={100} opticalSize={20} />
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
                            <Button variant="ghost" size="icon" onClick={() => { onUpdateCollection(collection.id, { viewMode: mode }); setIsViewModePopoverOpen(false); }} className={cn("h-8 w-8", collection.viewMode === mode && "text-primary")}>
                                <GoogleSymbol name={icon} weight={100} opticalSize={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{label}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
          </PopoverContent>
        </Popover>
      </>
    );

    const bodyContent = (
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
                  allCollections={allCollections}
                  isSharedPreview={isSharedPreview}
                  currentUserBadgeIds={currentUserBadgeIds}
              />
              )
          })}
      </DroppableCollectionContent>
    );

    return (
        <CardTemplate
            entity={collection}
            onUpdate={onUpdateCollection}
            onDelete={onDeleteCollection}
            canManage={isOwner}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            dragHandleProps={dragHandleProps}
            isSharedPreview={isSharedPreview}
            headerControls={headerControls}
            body={bodyContent}
        />
    );
}

function DuplicateZone({ id, onAdd }: { id: string; onAdd: () => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
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
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} opticalSize={20} />
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
    <div ref={setNodeRef} className={cn(className, isOver && "ring-1 ring-border ring-inset", "transition-all rounded-lg")}>
      {children}
    </div>
  );
}

export function BadgeManagement({ tab, page, isActive }: { tab: AppTab; page: AppPage; isActive: boolean }) {
    const { viewAsUser, users, appSettings, updateAppTab, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, predefinedColors, updateUser, teams, setAllBadgeCollections, reorderBadgeCollections } = useUser();
    const { toast } = useToast();

    const [activeDragItem, setActiveDragItem] = useState<{type: string, id: string, data: any} | null>(null);
    
    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [sharedSearchTerm, setSharedSearchTerm] = useState('');
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
    
    const onToggleExpand = useCallback((collectionId: string) => {
        setExpandedCollections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(collectionId)) {
                newSet.delete(collectionId);
            } else {
                newSet.add(collectionId);
            }
            return newSet;
        });
    }, []);

    const title = tab.name;

    const displayedCollections = useMemo(() => {
        if (!viewAsUser) return [];
        const owned = allBadgeCollections.filter(c => c.owner.id === viewAsUser.userId);
        const linked = (viewAsUser.linkedBadgeCollectionIds || [])
            .map(id => allBadgeCollections.find(c => c.id === id))
            .filter((c): c is BadgeCollection => !!c);
        
        let collections = [...owned, ...linked];

        if (mainSearchTerm) {
            collections = collections.filter(c => c.name.toLowerCase().includes(mainSearchTerm.toLowerCase()));
        }
        if (colorFilter) {
            const targetHue = getHueFromHsl(colorFilter);
            if (targetHue !== null) {
                collections = collections.filter(c => {
                    const itemHue = getHueFromHsl(c.color);
                    return itemHue !== null && isHueInRange(targetHue, itemHue);
                });
            }
        }
        return collections;
    }, [allBadgeCollections, viewAsUser, mainSearchTerm, colorFilter]);

    const sharedCollections = useMemo(() => {
        if (!viewAsUser) return [];
        const displayedIds = new Set(displayedCollections.map(c => c.id));
        return allBadgeCollections
            .filter(c => c.isShared && c.owner.id !== viewAsUser.userId && !displayedIds.has(c.id))
            .filter(c => c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
    }, [allBadgeCollections, displayedCollections, sharedSearchTerm, viewAsUser]);

    const currentUserBadgeIds = useMemo(() => {
        const badgeIds = new Set<string>();
        displayedCollections.forEach(collection => {
            collection.badgeIds.forEach(id => badgeIds.add(id));
        });
        return badgeIds;
    }, [displayedCollections]);


    const handleDeleteCollection = useCallback((collection: BadgeCollection) => {
        if (!viewAsUser) return;
        const isOwner = collection.owner.id === viewAsUser.userId;
        if (isOwner) {
            deleteBadgeCollection(collection.id);
            toast({ title: 'Collection Deleted' });
        } else {
            const updatedLinkedIds = (viewAsUser.linkedBadgeCollectionIds || []).filter(id => id !== collection.id);
            updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: updatedLinkedIds });
            toast({ title: 'Collection Unlinked' });
        }
    }, [viewAsUser, deleteBadgeCollection, updateUser, toast]);

    const handleDeleteBadge = useCallback((badgeId: string, collectionId: string) => {
        if (!viewAsUser) return;
        const badge = allBadges.find(b => b.id === badgeId);
        const isOwner = badge?.owner.id === viewAsUser.userId;
        
        if (isOwner) {
            deleteBadge(badgeId, collectionId);
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
        if (!viewAsUser) return;

        const { active, over } = event;
        if (!over) return;
        
        const activeData = active.data.current || {};
        const activeType = active.data.current?.type;
        const overData = over.data.current || {};
        const overType = over.data.current?.type;

        if (activeType === 'badge' && overType === 'duplicate-badge-zone') {
            const collectionId = overData.collectionId;
            const sourceBadge = activeData.badge;
            const targetCollection = allBadgeCollections.find(c => c.id === collectionId);
            if (!targetCollection || targetCollection.owner.id !== viewAsUser.userId) {
                toast({ variant: 'default', title: 'Permission Denied', description: 'You can only add badges to collections you own.' });
                return;
            }
            if (collectionId && sourceBadge) {
                addBadge(collectionId, sourceBadge);
            }
            return;
        }

        if (over.id === 'duplicate-collection-zone') {
            const collection = activeData.collection as BadgeCollection;
            if (collection) {
                addBadgeCollection(viewAsUser, collection);
                const isLinked = (viewAsUser.linkedBadgeCollectionIds || []).includes(collection.id);
                if (isLinked) {
                    const updatedLinkedIds = (viewAsUser.linkedBadgeCollectionIds || []).filter(id => id !== collection.id);
                    updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: updatedLinkedIds });
                    toast({ title: 'Collection Copied', description: 'A new, independent collection has been created.' });
                }
            }
            return;
        }
        
        if (activeType === 'collection-card' && over.id === 'collections-list' && activeData.isSharedPreview) {
             const collection = activeData.collection as BadgeCollection;
             if (collection) {
                 const updatedLinkedIds = [...(viewAsUser.linkedBadgeCollectionIds || []), collection.id];
                 updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: Array.from(new Set(updatedLinkedIds)) });
                 toast({ title: 'Collection Linked' });
             }
            return;
        }
        
        if (activeType === 'badge') {
            const badge = activeData.badge as Badge;
            const sourceCollectionId = activeData.collectionId;
            const targetCollectionId = overData.collection?.id || overData.collectionId;
            const targetCollection = allBadgeCollections.find(c => c.id === targetCollectionId);

            if (targetCollection && targetCollection.owner.id !== viewAsUser.userId) {
                toast({ variant: "destructive", title: 'Permission Denied', description: 'Cannot move badges to a collection you do not own.'});
                return;
            }

            if (targetCollectionId && sourceCollectionId !== targetCollectionId) {
                 if (targetCollection && !targetCollection.badgeIds.includes(badge.id)) {
                    // LINKING: Add badge to new collection, but DO NOT remove from source if it's a shared preview
                    if (!activeData.isSharedPreview) {
                        updateBadgeCollection(sourceCollectionId, { badgeIds: allBadgeCollections.find(c => c.id === sourceCollectionId)!.badgeIds.filter(id => id !== badge.id) });
                    }
                    updateBadgeCollection(targetCollectionId, { badgeIds: [badge.id, ...targetCollection.badgeIds] });
                    toast({title: "Badge Moved/Linked", description: `"${badge.name}" added to "${targetCollection.name}".`});
                 }
            } else if (targetCollectionId && sourceCollectionId === targetCollectionId) {
                const collection = allBadgeCollections.find(c => c.id === sourceCollectionId);
                const oldIndex = collection!.badgeIds.indexOf(badge.id);
                const overBadgeId = over.data.current?.badge.id;
                const newIndex = collection!.badgeIds.indexOf(overBadgeId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    reorderBadges(sourceCollectionId, arrayMove(collection!.badgeIds, oldIndex, newIndex));
                }
            }
            return;
        }

        if (activeType === 'collection-card' && over.id === 'shared-collections-panel') {
            const collection = activeData.collection as BadgeCollection;
            const isOwner = collection.owner.id === viewAsUser.userId;
            
            if (isOwner) {
                updateBadgeCollection(collection.id, { isShared: !collection.isShared });
                toast({ title: collection.isShared ? 'Collection Unshared' : 'Collection Shared' });
            } else { // Is a linked collection, so unlink it
                const updatedLinkedIds = (viewAsUser.linkedBadgeCollectionIds || []).filter(id => id !== collection.id);
                updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: updatedLinkedIds });
                toast({ title: 'Collection Unlinked' });
            }
        } else if (activeType === 'collection-card' && overType === 'collection-card') {
            const activeId = active.id.toString();
            const overId = over.id.toString();

            if (activeId !== overId) {
                const oldIndex = displayedCollections.findIndex(c => c.id === activeId);
                const newIndex = displayedCollections.findIndex(c => c.id === overId);
                
                if (oldIndex !== -1 && newIndex !== -1) {
                    reorderBadgeCollections(arrayMove(displayedCollections, oldIndex, newIndex));
                }
            }
        }
    }, [viewAsUser, teams, addBadgeCollection, updateUser, toast, updateBadgeCollection, allBadgeCollections, reorderBadges, addBadge, setAllBadgeCollections, displayedCollections, reorderBadgeCollections]);
    
    const renderCollectionCard = useCallback((collection: BadgeCollection, isDragging: boolean) => (
        <BadgeCollectionCard
            collection={collection}
            allBadges={allBadges}
            allCollections={allBadgeCollections}
            predefinedColors={predefinedColors}
            onUpdateCollection={updateBadgeCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddBadge={addBadge}
            onUpdateBadge={updateBadge}
            onDeleteBadge={handleDeleteBadge}
            isExpanded={expandedCollections.has(collection.id)}
            onToggleExpand={() => onToggleExpand(collection.id)}
        />
    ), [allBadges, allBadgeCollections, predefinedColors, updateBadgeCollection, handleDeleteCollection, addBadge, updateBadge, handleDeleteBadge, expandedCollections, onToggleExpand]);

    const renderSharedCollectionCard = useCallback((collection: BadgeCollection, isDragging: boolean) => (
        <BadgeCollectionCard
            collection={collection}
            allBadges={allBadges}
            allCollections={allBadgeCollections}
            predefinedColors={predefinedColors}
            onUpdateCollection={updateBadgeCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddBadge={addBadge}
            onUpdateBadge={updateBadge}
            onDeleteBadge={handleDeleteBadge}
            isSharedPreview={true}
            isViewer={true}
            currentUserBadgeIds={currentUserBadgeIds}
            isExpanded={expandedCollections.has(collection.id)}
            onToggleExpand={() => onToggleExpand(collection.id)}
        />
    ), [allBadges, allBadgeCollections, predefinedColors, updateBadgeCollection, handleDeleteCollection, addBadge, updateBadge, handleDeleteBadge, currentUserBadgeIds, expandedCollections, onToggleExpand]);
    
    const renderDragOverlay = (item: any) => {
        if (!item) return null;
        if (item.type === 'collection-card') {
            const collection = item.data.collection;
            return <GoogleSymbol
                name={collection.icon}
                style={{ color: collection.color, fontSize: '48px' }}
                weight={100}
                grade={-25}
                opticalSize={48}
            />
        }
        if (item.type === 'badge') {
            const badge = item.data.badge;
            return <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card shadow-lg" style={{ borderColor: badge.color }}>
                      <GoogleSymbol
                          name={badge.icon}
                          style={{ fontSize: '28px', color: badge.color }}
                          weight={100}
                      />
                    </div>
        }
        return null;
    }

    if (!viewAsUser) return null;

    return (
        <DndContext onDragEnd={onDragEnd} onDragStart={(e) => setActiveDragItem({type: e.active.data.current?.type, id: e.active.id as string, data: e.active.data.current})} sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}))}>
            <div className="flex h-full gap-4">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline text-2xl font-thin tracking-tight">{title}</h2>
                            <DuplicateZone id="duplicate-collection-zone" onAdd={() => addBadgeCollection(viewAsUser)} />
                        </div>
                        <div className="flex items-center gap-1">
                            <CompactSearchInput
                              searchTerm={mainSearchTerm}
                              setSearchTerm={setMainSearchTerm}
                              placeholder="Search collections..."
                              autoFocus={isActive}
                              showColorFilter={true}
                              onColorSelect={setColorFilter}
                              activeColorFilter={colorFilter}
                            />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                            <GoogleSymbol name="dynamic_feed" weight={100} opticalSize={20} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Show Shared Collections</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                    <CollectionDropZone id="collections-list" type="collection">
                         <DraggableGrid
                            items={displayedCollections}
                            setItems={reorderBadgeCollections}
                            renderItem={(item, isDragging) => renderCollectionCard(item as BadgeCollection, isDragging)}
                            renderDragOverlay={(item) => renderDragOverlay({type: 'collection-card', data: {collection: item}})}
                        />
                    </CollectionDropZone>
                    </ScrollArea>
                </div>
                <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96" : "w-0")}>
                    <div className={cn("h-full rounded-lg transition-all", isSharedPanelOpen ? "p-2" : "p-0")}>
                        <CollectionDropZone id="shared-collections-panel" type="collection-panel" className="h-full">
                            <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-headline font-thin text-xl">Shared Collections</CardTitle>
                                    <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." tooltipText="Search Shared Collections" />
                                </div>
                                <CardDescription>Drag a collection you own here to share it. Drag a collection to your board to link it.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-2 overflow-hidden min-h-[150px]">
                                <DraggableGrid
                                    items={sharedCollections}
                                    setItems={() => {}}
                                    renderItem={(item, isDragging) => renderSharedCollectionCard(item as BadgeCollection, isDragging)}
                                    renderDragOverlay={(item) => renderDragOverlay({type: 'collection-card', data: {collection: item}})}
                                >
                                    {sharedCollections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No other collections are currently shared.</p>}
                                </DraggableGrid>
                            </CardContent>
                            </Card>
                        </CollectionDropZone>
                    </div>
                </div>
            </div>
             <DragOverlay>
                {activeDragItem ? renderDragOverlay(activeDragItem) : null}
            </DragOverlay>
        </DndContext>
    );
}
