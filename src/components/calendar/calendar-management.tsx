

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type AppTab, type User, type AppPage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UICardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn, getHueFromHsl, isHueInRange } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { syncCalendar } from '@/ai/flows/sync-calendar-flow';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { CardTemplate } from '@/components/common/card-template';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HslStringColorPicker } from 'react-colorful';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { DraggableGrid } from '../common/draggable-grid';

function SortableCalendarCard({
    calendar,
    ...props
}: {
    calendar: SharedCalendar;
    [key: string]: any;
}) {
    const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
        id: calendar.id,
        data: { type: 'calendar-card', calendar, isSharedPreview: props.isSharedPreview },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("break-inside-avoid p-2", isDragging && "opacity-75 z-50")}>
            <div {...listeners} {...attributes}>
                <CalendarCard calendar={calendar} {...props} />
            </div>
        </div>
    );
}

function CalendarCard({
    calendar,
    onUpdate,
    onDelete,
    isExpanded,
    onToggleExpand,
    isSharedPreview = false,
}: {
    calendar: SharedCalendar;
    onUpdate: (id: string, data: Partial<SharedCalendar>) => void;
    onDelete: (calendar: SharedCalendar) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSharedPreview?: boolean;
}) {
  const { viewAsUser, users } = useUser();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [googleCalendarIdInput, setGoogleCalendarIdInput] = useState('');
  const linkDialogInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingDefaultTitle, setIsEditingDefaultTitle] = useState(false);
  const defaultTitleInputRef = useRef<HTMLInputElement>(null);

  const {toast} = useToast();
  
  const ownerUser = useMemo(() => users.find(u => u.userId === calendar.owner.id), [users, calendar.owner.id]);
  const canManage = useMemo(() => !isSharedPreview && viewAsUser.userId === calendar.owner.id, [isSharedPreview, viewAsUser, calendar]);

  const handleSaveDefaultTitle = useCallback(() => {
    const newTitle = defaultTitleInputRef.current?.value.trim();
    if (newTitle !== calendar.defaultEventTitle) {
      onUpdate(calendar.id, { defaultEventTitle: newTitle });
    }
    setIsEditingDefaultTitle(false);
  }, [calendar.id, calendar.defaultEventTitle, onUpdate, setIsEditingDefaultTitle]);
  
  useEffect(() => {
    if (!isEditingDefaultTitle) return;
    const handleOutsideClick = (event: MouseEvent) => {
        if (defaultTitleInputRef.current && !defaultTitleInputRef.current.contains(event.target as Node)) {
            handleSaveDefaultTitle();
        }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    defaultTitleInputRef.current?.focus();
    defaultTitleInputRef.current?.select();
    return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isEditingDefaultTitle, handleSaveDefaultTitle]);
  
  const handleDefaultTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveDefaultTitle(); }
    else if (e.key === 'Escape') setIsEditingDefaultTitle(false);
  };

  useEffect(() => {
    if (isLinkDialogOpen) {
      setTimeout(() => linkDialogInputRef.current?.focus(), 100);
    }
  }, [isLinkDialogOpen]);
  
  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!calendar.googleCalendarId) return;
    toast({ title: 'Sync Started', description: `Syncing with ${calendar.name}...` });
    try {
        const result = await syncCalendar({ googleCalendarId: calendar.googleCalendarId });
        console.log('Sync Result:', result);
        toast({ title: 'Sync Complete', description: `Found ${result.syncedEventCount} events in ${calendar.name}.` });
    } catch (error) {
        console.error('Sync failed:', error);
        toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not sync calendar.' });
    }
  };
  
  const handleSaveGoogleCalendarId = () => {
    if (canManage) {
        onUpdate(calendar.id, { googleCalendarId: googleCalendarIdInput });
        toast({ title: 'Success', description: 'Google Calendar ID linked.' });
    }
    setIsLinkDialogOpen(false);
    setGoogleCalendarIdInput('');
  };

  let shareIcon: string | null = null;
  let shareIconTitle: string = '';
  const shareIconColor = 'hsl(220, 13%, 47%)';

  const isOwned = ownerUser?.userId === viewAsUser.userId;

  if (isOwned && calendar.isShared) {
      shareIcon = 'change_circle';
      shareIconTitle = 'Owned & Shared by you';
  } else if (!isOwned && !isSharedPreview) { // It's a linked calendar on the main board
      shareIcon = 'link';
      shareIconTitle = `Owned by ${ownerUser?.displayName || 'another user'}`;
  } else if (isSharedPreview) { // In the shared panel
      shareIcon = 'change_circle';
      shareIconTitle = `Owned by ${ownerUser?.displayName || 'another user'}`;
  }


  return (
    <>
      <CardTemplate
        entity={calendar}
        onUpdate={onUpdate}
        onDelete={onDelete}
        canManage={canManage}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        isSharedPreview={isSharedPreview}
        shareIcon={shareIcon || undefined}
        shareIconTitle={shareIconTitle}
        shareIconColor={shareIconColor}
        headerControls={
            <>
            {canManage && !calendar.googleCalendarId && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsLinkDialogOpen(true)}>
                                <GoogleSymbol name="add_link" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Link Google Calendar</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
           {calendar.googleCalendarId && (
               <TooltipProvider>
                   <Tooltip>
                       <TooltipTrigger asChild>
                           <span tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { handleSync(e as any); }}}>
                               <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8 text-muted-foreground"
                                   onClick={handleSync}
                               >
                                   <GoogleSymbol name="sync" />
                               </Button>
                           </span>
                       </TooltipTrigger>
                       <TooltipContent>
                        <p>Sync with {calendar.googleCalendarId}</p>
                       </TooltipContent>
                   </Tooltip>
               </TooltipProvider>
           )}
            </>
        }
        body={
            <div className="space-y-1">
               {isEditingDefaultTitle ? (
                  <Input
                    ref={defaultTitleInputRef}
                    defaultValue={calendar.defaultEventTitle || ''}
                    onKeyDown={handleDefaultTitleKeyDown}
                    onBlur={handleSaveDefaultTitle}
                    className="h-auto p-0 text-xs italic border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="No default title"
                  />
                ) : (
                  <span 
                      className={cn("italic text-xs text-muted-foreground", canManage && "cursor-pointer")} 
                      onClick={(e) => {
                          e.stopPropagation();
                          if(canManage) setIsEditingDefaultTitle(true)
                      }}
                  >
                      {calendar.defaultEventTitle || 'No default title'}
                  </span>
                )}
            </div>
        }
      />
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveGoogleCalendarId}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Link Calendar</span>
              </Button>
            </div>
            <DialogHeader>
                <UIDialogTitle className="font-headline font-thin">Link Google Calendar</UIDialogTitle>
                <DialogDescription>
                    Paste the Google Calendar ID here to link it for syncing.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <Input
                  ref={linkDialogInputRef}
                  id="google-calendar-id"
                  placeholder="your-calendar-id@group.calendar.google.com"
                  value={googleCalendarIdInput}
                  onChange={(e) => setGoogleCalendarIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGoogleCalendarId()}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
            </div>
        </DialogContent>
      </Dialog>
    </>
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
                    <GoogleSymbol name="add_circle" className="text-4xl" />
                    <span className="sr-only">New Calendar or Drop to Duplicate</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{isOver ? 'Drop to Duplicate' : 'Add New Calendar'}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function CalendarDropZone({ id, type, children, className }: { id: string; type: string; children: React.ReactNode; className?: string; }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type } });

  return (
    <div ref={setNodeRef} className={cn(className, "transition-all rounded-lg", isOver && "ring-1 ring-border ring-inset")}>
      {children}
    </div>
  );
}


