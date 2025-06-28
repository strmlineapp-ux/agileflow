

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
  DialogDescription,
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
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function CalendarManagement() {
  const { users, calendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { toast } = useToast();

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [currentCalendar, setCurrentCalendar] = useState<SharedCalendar | null>(null);
  const [calendarName, setCalendarName] = useState('');
  const [calendarColor, setCalendarColor] = useState('#3B82F6');
  const [calendarManagers, setCalendarManagers] = useState<string[]>([]);
  const [defaultEventTitle, setDefaultEventTitle] = useState('');
  const [managerRoleName, setManagerRoleName] = useState('');

  const openAddDialog = () => {
    setCurrentCalendar(null);
    setCalendarName('');
    setCalendarColor('#3B82F6');
    setCalendarManagers([]);
    setDefaultEventTitle('');
    setManagerRoleName('');
    setIsAddOrEditDialogOpen(true);
  };

  const openEditDialog = (calendar: SharedCalendar) => {
    setCurrentCalendar(calendar);
    setCalendarName(calendar.name);
    setCalendarColor(calendar.color);
    setCalendarManagers(calendar.managers || []);
    setDefaultEventTitle(calendar.defaultEventTitle || '');
    setManagerRoleName(calendar.managerRoleName || '');
    setIsAddOrEditDialogOpen(true);
  };

  const openDeleteDialog = (calendar: SharedCalendar) => {
    // Close the edit dialog before opening the delete confirmation
    setIsAddOrEditDialogOpen(false);
    setCurrentCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };
  
  const handleToggleManager = (userId: string) => {
      setCalendarManagers(prev => {
          const newSet = new Set(prev);
          if (newSet.has(userId)) {
              newSet.delete(userId);
          } else {
              newSet.add(userId);
          }
          return Array.from(newSet);
      });
  };

  const handleSave = async () => {
    if (!calendarName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Calendar name is required.' });
      return;
    }

    const calendarData = { 
        name: calendarName, 
        managers: calendarManagers, 
        defaultEventTitle,
        managerRoleName,
        color: calendarColor
    };

    if (currentCalendar) {
      // Editing existing calendar
      await updateCalendar(currentCalendar.id, calendarData);
      toast({ title: 'Success', description: 'Calendar updated successfully.' });
    } else {
      // Adding new calendar
      await addCalendar(calendarData);
      toast({ title: 'Success', description: 'Calendar added successfully.' });
    }
    setIsAddOrEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (currentCalendar) {
      await deleteCalendar(currentCalendar.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleQuickColorChange = (calendarId: string, newColor: string) => {
    updateCalendar(calendarId, { color: newColor });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendars.map(calendar => {
          const calendarManagers = (calendar.managers || []).map(id => users.find(u => u.userId === id)).filter(Boolean) as User[];
          return (
            <Card key={calendar.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative h-4 w-4 rounded-full border shrink-0">
                            <div
                                className="h-full w-full rounded-full"
                                style={{ backgroundColor: calendar.color }}
                            />
                            <Input
                                type="color"
                                value={calendar.color}
                                onChange={(e) => handleQuickColorChange(calendar.id, e.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                aria-label={`Change color for ${calendar.name}`}
                            />
                        </div>
                        <CardTitle className="text-xl">{calendar.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="-mr-4 -mt-2" onClick={() => openEditDialog(calendar)}>
                        <GoogleSymbol name="edit" />
                        <span className="sr-only">Edit Calendar</span>
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Default Event Title</p>
                      <p className="text-sm italic">{calendar.defaultEventTitle || 'Not set'}</p>
                  </div>
                  <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{calendar.managerRoleName || 'Team User Manager'}</p>
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
              </CardContent>
            </Card>
          )
        })}
        <button
          onClick={openAddDialog}
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[190px]"
        >
          <div className="flex flex-col items-center gap-2">
            <GoogleSymbol name="add_circle" className="text-4xl" />
            <span className="font-semibold">New Calendar</span>
          </div>
        </button>
      </div>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <div className="absolute top-4 right-4 flex items-center gap-1">
            {currentCalendar && calendars.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => openDeleteDialog(currentCalendar)}
              >
                <GoogleSymbol name="delete" className="text-xl" />
                <span className="sr-only">Delete Calendar</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
              <GoogleSymbol name="check" className="text-xl" />
              <span className="sr-only">Save Changes</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>{currentCalendar ? 'Edit Calendar' : 'Add New Calendar'}</DialogTitle>
             <DialogDescription>
                {currentCalendar ? "Set the calendar's display name and managers." : "Set the calendar's display name, color, and managers."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 pt-4">
            <div className="flex items-center gap-4">
                {!currentCalendar && (
                    <div className="relative h-9 w-9 shrink-0">
                        <div
                            className="h-full w-full rounded-full border"
                            style={{ backgroundColor: calendarColor }}
                        />
                        <Input
                            id="color"
                            type="color"
                            value={calendarColor}
                            onChange={(e) => setCalendarColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                            aria-label="Calendar color"
                        />
                    </div>
                )}
                <Input
                    id="name"
                    value={calendarName}
                    onChange={(e) => setCalendarName(e.target.value)}
                    placeholder="Calendar Name"
                    className="flex-1 text-lg font-semibold"
                />
            </div>
            <div className="space-y-2">
                <Input
                    id="default-title"
                    value={defaultEventTitle}
                    onChange={(e) => setDefaultEventTitle(e.target.value)}
                    placeholder="Default Event Title (e.g., New Event)"
                />
            </div>
             <div className="space-y-2">
                <Input
                    id="manager-role-name"
                    value={managerRoleName}
                    onChange={(e) => setManagerRoleName(e.target.value)}
                    placeholder="Manager Label (e.g., Team User Manager)"
                />
            </div>
            <div className="space-y-2">
                 <p className="text-sm text-muted-foreground">Calendar Managers</p>
                 <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-2 min-h-[56px]">
                  {users.map(user => {
                    const isManager = calendarManagers.includes(user.userId);
                    return (
                      <Badge
                        key={user.userId}
                        variant={isManager ? 'default' : 'secondary'}
                        className={cn('gap-1.5 p-1 pl-2 cursor-pointer rounded-full', isManager && 'shadow-md')}
                        onClick={() => handleToggleManager(user.userId)}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.displayName}</span>
                      </Badge>
                    );
                  })}
                </div>
                 <p className="text-xs text-muted-foreground text-right pr-2 mt-2">Click user pills to toggle their manager status for this calendar.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{currentCalendar?.name}" calendar. All events on this calendar will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
