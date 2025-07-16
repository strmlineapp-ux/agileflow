'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type AppTab } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { googleSymbolNames } from '@/lib/google-symbols';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { syncCalendar } from '@/ai/flows/sync-calendar-flow';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function SortableCalendarCard({ calendar, onUpdate, onDelete, ...props }: { calendar: SharedCalendar; onUpdate: (id: string, data: Partial<SharedCalendar>) => void; onDelete: (calendar: SharedCalendar) => void; }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingGCalId, setIsEditingGCalId] = useState(false);
  
  const isEditing = isEditingName || isEditingTitle || isEditingGCalId;
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: calendar.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  return (
    <div ref={setNodeRef} style={style} className="p-2 basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0">
      <div className={cn(isDragging && "opacity-75")}>
        <CalendarCard
          calendar={calendar}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isDragging={isDragging}
          dragHandleProps={listeners}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          isEditingGCalId={isEditingGCalId}
          setIsEditingGCalId={setIsEditingGCalId}
          {...attributes}
        />
      </div>
    </div>
  );
}


function CalendarCard({
    calendar,
    onUpdate,
    onDelete,
    isDragging,
    dragHandleProps,
    isEditingName,
    setIsEditingName,
    isEditingTitle,
    setIsEditingTitle,
    isEditingGCalId,
    setIsEditingGCalId
}: {
    calendar: SharedCalendar;
    onUpdate: (id: string, data: Partial<SharedCalendar>) => void;
    onDelete: (calendar: SharedCalendar) => void;
    isDragging?: boolean;
    dragHandleProps?: any;
    isEditingName: boolean;
    setIsEditingName: (isEditing: boolean) => void;
    isEditingTitle: boolean;
    setIsEditingTitle: (isEditing: boolean) => void;
    isEditingGCalId: boolean;
    setIsEditingGCalId: (isEditing: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const gcalIdInputRef = useRef<HTMLInputElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  const {toast} = useToast();
  
  const handleSaveName = useCallback(() => {
    const newName = nameInputRef.current?.value.trim();
    if (newName && newName !== calendar.name) {
      onUpdate(calendar.id, { name: newName });
    }
    setIsEditingName(false);
  }, [calendar.id, calendar.name, onUpdate, setIsEditingName]);

  const handleSaveTitle = useCallback(() => {
    const newTitle = titleInputRef.current?.value.trim();
    if (newTitle !== calendar.defaultEventTitle) {
      onUpdate(calendar.id, { defaultEventTitle: newTitle });
    }
    setIsEditingTitle(false);
  }, [calendar.id, calendar.defaultEventTitle, onUpdate, setIsEditingTitle]);
  
  const handleSaveGCalId = useCallback(() => {
    const newId = gcalIdInputRef.current?.value.trim() || undefined;
    if (newId !== calendar.googleCalendarId) {
        onUpdate(calendar.id, { googleCalendarId: newId });
    }
    setIsEditingGCalId(false);
  }, [calendar.id, calendar.googleCalendarId, onUpdate, setIsEditingGCalId]);

  useEffect(() => {
    if (isIconPopoverOpen) {
      setTimeout(() => iconSearchInputRef.current?.focus(), 100);
    } else {
      setIconSearch('');
    }
  }, [isIconPopoverOpen]);

  const filteredIcons = useMemo(() => googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);
  
  useEffect(() => {
    const setupInlineEditor = (isEditing: boolean, ref: React.RefObject<HTMLInputElement>, onSave: () => void) => {
      if (!isEditing) return;
      
      const handleOutsideClick = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          onSave();
        }
      };
      
      document.addEventListener("mousedown", handleOutsideClick);
      ref.current?.focus();
      ref.current?.select();
      
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    };

    setupInlineEditor(isEditingName, nameInputRef, handleSaveName);
    setupInlineEditor(isEditingTitle, titleInputRef, handleSaveTitle);
    setupInlineEditor(isEditingGCalId, gcalIdInputRef, handleSaveGCalId);

  }, [isEditingName, isEditingTitle, isEditingGCalId, handleSaveName, handleSaveTitle, handleSaveGCalId]);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); nameInputRef.current?.blur(); }
    else if (e.key === 'Escape') setIsEditingName(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); titleInputRef.current?.blur(); }
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleGCalIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); gcalIdInputRef.current?.blur(); }
      else if (e.key === 'Escape') setIsEditingGCalId(false);
  };

  const handleSync = async () => {
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

  return (
    <Card className="group relative flex flex-col bg-transparent">
       <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onDelete(calendar);
                        }}
                    >
                        <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete Calendar</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>

      <div className="cursor-pointer flex-grow" {...dragHandleProps} onClick={() => { if (!isDragging) setIsExpanded(!isExpanded); }}>
        <CardHeader className="p-2">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" className="h-14 w-14 flex items-center justify-center p-0">
                                                <GoogleSymbol name={calendar.icon} style={{ fontSize: '48px' }} weight={100} />
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
                                        <Button variant={calendar.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(calendar.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} style={{fontSize: '24px'}} weight={100} /></Button>
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
                                        <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                            <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: calendar.color }} />
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Change Color</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <PopoverContent className="w-auto p-2" onPointerDown={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(calendar.id, { color: c }); setIsColorPopoverOpen(false);}}></button>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={calendar.color} onChange={(e) => onUpdate(calendar.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div onPointerDown={(e) => e.stopPropagation()}>
                    {isEditingName ? (
                        <Input
                        ref={nameInputRef}
                        defaultValue={calendar.name}
                        onKeyDown={handleNameKeyDown}
                        className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    ) : (
                        <CardTitle className="font-headline text-xl font-thin cursor-pointer" onClick={(e) => {e.stopPropagation(); setIsEditingName(true);}}>
                        {calendar.name}
                        </CardTitle>
                    )}
                    </div>
                </div>
                 <span onPointerDown={(e) => e.stopPropagation()}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={handleSync}
                            disabled={!calendar.googleCalendarId}
                          >
                            <GoogleSymbol name="sync" weight={100} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {calendar.googleCalendarId
                              ? "Sync with Google Calendar"
                              : "Link a Google Calendar ID to enable sync"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
            </div>
        </CardHeader>
        {isExpanded && (
            <CardContent className="space-y-2 pt-0 p-2">
            <div onPointerDown={(e) => e.stopPropagation()}>
                {isEditingTitle ? (
                <Input
                    ref={titleInputRef}
                    defaultValue={calendar.defaultEventTitle}
                    onKeyDown={handleTitleKeyDown}
                    className="h-auto p-0 text-sm italic font-normal border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Click to set default title"
                />
                ) : (
                <p className="text-sm italic cursor-text min-h-[20px]" onClick={(e) => {e.stopPropagation(); setIsEditingTitle(true)}}>
                    {calendar.defaultEventTitle || 'Click to set default title'}
                </p>
                )}
            </div>
             <p className="text-sm italic cursor-text min-h-[20px] text-muted-foreground" onPointerDown={(e) => {e.stopPropagation(); setIsEditingGCalId(true)}} onClick={(e) => {e.stopPropagation(); setIsEditingGCalId(true)}}>
                {isEditingGCalId ? (
                <Input
                    ref={gcalIdInputRef}
                    defaultValue={calendar.googleCalendarId}
                    onKeyDown={handleGCalIdKeyDown}
                    className="h-auto p-0 text-sm italic font-normal border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Google Calendar ID (e.g., user@domain.com)"
                />
                ) : (
                    calendar.googleCalendarId || 'Link to Google Calendar'
                )}
            </p>
            </CardContent>
        )}
      </div>
    </Card>
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

export function CalendarManagement({ tab }: { tab: AppTab }) {
  const { calendars, reorderCalendars, addCalendar, updateCalendar, deleteCalendar, updateAppTab, appSettings } = useUser();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<SharedCalendar | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const title = appSettings.calendarManagementLabel || tab.name;

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== title) {
      updateAppTab(tab.id, { name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };
  
  const handleAddCalendar = () => {
    const calendarCount = calendars.length;
    const newName = `New Calendar ${calendarCount + 1}`;
    addCalendar({
      name: newName,
      icon: 'calendar_month',
      color: predefinedColors[calendarCount % predefinedColors.length],
      managers: [],
      defaultEventTitle: 'New Event',
    });
    toast({ title: 'New Calendar Added', description: `"${newName}" has been created.` });
  };

  const openDeleteDialog = (calendar: SharedCalendar) => {
    setEditingCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };
  
  const handleUpdate = async (calendarId: string, data: Partial<SharedCalendar>) => {
    await updateCalendar(calendarId, data);
    toast({ title: 'Success', description: 'Calendar updated successfully.' });
  };

  const handleDelete = async () => {
    if (editingCalendar) {
      await deleteCalendar(editingCalendar.id);
      setIsDeleteDialogOpen(false);
      setEditingCalendar(null);
    }
  };
  
  const handleDuplicateCalendar = (sourceCalendar: SharedCalendar) => {
      const newName = `${sourceCalendar.name} (Copy)`;
      if (calendars.some(c => c.name === newName)) {
          toast({ variant: 'destructive', title: 'Error', description: `A calendar named "${newName}" already exists.` });
          return;
      }
      const newCalendarData: Omit<SharedCalendar, 'id'> = {
          ...JSON.parse(JSON.stringify(sourceCalendar)),
          name: newName,
      };
      addCalendar(newCalendarData);
      toast({ title: 'Success', description: `Calendar "${newName}" created.` });
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
  
      if (over?.id === 'duplicate-calendar-zone') {
        const calendarToDuplicate = calendars.find(c => c.id === active.id);
        if (calendarToDuplicate) {
            handleDuplicateCalendar(calendarToDuplicate);
        }
        return;
      }
  
      if (active.id !== over?.id && over?.id) {
          const oldIndex = calendars.findIndex(p => p.id === active.id);
          const newIndex = calendars.findIndex(p => p.id === over!.id);
          const reordered = arrayMove(calendars, oldIndex, newIndex);
          reorderCalendars(reordered);
      }
  };
  
  const calendarIds = useMemo(() => calendars.map(c => c.id), [calendars]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <Input ref={titleInputRef} defaultValue={title} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
            ) : (
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <h3 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{title}</h3>
                      </TooltipTrigger>
                      {tab.description && (
                          <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                      )}
                  </Tooltip>
              </TooltipProvider>
            )}
            <DuplicateZone id="duplicate-calendar-zone" onAdd={handleAddCalendar} />
        </div>
        <SortableContext items={calendarIds} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap -m-2">
                {calendars.map((calendar) => (
                    <SortableCalendarCard
                        key={calendar.id}
                        calendar={calendar}
                        onUpdate={handleUpdate}
                        onDelete={openDeleteDialog}
                    />
                ))}
            </div>
        </SortableContext>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onPointerDownCapture={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
              <AlertDialogTitle>Delete "{editingCalendar?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This is a high-risk action. This will permanently delete the calendar and all of its associated events. This action cannot be undone.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
