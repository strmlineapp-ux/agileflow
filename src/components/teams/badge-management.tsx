
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ManagementPageLayout } from '../common/management-page-layout';
import { predefinedColors } from '@/lib/colors';
import { IconColorPicker } from '../common/icon-color-picker';
import { InlineEditor } from '../common/inline-editor';
import { SortableItem } from '../common/sortable-item';
import { SettingSelect } from '../common/setting-select';


function BadgeDisplayItem({ 
    badge, 
    viewMode, 
    onUpdateBadge,
    onDeleteBadge,
    isOwner,
    isLinked,
    isSharedPreview,
    dragHandleProps,
    currentUserBadgeIds,
    isExpanded,
    onToggleExpand,
    collection,
    allCollections,
}: { 
    badge: Badge;
    viewMode: BadgeCollection['viewMode'];
    onUpdateBadge: (badgeId: string, badgeData: Partial<Badge>) => void;
    onDeleteBadge: (badgeId: string, collectionId: string) => void;
    isOwner: boolean;
    isLinked: boolean;
    isSharedPreview?: boolean;
    dragHandleProps?: any;
    currentUserBadgeIds?: Set<string>;
    isExpanded: boolean;
    onToggleExpand: () => void;
    collection: BadgeCollection;
    allCollections: BadgeCollection[];
}) {
    const { users, viewAsUser } = useUser();
    
    const handleUpdate = useCallback((data: Partial<Badge>) => {
        onUpdateBadge(badge.id, data);
    }, [badge.id, onUpdateBadge]);

    const ownerUser = users.find(u => u.userId === badge.owner.id);
    const ownerCollection = allCollections.find(c => c.id === badge.ownerCollectionId);
      
    const descriptionElement = (
        <InlineEditor
            value={badge.description || ''}
            onSave={(newValue) => handleUpdate({ description: newValue })}
            disabled={!isOwner}
            placeholder={isLinked ? "No description" : "Click to add description."}
            className="text-sm text-foreground"
        />
    );
      
    const bodyContent = (
      <>
        {isExpanded && descriptionElement}
      </>
    );

    const badgeContent = (
      <div className="group relative w-full" {...dragHandleProps}>
        <div className={cn(
          "flex items-center gap-2 p-2",
          viewMode === 'compact' && "flex-col items-center justify-center text-center"
        )}>
            <div className="relative">
                <IconColorPicker
                    icon={badge.icon}
                    color={badge.color}
                    onUpdateIcon={(newIcon) => handleUpdate({ icon: newIcon })}
                    onUpdateColor={(newColor) => handleUpdate({ color: newColor })}
                    disabled={!isOwner}
                />
                {isLinked && (
                    <div 
                        className="absolute -top-0.5 -left-1 h-4 w-4 rounded-full ring-2 ring-card flex items-center justify-center text-white"
                        style={{ backgroundColor: ownerCollection?.color || 'hsl(var(--muted-foreground))' }}
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <GoogleSymbol name="link" style={{fontSize: '16px'}} weight={100} opticalSize={20} />
                                </TooltipTrigger>
                                <TooltipContent><p>From {ownerCollection?.name}. Owned by {ownerUser?.displayName}.</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <InlineEditor
                  value={badge.name}
                  onSave={(newValue) => handleUpdate({ name: newValue })}
                  disabled={!isOwner}
                  className="font-normal break-words font-emphasis"
                />
                {isExpanded && viewMode !== 'compact' && <div className="mt-1">{bodyContent}</div>}
            </div>
            {viewMode !== 'compact' && (
                <Button variant="ghost" size="icon" onClick={onToggleExpand} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                    <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                </Button>
            )}
        </div>

        {isOwner && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onPointerDown={(e) => e.stopPropagation()}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-6 w-6 p-0 bg-card font-emphasis"
                                onClick={() => onDeleteBadge(badge.id, collection.id)}
                            >
                                <GoogleSymbol name="cancel" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isLinked ? "Unlink Badge" : "Delete Badge"}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )}
      </div>
    );
    
    if(viewMode === 'compact' && badge.description) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                    <TooltipContent><p>{badge.description}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return badgeContent;
}

