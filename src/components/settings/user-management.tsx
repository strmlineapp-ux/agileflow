
"use client";

import { useState, Fragment } from 'react';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Pencil, Lock } from 'lucide-react';
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { mockUsers } from '@/lib/mock-data';

export function UserManagement() {
    const { realUser, viewAsUser } = useUser();
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [phone, setPhone] = useState('');
    const [editingReportingLine, setEditingReportingLine] = useState<User | null>(null);
    const [tempDirectReports, setTempDirectReports] = useState<string[]>([]);

    const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
    const [editingAdminForUser, setEditingAdminForUser] = useState<User | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const { toast } = useToast();

    const canSeePermissions = viewAsUser.permissions?.includes('Admin') || viewAsUser.permissions?.includes('Service Delivery Manager');
    const canEditReportingLine = viewAsUser.permissions?.includes('Admin') || viewAsUser.permissions?.includes('Service Delivery Manager');

    const allSkills = [
        'Video Director', 'D.o.P.', 'Camera', 'Audio', 
        'ES Operator', 'TD', '1st AD', 'Content Op', 'Edit Events'
    ];

    const allPermissions = [
        "Events", "Event Users", "Studio Productions", "Studio Production Users",
        "Production", "Production Management", "Service Delivery Manager", "Admin"
    ];

    const handlePermissionChange = (userId: string, permission: string, checked: boolean) => {
        setUsers(users.map(user => {
            if (user.userId === userId) {
                const permissions = user.permissions || [];
                if (checked) {
                    if (!permissions.includes(permission)) {
                        return { ...user, permissions: [...permissions, permission] };
                    }
                } else {
                    return { ...user, permissions: permissions.filter(p => p !== permission) };
                }
            }
            return user;
        }));
    };

    const handleSkillChange = (userId: string, skill: string, checked: boolean) => {
        setUsers(users.map(user => {
            if (user.userId === userId) {
                const skills = user.skills || [];
                if (checked) {
                    if (!skills.includes(skill)) {
                        return { ...user, skills: [...skills, skill] };
                    }
                } else {
                    return { ...user, skills: skills.filter(s => s !== skill) };
                }
            }
            return user;
        }));
    };

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

    const handleSavePhone = () => {
        if (!editingUser) return;

        setUsers(users.map(user => 
            user.userId === editingUser.userId ? { ...user, phone: phone } : user
        ));
        setEditingUser(null);
    };

    const handleEditReportingLine = (user: User) => {
        setEditingReportingLine(user);
        setTempDirectReports(user.directReports || []);
    };

    const handleSaveReportingLine = () => {
        if (!editingReportingLine) return;

        setUsers(users.map(user =>
            user.userId === editingReportingLine.userId
                ? { ...user, directReports: tempDirectReports }
                : user
        ));
        setEditingReportingLine(null);
    };

    const handleReportSelectionChange = (reportId: string, checked: boolean) => {
        setTempDirectReports(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(reportId);
            } else {
                newSet.delete(reportId);
            }
            return Array.from(newSet);
        });
    };

    const handleVerifyAndChangeAdmin = () => {
        if (!editingAdminForUser) return;

        if (twoFactorCode === '123456') { 
            const isCurrentlyAdmin = editingAdminForUser.permissions?.includes('Admin');
            handlePermissionChange(editingAdminForUser.userId, 'Admin', !isCurrentlyAdmin);
            
            toast({ title: "Success", description: "Admin permission updated successfully." });
            setIs2faDialogOpen(false);
            setEditingAdminForUser(null);
            setTwoFactorCode('');
        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: "The provided 2FA code is incorrect. Please try again.",
            });
            setTwoFactorCode('');
        }
    };

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
                                <TableHead className="w-[48px]" />
                                <TableHead>User</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <Fragment key={user.userId}>
                                    <TableRow>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => toggleRow(user.userId)}>
                                                {expandedRows.has(user.userId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <span className="sr-only">Toggle row</span>
                                            </Button>
                                        </TableCell>
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
                                        <TableCell>{user.location || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            {/* This space is intentionally left blank. Edit button is in the expanded view. */}
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(user.userId) && (
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell />
                                            <TableCell colSpan={4}>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <p className="font-medium text-sm">Contact</p>
                                                            {user.userId === realUser.userId && (
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                                    setEditingUser(user);
                                                                    setPhone(user.phone || '');
                                                                }}>
                                                                    <Pencil className="h-4 w-4" />
                                                                    <span className="sr-only">Edit phone number</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{user.phone || 'Not provided'}</p>

                                                        <div className="mt-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <p className="font-medium text-sm">Reporting Line</p>
                                                                {canEditReportingLine && (
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditReportingLine(user)}>
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="sr-only">Edit reporting line</span>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div>
                                                                {(user.directReports && user.directReports.length > 0) ? (
                                                                    user.directReports.map(reportId => {
                                                                        const reportUser = users.find(u => u.userId === reportId);
                                                                        return (
                                                                            <div key={reportId} className="text-sm text-muted-foreground">
                                                                                {reportUser?.displayName || 'Unknown User'}
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">No direct reports.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {canSeePermissions && (
                                                        <div>
                                                            <p className="font-medium text-sm mb-2">Permissions</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {allPermissions.map(permission => (
                                                                    <div key={permission} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={`${user.userId}-${permission}`}
                                                                            checked={user.permissions?.includes(permission)}
                                                                            disabled={permission === 'Admin'}
                                                                            onCheckedChange={(checked) => {
                                                                                if (permission !== 'Admin') {
                                                                                    handlePermissionChange(user.userId, permission, !!checked);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label
                                                                            htmlFor={`${user.userId}-${permission}`}
                                                                            className="text-sm font-normal flex items-center gap-1 cursor-pointer"
                                                                            onClick={() => {
                                                                                if (permission === 'Admin') {
                                                                                    setEditingAdminForUser(user);
                                                                                    setIs2faDialogOpen(true);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {permission}
                                                                            {permission === 'Admin' && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="font-medium text-sm mb-2">Skills</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {allSkills.map(skill => (
                                                                <div key={skill} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`${user.userId}-${skill}`}
                                                                        checked={user.skills?.includes(skill)}
                                                                        onCheckedChange={(checked) => handleSkillChange(user.userId, skill, !!checked)}
                                                                    />
                                                                    <Label htmlFor={`${user.userId}-${skill}`} className="text-sm font-normal">{skill}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit contact number</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone-number" className="text-right">
                                Phone
                            </Label>
                            <Input
                                id="phone-number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. 123-456-7890"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleSavePhone}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingReportingLine} onOpenChange={(isOpen) => !isOpen && setEditingReportingLine(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Reporting Line for {editingReportingLine?.displayName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <p className="text-sm text-muted-foreground">Select users that report to {editingReportingLine?.displayName}.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {users
                                .filter(u => u.userId !== editingReportingLine?.userId)
                                .map(u => (
                                    <div key={u.userId} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`report-${u.userId}`}
                                            checked={tempDirectReports.includes(u.userId)}
                                            onCheckedChange={(checked) => handleReportSelectionChange(u.userId, !!checked)}
                                        />
                                        <Label htmlFor={`report-${u.userId}`} className="font-normal">{u.displayName}</Label>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingReportingLine(null)}>Cancel</Button>
                        <Button onClick={handleSaveReportingLine}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={is2faDialogOpen} onOpenChange={setIs2faDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Changing admin permissions requires secondary authentication. Enter the code from your Google Authenticator app.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="2fa-code" className="text-right">
                                Code
                            </Label>
                            <Input
                                id="2fa-code"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="col-span-3"
                                placeholder="123456"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => {
                             setIs2faDialogOpen(false);
                             setEditingAdminForUser(null);
                             setTwoFactorCode('');
                         }}>Cancel</Button>
                        <Button onClick={handleVerifyAndChangeAdmin}>Verify & Change</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
