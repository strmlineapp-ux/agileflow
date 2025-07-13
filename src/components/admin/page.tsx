
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CompactSearchInput } from '@/components/common/compact-search-input';
import { corePages, coreTabs } from '@/lib/core-data';
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
  useDraggable,
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

// #region Admin Groups Management Tab

function UserCard({ user }: { user: User }) {
    return (
        <div className="p-2 flex items-center justify-between rounded-md transition-colors bg-card">
            <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-thin">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground font-thin">{user.title || 'No title provided'}</p>
                </div>
            </div>
        </div>
    );
}

function SortableUserCard({ user, listId }: { user: User, listId: string }) {
    const draggableId = `user-dnd-${user.userId}-${listId}`;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: draggableId,
        data: { type: 'user', user, fromListId: listId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <UserCard user={user} />
        </div>
    );
}

function UserDropZone({ id, users, children }: { id: string, users: User[], children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list' }});
  
  const sortableUserIds = users.map(u => `user-dnd-${u.userId}-${id}`);

  return (
    <div ref={setNodeRef} className={cn(
        "p-1 space-y-1 rounded-md min-h-[60px] transition-all", 
        isOver && "ring-1 ring-border ring-inset"
    )}>
        <SortableContext items={sortableUserIds} strategy={verticalListSortingStrategy}>
            {users.map((user) => (
                <SortableUserCard key={user.userId} user={user} listId={id} />
            ))}
        </SortableContext>
        {children}
    </div>
  )
}

export const AdminsManagement = ({ tab, isSingleTabPage, isActive }: { tab: AppTab; isSingleTabPage?: boolean, isActive?: boolean }) => {
  const { toast } = useToast();
  const { users, updateUser } = useUser();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [pendingUserMove, setPendingUserMove] = useState<{ user: User; fromListId: string; destListId: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEditing2fa, setIsEditing2fa] = useState(false);
  const twoFactorCodeInputRef = useRef<HTMLInputElement>(null);
  
  const [adminSearch, setAdminSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const [activeDragUser, setActiveDragUser] = useState<User | null>(null);

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
    setIs2faDialogOpen(true);
  };

  const handleVerify2fa = () => {
    if (twoFactorCode === '123456' && pendingUserMove) {
      const { user } = pendingUserMove;
      updateUser(user.userId, { isAdmin: !user.isAdmin });
      toast({ title: 'Success', description: `${user.displayName}'s admin status has been updated.` });
      close2faDialog();
    } else {
      toast({ variant: 'destructive', title: 'Verification Failed', description: 'The provided 2FA code is incorrect. Please try again.' });
      setTwoFactorCode('');
    }
  };

  const close2faDialog = () => {
    setIs2faDialogOpen(false);
    setTwoFactorCode('');
    setPendingUserMove(null);
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
        }
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragUser(event.active.data.current?.user || null);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );


  return (
    <div className="space-y-6">
        {isSingleTabPage && (
             <div className="flex items-center gap-3">
                <GoogleSymbol name={tab.icon} className="text-6xl" weight={100} />
                <h1 className="font-headline text-3xl font-thin">{tab.name}</h1>
             </div>
        )}
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={closestCenter}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col h-full bg-transparent border-0">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="font-thin text-base">Admins ({filteredAdminUsers.length})</CardTitle>
                             <div className="flex items-center gap-1">
                                <CompactSearchInput searchTerm={adminSearch} setSearchTerm={setAdminSearch} placeholder="Search admins..." tooltipText="Search Admins" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <UserDropZone id="admin-list" users={filteredAdminUsers}>
                            {filteredAdminUsers.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">Drag users here to make them admins.</div>
                            )}
                        </UserDropZone>
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col h-full bg-transparent border-0">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="font-thin text-base">Users ({filteredNonAdminUsers.length})</CardTitle>
                             <div className="flex items-center gap-1">
                                <CompactSearchInput searchTerm={userSearch} setSearchTerm={setUserSearch} placeholder="Search users..." autoFocus={isActive} tooltipText="Search Users" />
                            </div>
                        </div>
                    </CardHeader>
                     <CardContent className="flex-grow">
                         <UserDropZone id="user-list" users={filteredNonAdminUsers} >
                           {filteredNonAdminUsers.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">No other users found.</div>
                            )}
                         </UserDropZone>
                    </CardContent>
                  </Card>
            </div>
            <DragOverlay>
                {activeDragUser ? <UserCard user={activeDragUser} /> : null}
            </DragOverlay>
        </DndContext>

        <Dialog open={is2faDialogOpen} onOpenChange={(isOpen) => !isOpen && close2faDialog()}>
            <DialogContent className="max-w-sm" onPointerDownCapture={(e) => e.stopPropagation()}>
                <div className="absolute top-4 right-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleVerify2fa}>
                                    <GoogleSymbol name="check" className="text-xl" weight={100} />
                                    <span className="sr-only">Verify Code</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Verify Code</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DialogHeader>
                    <DialogTitle>Two-Factor Authentication</DialogTitle>
                    <DialogDescription>Enter the 6-digit code from your authenticator app to proceed.</DialogDescription>
                </DialogHeader>
                <div
                    className={cn("flex items-center gap-2 w-full text-left text-muted-foreground transition-colors p-2 h-10",
                        !isEditing2fa && "cursor-text hover:text-primary/80"
                    )}
                    onClick={() => {if (!isEditing2fa) setIsEditing2fa(true)}}
                    >
                    <GoogleSymbol name="password" className="text-xl" weight={100} />
                    {isEditing2fa ? (
                        <Input
                            id="2fa-code"
                            ref={twoFactorCodeInputRef}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            onBlur={() => { if (!twoFactorCode) setIsEditing2fa(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify2fa()}
                            className="w-full text-center tracking-[0.5em] h-auto p-0 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground font-thin"
                            maxLength={6}
                            placeholder="••••••"
                        />
                    ) : (
                        <span className="flex-1 text-center text-sm tracking-[0.5em] font-thin">
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
              <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} />
              <input
                  ref={searchInputRef}
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
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
                            <Button variant="ghost" size="icon" onPointerDown={(e) => e.stopPropagation()}><GoogleSymbol name="group_add" className="text-4xl" weight={100} /></Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Manage Page Access</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-0" onPointerDownCapture={(e) => e.stopPropagation()}>
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
                              <span className="font-thin">{user.displayName}</span>
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
                              <GoogleSymbol name={team.icon} className="text-xl" weight={100} />
                              <span className="font-thin">{team.name}</span>
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const systemTabIds = ['tab-admins', 'tab-settings'];

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
        setSearchTerm('');
    }
  }, [isOpen]);

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
                      <Button variant="ghost" size="icon" onPointerDown={(e) => e.stopPropagation()}><GoogleSymbol name="layers" className="text-4xl" weight={100} /></Button>
                  </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent><p>Manage Associated Tabs</p></TooltipContent>
          </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-0" onPointerDownCapture={(e) => e.stopPropagation()}>
        <div className="p-2 border-b">
          <div className="flex items-center gap-1 w-full">
            <GoogleSymbol name="search" className="text-muted-foreground text-xl" weight={100} />
            <input
                ref={searchInputRef}
                placeholder="Search tabs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
            />
          </div>
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
                    <GoogleSymbol name={tab.icon} className="text-xl" weight={100} />
                    <span className="font-thin">{tab.name}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function PageCard({ page, onUpdate, onDelete, isPinned, isDragging, ...props }: { page: AppPage; onUpdate: (id: string, data: Partial<AppPage>) => void; onDelete: (id: string) => void; isPinned?: boolean; isDragging?: boolean; [key:string]: any; }) {
    const { viewAsUser } = useUser();
    const canManage = viewAsUser.isAdmin;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== page.name) {
            onUpdate(page.id, { name: newName });
        }
        setIsEditingName(false);
    }, [page.id, page.name, onUpdate]);

    useEffect(() => {
        if (!isEditingName) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                handleSaveName();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);
    
    useEffect(() => {
        if (isIconPopoverOpen) {
            setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };

    const handlePathClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isPinned && canManage) {
        onUpdate(page.id, { isDynamic: !page.isDynamic });
      }
    };

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);
    
    const displayPath = page.isDynamic ? `${page.path}/[teamId]` : page.path;

    return (
        <Card className="group relative" {...props}>
            {!isPinned && (
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onPointerDown={(e) => {
                                  e.stopPropagation();
                                  setIsDeleteDialogOpen(true);
                              }}
                          >
                              <GoogleSymbol name="cancel" className="text-lg" weight={100} />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Page</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            )}
            <CardHeader
              className={cn("p-2", !isPinned && "cursor-pointer")}
              onClick={() => {if (!isPinned && !isDragging) setIsExpanded(!isExpanded);}}
              {...(!isPinned && props.dragHandleProps)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
                        <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                                <button className="h-12 w-12 flex items-center justify-center">
                                                    <GoogleSymbol name={page.icon} className="text-6xl" weight={100} />
                                                </button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Icon</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-80 p-0" onPointerDownCapture={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 p-2 border-b">
                                        <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                        <input
                                            ref={iconSearchInputRef}
                                            placeholder="Search icons..."
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
                                        />
                                    </div>
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                                    <TooltipProvider key={iconName}>
                                        <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                            variant={page.icon === iconName ? "default" : "ghost"}
                                            size="icon"
                                            onClick={() => { onUpdate(page.id, { icon: iconName }); setIsIconPopoverOpen(false);}}
                                            className="h-8 w-8 p-0"
                                            >
                                            <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{iconName}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    ))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
                                                <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: page.color }} />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Change Color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-2" onPointerDownCapture={(e) => e.stopPropagation()}>
                                    <div className="grid grid-cols-8 gap-1">
                                        {['#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'].map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => { onUpdate(page.id, { color: c }); setIsColorPopoverOpen(false); }}/>))}
                                        <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                            <GoogleSymbol name="colorize" className="text-muted-foreground" weight={100} /><Input type="color" value={page.color} onChange={(e) => onUpdate(page.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex-1 min-w-0" onPointerDown={(e) => { if(canManage) e.stopPropagation() }}>
                            <div className="flex items-center gap-1">
                                {isEditingName ? (
                                    <Input ref={nameInputRef} defaultValue={page.name} onKeyDown={handleNameKeyDown} onBlur={handleSaveName} className="h-auto p-0 font-headline text-base font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 break-words"/>
                                ) : (
                                    <CardTitle 
                                      className={cn("font-headline text-base break-words font-thin", canManage && "cursor-pointer")}
                                      onClick={() => {if(canManage && !isDragging) setIsEditingName(true)}}
                                    >
                                        {page.name}
                                    </CardTitle>
                                )}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
                        {!isPinned && (
                            <>
                                <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                                <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="p-2 pt-0">
                    <p className={cn("text-xs text-muted-foreground truncate font-thin", !isPinned && "cursor-pointer hover:text-primary")} onClick={handlePathClick}>
                      {displayPath}
                    </p>
                </CardContent>
            )}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" onClick={() => onDelete(page.id)}>
                            <GoogleSymbol name="check" className="text-xl" weight={100} />
                            <span className="sr-only">Confirm Delete</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Delete "{page.name}"?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the page and its configuration. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function SortablePageCard({ id, page, onUpdate, onDelete, isPinned }: { id: string, page: AppPage, onUpdate: (id: string, data: Partial<AppPage>) => void; onDelete: (id: string) => void; isPinned?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: id, disabled: isPinned});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="p-2 basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0"
        >
             <div className={cn(isDragging && "opacity-75")}>
                 <PageCard 
                    page={page} 
                    onUpdate={onUpdate} 
                    onDelete={onDelete} 
                    isPinned={isPinned}
                    dragHandleProps={!isPinned ? listeners : undefined}
                    {...attributes}
                    isDragging={isDragging}
                 />
            </div>
        </div>
    );
}