function SortableBadgeItem({ badge, collection, onDeleteBadge, ...props }: { badge: Badge, collection: BadgeCollection, onDeleteBadge: (badgeId: string, collectionId: string) => void, [key: string]: any }) {
    
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
    
    return (
        <div ref={setNodeRef} style={style} className={cn("bg-muted/30 rounded-md", props.viewMode !== 'list' && "break-inside-avoid")}>
            <div className="relative flex w-full" {...listeners} {...attributes}>
                <div className="flex-grow">
                    <BadgeDisplayItem 
                        badge={badge}
                        collection={collection}
                        onDeleteBadge={onDeleteBadge}
                        {...props} 
                    />
                </div>
            </div>
        </div>
    );
}

function DroppableCollectionContent({ collection, children }: { collection: BadgeCollection, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: collection.id, data: { type: 'collection', collection }});
    
    let strategy;
    let gridLayoutClass;
    switch(collection.viewMode) {
      case 'list':
        strategy = verticalListSortingStrategy;
        gridLayoutClass = "flex flex-col gap-1";
        break;
      case 'grid':
        strategy = rectSortingStrategy;
        gridLayoutClass = "grid grid-cols-2 w-full gap-4";
        break;
      case 'compact':
      default:
        strategy = rectSortingStrategy;
        gridLayoutClass = "w-full gap-2 [column-fill:_balance] columns-2 sm:columns-3";
        break;
    }
    
    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "min-h-[60px] rounded-md p-2 transition-all w-full",
                isOver && "ring-1 ring-border ring-inset",
                gridLayoutClass
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
    onAddBadge: (collectionId: string, sourceBadge?: Badge, unlinkSource?: boolean) => void;
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

    const viewModeOptions = [
        { value: 'compact', label: 'Compact View', icon: 'view_module' },
        { value: 'grid', label: 'Grid View', icon: 'view_comfy_alt' },
        { value: 'list', label: 'List View', icon: 'view_list' }
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
         <SettingSelect
            value={collection.viewMode}
            onSave={(newValue) => onUpdateCollection(collection.id, { viewMode: newValue as any })}
            options={viewModeOptions}
            triggerIcon={viewModeOptions.find(o => o.value === collection.viewMode)?.icon || 'view_module'}
            tooltip="Change View Mode"
            disabled={!isOwner}
          />
      </>
    );

    const bodyContent = (
      <div className="space-y-2">
        <InlineEditor
            value={collection.description || ''}
            onSave={(newDesc) => onUpdateCollection(collection.id, { description: newDesc })}
            disabled={!isOwner}
            placeholder="Click to add a description..."
            className="text-sm"
        />
        <DroppableCollectionContent collection={collection}>
          {collectionBadges.map((badge) => {
            const isBadgeLinked = badge.ownerCollectionId !== collection.id;
            return (
              <SortableBadgeItem
                key={badge.id}
                badge={badge}
                collection={collection}
                viewMode={collection.viewMode}
                onUpdateBadge={onUpdateBadge}
                onDeleteBadge={onDeleteBadge}
                isViewer={isViewer}
                isOwner={badge.owner.id === viewAsUser.userId}
                isLinked={isBadgeLinked}
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

export function BadgeManagement({ tab, page, isActive, isSharedPanelOpen, setIsSharedPanelOpen, isDragging }: { tab: AppTab; page: AppPage; isActive: boolean; isSharedPanelOpen: boolean; setIsSharedPanelOpen: (isOpen: boolean) => void; isDragging: boolean; }) {
    const { viewAsUser, users, updateUser, allBadges, allBadgeCollections, addBadgeCollection, updateBadgeCollection, deleteBadgeCollection, addBadge, updateBadge, deleteBadge, reorderBadges, setAllBadgeCollections, reorderBadgeCollections, updatePage } = useUser();
    const { toast } = useToast();
    const contextKey = `badges-${page.id}`;
    
    const onToggleExpand = useCallback((collectionId: string) => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        const currentExpanded = new Set(currentState[contextKey] || []);
        if (currentExpanded.has(collectionId)) {
            currentExpanded.delete(collectionId);
        } else {
            currentExpanded.add(collectionId);
        }
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: Array.from(currentExpanded) } });
    }, [viewAsUser, updateUser, contextKey]);
    
    const onCollapseAll = () => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: [] } });
    };

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

    const handleAddBadge = (collectionId: string, sourceBadge?: Badge, unlinkSource: boolean = false) => {
        addBadge(collectionId, sourceBadge, realUser, unlinkSource);
    };

    const displayedCollections = useMemo(() => {
        return allBadgeCollections
            .filter(c => (c.owner && c.owner.id === viewAsUser.userId) || (viewAsUser.linkedBadgeCollectionIds || []).includes(c.id));
    }, [allBadgeCollections, viewAsUser]);

    const sharedCollections = useMemo(() => {
        const displayedIds = new Set(displayedCollections.map(c => c.id));
        return allBadgeCollections.filter(c => c.isShared && c.owner?.id !== viewAsUser.userId && !displayedIds.has(c.id));
    }, [allBadgeCollections, displayedCollections, viewAsUser.userId]);

    const renderCollectionCard = useCallback((collection: BadgeCollection) => {
        const userBadgeIds = new Set(allBadges.filter(b => b.owner.id === viewAsUser.userId).map(b => b.id));
        const expandedCardIds = viewAsUser?.expandedCardState?.[contextKey] || [];
        return (
            <SortableItem key={collection.id} id={collection.id} data={{ type: 'collection-card', collection, isSharedPreview: false }}>
              {(isDragging: boolean) => (
                <BadgeCollectionCard
                    collection={collection}
                    allBadges={allBadges}
                    onUpdateCollection={handleUpdate}
                    onDeleteCollection={handleDelete}
                    onAddBadge={(collectionId, sourceBadge) => {
                        const isLinked = sourceBadge ? sourceBadge.ownerCollectionId !== collectionId : false;
                        addBadge(collectionId, sourceBadge, isLinked)
                    }}
                    onUpdateBadge={updateBadge}
                    onDeleteBadge={deleteBadge}
                    isViewer={!viewAsUser}
                    isExpanded={expandedCardIds.includes(collection.id)}
                    onToggleExpand={() => onToggleExpand(collection.id)}
                    currentUserBadgeIds={userBadgeIds}
                    allCollections={allBadgeCollections}
                />
              )}
            </SortableItem>
        );
    }, [handleUpdate, handleDelete, addBadge, updateBadge, deleteBadge, viewAsUser, onToggleExpand, allBadges, allBadgeCollections, contextKey]);

    const renderDragOverlay = useCallback((item: any) => {
        if (item?.type === 'badge') {
            const badge = item.badge as Badge;
            return (
                <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center bg-card shadow-lg" style={{ borderColor: badge.color }}>
                    <GoogleSymbol name={badge.icon} style={{ fontSize: '28px', color: badge.color }} weight={100} />
                </div>
            );
        }
        if (item?.type === 'collection-card') {
            const collection = item.collection as BadgeCollection;
            return <GoogleSymbol name={collection.icon} style={{color: collection.color, fontSize: '48px'}} />;
        }
        return null;
    }, []);

    const { realUser } = useUser();

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
            onCollapseAll={onCollapseAll}
            renderItem={renderCollectionCard}
            renderDragOverlay={(item: any) => renderDragOverlay({type: item.type, ...item})}
            isActive={isActive}
            isSharedPanelOpen={isSharedPanelOpen}
            setIsSharedPanelOpen={setIsSharedPanelOpen}
            isDragging={isDragging}
        />
    );
}