export function CalendarManagement({ tab, page }: { tab: AppTab; page: AppPage }) {
  const { viewAsUser, calendars, addCalendar, updateCalendar, deleteCalendar, updateAppTab, appSettings, updateUser, reorderCalendars } = useUser();
  const { toast } = useToast();
  
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
  const [sharedSearchTerm, setSharedSearchTerm] = useState('');
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set());

  const onToggleExpand = useCallback((calendarId: string) => {
      setExpandedCalendars(prev => {
          const newSet = new Set(prev);
          if (newSet.has(calendarId)) {
              newSet.delete(calendarId);
          } else {
              newSet.add(calendarId);
          }
          return newSet;
      });
  }, []);

  const title = appSettings.calendarManagementLabel || tab.name;
  
  const handleAddCalendar = (sourceCalendar?: SharedCalendar) => {
    const calendarCount = calendars.length;
    let newCalendarData: Omit<SharedCalendar, 'id'>;

    if (sourceCalendar) {
        newCalendarData = {
            ...JSON.parse(JSON.stringify(sourceCalendar)),
            name: `${sourceCalendar.name} (Copy)`,
            isShared: false,
            owner: { type: 'user', id: viewAsUser.userId },
            defaultEventTitle: sourceCalendar.defaultEventTitle ? `${sourceCalendar.defaultEventTitle} (Copy)` : `New Event in ${sourceCalendar.name} (Copy)`,
        };
    } else {
        const newName = `New Calendar ${calendarCount + 1}`;
        newCalendarData = {
            name: newName,
            icon: 'calendar_month',
            color: 'hsl(220, 13%, 47%)',
            owner: { type: 'user', id: viewAsUser.userId },
            defaultEventTitle: `New ${newName} Event`,
        };
    }
    addCalendar(newCalendarData);
    toast({ title: 'New Calendar Added' });
  };
  
  const handleUpdate = async (calendarId: string, data: Partial<SharedCalendar>) => {
    await updateCalendar(calendarId, data);
  };
  
  const handleDelete = (calendar: SharedCalendar) => {
    const isOwner = calendar.owner.id === viewAsUser.userId;
    if (isOwner) {
        deleteCalendar(calendar.id);
        toast({ title: 'Calendar Deleted' });
    } else { // Unlink
        const updatedLinkedIds = (viewAsUser.linkedCalendarIds || []).filter(id => id !== calendar.id);
        updateUser(viewAsUser.userId, { linkedCalendarIds: updatedLinkedIds });
        toast({ title: 'Calendar Unlinked', description: `"${calendar.name}" has been removed from your board.`});
    }
  };
  
  const displayedCalendars = useMemo(() => {
    let filtered = calendars
      .filter(c => c.owner.id === viewAsUser.userId || (viewAsUser.linkedCalendarIds || []).includes(c.id))
      .filter(c => c.name.toLowerCase().includes(mainSearchTerm.toLowerCase()));
      
    if (colorFilter) {
        const targetHue = getHueFromHsl(colorFilter);
        if (targetHue !== null) {
            filtered = filtered.filter(c => {
                const itemHue = getHueFromHsl(c.color);
                return itemHue !== null && isHueInRange(targetHue, itemHue);
            });
        }
    }
    return filtered;
  }, [calendars, mainSearchTerm, colorFilter, viewAsUser]);

  const sharedCalendars = useMemo(() => {
    const displayedIds = new Set(displayedCalendars.map(c => c.id));
    return calendars.filter(c => c.isShared && c.owner.id !== viewAsUser.userId && !displayedIds.has(c.id) && c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
  }, [calendars, displayedCalendars, sharedSearchTerm, viewAsUser.userId]);

  const onDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
  
      const activeCalendar = active.data.current?.calendar as SharedCalendar;
      if (!activeCalendar) return;

      if (over.id === 'duplicate-calendar-zone') {
        handleAddCalendar(activeCalendar);
        const isLinked = activeCalendar.owner.id !== viewAsUser.userId;
        if (isLinked) {
            const updatedLinkedIds = (viewAsUser.linkedCalendarIds || []).filter(id => id !== activeCalendar.id);
            updateUser(viewAsUser.userId, { linkedCalendarIds: updatedLinkedIds });
            toast({ title: 'Calendar Copied', description: `Original shared calendar "${activeCalendar.name}" has been unlinked.`});
        }
        return;
      }

      if (over.id === 'shared-calendars-panel') {
        const isOwner = activeCalendar.owner.id === viewAsUser.userId;
        if (isOwner) { // Owned calendar dragged to share/unshare
            const newSharedState = !activeCalendar.isShared;
            updateCalendar(activeCalendar.id, { isShared: newSharedState });
            toast({ title: newSharedState ? 'Calendar Shared' : 'Calendar Unshared' });
        } else { // Linked calendar dragged back to unlink
            const updatedLinkedIds = (viewAsUser.linkedCalendarIds || []).filter(id => id !== activeCalendar.id);
            updateUser(viewAsUser.userId, { linkedCalendarIds: updatedLinkedIds });
            toast({ title: 'Calendar Unlinked' });
        }
        return;
      }
      
      if (active.data.current?.isSharedPreview && over.id === 'main-calendars-grid') {
         const updatedLinkedIds = [...(viewAsUser.linkedCalendarIds || []), activeCalendar.id];
         updateUser(viewAsUser.userId, { linkedCalendarIds: Array.from(new Set(updatedLinkedIds)) });
         toast({ title: 'Calendar Linked' });
        return;
      }
      
      const overIsCard = over.data.current?.type === 'calendar';
      if(overIsCard && active.id !== over.id) {
          const oldIndex = displayedCalendars.findIndex(t => t.id === active.id);
          const newIndex = displayedCalendars.findIndex(t => t.id === over.id);
          if(oldIndex !== -1 && newIndex !== -1) {
              reorderCalendars(arrayMove(displayedCalendars, oldIndex, newIndex));
          }
      }
  };
  
  const renderCalendarCard = (calendar: SharedCalendar) => (
      <SortableCalendarCard
        key={calendar.id}
        calendar={calendar}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isExpanded={expandedCalendars.has(calendar.id)}
        onToggleExpand={() => onToggleExpand(calendar.id)}
      />
  );
  
  const renderSharedCalendarCard = (calendar: SharedCalendar) => (
      <SortableCalendarCard
        key={calendar.id}
        calendar={calendar}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSharedPreview={true}
        isExpanded={expandedCalendars.has(calendar.id)}
        onToggleExpand={() => onToggleExpand(calendar.id)}
      />
  );

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-headline text-2xl font-thin tracking-tight">{title}</h2>
            <DuplicateZone id="duplicate-calendar-zone" onAdd={() => handleAddCalendar()} />
          </div>
          <div className="flex items-center gap-2">
            <CompactSearchInput
              searchTerm={mainSearchTerm}
              setSearchTerm={setMainSearchTerm}
              placeholder="Search calendars..."
              tooltipText="Search Calendars"
              showColorFilter={true}
              onColorSelect={setColorFilter}
              activeColorFilter={colorFilter}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                    <GoogleSymbol name="dynamic_feed" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Show Shared Calendars</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
            <DraggableGrid 
                items={displayedCalendars} 
                setItems={reorderCalendars}
                onDragEnd={onDragEnd}
                renderItem={(item) => renderCalendarCard(item as SharedCalendar)}
                renderDragOverlay={(item) => <GoogleSymbol name={item.icon} style={{color: item.color, fontSize: '48px'}} />}
            />
        </ScrollArea>
      </div>

      <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96" : "w-0")}>
        <div className={cn("h-full rounded-lg transition-all", isSharedPanelOpen ? "p-2" : "p-0")}>
          <CalendarDropZone id="shared-calendars-panel" type="shared-calendar-panel" className="h-full">
              <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
              <CardHeader>
                  <div className="flex items-center justify-between">
                  <CardTitle className="font-headline font-thin text-xl">Shared Calendars</CardTitle>
                  <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." tooltipText="Search Shared Calendars" />
                  </div>
                  <UICardDescription>Drag a calendar to your board to link it.</UICardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-2 overflow-hidden">
                   <DraggableGrid 
                      items={sharedCalendars} 
                      setItems={() => {}}
                      onDragEnd={onDragEnd}
                      renderItem={(item) => renderSharedCalendarCard(item as SharedCalendar)}
                      renderDragOverlay={(item) => <GoogleSymbol name={item.icon} style={{color: item.color, fontSize: '48px'}} />}
                  />
              </CardContent>
              </Card>
          </CalendarDropZone>
        </div>
      </div>
    </div>
  );
}
