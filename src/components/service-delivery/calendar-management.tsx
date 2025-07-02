
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type AppTab } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as UIAlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { googleSymbolNames } from '@/lib/google-symbols';
import { ScrollArea } from '../ui/scroll-area';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function CalendarCard({ calendar, onUpdate, onDelete }: { calendar: SharedCalendar; onUpdate: (id: string, data: Partial<SharedCalendar>) => void; onDelete: (calendar: SharedCalendar) => void; }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  
  const [isSearching, setIsSearching] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isIconPopoverOpen) {
        setIsSearching(false);
        setIconSearch('');
    }
  }, [isIconPopoverOpen]);
  
  useEffect(() => {
    if (isSearching) searchInputRef.current?.focus();
  }, [isSearching]);

  const handleBlurSearch = () => {
    if (!iconSearch) setIsSearching(false);
  }

  const filteredIcons = googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

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

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl">
                            <GoogleSymbol name={calendar.icon} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                        <div className="flex items-center gap-1 p-2 border-b">
                            {!isSearching ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearching(true)}>
                                <GoogleSymbol name="search" />
                            </Button>
                            ) : (
                             <div className="flex items-center gap-1 w-full">
                                <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                <input
                                    ref={searchInputRef}
                                    placeholder="Search icons..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    onBlur={handleBlurSearch}
                                    className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                />
                            </div>
                            )}
                        </div>
                        <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={calendar.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(calendar.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                    </PopoverContent>
                </Popover>
                <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                    <PopoverTrigger asChild><div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: calendar.color }} /></PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {onUpdate(calendar.id, { color: c }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={calendar.color} onChange={(e) => onUpdate(calendar.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                    </PopoverContent>
                </Popover>
            </div>
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                defaultValue={calendar.name}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="h-auto p-0 text-xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            ) : (
              <CardTitle className="text-xl cursor-pointer" onClick={() => setIsEditingName(true)}>
                {calendar.name}
              </CardTitle>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mr-4 -mt-2" onClick={() => onDelete(calendar)}>
                        <GoogleSymbol name="delete" />
                        <span className="sr-only">Delete Calendar</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Calendar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={calendar.defaultEventTitle}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="h-auto p-0 text-sm italic border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Click to set default title"
            />
          ) : (
            <p className="text-sm italic cursor-text min-h-[20px]" onClick={() => setIsEditingTitle(true)}>
              {calendar.defaultEventTitle || 'Click to set default title'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarManagement({ tab }: { tab: AppTab }) {
  const { calendars, addCalendar, updateCalendar, deleteCalendar, updateAppTab, appSettings } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddColorPopoverOpen, setIsAddColorPopoverOpen] = useState(false);
  const [isAddIconPopoverOpen, setIsAddIconPopoverOpen] = useState(false);
  
  const [editingCalendar, setEditingCalendar] = useState<SharedCalendar | null>(null);

  // Add new calendar state
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarIcon, setNewCalendarIcon] = useState('calendar_month');
  const [newCalendarColor, setNewCalendarColor] = useState('#3B82F6');
  
  const [isAddIconSearching, setIsAddIconSearching] = useState(false);
  const [addIconSearch, setAddIconSearch] = useState('');
  const addSearchInputRef = useRef<HTMLInputElement>(null);
  
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
  
  useEffect(() => {
    if (!isAddIconPopoverOpen) {
        setIsAddIconSearching(false);
        setAddIconSearch('');
    }
  }, [isAddIconPopoverOpen]);
  
  useEffect(() => {
    if (isAddIconSearching) addSearchInputRef.current?.focus();
  }, [isAddIconSearching]);

  const handleAddBlurSearch = () => {
    if (!addIconSearch) setIsAddIconSearching(false);
  }

  const filteredIcons = googleSymbolNames.filter(name => name.toLowerCase().includes(addIconSearch.toLowerCase()));

  const openAddDialog = () => {
    setNewCalendarName('');
    setNewCalendarColor('#3B82F6');
    setNewCalendarIcon('calendar_month');
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (calendar: SharedCalendar) => {
    setEditingCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };
  
  const handleAddNewCalendar = async () => {
    if (!newCalendarName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Calendar name is required.' });
      return;
    }
    await addCalendar({
      name: newCalendarName.trim(),
      icon: newCalendarIcon,
      color: newCalendarColor,
      managers: [],
      defaultEventTitle: 'New Event',
    });
    toast({ title: 'Success', description: 'Calendar added successfully.' });
    setIsAddDialogOpen(false);
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
  
  const onDragEnd = (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
  
      if (destination.droppableId === 'duplicate-calendar-zone') {
          const calendarToDuplicate = calendars.find(c => c.id === draggableId);
          if (calendarToDuplicate) {
              handleDuplicateCalendar(calendarToDuplicate);
          }
          return;
      }
  
      if (source.droppableId === 'calendars-list' && destination.droppableId === 'calendars-list') {
          // Reordering logic would go here if needed in the future
      }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex items-center gap-2 mb-6">
          {isEditingTitle ? (
            <Input ref={titleInputRef} defaultValue={title} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
          ) : (
            <h3 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{title}</h3>
          )}
          <StrictModeDroppable droppableId="duplicate-calendar-zone">
              {(provided, snapshot) => (
                  <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                          "rounded-full transition-all p-0.5",
                          snapshot.isDraggingOver && "ring-2 ring-primary ring-offset-2 bg-accent"
                      )}
                  >
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                                      <GoogleSymbol name="add_circle" className="text-xl" />
                                      <span className="sr-only">New Calendar or Drop to Duplicate</span>
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{snapshot.isDraggingOver ? 'Drop to Duplicate' : 'Add New Calendar'}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  </div>
              )}
          </StrictModeDroppable>
      </div>
      <StrictModeDroppable droppableId="calendars-list">
          {(provided) => (
              <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
              >
                  {calendars.map((calendar, index) => (
                      <Draggable key={calendar.id} draggableId={calendar.id} index={index}>
                          {(provided) => (
                              <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                              >
                                  <CalendarCard
                                      calendar={calendar}
                                      onUpdate={handleUpdate}
                                      onDelete={openDeleteDialog}
                                  />
                              </div>
                          )}
                      </Draggable>
                  ))}
                  {provided.placeholder}
              </div>
          )}
      </StrictModeDroppable>

      {/* Add New Calendar Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddNewCalendar}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Add Calendar</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle>Add New Calendar</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 pt-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Popover open={isAddIconPopoverOpen} onOpenChange={setIsAddIconPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl" style={{ color: newCalendarColor }}>
                                    <GoogleSymbol name={newCalendarIcon} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                                <div className="flex items-center gap-1 p-2 border-b">
                                    {!isAddIconSearching ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsAddIconSearching(true)}>
                                        <GoogleSymbol name="search" />
                                    </Button>
                                    ) : (
                                    <div className="flex items-center gap-1 w-full">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                        <input
                                            ref={addSearchInputRef}
                                            placeholder="Search icons..."
                                            value={addIconSearch}
                                            onChange={(e) => setAddIconSearch(e.target.value)}
                                            onBlur={handleAddBlurSearch}
                                            className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                        />
                                    </div>
                                    )}
                                </div>
                                <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={newCalendarIcon === iconName ? "default" : "ghost"} size="icon" onClick={() => { setNewCalendarIcon(iconName); setIsAddIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                            </PopoverContent>
                        </Popover>
                        <Popover open={isAddColorPopoverOpen} onOpenChange={setIsAddColorPopoverOpen}>
                            <PopoverTrigger asChild><div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: newCalendarColor }} /></PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {setNewCalendarColor(c); setIsAddColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={newCalendarColor} onChange={(e) => setNewCalendarColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Input id="name" value={newCalendarName} onChange={(e) => setNewCalendarName(e.target.value)} placeholder="Calendar Name" className="flex-1 text-lg font-semibold" />
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <UIAlertDialogTitle>Are you absolutely sure?</UIAlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{editingCalendar?.name}" calendar. All events on this calendar will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingCalendar(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DragDropContext>
  );
}
