
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type AppTab } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
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

function SortableCalendarCard({ calendar, onUpdate, onDelete }: { calendar: SharedCalendar; onUpdate: (id: string, data: Partial<SharedCalendar>) => void; onDelete: (calendar: SharedCalendar) => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: calendar.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  return (
    <div ref={setNodeRef} style={style} className="p-3 basis-full md:basis-1/2 lg:basis-1/3 flex-grow-0 flex-shrink-0">
      <CalendarCard calendar={calendar} onUpdate={onUpdate} onDelete={onDelete} isDragging={isDragging} dragHandleProps={{...attributes, ...listeners}} />
    </div>
  );
}


function CalendarCard({ calendar, onUpdate, onDelete, isDragging, dragHandleProps }: { calendar: SharedCalendar; onUpdate: (id: string, data: Partial<SharedCalendar>) => void; onDelete: (calendar: SharedCalendar) => void; isDragging?: boolean; dragHandleProps?: any; }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingGCalId, setIsEditingGCalId] = useState(false);
  const gcalIdInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  useEffect(() => {
    if (isIconPopoverOpen) {
      setTimeout(() => iconSearchInputRef.current?.focus(), 100);
    } else {
      setIconSearch('');
    }
  }, [isIconPopoverOpen]);

  const filteredIcons = useMemo(() => googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
      if (isEditingGCalId) gcalIdInputRef.current?.focus();
  }, [isEditingGCalId]);

  const handleSaveName = () => {
    const newName = nameInputRef.current?.value.trim();
    if (newName && newName !== calendar.name) {
      onUpdate(calendar.id, { name: newName });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') setIsEditingName(false);
  };
  
  const handleSaveTitle = () => {
    const newTitle = titleInputRef.current?.value.trim();
    if (newTitle !== calendar.defaultEventTitle) {
      onUpdate(calendar.id, { defaultEventTitle: newTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleSaveGCalId = () => {
    const newId = gcalIdInputRef.current?.value.trim() || undefined;
    if (newId !== calendar.googleCalendarId) {
        onUpdate(calendar.id, { googleCalendarId: newId });
    }
    setIsEditingGCalId(false);
  };

  const handleGCalIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSaveGCalId();
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
    <Card className={cn("flex flex-col group bg-transparent relative", isDragging && "shadow-xl")} {...dragHandleProps}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <button className="h-12 w-12 flex items-center justify-center">
                                        <GoogleSymbol name={calendar.icon} className="text-6xl" weight={100} />
                                    </button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Change Icon</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-80 p-0">
                        <div className="flex items-center gap-1 p-2 border-b">
                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
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
                                <PopoverTrigger asChild>
                                    <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: calendar.color }} />
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Change Color</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(calendar.id, { color: c }); setIsColorPopoverOpen(false);}}></button>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={calendar.color} onChange={(e) => onUpdate(calendar.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                    </PopoverContent>
                </Popover>
            </div>
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                defaultValue={calendar.name}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="h-auto p-0 font-headline text-xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            ) : (
              <CardTitle className="font-headline text-xl font-thin cursor-pointer" onClick={() => setIsEditingName(true)}>
                {calendar.name}
              </CardTitle>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                    <GoogleSymbol name="more_vert" weight={100} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {calendar.googleCalendarId && (
                    <DropdownMenuItem onClick={handleSync}>
                        <GoogleSymbol name="sync" className="mr-2" weight={100}/>
                        Sync with Google
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(calendar)} className="text-destructive focus:text-destructive">
                    <GoogleSymbol name="delete" className="mr-2" weight={100}/>
                    Delete Calendar
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 pt-0">
        <div>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={calendar.defaultEventTitle}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="h-auto p-0 text-sm italic font-normal border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Click to set default title"
            />
          ) : (
            <p className="text-sm italic cursor-text min-h-[20px]" onClick={() => setIsEditingTitle(true)}>
              {calendar.defaultEventTitle || 'Click to set default title'}
            </p>
          )}
        </div>
         <div>
          {isEditingGCalId ? (
            <Input
              ref={gcalIdInputRef}
              defaultValue={calendar.googleCalendarId}
              onBlur={handleSaveGCalId}
              onKeyDown={handleGCalIdKeyDown}
              className="h-auto p-0 text-sm italic font-normal border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Google Calendar ID (e.g., user@domain.com)"
            />
          ) : (
            <p className="text-sm italic cursor-text min-h-[20px] text-muted-foreground" onClick={() => setIsEditingGCalId(true)}>
              {calendar.googleCalendarId || 'Link to Google Calendar'}
            </p>
          )}
        </div>
      </CardContent>
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
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={onAdd}>
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
    useSensor(PointerSensor),
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
                          <h3 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{title}</h3>
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
            <div className="flex flex-wrap -m-3">
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
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 p-0" onClick={handleDelete}>
                  <GoogleSymbol name="delete" className="text-4xl" weight={100} />
                  <span className="sr-only">Delete Calendar</span>
              </Button>
          </div>
          <DialogHeader>
              <UIDialogTitle>Delete "{editingCalendar?.name}"?</UIDialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the calendar and all of its associated events.
              </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
