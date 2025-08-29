

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { corePages, coreTabs } from '@/lib/core-data';
import { cn, getContrastColor, isHueInRange, getHueFromHsl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { CardTemplate } from '@/components/common/card-template';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HslStringColorPicker } from 'react-colorful';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { UserCard } from '@/components/common/user-card';
import { DraggableGrid } from '../common/draggable-grid';
import { SortableItem } from '../common/sortable-item';
import { IconColorPicker } from '../common/icon-color-picker';

// #region Admin Groups Management Tab

function SortableUserCard({ user, listId, onDeleteRequest }: { user: User, listId: string, onDeleteRequest?: (user: User) => void }) {
    const draggableId = `user-dnd-${user.userId}-${listId}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: draggableId,
        data: { type: 'user', user, fromListId: listId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="break-inside-avoid p-2">
            <UserCard 
              user={user} 
              isDeletable={listId === 'user-list'} 
              onDelete={onDeleteRequest} 
            />
        </div>
    );
}

function UserDropZone({ id, users, children, onDeleteRequest }: { id: string, users: User[], children: React.ReactNode, onDeleteRequest?: (user: User) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list' }});
  
  const sortableUserIds = users.map(u => `user-dnd-${u.userId}-${id}`);

  return (
    <div ref={setNodeRef} className={cn(
        "p-1 space-y-1 rounded-md min-h-[60px] transition-all", 
        isOver && "ring-1 ring-border ring-inset"
    )}>
        <SortableContext items={sortableUserIds} strategy={verticalListSortingStrategy}>
            <div className="gap-4 [column-fill:_balance] columns-1 sm:columns-2 md:columns-1 lg:columns-2 xl:columns-3 2xl:columns-4">
                {users.map((user) => (
                    <SortableUserCard key={user.userId} user={user} listId={id} onDeleteRequest={onDeleteRequest} />
                ))}
            </div>
        </SortableContext>
        {children}
    </div>
  )
}

export const AdminsManagement = ({ isActive }: { isActive: boolean }) => {
  const { toast } = useToast();
  const { viewAsUser, users, updateUser, deleteUser, reorderUsers, appSettings, updateAppSettings } = useUser();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [pendingUserMove, setPendingUserMove] = useState<{ user: User; fromListId: string; destListId: string } | null>(null);
  const [pendingUserDelete, setPendingUserDelete] = useState<User | null>(null);
  const [twoFactorActionType, setTwoFactorActionType] = useState<'toggleAdmin' | 'deleteUser' | null>(null);

  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEditing2fa, setIsEditing2fa] = useState(false);
  const twoFactorCodeInputRef = useRef<HTMLInputElement>(null);
  
  const [adminSearch, setAdminSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const [activeAdminSearch, setActiveAdminSearch] = useState(false);

  const [activeDragUser, setActiveDragUser] = useState<User | null>(null);
  const [isAddUserPopoverOpen, setIsAddUserPopoverOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  
  const preApprovedEmails = useMemo(() => appSettings.preApprovedEmails || [], [appSettings]);

  const handleAddPreApprovedEmail = () => {
    if (newUserEmail.trim() && !preApprovedEmails.includes(newUserEmail.trim())) {
      const updatedEmails = [...preApprovedEmails, newUserEmail.trim()];
      updateAppSettings({ preApprovedEmails: updatedEmails });
      setNewUserEmail('');
    }
  };

  const handleRemovePreApprovedEmail = (emailToRemove: string) => {
    const updatedEmails = preApprovedEmails.filter(email => email !== emailToRemove);
    updateAppSettings({ preApprovedEmails: updatedEmails });
  };

  const adminUsers = useMemo(() => users.filter(u => u.isAdmin), [users]);
  const nonAdminUsers = useMemo(() => users.filter(u => !u.isAdmin), [users]);

  useEffect(() => {
    if (is2faDialogOpen) {
      setTimeout(() => {
        setIsEditing2fa(true);
        setTimeout(() => twoFactorCodeInputRef.current?.focus(), 50);
      }, 50);
    }
  }, [is2faDialogOpen]);

  const filteredAdminUsers = useMemo(() =>
    adminUsers.filter(u => u.displayName.toLowerCase().includes(adminSearch.toLowerCase())),
    [adminUsers, adminSearch]
  );

  const filteredNonAdminUsers = useMemo(() =>
      nonAdminUsers.filter(u => u.displayName.toLowerCase().includes(userSearch.toLowerCase())),
      [nonAdminUsers, userSearch]
  );
  
  const handleAdminToggleRequest = (userToMove: User, fromListId: string, destListId: string) => {
    const currentAdminCount = users.filter(u => u.isAdmin).length;
    if (userToMove.isAdmin && currentAdminCount === 1) {
        toast({
            variant: 'destructive',
            title: 'Action Prohibited',
            description: 'You cannot remove the last system administrator.',
        });
        return;
    }
    setPendingUserMove({ user: userToMove, fromListId, destListId });
    setTwoFactorActionType('toggleAdmin');
    setIs2faDialogOpen(true);
  };
  
  const handleDeleteUserRequest = (userToDelete: User) => {
    setPendingUserDelete(userToDelete);
    setTwoFactorActionType('deleteUser');
    setIs2faDialogOpen(true);
  };

  const handleVerify2fa = () => {
    if (twoFactorCode !== '123456') {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'The provided 2FA code is incorrect. Please try again.' });
        setTwoFactorCode('');
        return;
    }

    if (twoFactorActionType === 'toggleAdmin' && pendingUserMove) {
        const { user } = pendingUserMove;
        updateUser(user.userId, { isAdmin: !user.isAdmin });
        toast({ title: 'Success', description: `${user.displayName}'s admin status has been updated.` });
    } else if (twoFactorActionType === 'deleteUser' && pendingUserDelete) {
        deleteUser(pendingUserDelete.userId);
        toast({ title: 'User Deleted', description: `${pendingUserDelete.displayName} has been removed from the system.` });
    }
    close2faDialog();
  };

  const close2faDialog = () => {
    setIs2faDialogOpen(false);
    setTwoFactorCode('');
    setPendingUserMove(null);
    setPendingUserDelete(null);
    setTwoFactorActionType(null);
    setIsEditing2fa(false);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragUser(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeData = active.data.current;
    const userToMove: User | undefined = activeData?.user;
    
    if (userToMove) {
        const sourceListId: string | undefined = activeData?.fromListId;
        const overElement = over.data.current;
        const destListId: string | undefined = overElement?.type === 'user-list' ? over.id.toString() : overElement?.fromListId;

        if (sourceListId && destListId && sourceListId !== destListId) {
            handleAdminToggleRequest(userToMove, sourceListId, destListId);
        } else if (sourceListId && destListId && sourceListId === destListId) {
            const list = sourceListId === 'admin-list' ? adminUsers : nonAdminUsers;
            const oldIndex = list.findIndex(u => `user-dnd-${u.userId}-${sourceListId}` === active.id);
            const overUser = over.data.current?.user as User;
            const newIndex = list.findIndex(u => u.userId === overUser.userId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedSubList = arrayMove(list, oldIndex, newIndex);
                const reorderedFullList = sourceListId === 'admin-list' 
                    ? [...reorderedSubList, ...nonAdminUsers] 
                    : [...adminUsers, ...reorderedSubList];
                const finalOrder = users.map(u => reorderedFullList.find(r => r.userId === u.userId)).filter(Boolean) as User[];
                reorderUsers(finalOrder);
            }
        }
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragUser(event.active.data.current?.user || null);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  return (
    <div className="space-y-6">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-muted-foreground">Admins ({filteredAdminUsers.length})</CardTitle>
                             <div className="flex items-center gap-1">
                                <CompactSearchInput
                                  searchTerm={adminSearch}
                                  setSearchTerm={setAdminSearch}
                                  placeholder="Search admins..."
                                  tooltipText="Search Admins"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <UserDropZone id="admin-list" users={filteredAdminUsers} />
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-2">
                                <CardTitle className="text-muted-foreground">Users ({filteredNonAdminUsers.length})</CardTitle>
                                <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <PopoverTrigger asChild>
                                              <Button variant="ghost" size="icon" className="p-0 text-muted-foreground">
                                                  <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                                              </Button>
                                          </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Pre-approve User</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-80 p-0" align="start">
                                        <div className="flex items-center gap-1 p-2">
                                            <Input
                                                placeholder="user@example.com"
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddPreApprovedEmail()}
                                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 p-0 flex-1"
                                            />
                                            <Button variant="ghost" size="icon" onClick={handleAddPreApprovedEmail} className="h-8 w-8"><GoogleSymbol name="add" /></Button>
                                        </div>
                                        {preApprovedEmails.length > 0 && (
                                            <ScrollArea className="max-h-40 mt-2">
                                                <div className="p-2 space-y-1">
                                                {preApprovedEmails.map(email => (
                                                    <div key={email} className="flex items-center justify-between text-sm p-1 rounded-md">
                                                        <span>{email}</span>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemovePreApprovedEmail(email)}>
                                                            <GoogleSymbol name="close" className="text-xs" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>
                             <div className="flex items-center gap-1">
                                <CompactSearchInput
                                  searchTerm={userSearch}
                                  setSearchTerm={setUserSearch}
                                  placeholder="Search users..."
                                  tooltipText="Search Users"
                                  autoFocus={isActive}
                                />
                            </div>
                        </div>
                    </CardHeader>
                     <CardContent className="flex-grow">
                         <UserDropZone id="user-list" users={filteredNonAdminUsers} onDeleteRequest={handleDeleteUserRequest} />
                    </CardContent>
                  </Card>
            </div>
            <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeDragUser ? (
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={activeDragUser.avatarUrl} alt={activeDragUser.displayName} data-ai-hint="user avatar" />
                        <AvatarFallback>{activeDragUser.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ) : null}
            </DragOverlay>
        </DndContext>

        <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
            <DialogContent className="max-w-sm" onPointerDownCapture={(e) => e.stopPropagation()}>
                <div className="absolute top-4 right-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleVerify2fa}>
                                    <GoogleSymbol name="check" />
                                    <span className="sr-only">Verify Code</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Verify Code</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DialogHeader>
                    <UIDialogTitle className="font-headline font-thin text-muted-foreground">Two-Factor Authentication</UIDialogTitle>
                    <DialogDescription>Enter the 6-digit code from your authenticator app to proceed.</DialogDescription>
                </DialogHeader>
                <div
                    className={cn("flex items-center gap-2 w-full text-left text-muted-foreground transition-colors p-2 h-10",
                        !isEditing2fa && "cursor-text hover:text-primary/80"
                    )}
                    onClick={() => {if (!isEditing2fa) setIsEditing2fa(true)}}
                    >
                    <GoogleSymbol name="password" />
                    {isEditing2fa ? (
                        <Input
                            id="2fa-code"
                            ref={twoFactorCodeInputRef}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            onBlur={() => { if (!twoFactorCode) setIsEditing2fa(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}
                            className="w-full text-center tracking-[0.5em] h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                            maxLength={6}
                            placeholder="••••••"
                        />
                    ) : (
                        <span className="flex-1 text-center text-sm tracking-[0.5em]">
                            {twoFactorCode ? '••••••' : '6-digit code'}
                        </span>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
};
// #endregion

// #region Pages Management Tab

function DuplicateZone({ id, onAdd }: { id: string; onAdd: () => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-full transition-all p-0.5",
        isOver && "ring-1 ring-border ring-inset"
      )}
    >
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={onAdd} onPointerDown={(e) => e.stopPropagation()}>
                    <GoogleSymbol name="add_circle" className="text-4xl text-muted-foreground" weight={100} />
                    <span className="sr-only">New Page or Drop to Duplicate</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>{isOver ? 'Drop to Duplicate' : 'Add New Page'}</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function PageAccessControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
    const { users, teams, appSettings } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, activeTab]);

    const access = page.access;

    const handleToggle = (type: 'users' | 'teams', id: string) => {
        const currentIds = new Set(access[type] || []);
        if (currentIds.has(id)) {
            currentIds.delete(id);
        } else {
            currentIds.add(id);
        }
        onUpdate({ access: { ...access, [type]: Array.from(currentIds) } });
    };

    const filteredUsers = useMemo(() => users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
    const filteredTeams = useMemo(() => teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [teams, searchTerm]);

    const renderSearchControl = () => (
         <div className="p-2 border-b">
            <div className="flex items-center gap-1 w-full">
              <GoogleSymbol name="search" className="text-muted-foreground" />
              <input
                  ref={searchInputRef}
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
              />
          </div>
        </div>
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" onPointerDown={(e) => e.stopPropagation()} className="h-8 w-8 text-muted-foreground"><GoogleSymbol name="group_add" /></Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Manage Page Access</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-0" onPointerDown={(e) => e.stopPropagation()}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="users" className="m-0">
                        {renderSearchControl()}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredUsers.map(user => {
                          const isSelected = access.users.includes(user.userId);
                          return (
                            <div key={user.userId} className="flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer" style={{ color: isSelected ? 'hsl(var(--primary))' : undefined }} onClick={() => handleToggle('users', user.userId)}>
                              <Avatar className="h-7 w-7"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0,2)}</AvatarFallback></Avatar>
                              <span>{user.displayName}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                    <TabsContent value="teams" className="m-0">
                        {renderSearchControl()}
                        <ScrollArea className="h-64"><div className="p-1 space-y-1">{filteredTeams.map(team => {
                          const isSelected = access.teams.includes(team.id);
                          return (
                            <div key={team.id} className="flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer" style={{ color: isSelected ? team.color : undefined }} onClick={() => handleToggle('teams', team.id)}>
                              <GoogleSymbol name={team.icon} />
                              <span>{team.name}</span>
                            </div>
                          )
                        })}</div></ScrollArea>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}

function PageTabsControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
  const { appSettings } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const systemTabIds = ['tab-admins', 'tab-settings'];

  const filteredTabs = useMemo(() => {
    const allTabs = appSettings.tabs.filter(tab => !systemTabIds.includes(tab.id));
    if (!searchTerm) return allTabs;
    return allTabs.filter(tab =>
      tab.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [appSettings.tabs, searchTerm]);

  const handleToggle = (tabId: string) => {
    const currentIds = new Set(page.associatedTabs || []);
    if (currentIds.has(tabId)) {
        currentIds.delete(tabId);
    } else {
        currentIds.add(tabId);
    }
    onUpdate({ associatedTabs: Array.from(currentIds) });
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" onPointerDown={(e) => e.stopPropagation()} className="h-8 w-8 text-muted-foreground"><GoogleSymbol name="layers" /></Button>
                  </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent><p>Manage Associated Tabs</p></TooltipContent>
          </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-0" onPointerDownCapture={(e) => { e.stopPropagation(); }}>
        <div className="p-2 border-b">
          <CompactSearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search tabs..."
            autoFocus={isOpen}
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-1 space-y-1">
            {filteredTabs.map(tab => {
              const isAssociated = (page.associatedTabs || []).includes(tab.id);
              
              return (
                <div 
                    key={tab.id} 
                    className={cn("flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer")}
                    style={{ color: isAssociated ? tab.color : undefined }}
                    onClick={() => handleToggle(tab.id)}
                >
                    <GoogleSymbol name={tab.icon} />
                    <span>{tab.name}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function SortablePageCard({ page, onUpdate, onDelete, isExpanded, onToggleExpand }: { 
    page: AppPage; 
    onUpdate: (id: string, data: Partial<AppPage>) => void; 
    onDelete: (id: string) => void; 
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const { viewAsUser } = useUser();
    const canManage = viewAsUser.isAdmin;
    const isPinned = corePages.some(p => p.id === page.id);

    const displayPath = page.isDynamic ? `${page.path}/[...]` : page.path;

    const entityWithDescription = {
        ...page,
        description: (
             <button
                disabled={isPinned}
                onClick={() => !isPinned && onUpdate(page.id, { isDynamic: !page.isDynamic })}
                className={cn(
                    "text-sm text-left",
                    !isPinned && "cursor-pointer hover:text-primary",
                    isPinned ? "text-muted-foreground/50" : "text-muted-foreground"
                )}
            >
                {displayPath}
            </button>
        )
    };
    
    return (
        <CardTemplate
            entity={entityWithDescription}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canManage={canManage}
            isPinned={isPinned}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            headerControls={
                <div className="flex items-center">
                    {!isPinned && <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />}
                    {!isPinned && <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />}
                </div>
            }
        />
    );
}

export const PagesManagement = ({ isActive }: { isActive: boolean }) => {
    const { appSettings, updateAppSettings } = useUser();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

    const onToggleExpand = useCallback((pageId: string) => {
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    }, []);
    
    const pinnedIds = useMemo(() => new Set(corePages.map(p => p.id)), []);
    
    const handleUpdatePage = useCallback((pageId: string, data: Partial<AppPage>) => {
        const newPages = appSettings.pages.map(p => p.id === pageId ? { ...p, ...data } : p);
        updateAppSettings({ pages: newPages });
    }, [appSettings.pages, updateAppSettings]);
    
    const handleDuplicatePage = useCallback((sourcePage: AppPage) => {
        const newName = `${sourcePage.name} (Copy)`;
        const newPath = `/dashboard/${newName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}-${crypto.randomUUID().slice(0, 4)}`;
        
        const newPage: AppPage = {
            ...JSON.parse(JSON.stringify(sourcePage)),
            id: crypto.randomUUID(),
            name: newName,
            path: newPath,
            isDynamic: sourcePage.isDynamic,
        };
        const sourceIndex = appSettings.pages.findIndex(p => p.id === sourcePage.id);
        const newPages = [...appSettings.pages];
        newPages.splice(sourceIndex + 1, 0, newPage);
        updateAppSettings({ pages: newPages });
        toast({ title: "Page Duplicated", description: `A copy of "${sourcePage.name}" was created.`});
    }, [appSettings.pages, updateAppSettings, toast]);

    const handleAddPage = () => {
        const pageCount = appSettings.pages.length;
        const newName = `New Page ${pageCount + 1}`;
        const newPage: AppPage = {
            id: crypto.randomUUID(),
            name: newName,
            icon: 'web',
            color: 'hsl(220, 13%, 47%)',
            path: `/dashboard/${newName.toLowerCase().replace(/\s/g, '-')}-${crypto.randomUUID().slice(0,4)}`,
            isDynamic: false,
            associatedTabs: [],
            access: { users: [], teams: [] }
        };
        
        const insertIndex = appSettings.pages.findIndex(p => p.id === 'page-notifications');
        const newPages = [...appSettings.pages];
        if (insertIndex !== -1) {
            newPages.splice(insertIndex, 0, newPage);
        } else {
            // Fallback: place before the last element if notifications page not found
            newPages.splice(newPages.length -1, 0, newPage);
        }
        
        updateAppSettings({ pages: newPages });
    };

    const handleDeletePage = (pageId: string) => {
        updateAppSettings({ pages: appSettings.pages.filter(p => p.id !== pageId) });
        toast({ title: 'Page Deleted' });
    };

    const filteredPages = useMemo(() => {
        let pages = appSettings.pages;
        if (searchTerm) {
          pages = pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (colorFilter) {
          const targetHue = getHueFromHsl(colorFilter);
          if (targetHue !== null) {
            pages = pages.filter(p => {
              const itemHue = getHueFromHsl(p.color);
              return itemHue !== null && isHueInRange(targetHue, itemHue);
            });
          }
        }
        return pages;
    }, [appSettings.pages, searchTerm, colorFilter]);
    
    const renderPageCard = useCallback((page: AppPage) => (
        <SortablePageCard
            key={page.id}
            page={page}
            onUpdate={handleUpdatePage}
            onDelete={handleDeletePage}
            isExpanded={expandedPages.has(page.id)}
            onToggleExpand={() => onToggleExpand(page.id)}
        />
    ), [handleUpdatePage, handleDeletePage, expandedPages, onToggleExpand]);

    return (
        <DraggableGrid
            items={filteredPages}
            setItems={(newPages) => updateAppSettings({ pages: newPages })}
            onDragEnd={(event) => {
                const { active, over } = event;
                if (over?.id === 'duplicate-page-zone') {
                    const pageToDuplicate = appSettings.pages.find(p => p.id === active.id);
                    if (pageToDuplicate) {
                        handleDuplicatePage(pageToDuplicate);
                    }
                    return;
                }
                
                if (over && active.id !== over.id) {
                    const oldIndex = appSettings.pages.findIndex(p => p.id === active.id);
                    const newIndex = appSettings.pages.findIndex(p => p.id === over.id);

                    const activeIsPinned = pinnedIds.has(active.id.toString());
                    const overIsPinned = pinnedIds.has(over.id.toString());
                    
                    if (activeIsPinned !== overIsPinned) return;
                    
                    const reorderedPages = arrayMove(appSettings.pages, oldIndex, newIndex);
                    updateAppSettings({ pages: reorderedPages });
                }
            }}
            renderItem={(item, isDragging) => renderPageCard(item as AppPage)}
            renderDragOverlay={(item) => <GoogleSymbol name={item.icon} style={{ color: item.color, fontSize: '48px' }} />}
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <DuplicateZone onAdd={handleAddPage} id="duplicate-page-zone" />
                <div className="flex items-center">
                    <CompactSearchInput
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      placeholder="Search pages..."
                      autoFocus={isActive}
                      showColorFilter={true}
                      onColorSelect={setColorFilter}
                      activeColorFilter={colorFilter}
                    />
                </div>
            </div>
        </DraggableGrid>
    );
};
// #endregion

// #region Tabs Management Tab

function SortableTabCard({ tab, onUpdate, isExpanded, onToggleExpand }: {
    tab: AppTab;
    onUpdate: (id: string, data: Partial<AppTab>) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const { viewAsUser } = useUser();
    const canManage = viewAsUser.isAdmin;
    
    const entityWithDescription = {
        ...tab,
        description: tab.description || 'No description provided.'
    };

    return (
        <CardTemplate
            entity={entityWithDescription}
            onUpdate={onUpdate}
            onDelete={() => {}} // Tabs cannot be deleted
            canManage={canManage}
            isPinned={false}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            body={<Badge variant="outline">{tab.componentKey}</Badge>}
        />
    );
}

export const TabsManagement = ({ isActive }: { isActive: boolean }) => {
    const { appSettings, updateAppSettings, reorderTabs } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());

    const onToggleExpand = useCallback((tabId: string) => {
        setExpandedTabs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tabId)) {
                newSet.delete(tabId);
            } else {
                newSet.add(tabId);
            }
            return newSet;
        });
    }, []);

    const handleUpdateTab = useCallback((tabId: string, data: Partial<AppTab>) => {
        const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...data } : t);
        updateAppSettings({ tabs: newTabs });
    }, [appSettings.tabs, updateAppSettings]);
    
    const filteredTabs = useMemo(() => {
        let results = appSettings.tabs;
        
        if (searchTerm) {
            results = results.filter(t => 
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    
        if (colorFilter) {
            const targetHue = getHueFromHsl(colorFilter);
            if (targetHue !== null) {
                results = results.filter(t => {
                    const itemHue = getHueFromHsl(t.color);
                    return itemHue !== null && isHueInRange(targetHue, itemHue);
                });
            }
        }
    
        return results;
    }, [appSettings.tabs, searchTerm, colorFilter]);

    const renderTabCard = useCallback((tab: AppTab) => (
        <SortableTabCard
            key={tab.id}
            tab={tab}
            onUpdate={handleUpdateTab}
            isExpanded={expandedTabs.has(tab.id)}
            onToggleExpand={() => onToggleExpand(tab.id)}
        />
    ), [handleUpdateTab, expandedTabs, onToggleExpand]);

    return (
        <DraggableGrid
            items={filteredTabs}
            setItems={reorderTabs}
            renderItem={(item) => renderTabCard(item as AppTab)}
            renderDragOverlay={(item) => <GoogleSymbol name={item.icon} style={{ color: item.color, fontSize: '48px' }} />}
            className="space-y-4"
        >
            <div className="flex items-center justify-end">
                 <div className="flex items-center">
                    <CompactSearchInput
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      placeholder="Search by name or desc..."
                      autoFocus={isActive}
                      showColorFilter={true}
                      onColorSelect={setColorFilter}
                      activeColorFilter={colorFilter}
                    />
                </div>
            </div>
        </DraggableGrid>
    );
};
// #endregion

    




