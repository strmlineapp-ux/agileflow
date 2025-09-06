

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
  pointerWithin,
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
import { SharedItemsPanel } from '../common/shared-items-panel';
import { PageTitle } from '../common/page-title';
import { predefinedColors } from '@/lib/colors';
import { IconColorPicker } from '../common/icon-color-picker';
import { ManagementPageLayout } from '../common/management-page-layout';


function BadgeDisplayItem({ 
    badge, 
    viewMode, 
    onUpdateBadge, 
    onDelete,
    isViewer = false, 
    isOwner,
    isLinked,
    isSharedPreview,
    allCollections,
    isCollectionEditing,
    dragHandleProps,
    currentUserBadgeIds,
    isExpanded,
    onToggleExpand
}: { 
    badge: Badge;
    viewMode: BadgeCollection['viewMode'];
    onUpdateBadge: (badgeId: string, badgeData: Partial<Badge>) => void;
    onDelete: (badgeId: string) => void;
    isViewer?: boolean;
    isOwner: boolean;
    isLinked: boolean;
    isSharedPreview?: boolean;
    allCollections: BadgeCollection[];
    isCollectionEditing: boolean;
    dragHandleProps?: any;
    currentUserBadgeIds?: Set<string>;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const { users } = useUser();

    const handleUpdate = useCallback((data: Partial<Badge>) => {
        onUpdateBadge(badge.id, data);
    }, [badge.id, onUpdateBadge]);

    const ownerUser = users.find(u => u.userId === badge.owner.id);
        
    const nameEditorElement = (
        <InlineEditor
            value={badge.name}
            onSave={(newValue) => handleUpdate({ name: newValue })}
            disabled={!isOwner}
            className={cn("break-words font-emphasis", viewMode === 'grid' ? "text-base" : "text-sm", isOwner && "cursor-text")}
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
        <div className="flex items-start gap-2 p-2 relative" {...dragHandleProps}>
            <div className="relative">
                <IconColorPicker
                    icon={badge.icon}
                    color={badge.color}
                    onUpdateIcon={(newIcon) => handleUpdate({ icon: newIcon })}
                    onUpdateColor={(newColor) => handleUpdate({ color: newColor })}
                    disabled={!isOwner}
                />
                 {shouldShowLinkIcon && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full ring-2 ring-card flex items-center justify-center text-white" style={{ backgroundColor: '#64748B' }}>
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
                {isExpanded && descriptionEditorElement}
            </div>
            <div className="absolute -bottom-1 right-0">
              <Button variant="ghost" size="icon" onClick={onToggleExpand} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
              </Button>
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
                     <IconColorPicker
                        icon={badge.icon}
                        color={badge.color}
                        onUpdateIcon={(newIcon) => handleUpdate({ icon: newIcon })}
                        onUpdateColor={(newColor) => handleUpdate({ color: newColor })}
                        disabled={!isOwner}
                        buttonClassName="h-auto p-0 hover:bg-transparent"
                        iconClassName='text-3xl'
                     />
                     {shouldShowLinkIcon && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute -top-0.5 -left-1 h-4 w-4 rounded-full ring-2 ring-card flex items-center justify-center text-white" style={{ backgroundColor: '#64748B' }}>
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
              className="h-8 w-8 text-muted-foreground font-emphasis"
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
    const [expandedBadges, setExpandedBadges] = useState<Set<string>>(new Set());
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const isOwner = useMemo(() => collection.owner.id === viewAsUser.userId, [collection.owner.id, viewAsUser.userId]);
    
    const onToggleBadgeExpand = useCallback((badgeId: string) => {
        setExpandedBadges(prev => {
            const newSet = new Set(prev);
            if (newSet.has(badgeId)) newSet.delete(badgeId);
            else newSet.add(badgeId);
            return newSet;
        });
    }, []);

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
        buttonRefs.current[application]?.blur();
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground font-emphasis">
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
                            <Button
                                variant="ghost"
                                size="icon"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => { onUpdateCollection(collection.id, { viewMode: mode }); setIsViewModePopoverOpen(false); }}
                                className={cn(
                                    "h-8 w-8",
                                    collection.viewMode === mode ? 'font-emphasized' : 'font-emphasis'
                                )}
                            >
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
      <div className="space-y-2">
        <InlineEditor
            value={collection.description || ''}
            onSave={(newDesc) => onUpdateCollection(collection.id, { description: newDesc })}
            disabled={!isOwner}
            placeholder="Click to add a description..."
            className="text-sm text-foreground"
        />
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
                isOwner={badgeIsOwned}
                isLinked={!badgeIsOwned}
                allCollections={allCollections}
                isSharedPreview={isSharedPreview}
                currentUserBadgeIds={currentUserBadgeIds}
                isExpanded={expandedBadges.has(badge.id)}
                onToggleExpand={() => onToggleBadgeExpand(badge.id)}
              />
            );
          })}
        </DroppableCollectionContent>
      </div>
    );
    
    const footerContent = (
      <div className="flex items-center justify-end w-full">
        <div className="flex flex-wrap items-center gap-1">
          {associationsToRender.map(app => {
            const isActive = collection.applications?.includes(app.key);
            return (
              <TooltipProvider key={app.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      ref={el => buttonRefs.current[app.key] = el}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground font-emphasis"
                      data-state={isActive ? "active" : "inactive"}
                      onClick={() => handleToggleApplication(app.key)}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={!isOwner}
                    >
                      <GoogleSymbol name={app.icon} className="text-lg" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{app.label}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
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
            footer={footerContent}
        />
    );
}

export function BadgeManagement({ tab, page, isActive }: { tab: AppTab; page: AppPage; isActive: boolean }) {
    const { viewAsUser, users, updateUser, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, setAllBadgeCollections, reorderBadgeCollections, updatePage } = useUser();
    const { toast } = useToast();
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

    const onToggleExpand = useCallback((collectionId: string) => {
        setExpandedCollections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(collectionId)) newSet.delete(collectionId);
            else newSet.add(collectionId);
            return newSet;
        });
    }, []);

    const handleUpdate = (collectionId: string, data: Partial<BadgeCollection>) => {
        updateBadgeCollection(collectionId, data);
    };
    
    const handleDelete = (collection: BadgeCollection) => {
        if (collection.owner.id === viewAsUser.userId) {
            deleteBadgeCollection(collection.id);
        } else {
            const updatedLinkedIds = (viewAsUser.linkedBadgeCollectionIds || []).filter(id => id !== collection.id);
            updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: updatedLinkedIds });
            toast({ title: "Collection unlinked", description: `"${collection.name}" has been removed from your board.`});
        }
    };
    
    const handleLink = (collectionId: string) => {
        const updatedLinkedIds = [...(viewAsUser.linkedBadgeCollectionIds || []), collectionId];
        updateUser(viewAsUser.userId, { linkedBadgeCollectionIds: Array.from(new Set(updatedLinkedIds))});
    };

    const handleAddCollection = (sourceCollection?: BadgeCollection) => {
        addBadgeCollection(viewAsUser, sourceCollection);
    };

    const displayedCollections = useMemo(() => {
        return allBadgeCollections
            .filter(c => (c.owner && c.owner.id === viewAsUser.userId) || (viewAsUser.linkedBadgeCollectionIds || []).includes(c.id));
    }, [allBadgeCollections, viewAsUser]);

    const sharedCollections = useMemo(() => {
        const displayedIds = new Set(displayedCollections.map(c => c.id));
        return allBadgeCollections.filter(c => c.isShared && c.owner?.id !== viewAsUser.userId && !displayedIds.has(c.id));
    }, [allBadgeCollections, displayedCollections, viewAsUser.userId]);

    const renderCollectionCard = useCallback((collection: BadgeCollection, isDragging: boolean) => {
        const userBadgeIds = new Set(allBadges.filter(b => b.owner.id === viewAsUser.userId).map(b => b.id));

        return (
            <SortableItem key={collection.id} id={collection.id} data={{ type: 'collection-card', collection, isSharedPreview: false }}>
              {(isDragging) => (
                <BadgeCollectionCard
                    collection={collection}
                    allBadges={allBadges}
                    onUpdateCollection={handleUpdate}
                    onDeleteCollection={handleDelete}
                    onAddBadge={addBadge}
                    onUpdateBadge={updateBadge}
                    onDeleteBadge={deleteBadge}
                    isViewer={!viewAsUser}
                    isExpanded={expandedCollections.has(collection.id)}
                    onToggleExpand={() => onToggleExpand(collection.id)}
                    currentUserBadgeIds={userBadgeIds}
                    allCollections={allBadgeCollections}
                />
              )}
            </SortableItem>
        );
    }, [handleUpdate, handleDelete, addBadge, updateBadge, deleteBadge, viewAsUser, expandedCollections, onToggleExpand, allBadges, allBadgeCollections]);
    
    const renderSharedCollectionCard = useCallback((collection: BadgeCollection, isDragging: boolean) => {
        const userBadgeIds = new Set(allBadges.filter(b => b.owner.id === viewAsUser.userId).map(b => b.id));
        return (
            <SortableItem key={collection.id} id={collection.id} data={{ type: 'collection-card', collection, isSharedPreview: true }}>
              {(isDragging) => (
                <BadgeCollectionCard
                    collection={collection}
                    allBadges={allBadges}
                    onUpdateCollection={handleUpdate}
                    onDeleteCollection={handleDelete}
                    onAddBadge={addBadge}
                    onUpdateBadge={updateBadge}
                    onDeleteBadge={deleteBadge}
                    isSharedPreview={true}
                    isViewer={!viewAsUser}
                    isExpanded={expandedCollections.has(collection.id)}
                    onToggleExpand={() => onToggleExpand(collection.id)}
                    currentUserBadgeIds={userBadgeIds}
                    allCollections={allBadgeCollections}
                />
              )}
            </SortableItem>
        );
    }, [handleUpdate, handleDelete, addBadge, updateBadge, deleteBadge, viewAsUser, expandedCollections, onToggleExpand, allBadges, allBadgeCollections]);

    const renderDragOverlay = useCallback((item: BadgeCollection | Badge) => {
        if ('badgeIds' in item) { // It's a BadgeCollection
            return <GoogleSymbol name={item.icon} style={{color: item.color, fontSize: '48px'}} />;
        }
        // It's a Badge
        return (
            <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card shadow-lg" style={{ borderColor: item.color }}>
                <GoogleSymbol name={item.icon} style={{ fontSize: '28px', color: item.color }} weight={100} />
            </div>
        );
    }, []);

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
    
        // Handle dropping a badge
        if (active.data.current?.type === 'badge') {
            const badge = active.data.current.badge as Badge;
            const sourceCollectionId = active.data.current.collectionId;
            const targetCollectionId = over.data.current?.type === 'collection'
                ? over.data.current.collection.id
                : over.data.current?.collectionId;

            if (targetCollectionId) {
                const targetCollection = allBadgeCollections.find(c => c.id === targetCollectionId);
                const sourceCollection = allBadgeCollections.find(c => c.id === sourceCollectionId);

                if(targetCollection && sourceCollection && targetCollection.owner.id === viewAsUser.userId) {
                    deleteBadge(badge.id, sourceCollection.id);
                    // Add/link badge to the new collection
                    updateBadgeCollection(targetCollection.id, {
                        badgeIds: [badge.id, ...targetCollection.badgeIds]
                    });
                }
            } else if (over.data.current?.type === 'duplicate-badge-zone') {
                const collectionId = over.data.current.collectionId;
                addBadge(collectionId, badge);
            }
        }
    };

    return (
        <ManagementPageLayout
            pageTitle={page.displayTitle ?? tab.name}
            onPageTitleSave={(newTitle) => updatePage(page.id, { displayTitle: newTitle })}
            onPageTitleReset={(e) => {
                if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
                    e.preventDefault();
                    updatePage(page.id, { displayTitle: null });
                    toast({ title: "Title Reset" });
                }
            }}
            canManagePage={viewAsUser.isAdmin}
            entityType="collection"
            allItems={displayedCollections}
            allSharedItems={sharedCollections}
            onAddItem={handleAddCollection}
            onUpdateItem={handleUpdate}
            onDeleteItem={handleDelete}
            onReorderItems={reorderBadgeCollections}
            onLinkItem={handleLink}
            renderItem={renderCollectionCard}
            renderDragOverlay={renderDragOverlay}
            isActive={isActive}
            onDragEnd={onDragEnd}
        />
    );
}