function DuplicateZone({ onAdd }: { onAdd: () => void; }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'duplicate-page-zone' });
  
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
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
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

export const PagesManagement = ({ tab, isSingleTabPage, isActive }: { tab: AppTab; isSingleTabPage?: boolean, isActive?: boolean }) => {
    const { appSettings, updateAppSettings } = useUser();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activePage, setActivePage] = useState<AppPage | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const pinnedIds = useMemo(() => new Set(corePages.map(p => p.id)), []);

    useEffect(() => {
        if (isActive && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isActive]);

    const handleUpdatePage = useCallback((pageId: string, data: Partial<AppPage>) => {
        const newPages = appSettings.pages.map(p => p.id === pageId ? { ...p, ...data } : p);
        updateAppSettings({ pages: newPages });
    }, [appSettings.pages, updateAppSettings]);
    
    const handleDuplicatePage = useCallback((sourcePage: AppPage) => {
        const newPage: AppPage = {
            ...JSON.parse(JSON.stringify(sourcePage)),
            id: crypto.randomUUID(),
            name: `${sourcePage.name} (Copy)`,
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
            color: '#64748B',
            path: `/dashboard/${newName.toLowerCase().replace(/\s/g, '-')}`,
            isDynamic: false,
            associatedTabs: [],
            access: { users: [], teams: [] }
        };
        
        const lastPinnedCorePage = corePages[corePages.length - 1];
        const lastTopPinnedIndex = appSettings.pages.findIndex(p => p.id === lastPinnedCorePage.id);
        
        const newPages = [...appSettings.pages];
        newPages.splice(lastTopPinnedIndex + 1, 0, newPage);
        
        updateAppSettings({ pages: newPages });
    };

    const handleDeletePage = (pageId: string) => {
        updateAppSettings({ pages: appSettings.pages.filter(p => p.id !== pageId) });
        toast({ title: 'Page Deleted' });
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const page = appSettings.pages.find(p => p.id === active.id);
        if (page) {
            setActivePage(page);
        }
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        setActivePage(null);
        const { active, over } = event;
        
        if (over?.id === 'duplicate-page-zone') {
            const pageId = active.id.toString();
            const pageToDuplicate = appSettings.pages.find(p => p.id === pageId);
            if (pageToDuplicate) {
                handleDuplicatePage(pageToDuplicate);
            }
            return;
        }

        if (over && active.id !== over.id) {
            const oldIndex = appSettings.pages.findIndex(p => p.id === active.id);
            const newIndex = appSettings.pages.findIndex(p => p.id === over!.id);
            
            if (pinnedIds.has(appSettings.pages[newIndex].id)) {
                return;
            }

            const reorderedPages = arrayMove(appSettings.pages, oldIndex, newIndex);
            updateAppSettings({ pages: reorderedPages });
        }
    };
    
    const filteredPages = useMemo(() => {
        if (!searchTerm) return appSettings.pages;
        return appSettings.pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [appSettings.pages, searchTerm]);

    const pageIds = useMemo(() => filteredPages.map(p => p.id), [filteredPages]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <DuplicateZone onAdd={handleAddPage} />
                    <div className="flex items-center">
                        <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search pages..." inputRef={searchInputRef} autoFocus={isActive} />
                    </div>
                </div>
                
                <SortableContext items={pageIds} strategy={rectSortingStrategy}>
                    <div className="flex flex-wrap -m-2">
                        {filteredPages.map((page) => (
                            <SortablePageCard
                                key={page.id}
                                id={page.id}
                                page={page}
                                onUpdate={handleUpdatePage}
                                onDelete={handleDeletePage}
                                isPinned={pinnedIds.has(page.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activePage ? <PageCard page={activePage} onUpdate={() => {}} onDelete={() => {}} isPinned={pinnedIds.has(activePage.id)} /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
// #endregion

// #region Tabs Management Tab

function TabCard({ tab, onUpdate, isDragging }: { tab: AppTab; onUpdate: (id: string, data: Partial<AppTab>) => void; isDragging?: boolean; }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const [iconSearch, setIconSearch] = useState('');
    const iconSearchInputRef = useRef<HTMLInputElement>(null);

    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const handleSaveName = useCallback(() => {
        const newName = nameInputRef.current?.value.trim();
        if (newName && newName !== tab.name) {
            onUpdate(tab.id, { name: newName });
        }
        setIsEditingName(false);
    }, [tab.id, tab.name, onUpdate]);
    
    const handleSaveDescription = useCallback(() => {
        const newDescription = descriptionTextareaRef.current?.value.trim();
        if (newDescription !== tab.description) {
            onUpdate(tab.id, { description: newDescription });
        }
        setIsEditingDescription(false);
    }, [tab.id, tab.description, onUpdate]);

    useEffect(() => {
        if (!isEditingName) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
                handleSaveName();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingName, handleSaveName]);
    
    useEffect(() => {
        if (!isEditingDescription) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (descriptionTextareaRef.current && !descriptionTextareaRef.current.contains(event.target as Node)) {
                handleSaveDescription();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        descriptionTextareaRef.current?.focus();
        descriptionTextareaRef.current?.select();
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isEditingDescription, handleSaveDescription]);

    useEffect(() => {
        if (isIconPopoverOpen) {
             setTimeout(() => iconSearchInputRef.current?.focus(), 100);
        } else {
            setIconSearch('');
        }
    }, [isIconPopoverOpen]);

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameInputRef.current?.blur();
        } else if (e.key === 'Escape') {
          setIsEditingName(false);
        }
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveDescription();
        } else if (e.key === 'Escape') {
            setIsEditingDescription(false);
        }
    };

    const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

    return (
        <Card className={cn("bg-transparent", isDragging && "shadow-xl")}>
            <CardContent className="p-2 flex items-center gap-4">
                <div className="relative">
                     <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <button className="h-10 w-10 flex items-center justify-center">
                                            <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
                                        </button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Icon</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <PopoverContent className="w-80 p-0">
                            <div className="flex items-center gap-1 p-2 border-b">
                                <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                <input
                                    ref={iconSearchInputRef}
                                    placeholder="Search icons..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 font-thin"
                                />
                            </div>
                            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (
                            <TooltipProvider key={iconName}>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant={tab.icon === iconName ? "default" : "ghost"}
                                    size="icon"
                                    onClick={() => { onUpdate(tab.id, { icon: iconName }); setIsIconPopoverOpen(false);}}
                                    className="h-8 w-8 p-0"
                                    >
                                    <GoogleSymbol name={iconName} className="text-4xl" weight={100} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{iconName}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            ))}</div></ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: tab.color }} />
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Color</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">
                                {['#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
                                '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
                                '#A855F7', '#D946EF', '#EC4899', '#F43F5E'].map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => { onUpdate(tab.id, { color: c }); setIsColorPopoverOpen(false); }}/>))}
                                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                    <GoogleSymbol name="colorize" className="text-muted-foreground" weight={100} /><Input type="color" value={tab.color} onChange={(e) => onUpdate(tab.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                         {isEditingName ? (
                            <Input ref={nameInputRef} defaultValue={tab.name} onKeyDown={handleNameKeyDown} onBlur={handleSaveName} className="h-auto p-0 font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-headline" />
                        ) : (
                            <h3 className="font-headline cursor-text text-base font-thin" onClick={() => setIsEditingName(true)}>{tab.name}</h3>
                        )}
                        <Badge variant="outline">{tab.componentKey}</Badge>
                    </div>
                    {isEditingDescription ? (
                        <Textarea 
                            ref={descriptionTextareaRef}
                            defaultValue={tab.description}
                            onBlur={handleSaveDescription}
                            onKeyDown={handleDescriptionKeyDown}
                            className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none font-thin"
                            placeholder="Click to add a description."
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground cursor-text min-h-[20px] font-thin" onClick={() => setIsEditingDescription(true)}>
                            {tab.description || 'Click to add a description.'}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SortableTabCard({ id, tab, onUpdate }: { id: string, tab: AppTab, onUpdate: (id: string, data: Partial<AppTab>) => void; }) {
    const isCoreTab = useMemo(() => coreTabs.some(t => t.id === tab.id), [tab.id]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id, disabled: isCoreTab});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TabCard tab={tab} onUpdate={onUpdate} isDragging={isDragging} />
        </div>
    );
}


export const TabsManagement = ({ tab, isSingleTabPage, isActive }: { tab: AppTab; isSingleTabPage?: boolean, isActive?: boolean }) => {
    const { appSettings, updateAppSettings, updateAppTab } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isActive) {
            searchInputRef.current?.focus();
        }
    }, [isActive]);


    const handleUpdateTab = useCallback((tabId: string, data: Partial<AppTab>) => {
        const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...data } : t);
        updateAppSettings({ tabs: newTabs });
    }, [appSettings.tabs, updateAppSettings]);

    const filteredTabs = useMemo(() => {
        if (!searchTerm) return appSettings.tabs;
        return appSettings.tabs.filter(tab => 
            tab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tab.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [appSettings.tabs, searchTerm]);

    const tabIds = useMemo(() => filteredTabs.map(t => t.id), [filteredTabs]);
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = appSettings.tabs.findIndex(t => t.id === active.id);
            const newIndex = appSettings.tabs.findIndex(t => t.id === over.id);
            const reorderedTabs = arrayMove(appSettings.tabs, oldIndex, newIndex);
            updateAppSettings({ tabs: reorderedTabs });
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-8">
                <div className="flex items-center justify-end">
                     <div className="flex items-center">
                        <CompactSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search by name or desc..." inputRef={searchInputRef} autoFocus={isActive} />
                    </div>
                </div>
                <SortableContext items={tabIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {filteredTabs.length > 0 ? (
                            filteredTabs.map((appTab) => (
                                <SortableTabCard
                                    key={appTab.id}
                                    id={appTab.id}
                                    tab={appTab}
                                    onUpdate={handleUpdateTab}
                                />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground p-4">No tabs found.</p>
                        )}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};
// #endregion
