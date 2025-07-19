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
import { cn } from '@/lib/utils';
import { googleSymbolNames } from '@/lib/google-symbols';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { syncCalendar } from '@/ai/flows/sync-calendar-flow';
import { CompactSearchInput } from '@/components/common/compact-search-input';
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
import { HexColorPicker, HexColorInput } from 'react-colorful';


const PREDEFINED_COLORS = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function CalendarCard({
    calendar,
    onUpdate,
    onDelete,
    dragHandleProps,
    isDragging,
    isEditingName,
    setIsEditingName,
    isSharedPreview = false,
}: {
    calendar: SharedCalendar;
    onUpdate: (id: string, data: Partial<SharedCalendar>) => void;
    onDelete: (calendar: SharedCalendar) => void;
    dragHandleProps?: any;
    isDragging?: boolean;
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
    isSharedPreview?: boolean;
}) {
  const { viewAsUser, users } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  const [color, setColor] = useState(calendar.color);
  
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [googleCalendarIdInput, setGoogleCalendarIdInput] = useState('');
  const linkDialogInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingDefaultTitle, setIsEditingDefaultTitle] = useState(false);
  const defaultTitleInputRef = useRef<HTMLInputElement>(null);

  const {toast} = useToast();
  
  const ownerUser = useMemo(() => users.find(u => u.userId === calendar.owner.id), [users, calendar.owner.id]);
  const canManage = useMemo(() => !isSharedPreview && viewAsUser.userId === calendar.owner.id, [isSharedPreview, viewAsUser, calendar]);

  const handleSaveName = useCallback(() => {
    const newName = nameInputRef.current?.value.trim();
    if (newName && newName !== calendar.name) {
      onUpdate(calendar.id, { name: newName });
    }
    setIsEditingName(false);
  }, [calendar.id, calendar.name, onUpdate, setIsEditingName]);

  const handleSaveDefaultTitle = useCallback(() => {
    const newTitle = defaultTitleInputRef.current?.value.trim();
    if (newTitle !== calendar.defaultEventTitle) {
      onUpdate(calendar.id, { defaultEventTitle: newTitle });
    }
    setIsEditingDefaultTitle(false);
  }, [calendar.id, calendar.defaultEventTitle, onUpdate, setIsEditingDefaultTitle]);
  
  useEffect(() => {
    if (!isEditingName) return;
    const handleOutsideClick = (event: MouseEvent) => {
        if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
            handleSaveName();
        }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
    return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isEditingName, handleSaveName]);
  
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

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
    else if (e.key === 'Escape') setIsEditingName(false);
  };
  
  const handleDefaultTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveDefaultTitle(); }
    else if (e.key === 'Escape') setIsEditingDefaultTitle(false);
  };

  useEffect(() => {
    if (isIconPopoverOpen) {
      setTimeout(() => iconSearchInputRef.current?.focus(), 100);
    } else {
      setIconSearch('');
    }
  }, [isIconPopoverOpen]);

  useEffect(() => {
    if (isLinkDialogOpen) {
      setTimeout(() => linkDialogInputRef.current?.focus(), 100);
    }
  }, [isLinkDialogOpen]);

  const filteredIcons = useMemo(() => googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);
  
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
  let shareIconColor = ownerUser?.primaryColor || '#64748B';

  if (canManage && calendar.isShared) {
      shareIcon = 'upload';
      shareIconTitle = 'Owned by you and shared';
  } else if (!canManage && !isSharedPreview) { // It's a linked calendar on the main board
      shareIcon = 'downloading';
      shareIconTitle = `Shared by ${ownerUser?.displayName || 'another user'}`;
  }

  return (
    <>
      <Card className="group relative flex flex-col bg-transparent h-full">
          {!isSharedPreview && (
              <div onPointerDown={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                  <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{canManage ? "Delete Calendar" : "Unlink Calendar"}</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
          )}

          <div className="p-2 flex-grow flex flex-col" {...dragHandleProps}>
              <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                          <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} disabled={!canManage}>
                                               <Button variant="ghost" className="h-10 w-12 flex items-center justify-center p-0">
                                                    <GoogleSymbol name={calendar.icon} opticalSize={20} grade={-25} style={{ fontSize: '36px' }} weight={100} />
                                                </Button>
                                          </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Change Icon</p></TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                              <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1 p-2 border-b">
                                      <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} />
                                      <input
                                          ref={iconSearchInputRef}
                                          placeholder="Search icons..."
                                          value={iconSearch}
                                          onChange={(e) => setIconSearch(e.target.value)}
                                          className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                      />
                                  </div>
                                  <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                  <TooltipProvider key={iconName}>
                                      <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant={calendar.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(calendar.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} className="text-4xl" weight={100} /></Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>{iconName}</p></TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                                  ))}</div></ScrollArea>
                              </PopoverContent>
                          </Popover>
                          <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()} disabled={!canManage}>
                                              <button className={cn("absolute -bottom-0 -right-3 h-4 w-4 rounded-full border-0", canManage && "cursor-pointer")} style={{ backgroundColor: calendar.color }} />
                                          </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Change Color</p></TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                              <PopoverContent className="w-auto p-4" onPointerDown={(e) => e.stopPropagation()}>
                                 <div className="space-y-4">
                                    <HexColorPicker color={color} onChange={setColor} className="!w-full" />
                                    <div className="flex items-center gap-2">
                                        <span className="p-2 border rounded-md shadow-sm" style={{ backgroundColor: color }} />
                                        <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
                                    </div>
                                    <div className="grid grid-cols-8 gap-1">
                                        {PREDEFINED_COLORS.map(c => (
                                            <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(calendar.id, { color: c }); setIsColorPopoverOpen(false);}} />
                                        ))}
                                    </div>
                                    <Button onClick={() => { onUpdate(calendar.id, { color }); setIsColorPopoverOpen(false); }} className="w-full">Set Color</Button>
                                </div>
                              </PopoverContent>
                          </Popover>
                           {shareIcon && (
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div 
                                              className="absolute -top-0 -right-3 h-4 w-4 rounded-full border-0 flex items-center justify-center text-white"
                                              style={{ backgroundColor: shareIconColor }}
                                          >
                                              <GoogleSymbol name={shareIcon} style={{fontSize: '16px'}}/>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent><p>{shareIconTitle}</p></TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                          )}
                      </div>
                      <div className="flex-1 min-w-0" onPointerDown={(e) => { if(canManage) e.stopPropagation(); }}>
                      {isEditingName && canManage ? (
                           <Input
                              ref={nameInputRef}
                              defaultValue={calendar.name}
                              onKeyDown={handleNameKeyDown}
                              onBlur={handleSaveName}
                              onClick={(e) => e.stopPropagation()}
                              className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"
                            />
                      ) : (
                          <CardTitle onClick={(e) => {e.stopPropagation(); if(canManage && !isDragging) { setIsEditingName(true)}}} className={cn("font-headline text-xl font-thin break-words", canManage && "cursor-pointer")}>
                          {calendar.name}
                          </CardTitle>
                      )}
                      </div>
                  </div>
                   <div className='flex items-center' onPointerDown={(e) => e.stopPropagation()}>
                    {canManage && !calendar.googleCalendarId && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsLinkDialogOpen(true)}>
                                        <GoogleSymbol name="add_link" weight={100} />
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
                                           <GoogleSymbol name="sync" weight={100} />
                                       </Button>
                                   </span>
                               </TooltipTrigger>
                               <TooltipContent>
                                <p>Sync with {calendar.googleCalendarId}</p>
                               </TooltipContent>
                           </Tooltip>
                       </TooltipProvider>
                   )}
                   </div>
              </div>
              
              <div className="flex-grow"/>

              {isExpanded && (
                  <CardContent className="p-2 pt-0 mt-2" onPointerDown={(e) => e.stopPropagation()}>
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
                  </CardContent>
              )}
              
              <div className="absolute -bottom-1 right-0">
                  <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} onPointerDown={(e) => e.stopPropagation()} className="text-muted-foreground h-6 w-6">
                      <GoogleSymbol name="expand_more" className={cn("transition-transform duration-200", isExpanded && "rotate-180")} />
                  </Button>
              </div>
          </div>
      </Card>
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={handleSaveGoogleCalendarId}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Link Calendar</span>
              </Button>
            </div>
            <DialogHeader>
                <UIDialogTitle>Link Google Calendar</UIDialogTitle>
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={() => { onDelete(calendar); setIsDeleteDialogOpen(false); }}>
                    <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                    <span className="sr-only">Delete Calendar</span>
                </Button>
            </div>
            <DialogHeader>
                <UIDialogTitle>Delete "{calendar.name}"?</UIDialogTitle>
                <DialogDescription>
                    This will permanently delete the calendar. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SortableCalendarCard({ calendar, ...props }: { calendar: SharedCalendar; [key: string]: any; }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: calendar.id,
        data: { type: 'calendar', calendar, isSharedPreview: props.isSharedPreview },
        disabled: isEditingName
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
            : "basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)]"
        )}
    >
        <div className={cn(isDragging && "opacity-75 shadow-2xl")}>
            <CalendarCard
                calendar={calendar}
                isDragging={isDragging}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                dragHandleProps={{...attributes, ...listeners}}
                {...props}
            />
        </div>
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


