

'use client';

import { useState, Fragment } from 'react';
import { type User, type Team } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';

export function UserManagement() {
    const { realUser, users, updateUser, linkGoogleCalendar, allRoles, teams } = useUser();
    
    // State for editing user contact
    const [editingContactUser, setEditingContactUser] = useState<User | null>(null);
    const [phone, setPhone] = useState('');

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const { toast } = useToast();
   
    const toggleRow = (userId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSavePhone = async () => {
        if (!editingContactUser) return;
        if (editingContactUser.userId !== realUser.userId) {
            toast({ variant: 'destructive', title: 'Error', description: 'You can only edit your own phone number.' });
            return;
        }
        await updateUser(editingContactUser.userId, { phone });
        setEditingContactUser(null);
        toast({ title: 'Success', description: 'Contact number updated.' });
    };

    const canViewRoles = (targetUser: User): boolean => {
        if (realUser.isAdmin) return true;
        const managedTeamIds = teams.filter(t => t.teamAdmins?.includes(realUser.userId)).map(t => t.id);
        const userIsInManagedTeam = teams.some(t => managedTeamIds.includes(t.id) && t.members.includes(targetUser.userId));
        return userIsInManagedTeam;
    }

    return (
        <>
            <Card>
                <CardHeader>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[48px]" />
                                <TableHead>User</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => {
                                 const rolesToDisplay = (user.roles || []).filter(r => r !== 'Admin');
                                 const canSeeRoles = user.userId === realUser.userId || canViewRoles(user);
                                return (
                                <Fragment key={user.userId}>
                                    <TableRow>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => toggleRow(user.userId)}>
                                                {expandedRows.has(user.userId) ? <GoogleSymbol name="expand_more" /> : <GoogleSymbol name="chevron_right" />}
                                                <span className="sr-only">Toggle row</span>
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {user.userId === realUser.userId && !user.googleCalendarLinked ? (
                                                                <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full" onClick={() => linkGoogleCalendar(user.userId)}>
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-gray-400 ring-2 ring-card" />
                                                                </Button>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Avatar>
                                                                        <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                                        <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className={cn(
                                                                        "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card",
                                                                        user.googleCalendarLinked ? "bg-green-500" : "bg-gray-400"
                                                                    )} />
                                                                </div>
                                                            )}
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Google Calendar: {user.googleCalendarLinked ? 'Connected' : user.userId === realUser.userId ? 'Click to connect' : 'Not Connected'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <div>
                                                    <p className="font-medium">{user.displayName}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.title}</TableCell>
                                         <TableCell>
                                            {canSeeRoles && (
                                                <div className="flex flex-wrap gap-1">
                                                {rolesToDisplay.map(role => {
                                                    const roleInfo = allRoles.find(r => r.name === role);
                                                    return (
                                                        <Badge
                                                            key={role}
                                                            variant="outline"
                                                            style={roleInfo ? { color: roleInfo.color, borderColor: roleInfo.color } : {}}
                                                            className="rounded-full gap-1 text-xs py-0.5 px-2"
                                                        >
                                                            {roleInfo && <GoogleSymbol name={roleInfo.icon} className="text-sm" />}
                                                            <span>{role}</span>
                                                        </Badge>
                                                    );
                                                })}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {user.userId === realUser.userId && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <GoogleSymbol name="palette" />
                                                            <span className="sr-only">Change preferences</span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Preferences</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Set your personal display and interaction settings.
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-4">
                                                                <Select
                                                                    value={realUser.theme || 'light'}
                                                                    onValueChange={(value) => updateUser(realUser.userId, { theme: value as any })}
                                                                >
                                                                    <SelectTrigger id="color-scheme" className="w-full">
                                                                        <SelectValue placeholder="Select Colour Scheme" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="light">Light</SelectItem>
                                                                        <SelectItem value="dark">Dark</SelectItem>
                                                                        <SelectItem value="high-visibility">High Visibility</SelectItem>
                                                                        <SelectItem value="firebase">Firebase</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={realUser.defaultCalendarView || 'day'}
                                                                    onValueChange={(value) => updateUser(realUser.userId, { defaultCalendarView: value as any })}
                                                                >
                                                                    <SelectTrigger id="calendar-view" className="w-full">
                                                                        <SelectValue placeholder="Select Default View" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="month">Month</SelectItem>
                                                                        <SelectItem value="week">Week</SelectItem>
                                                                        <SelectItem value="day">Day</SelectItem>
                                                                        <SelectItem value="production-schedule">Production Schedule</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={realUser.timeFormat || '12h'}
                                                                    onValueChange={(value) => updateUser(realUser.userId, { timeFormat: value as any })}
                                                                >
                                                                    <SelectTrigger id="time-format" className="w-full">
                                                                        <SelectValue placeholder="Select Time Format" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="12h">12-Hour</SelectItem>
                                                                        <SelectItem value="24h">24-Hour</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="easy-booking"
                                                                        checked={realUser.easyBooking}
                                                                        onCheckedChange={(checked) => updateUser(realUser.userId, { easyBooking: !!checked })}
                                                                    />
                                                                    <label
                                                                        htmlFor="easy-booking"
                                                                        className="text-sm font-normal text-muted-foreground cursor-pointer"
                                                                    >
                                                                        Click empty calendar slots to quickly create events.
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(user.userId) && (
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell />
                                            <TableCell colSpan={4}>
                                                <div className="p-4">
                                                    <p className="font-medium text-sm mb-2">Details</p>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-xs text-muted-foreground">Contact</p>
                                                            {user.userId === realUser.userId && (
                                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                                                    setEditingContactUser(user);
                                                                    setPhone(user.phone || '');
                                                                }}>
                                                                    <GoogleSymbol name="edit" className="text-base" />
                                                                    <span className="sr-only">Edit phone number</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {user.phone ? <p className="text-sm">{user.phone}</p> : <p className="text-sm text-muted-foreground italic">Not provided</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingContactUser} onOpenChange={(isOpen) => !isOpen && setEditingContactUser(null)}>
                <DialogContent>
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSavePhone}>
                            <GoogleSymbol name="check" className="text-xl" />
                            <span className="sr-only">Save Phone Number</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Edit contact number</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input id="phone-number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 123-456-7890" />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
