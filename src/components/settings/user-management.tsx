"use client";

import { useState } from 'react';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const mockUsers: User[] = [
    { userId: '1', displayName: 'Alice Johnson', email: 'alice@example.com', role: 'admin', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Product Manager', location: 'New York, USA', phone: '123-456-7890' },
    { userId: '2', displayName: 'Bob Williams', email: 'bob@example.com', role: 'manager', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'Lead Engineer', location: 'San Francisco, USA' },
    { userId: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', role: 'team_member', googleCalendarLinked: true, avatarUrl: 'https://placehold.co/40x40.png', title: 'Software Engineer', location: 'Austin, USA' },
    { userId: '4', displayName: 'Diana Prince', email: 'diana@example.com', role: 'team_member', googleCalendarLinked: false, avatarUrl: 'https://placehold.co/40x40.png', title: 'UX Designer', location: 'Chicago, USA', phone: '098-765-4321' },
];

const currentUserId = '1';

export function UserManagement() {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isRoleModalOpen, setRoleModalOpen] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [roleInput, setRoleInput] = useState<'admin' | 'manager' | 'team_member'>('team_member');

    const currentUser = users.find(u => u.userId === currentUserId);

    const handleRoleChange = () => {
        if (selectedUser) {
            setUsers(users.map(u => u.userId === selectedUser.userId ? {...u, role: roleInput} : u));
            setRoleModalOpen(false);
        }
    };

    const handlePhoneChange = () => {
        if (selectedUser) {
            setUsers(users.map(u => u.userId === selectedUser.userId ? {...u, phone: phoneInput} : u));
            setEditModalOpen(false);
        }
    }
    
    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setPhoneInput(user.phone || '');
        setEditModalOpen(true);
    }

    const openRoleModal = (user: User) => {
        setSelectedUser(user);
        setRoleInput(user.role);
        setRoleModalOpen(true);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.userId}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar"/>
                                                <AvatarFallback>{user.displayName.slice(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.title || 'N/A'}</TableCell>
                                    <TableCell className="capitalize">{user.role.replace('_', ' ')}</TableCell>
                                    <TableCell>{user.phone || 'Not provided'}</TableCell>
                                    <TableCell>{user.location || 'N/A'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {user.userId === currentUserId && (
                                                    <DropdownMenuItem onSelect={() => openEditModal(user)}>Edit Phone</DropdownMenuItem>
                                                )}
                                                {(currentUser?.role === 'admin') && user.userId !== currentUserId && (
                                                    <DropdownMenuItem onSelect={() => openRoleModal(user)}>Change Role</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Phone Number</DialogTitle>
                        <DialogDescription>Update your phone number.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handlePhoneChange}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRoleModalOpen} onOpenChange={setRoleModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Role</DialogTitle>
                        <DialogDescription>Select a new role for {selectedUser?.displayName}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="role">Role</Label>
                         <Select value={roleInput} onValueChange={(value) => setRoleInput(value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="team_member">Team Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
                         <Button onClick={handleRoleChange}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