export function CalendarManagement({ tab }: { tab: AppTab }) {
  const { viewAsUser, calendars, addCalendar, updateCalendar, deleteCalendar, updateAppTab, appSettings, updateUser } = useUser();
  const { toast } = useToast();
  const sharedSearchInputRef = useRef<HTMLInputElement>(null);

  const [activeCalendar, setActiveCalendar] = useState<SharedCalendar | null>(null);
  
  const [isSharedPanelOpen, setIsSharedPanelOpen] = useState(false);
  const [sharedSearchTerm, setSharedSearchTerm] = useState('');
  const [mainSearchTerm, setMainSearchTerm] = useState('');

  const title = appSettings.calendarManagementLabel || tab.name;
  
  useEffect(() => {
    if (isSharedPanelOpen) {
        setTimeout(() => sharedSearchInputRef.current?.focus(), 100);
    }
  }, [isSharedPanelOpen]);
  
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
            color: PREDEFINED_COLORS[calendarCount % PREDEFINED_COLORS.length],
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
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const displayedCalendars = useMemo(() => {
    return calendars
      .filter(c => c.owner.id === viewAsUser.userId || (viewAsUser.linkedCalendarIds || []).includes(c.id))
      .filter(c => c.name.toLowerCase().includes(mainSearchTerm.toLowerCase()));
  }, [calendars, mainSearchTerm, viewAsUser]);

  const sharedCalendars = useMemo(() => {
    const displayedIds = new Set(displayedCalendars.map(c => c.id));
    return calendars.filter(c => c.isShared && !displayedIds.has(c.id) && c.name.toLowerCase().includes(sharedSearchTerm.toLowerCase()));
  }, [calendars, displayedCalendars, sharedSearchTerm]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveCalendar(event.active.data.current?.calendar || null);
  };

  const onDragEnd = (event: DragEndEvent) => {
      setActiveCalendar(null);
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
      
      const isCalendarCardDrop = active.data.current?.type === 'calendar' && over.data.current?.type === 'calendar';
      if (isCalendarCardDrop && active.id !== over.id) {
          // Reordering is not implemented in mock data, but this is where it would go.
      }
  };
  
  const calendarIds = useMemo(() => displayedCalendars.map(c => c.id), [displayedCalendars]);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
        <div className="flex gap-4 h-full">
            <div className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline text-2xl font-thin tracking-tight">{title}</h3>
                          <DuplicateZone id="duplicate-calendar-zone" onAdd={() => handleAddCalendar()} />
                        </div>
                        <div className="flex items-center gap-2">
                            <CompactSearchInput searchTerm={mainSearchTerm} setSearchTerm={setMainSearchTerm} placeholder="Search calendars..." />
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setIsSharedPanelOpen(!isSharedPanelOpen)}>
                                            <GoogleSymbol name="dynamic_feed" weight={100} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Show Shared Calendars</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <CalendarDropZone id="main-calendars-grid" type="calendar-grid" className="h-full">
                         <ScrollArea className="h-full">
                          <div className="flex flex-wrap content-start -m-2">
                            <SortableContext items={calendarIds} strategy={rectSortingStrategy}>
                                {displayedCalendars.map((calendar) => (
                                    <SortableCalendarCard
                                        key={calendar.id}
                                        calendar={calendar}
                                        onUpdate={handleUpdate}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                          </div>
                          </ScrollArea>
                        </CalendarDropZone>
                    </div>
                </div>
            </div>
            <div className={cn("transition-all duration-300", isSharedPanelOpen ? "w-96" : "w-0")}>
                <CalendarDropZone id="shared-calendars-panel" type="shared-calendar-panel" className={cn("h-full rounded-lg transition-all", isSharedPanelOpen ? "p-2" : "p-0")}>
                    <Card className={cn("transition-opacity duration-300 h-full bg-transparent flex flex-col", isSharedPanelOpen ? "opacity-100" : "opacity-0")}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-headline font-thin text-xl">Shared Calendars</CardTitle>
                                <CompactSearchInput searchTerm={sharedSearchTerm} setSearchTerm={setSharedSearchTerm} placeholder="Search shared..." inputRef={sharedSearchInputRef} autoFocus={isSharedPanelOpen} tooltipText="Search Shared Calendars" />
                            </div>
                            <UICardDescription>Drag a calendar to your board to link it.</UICardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-2 overflow-hidden">
                            <ScrollArea className="h-full">
                                <SortableContext items={sharedCalendars.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {sharedCalendars.map(calendar => (
                                            <SortableCalendarCard 
                                                key={calendar.id}
                                                calendar={calendar}
                                                onUpdate={handleUpdate}
                                                onDelete={handleDelete}
                                                isSharedPreview={true}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </CalendarDropZone>
            </div>
        </div>
      
       <DragOverlay>
        {activeCalendar ? (
            <div className="p-2 basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0">
                <CalendarCard 
                    calendar={activeCalendar} 
                    onUpdate={()=>{}} 
                    onDelete={()=>{}} 
                    isSharedPreview={activeCalendar.owner.id !== viewAsUser.userId}
                    isEditingName={false}
                    setIsEditingName={() => {}}
                />
            </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
