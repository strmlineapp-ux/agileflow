
"use client";

import { useState, Fragment } from 'react';
import { type User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Pencil, Lock, X } from 'lucide-react';
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

export function UserManagement() {
    const { realUser, viewAsUser, users, setUsers, allRoles, setAllRoles } = useUser();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [phone, setPhone] = useState('');
    const [editingReportingLine, setEditingReportingLine] = useState<User | null>(null);
    const [tempDirectReports, setTempDirectReports] = useState<string[]>([]);

    const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
    const [editingPermissionState, setEditingPermissionState] = useState<{ user: User; permission: string } | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const { toast } = useToast();
    
    const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
    const [tempRoles, setTempRoles] = useState<string[]>([]);
    const [newRole, setNewRole] = useState('');
    const [isDeleteRole2faDialogOpen, setIsDeleteRole2faDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);


    const allPermissions = [
        "Events", "Event Users", "Studio Productions", "Studio Production Users",
        "Production", "Production Management", "Post-Production", "Service Delivery Manager", "Admin"
    ];

    const isPrivilegedUser = (user: User) => {
        return user.permissions?.includes('Admin') || user.permissions?.includes('Service Delivery Manager');
    }
    
    const managerialPermissions = ["Admin", "Service Delivery Manager", "Production Management", "Studio Production Users", "Event Users"];
    const isManager = (user: User) => {
        return user.permissions?.some(p => managerialPermissions.includes(p));
    };

    const canEditPermissions = (editor: User, target: User, permission: string): boolean => {
        const editorIsPrivileged = isPrivilegedUser(editor);
        if (editorIsPrivileged) {
             if (permission === 'Admin' || (permission === 'Service Delivery Manager' && !editor.permissions?.includes('Admin'))) {
                return true; 
            }
             if (permission === 'Admin' && !editor.permissions?.includes('Admin')) {
                 return false;
             }
            return true;
        }

        const targetIsManager = isManager(target);
        
        if (targetIsManager) return false;

        if (editor.permissions?.includes('Production Management')) {
            const editableByProdManager = ["Production", "Studio Productions", "Post-Production", "Events"];
            if (editableByProdManager.includes(permission)) {
                return true;
            }
        }
        
        if (editor.permissions?.includes('Studio Production Users')) {
            const editableByStudioUsers = ["Post-Production", "Studio Productions"];
            if (editableByStudioUsers.includes(permission)) {
                return true;
            }
        }

        if (editor.permissions?.includes('Event Users')) {
            if (permission === 'Events') {
                return true;
            }
        }

        return false;
    };
    
    const canEditRoles = (editor: User, target: User): boolean => {
        if (isPrivilegedUser(editor)) {
            return true;
        }
        if (isManager(editor) && editor.directReports?.includes(target.userId)) {
            return true;
        }
        return false;
    };


    const handlePermissionChange = (userId: string, permission: string, checked: boolean) => {
        setUsers(users.map(user => {
            if (user.userId === userId) {
                let newPermissions = user.permissions ? [...user.permissions] : [];
                
                if (checked) {
                    if (!newPermissions.includes(permission)) {
                        newPermissions.push(permission);
                    }
                    
                    const dependencies: Record<string, string[]> = {
                        'Service Delivery Manager': ['Production Management', 'Studio Production Users', 'Event Users', 'Post-Production'],
                        'Production Management': ['Post-Production', 'Production', 'Studio Productions', 'Events'],
                        'Studio Production Users': ['Post-Production', 'Studio Productions'],
                        'Event Users': ['Events']
                    };

                    let changed = true;
                    while(changed) {
                        changed = false;
                        for (const parent in dependencies) {
                            if (newPermissions.includes(parent)) {
                                dependencies[parent as keyof typeof dependencies].forEach(child => {
                                    if (!newPermissions.includes(child)) {
                                        newPermissions.push(child);
                                        changed = true;
                                    }
                                });
                            }
                        }
                    }
                } else {
                    newPermissions = newPermissions.filter(p => p !== permission);
                }
                
                return { ...user, permissions: newPermissions };
            }
            return user;
        }));
    };

    const handleRoleChange = (userId: string, role: string, checked: boolean) => {
        setUsers(users.map(user => {
            if (user.userId === userId) {
                const roles = user.roles || [];
                if (checked) {
                    if (!roles.includes(role)) {
                        return { ...user, roles: [...roles, role] };
                    }
                } else {
                    return { ...user, roles: roles.filter(s => s !== role) };
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

    const handleVerifyAndChangePermission = () => {
        if (!editingPermissionState) return;

        if (twoFactorCode === '123456') {
            const { user, permission } = editingPermissionState;
            const isCurrentlyEnabled = user.permissions?.includes(permission);
            handlePermissionChange(user.userId, permission, !isCurrentlyEnabled);
            
            toast({ title: "Success", description: `${permission} permission updated successfully.` });
            setIs2faDialogOpen(false);
            setEditingPermissionState(null);
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
    
    const viewerIsManager = isManager(viewAsUser);
    const viewerIsPrivileged = isPrivilegedUser(viewAsUser);

    const handleAddRole = () => {
        if (newRole && !tempRoles.includes(newRole.trim())) {
             if (newRole.trim().toLowerCase() === 'manage checks') {
                toast({ variant: 'destructive', title: 'Error', description: '"Manage Checks" is a reserved role and cannot be added.' });
                return;
            }
            setTempRoles([...tempRoles, newRole.trim()]);
            setNewRole('');
        }
    };

    const triggerDeleteRole = (role: string) => {
        setRoleToDelete(role);
        setIsDeleteRole2faDialogOpen(true);
    };
    
    const openRolesDialog = () => {
        setTempRoles(allRoles.filter(r => r !== 'Manage Checks'));
        setIsRolesDialogOpen(true);
    };

    const handleVerifyAndDeleteRole = () => {
        if (!roleToDelete) return;

        if (twoFactorCode === '123456') {
            setTempRoles(tempRoles.filter(role => role !== roleToDelete));
            toast({ title: "Success", description: `Role "${roleToDelete}" deleted successfully.` });
            setIsDeleteRole2faDialogOpen(false);
            setRoleToDelete(null);
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

    const handleSaveRoles = () => {
        setAllRoles(['Manage Checks', ...tempRoles].filter((value, index, self) => self.indexOf(value) === index));
        setIsRolesDialogOpen(false);
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
                            {users.map(user => {
                                const canViewerEditThisUserRoles = canEditRoles(viewAsUser, user);
                                return (
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

                                                        {viewerIsManager && (
                                                            <div className="mt-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <p className="font-medium text-sm">Reporting Line</p>
                                                                    {isPrivilegedUser(viewAsUser) && (
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
                                                        )}
                                                    </div>
                                                    
                                                    {(viewerIsManager || user.userId === viewAsUser.userId) && (
                                                        <div>
                                                            <p className="font-medium text-sm mb-2">Create/ Edit</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {allPermissions.map(permission => {
                                                                    const canViewAdminPermission = viewerIsPrivileged || user.userId === viewAsUser.userId;
                                                                    if (permission === 'Admin' && !canViewAdminPermission) {
                                                                        return null;
                                                                    }

                                                                    const permissionIsEnabled = user.permissions?.includes(permission);
                                                                    const canEdit = canEditPermissions(viewAsUser, user, permission);

                                                                    if (!viewerIsManager && !permissionIsEnabled && permission !== 'Admin') {
                                                                        return null;
                                                                    }
                                                                    
                                                                    const hasServiceDeliveryManager = user.permissions?.includes('Service Delivery Manager');
                                                                    const hasProductionManagement = user.permissions?.includes('Production Management');
                                                                    const hasStudioProductionUsers = user.permissions?.includes('Studio Production Users');
                                                                    const hasEventUsers = user.permissions?.includes('Event Users');

                                                                    const isLocked = 
                                                                        (permission === 'Production Management' && hasServiceDeliveryManager) ||
                                                                        (permission === 'Studio Production Users' && hasServiceDeliveryManager) ||
                                                                        (permission === 'Event Users' && hasServiceDeliveryManager) ||
                                                                        (permission === 'Post-Production' && hasServiceDeliveryManager) ||
                                                                        (permission === 'Post-Production' && hasProductionManagement) ||
                                                                        (permission === 'Production' && hasProductionManagement) ||
                                                                        (permission === 'Studio Productions' && hasProductionManagement) ||
                                                                        (permission === 'Events' && hasProductionManagement) ||
                                                                        (permission === 'Post-Production' && hasStudioProductionUsers) ||
                                                                        (permission === 'Studio Productions' && hasStudioProductionUsers) ||
                                                                        (permission === 'Events' && hasEventUsers);
                                                                    
                                                                    const isPrivilegedPermission = permission === 'Admin' || permission === 'Service Delivery Manager';
                                                                    const isCheckboxDisabled = isPrivilegedPermission || isLocked || !canEdit;
                                                                    const isChecked = permissionIsEnabled || isLocked;

                                                                    return (
                                                                        <div key={permission} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`${user.userId}-${permission}`}
                                                                                checked={isChecked}
                                                                                disabled={isCheckboxDisabled}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (!isPrivilegedPermission && canEdit) {
                                                                                        handlePermissionChange(user.userId, permission, !!checked);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Label
                                                                                htmlFor={`${user.userId}-${permission}`}
                                                                                className="text-sm font-normal flex items-center gap-1 cursor-pointer"
                                                                                onClick={() => {
                                                                                    if (isPrivilegedPermission && canEdit) {
                                                                                        const isAdminPermission = permission === 'Admin';
                                                                                        const isSdmNotByAdmin = permission === 'Service Delivery Manager' && !viewAsUser.permissions?.includes('Admin');
                                                                                        
                                                                                        if (isAdminPermission || isSdmNotByAdmin) {
                                                                                            setEditingPermissionState({ user, permission });
                                                                                            setIs2faDialogOpen(true);
                                                                                        } else {
                                                                                            const isCurrentlyEnabled = user.permissions?.includes(permission);
                                                                                            handlePermissionChange(user.userId, permission, !isCurrentlyEnabled);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {permission}
                                                                                {isPrivilegedPermission && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                                            </Label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(viewerIsManager || user.userId === viewAsUser.userId) && (
                                                      <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <p className="font-medium text-sm">Roles</p>
                                                                {viewerIsManager && (
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openRolesDialog}>
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="sr-only">Edit roles</span>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                          <div className="grid grid-cols-2 gap-2">
                                                              {allRoles.map(role => {
                                                                    const isThisManager = isManager(user);
                                                                    const isManageChecksRole = role === 'Manage Checks';
                                                                    const isChecked = user.roles?.includes(role);
                                                                    const isDisabled = (isManageChecksRole && isThisManager) || !canViewerEditThisUserRoles;

                                                                    if (isManageChecksRole && !isThisManager && !viewerIsPrivileged) {
                                                                        // Hide 'Manage Checks' for non-managers if viewer is not privileged
                                                                        if (isChecked) {
                                                                            // but show it if they have it
                                                                        } else {
                                                                            return null;
                                                                        }
                                                                    }
                                                                    
                                                                    if (canViewerEditThisUserRoles || user.userId === viewAsUser.userId) {
                                                                        return (
                                                                            <div key={role} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={`${user.userId}-${role}`}
                                                                                    checked={isChecked}
                                                                                    disabled={isDisabled}
                                                                                    onCheckedChange={(checked) => handleRoleChange(user.userId, role, !!checked)}
                                                                                />
                                                                                <Label htmlFor={`${user.userId}-${role}`} className="text-sm font-normal flex items-center gap-1">
                                                                                    {role}
                                                                                    {isManageChecksRole && isThisManager && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                                                </Label>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (isChecked) {
                                                                         return (
                                                                            <div key={role} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={`${user.userId}-${role}`}
                                                                                    checked={true}
                                                                                    disabled={true}
                                                                                />
                                                                                <Label htmlFor={`${user.userId}-${role}`} className="text-sm font-normal">{role}</Label>
                                                                            </div>
                                                                         );
                                                                    }
                                                                    
                                                                    return null;
                                                               })}
                                                                {!canViewerEditThisUserRoles && (!user.roles || user.roles.filter(r => r !== 'Manage Checks').length === 0) && (
                                                                    <p className="text-sm text-muted-foreground col-span-2">No roles assigned.</p>
                                                                )}
                                                          </div>
                                                      </div>
                                                    )}
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

            <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setIs2faDialogOpen(false);
                    setEditingPermissionState(null);
                    setTwoFactorCode('');
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Changing the {editingPermissionState?.permission} permission requires secondary authentication. Enter the code from your Google Authenticator app.
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
                             setEditingPermissionState(null);
                             setTwoFactorCode('');
                         }}>Cancel</Button>
                        <Button onClick={handleVerifyAndChangePermission}>Verify & Change</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Roles</DialogTitle>
                        <DialogDescription>
                            Add or remove roles available for assignment. Changes will affect all users.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                            {tempRoles.map(role => (
                                <div key={role} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                    <span className="text-sm">{role}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => triggerDeleteRole(role)}>
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove {role}</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="New role name"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                            />
                            <Button onClick={handleAddRole}>Add</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRolesDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRoles}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteRole2faDialogOpen} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setIsDeleteRole2faDialogOpen(false);
                    setRoleToDelete(null);
                    setTwoFactorCode('');
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Deleting the role "{roleToDelete}" requires secondary authentication. Enter the code from your Google Authenticator app.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="delete-role-2fa-code" className="text-right">
                                Code
                            </Label>
                            <Input
                                id="delete-role-2fa-code"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="col-span-3"
                                placeholder="123456"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => {
                             setIsDeleteRole2faDialogOpen(false);
                             setRoleToDelete(null);
                             setTwoFactorCode('');
                         }}>Cancel</Button>
                        <Button onClick={handleVerifyAndDeleteRole} variant="destructive">Verify & Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
