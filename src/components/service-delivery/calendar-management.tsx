
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

export function CalendarManagement() {
  const { calendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { toast } = useToast();

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [currentCalendar, setCurrentCalendar] = useState<SharedCalendar | null>(null);
  const [calendarName, setCalendarName] = useState('');
  const [calendarColor, setCalendarColor] = useState('');

  const openAddDialog = () => {
    setCurrentCalendar(null);
    setCalendarName('');
    setCalendarColor('#3692E9');
    setIsAddOrEditDialogOpen(true);
  };

  const openEditDialog = (calendar: SharedCalendar) => {
    setCurrentCalendar(calendar);
    setCalendarName(calendar.name);
    setCalendarColor(calendar.color);
    setIsAddOrEditDialogOpen(true);
  };

  const openDeleteDialog = (calendar: SharedCalendar) => {
    setCurrentCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!calendarName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Calendar name is required.' });
      return;
    }
    if (currentCalendar) {
      // Editing existing calendar
      await updateCalendar(currentCalendar.id, { name: calendarName, color: calendarColor });
      toast({ title: 'Success', description: 'Calendar updated successfully.' });
    } else {
      // Adding new calendar
      await addCalendar({ name: calendarName, color: calendarColor });
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Shared Calendars</CardTitle>
              <CardDescription>Add, edit, or delete shared calendars available to all users.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={openAddDialog}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Add New Calendar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
              {calendars.map(cal => (
                <Button key={cal.id} variant="outline" className="h-auto" onClick={() => openEditDialog(cal)}>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cal.color }} />
                      <span className="font-medium">{cal.name}</span>
                    </div>
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentCalendar ? 'Edit Calendar' : 'Add New Calendar'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={calendarName} onChange={(e) => setCalendarName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <Input id="color" type="color" value={calendarColor} onChange={(e) => setCalendarColor(e.target.value)} className="col-span-3 p-1" />
            </div>
          </div>
          <DialogFooter>
            {currentCalendar && (
                 <Button variant="destructive" className="mr-auto" onClick={() => openDeleteDialog(currentCalendar)} disabled={calendars.length <= 1}>
                    Delete
                </Button>
            )}
            <Button variant="outline" onClick={() => setIsAddOrEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
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
