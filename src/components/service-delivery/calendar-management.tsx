
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function CalendarManagement() {
  const { calendars, addCalendar, updateCalendar, deleteCalendar } = useUser();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [currentCalendar, setCurrentCalendar] = useState<SharedCalendar | null>(null);
  const [calendarName, setCalendarName] = useState('');
  const [calendarColor, setCalendarColor] = useState('');

  const openAddDialog = () => {
    setCurrentCalendar(null);
    setCalendarName('');
    setCalendarColor('#3692E9');
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (calendar: SharedCalendar) => {
    setCurrentCalendar(calendar);
    setCalendarName(calendar.name);
    setCalendarColor(calendar.color);
    setIsEditDialogOpen(true);
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
      setIsEditDialogOpen(false);
    } else {
      // Adding new calendar
      await addCalendar({ name: calendarName, color: calendarColor });
      toast({ title: 'Success', description: 'Calendar added successfully.' });
      setIsAddDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (currentCalendar) {
      await deleteCalendar(currentCalendar.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div></div>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Calendar
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Shared Calendars</CardTitle>
          <CardDescription>Add, edit, or delete shared calendars available to all users.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Calendar Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calendars.map(cal => (
                <TableRow key={cal.id}>
                  <TableCell className="font-medium">{cal.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: cal.color }} />
                      <span>{cal.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(cal)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => openDeleteDialog(cal)}
                          disabled={calendars.length <= 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={isAddDialogOpen ? setIsAddDialogOpen : setIsEditDialogOpen}>
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
            <Button variant="outline" onClick={() => (isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false))}>Cancel</Button>
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
