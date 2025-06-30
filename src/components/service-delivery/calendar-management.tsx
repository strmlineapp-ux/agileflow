'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

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
  const [openColorPopoverId, setOpenColorPopoverId] = useState<string | null>(null);

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

  const handleQuickColorChange = (newColor: string) => {
    onUpdate(calendar.id, { color: newColor });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Popover open={openColorPopoverId === calendar.id} onOpenChange={(isOpen) => setOpenColorPopoverId(isOpen ? calendar.id : null)}>
              <PopoverTrigger asChild>
                <div className="h-4 w-4 rounded-full border shrink-0 cursor-pointer" style={{ backgroundColor: calendar.color }} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        handleQuickColorChange(color);
                        setOpenColorPopoverId(null);
                      }}
                      aria-label={`Set color to ${color}`}
                    />
                  ))}
                  <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                    <GoogleSymbol name="colorize" className="text-muted-foreground" />
                    <Input
                      type="color"
                      value={calendar.color}
                      onChange={(e) => handleQuickColorChange(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                      aria-label="Custom color picker"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mr-4 -mt-2" onClick={() => onDelete(calendar)}>
            <GoogleSymbol name="delete" />
            <span className="sr-only">Delete Calendar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Default Event Title</p>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={calendar.defaultEventTitle}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="text-sm italic"
              placeholder="e.g., New Event"
            />
          ) : (
            <p className="text-sm italic cursor-text" onClick={() => setIsEditingTitle(true)}>
              {calendar.defaultEventTitle || 'Click to set'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CalendarManagement() {
  const { calendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddColorPopoverOpen, setIsAddColorPopoverOpen] = useState(false);
  
  const [editingCalendar, setEditingCalendar] = useState<SharedCalendar | null>(null);

  // Add new calendar state
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#3B82F6');

  const openAddDialog = () => {
    setNewCalendarName('');
    setNewCalendarColor('#3B82F6');
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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Manage Calendars</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                <GoogleSymbol name="add_circle" className="text-xl" />
                <span className="sr-only">New Calendar</span>
            </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendars.map(calendar => (
          <CalendarCard
            key={calendar.id}
            calendar={calendar}
            onUpdate={handleUpdate}
            onDelete={openDeleteDialog}
          />
        ))}
      </div>

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
                     <Popover open={isAddColorPopoverOpen} onOpenChange={setIsAddColorPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div className="h-9 w-9 rounded-full border shrink-0 cursor-pointer" style={{ backgroundColor: newCalendarColor }} />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">
                            {predefinedColors.map(color => (
                                <button
                                key={color}
                                className="h-6 w-6 rounded-full border"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    setNewCalendarColor(color);
                                    setIsAddColorPopoverOpen(false);
                                }}
                                aria-label={`Set color to ${color}`}
                                />
                            ))}
                            <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                <Input
                                type="color"
                                value={newCalendarColor}
                                onChange={(e) => setNewCalendarColor(e.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                aria-label="Custom color picker"
                                />
                            </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Input id="name" value={newCalendarName} onChange={(e) => setNewCalendarName(e.target.value)} placeholder="Calendar Name" className="flex-1 text-lg font-semibold" />
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
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
    </>
  );
}
