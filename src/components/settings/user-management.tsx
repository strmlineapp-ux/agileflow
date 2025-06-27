
"use client";

import { useState, Fragment } from 'react';
import { type User } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Pencil, Palette, X } from 'lucide-react';
import { Label } from "@/components/ui/label"
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function UserManagement() {
    const { realUser, viewAsUser, users, allRoles, updateUser } = useUser();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // State for editing user contact
    const [editingContactUser, setEditingContactUser] = useState<User | null>(null);
    const [phone, setPhone] = useState('');

    // State for editing reporting lines
    const [editingReportingLine, setEditingReportingLine] = useState<User | null>(null);
    const [tempDirectReports, setTempDirectReports] = useState<string[]>([]);

    // State for editing roles
    const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
    const [userToEditRoles, setUserToEditRoles] = useState<User | null>(null);
    const [tempRoles, setTempRoles] = useState<string[]>([]);
    const [roleToAdd, setRoleToAdd] = useState('');
    
    // State for 2FA dialog
    const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
    const [on2faSuccess, setOn2faSuccess] = useState<(() => void) | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const { toast } = useToast();

    const assignableRoles = viewAsUser.roles?.includes('Admin')
        ? allRoles
        : (viewAsUser.roles || []).filter(role => allRoles.includes(role));

    const privilegedRoles = ['Admin', 'Service Delivery Manager'];

    const canEditUser = (editor: User, target: User): boolean => {
        if (editor.roles?.includes('Admin')) return true;
        if (editor.roles?.includes('Service Delivery Manager') && target.userId !== editor.userId) return true;
        if (editor.directReports?.includes(target.userId)) return true;
        return false;
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

    const handleSavePhone = async () => {
        if (!editingContactUser) return;
        await updateUser(editingContactUser.userId, { phone });
        setEditingContactUser(null);
    };

    const handleEditReportingLine = (user: User) => {
        setEditingReportingLine(user);
        setTempDirectReports(user.directReports || []);
    };

    const handleSaveReportingLine = async () => {
        if (!editingReportingLine) return;
        await updateUser(editingReportingLine.userId, { directReports: tempDirectReports });
        setEditingReportingLine(null);
    };

    const handleReportSelectionChange = (reportId: string, checked: boolean) => {
        setTempDirectReports(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(reportId);
            else newSet.delete(reportId);
            return Array.from(newSet);
        });
    };

    const handleOpenRolesDialog = (user: User) => {
        setUserToEditRoles(user);
        setTempRoles(user.roles || []);
        setIsRolesDialogOpen(true);
    };

    const handleAddRoleToTemp = () => {
        if (roleToAdd && !tempRoles.includes(roleToAdd)) {
            setTempRoles(prev => [...prev, roleToAdd]);
            setRoleToAdd('');
        }
    };

    const handleRemoveRoleFromTemp = (roleToRemove: string) => {
        setTempRoles(prev => prev.filter(role => role !== roleToRemove));
    };

    const handleSaveRoles = () => {
        if (!userToEditRoles) return;
        
        const originalRoles = new Set(userToEditRoles.roles || []);
        const newRoles = new Set(tempRoles);

        const changedRoles = new Set(
            [...originalRoles, ...newRoles].filter(role => originalRoles.has(role) !== newRoles.has(role))
        );

        const requires2fa = [...changedRoles].some(role => privilegedRoles.includes(role));

        const saveAction = async () => {
            let finalRoles = [...tempRoles];
            const dependencies: Record<string, string[]> = {
                'Service Delivery Manager': ['Production Team Admin', 'Studio Production Team Admin', 'Live Event Team Admin', 'Post-Production', 'Production', 'Studio Productions', 'Live Events', 'Manage Checks'],
                'Production Team Admin': ['Post-Production', 'Production', 'Studio Productions', 'Live Events', 'Manage Checks'],
                'Studio Production Team Admin': ['Post-Production', 'Studio Productions', 'Manage Checks'],
                'Live Event Team Admin': ['Live Events', 'Manage Checks']
            };

            let changed = true;
            while(changed) {
                changed = false;
                const rolesToAdd: string[] = [];
                finalRoles.forEach(role => {
                    if (dependencies[role]) {
                        dependencies[role].forEach(dep => {
                            if (!finalRoles.includes(dep) && !rolesToAdd.includes(dep)) {
                                rolesToAdd.push(dep);
                            }
                        });
                    }
                });
                if (rolesToAdd.length > 0) {
                    finalRoles = [...finalRoles, ...rolesToAdd];
                    changed = true;
                }
            }
            
            const uniqueRoles = [...new Set(finalRoles)];
            await updateUser(userToEditRoles.userId, { roles: uniqueRoles });
            toast({ title: "Success", description: `${userToEditRoles.displayName}'s roles have been updated.` });
            closeRolesDialog();
        };

        if (requires2fa) {
            setOn2faSuccess(() => saveAction);
            setIs2faDialogOpen(true);
        } else {
            saveAction();
        }
    };
    
    const closeRolesDialog = () => {
        setIsRolesDialogOpen(false);
        setUserToEditRoles(null);
        setTempRoles([]);
        setRoleToAdd('');
    };
    
    const handleVerify2fa = () => {
        if (twoFactorCode === '123456') {
            on2faSuccess?.();
            close2faDialog();
        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: "The provided 2FA code is incorrect. Please try again.",
            });
            setTwoFactorCode('');
        }
    };

    const close2faDialog = () => {
        setIs2faDialogOpen(false);
        setTwoFactorCode('');
        setOn2faSuccess(null);
    };

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
                                        <TableCell>{user.title}</TableCell>
                                        <TableCell>{user.location}</TableCell>
                                        <TableCell className="text-right">
                                            {user.userId === realUser.userId && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Palette className="h-4 w-4" />
                                                            <span className="sr-only">Change preferences</span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Preferences</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Set your color scheme and default calendar view.
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <Label htmlFor="color-scheme">Colour Scheme</Label>
                                                                    <Select
                                                                        value={realUser.theme || 'light'}
                                                                        onValueChange={(value) => updateUser(realUser.userId, { theme: value as any })}
                                                                    >
                                                                        <SelectTrigger id="color-scheme" className="col-span-2 h-8">
                                                                            <SelectValue placeholder="Select scheme" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="light">Light</SelectItem>
                                                                            <SelectItem value="dark">Dark</SelectItem>
                                                                            <SelectItem value="high-visibility">High Visibility</SelectItem>
                                                                            <SelectItem value="firebase">Firebase</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <Label htmlFor="calendar-view">Default View</Label>
                                                                    <Select
                                                                        value={realUser.defaultCalendarView || 'day'}
                                                                        onValueChange={(value) => updateUser(realUser.userId, { defaultCalendarView: value as any })}
                                                                    >
                                                                        <SelectTrigger id="calendar-view" className="col-span-2 h-8">
                                                                            <SelectValue placeholder="Select view" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="month">Month</SelectItem>
                                                                            <SelectItem value="week">Week</SelectItem>
                                                                            <SelectItem value="day">Day</SelectItem>
                                                                            <SelectItem value="production-schedule">Production Schedule</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                                                    <div>
                                                        <p className="font-medium text-sm mb-2">Details</p>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-xs text-muted-foreground">Contact</p>
                                                                    {user.userId === realUser.userId && (
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                                                            setEditingContactUser(user);
                                                                            setPhone(user.phone || '');
                                                                        }}>
                                                                            <Pencil className="h-3 w-3" />
                                                                            <span className="sr-only">Edit phone number</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {user.phone ? <p className="text-sm">{user.phone}</p> : <p className="text-sm text-muted-foreground italic">Not provided</p>}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-xs text-muted-foreground">Reporting Line</p>
                                                                    {viewAsUser.roles?.includes('Admin') && (
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEditReportingLine(user)}>
                                                                            <Pencil className="h-3 w-3" />
                                                                            <span className="sr-only">Edit reporting line</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {user.directReports && user.directReports.length > 0 ? user.directReports?.map(reportId => {
                                                                    const reportUser = users.find(u => u.userId === reportId);
                                                                    return reportUser ? <div key={reportId} className="text-sm">{reportUser.displayName}</div> : null;
                                                                }) : <p className="text-sm text-muted-foreground italic">No direct reports</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                     <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <p className="font-medium text-sm">Roles/ Permissions</p>
                                                            {canEditUser(viewAsUser, user) && (
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenRolesDialog(user)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                    <span className="sr-only">Edit roles</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {(canEditUser(viewAsUser, user) || viewAsUser.userId === user.userId) && (
                                                          user.roles && user.roles.length > 0 ? (
                                                              <div className="flex flex-wrap gap-2">
                                                                  {user.roles?.map(role => (
                                                                      <Badge key={role} variant="secondary">{role}</Badge>
                                                                  ))}
                                                              </div>
                                                          ) : <p className="text-sm text-muted-foreground italic">No roles assigned</p>
                                                        )}
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

            <Dialog open={!!editingContactUser} onOpenChange={(isOpen) => !isOpen && setEditingContactUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit contact number</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone-number" className="text-right">Phone</Label>
                            <Input id="phone-number" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="e.g. 123-456-7890" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingContactUser(null)}>Cancel</Button>
                        <Button onClick={handleSavePhone}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingReportingLine} onOpenChange={(isOpen) => !isOpen && setEditingReportingLine(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Reporting Line for {editingReportingLine?.displayName}</DialogTitle>
                        <DialogDescription>Select users that report to {editingReportingLine?.displayName}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4 max-h-60 overflow-y-auto">
                        {users.filter(u => u.userId !== editingReportingLine?.userId).map(u => (
                            <div key={u.userId} className="flex items-center space-x-2">
                                <input type="checkbox" id={`report-${u.userId}`} checked={tempDirectReports.includes(u.userId)} onChange={(e) => handleReportSelectionChange(u.userId, e.target.checked)} className="form-checkbox h-4 w-4 text-primary" />
                                <Label htmlFor={`report-${u.userId}`} className="font-normal">{u.displayName}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingReportingLine(null)}>Cancel</Button>
                        <Button onClick={handleSaveReportingLine}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isRolesDialogOpen} onOpenChange={(isOpen) => !isOpen && closeRolesDialog()}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Roles/Permissions for {userToEditRoles?.displayName}</DialogTitle>
                        <DialogDescription>Add or remove roles for this user.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Assigned Roles</h4>
                            <div className="p-1 max-h-48 overflow-y-auto space-y-2">
                                {tempRoles.length > 0 ? (
                                    tempRoles.map(role => (
                                        <div key={role} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                            <span className="text-sm">{role}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRoleFromTemp(role)}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove {role}</span>
                                            </Button>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-muted-foreground text-center py-4">No roles assigned.</p>}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-medium text-sm">Add Role</h4>
                            <div className="flex items-center gap-2">
                                <Select value={roleToAdd} onValueChange={setRoleToAdd}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role to add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignableRoles.filter(r => !tempRoles.includes(r)).map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddRoleToTemp} disabled={!roleToAdd}>Add</Button>
                            </div>
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeRolesDialog}>Cancel</Button>
                        <Button onClick={handleSaveRoles}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Changing a privileged role requires secondary authentication. Enter the code from your authenticator app.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="2fa-code" className="text-right">Code</Label>
                            <Input id="2fa-code" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} className="col-span-3" placeholder="123456" />
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={close2faDialog}>Cancel</Button>
                        <Button onClick={handleVerify2fa}>Verify & Change</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
