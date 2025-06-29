

'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type User } from '@/types';
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
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type DialogType = 'name' | 'defaultTitle' | 'managerLabel' | 'roleLabel';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

export function CalendarManagement() {
  const { users, calendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddColorPopoverOpen, setIsAddColorPopoverOpen] = useState(false);
  const [openColorPopoverId, setOpenColorPopoverId] = useState<string | null>(null);

  // State for specific edit dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<SharedCalendar | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Add new calendar state
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#3B82F6');

  const openAddDialog = () => {
    setNewCalendarName('');
    setNewCalendarColor('#3B82F6');
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (calendar: SharedCalendar, type: DialogType) => {
    setEditingCalendar(calendar);
    setDialogType(type);
    switch (type) {
      case 'name':
        setTempValue(calendar.name);
        break;
      case 'defaultTitle':
        setTempValue(calendar.defaultEventTitle || '');
        break;
      case 'managerLabel':
        setTempValue(calendar.managerRoleName || '');
        break;
      case 'roleLabel':
        setTempValue(calendar.roleAssignmentsLabel || '');
        break;
    }
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (calendar: SharedCalendar) => {
    setEditingCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCalendar(null);
    setDialogType(null);
    setTempValue('');
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
      managerRoleName: 'Shared Calendar Coordinators',
      roleAssignmentsLabel: 'Role Assignments'
    });
    toast({ title: 'Success', description: 'Calendar added successfully.' });
    setIsAddDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingCalendar || dialogType === null) return;
    if (tempValue.trim() === '') {
        toast({ variant: 'destructive', title: 'Error', description: 'Value cannot be empty.' });
        return;
    }
    
    let updateData: Partial<SharedCalendar> = {};
    switch (dialogType) {
        case 'name':
            updateData.name = tempValue;
            break;
        case 'defaultTitle':
            updateData.defaultEventTitle = tempValue;
            break;
        case 'managerLabel':
            updateData.managerRoleName = tempValue;
            break;
        case 'roleLabel':
            updateData.roleAssignmentsLabel = tempValue;
            break;
    }

    await updateCalendar(editingCalendar.id, updateData);
    toast({ title: 'Success', description: 'Calendar updated successfully.' });
    closeEditDialog();
  };

  const handleDelete = async () => {
    if (editingCalendar) {
      await deleteCalendar(editingCalendar.id);
      setIsDeleteDialogOpen(false);
      setEditingCalendar(null);
    }
  };
  
  const handleQuickColorChange = (calendarId: string, newColor: string) => {
    updateCalendar(calendarId, { color: newColor });
  };
  
  const getDialogTitle = (): string => {
      if (!dialogType) return '';
      switch (dialogType) {
          case 'name': return 'Edit Calendar Name';
          case 'defaultTitle': return 'Edit Default Event Title';
          case 'managerLabel': return 'Edit Manager Label';
          case 'roleLabel': return 'Edit Role Assignments Label';
          default: return 'Edit';
      }
  }

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
        {calendars.map(calendar => {
          const calendarManagers = (calendar.managers || []).map(id => users.find(u => u.userId === id)).filter(Boolean) as User[];
          return (
            <Card key={calendar.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <Popover open={openColorPopoverId === calendar.id} onOpenChange={(isOpen) => setOpenColorPopoverId(isOpen ? calendar.id : null)}>
                            <PopoverTrigger asChild>
                                <div
                                    className="h-4 w-4 rounded-full border shrink-0 cursor-pointer"
                                    style={{ backgroundColor: calendar.color }}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">
                                    {predefinedColors.map(color => (
                                        <button
                                            key={color}
                                            className="h-6 w-6 rounded-full border"
                                            style={{ backgroundColor: color }}
                                            onClick={() => {
                                                handleQuickColorChange(calendar.id, color);
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
                                            onChange={(e) => handleQuickColorChange(calendar.id, e.target.value)}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                            aria-label="Custom color picker"
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {calendar.name}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(calendar, 'name')}>
                            <GoogleSymbol name="edit" className="text-lg" />
                            <span className="sr-only">Edit Calendar Name</span>
                        </Button>
                    </CardTitle>
                    <div className="flex items-center -mr-4 -mt-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(calendar)}>
                            <GoogleSymbol name="delete" />
                            <span className="sr-only">Delete Calendar</span>
                        </Button>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-sm font-medium text-muted-foreground">Default Event Title</p>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditDialog(calendar, 'defaultTitle')}>
                            <GoogleSymbol name="edit" className="text-base" />
                            <span className="sr-only">Edit default event title</span>
                        </Button>
                      </div>
                      <p className="text-sm italic">{calendar.defaultEventTitle || 'Not set'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <p className="text-sm font-medium text-muted-foreground">{calendar.managerRoleName || 'Shared Calendar Coordinators'}</p>
                       <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditDialog(calendar, 'managerLabel')}>
                            <GoogleSymbol name="edit" className="text-base" />
                            <span className="sr-only">Edit manager label</span>
                        </Button>
                    </div>
                      <div className="flex flex-wrap gap-2 min-h-[34px]">
                      {calendarManagers.length > 0 ? (
                          calendarManagers.map(user => (
                              <Badge key={user.userId} variant="secondary" className="gap-1.5 p-1 pl-2 rounded-full">
                                  <Avatar className="h-5 w-5"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                  <span className="font-medium">{user.displayName}</span>
                              </Badge>
                          ))
                      ) : <p className="text-sm text-muted-foreground italic px-2">No managers assigned.</p>}
                      </div>
                  </div>
                   <div>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-sm font-medium text-muted-foreground">Role Assignments Label</p>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditDialog(calendar, 'roleLabel')}>
                            <GoogleSymbol name="edit" className="text-base" />
                            <span className="sr-only">Edit role assignments label</span>
                        </Button>
                      </div>
                      <p className="text-sm italic">{calendar.roleAssignmentsLabel || 'Role Assignments'}</p>
                  </div>
              </CardContent>
            </Card>
          )
        })}
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
      
      {/* Generic Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-md">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
              <GoogleSymbol name="check" className="text-xl" />
              <span className="sr-only">Save Changes</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 pt-4">
            <Input
              id="temp-value"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="Enter new value"
            />
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
