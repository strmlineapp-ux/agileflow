

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team, type PreApprovedEmail } from '@/types';
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
import { cn, getContrastColor, isHueInRange, getHueFromHsl, getReadableColor } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { SortableItem } from '../common/sortable-item';
import { IconColorPicker } from '../common/icon-color-picker';
import { InlineEditor } from '../common/inline-editor';
import { ItemSelectionPopover, type ItemSelectionTab } from '../common/item-selection-popover';
import { ManagementPageLayout } from '../common/management-page-layout';
import { useTheme } from 'next-themes';
import { getDb } from '@/lib/firebase';
import { collection, doc, writeBatch, getFirestore, getDocs, query, where, addDoc, updateDoc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// #region Data Fetching and Mutations
async function fetchUsers(workspaceId: string): Promise<User[]> {
  const db = getDb();
  const q = query(collection(db, 'users'), where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
}

async function fetchPreApprovedEmails(workspaceId: string): Promise<PreApprovedEmail[]> {
  const db = getDb();
  const q = query(collection(db, 'pre-approved-emails'), where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApprovedEmail));
}

async function fetchAppSettings(workspaceId: string): Promise<AppSettings> {
  const db = getDb();
  const docRef = doc(db, 'app-settings', workspaceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AppSettings;
  }
  return { pages: [], tabs: [], workspaceId };
}

async function updateUser(variables: { userId: string; data: Partial<User> }) {
  const { userId, data } = variables;
  const db = getDb();
  await updateDoc(doc(db, "users", userId), data);
}

async function deleteUser(userId: string) {
  const db = getDb();
  await deleteDoc(doc(db, "users", userId));
}

async function addPreApprovedEmail(variables: { email: string, invitedBy: string, workspaceId: string }) {
  const db = getDb();
  await addDoc(collection(db, 'pre-approved-emails'), { ...variables, createdAt: new Date() });
}

async function removePreApprovedEmail(docId: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'pre-approved-emails', docId));
}

async function updateAppSettings(variables: { workspaceId: string, newSettings: Partial<AppSettings> }) {
    const { workspaceId, newSettings } = variables;
    const db = getDb();
    await updateDoc(doc(db, 'app-settings', workspaceId), newSettings);
}
// #endregion

// #region Admin Groups Management Tab

function SortableUserCard({ user, listId, onDeleteRequest, isExpanded, onToggleExpand }: { user: User, listId: string, onDeleteRequest?: (user: User) => void, isExpanded: boolean, onToggleExpand: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `user-dnd-${user.userId}-${listId}`,
        data: { type: 'user', user, fromListId: listId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };
    
    const canDelete = listId === 'user-list';

    return (
         <SortableItem id={`user-dnd-${user.userId}-${listId}`} data={{ type: 'user', user, fromListId: listId }}>
          {(isDragging) => (
             <CardTemplate
                user={user}
                entity={{ id: user.userId, name: user.displayName }}
                onUpdate={() => {}}
                onDelete={canDelete && onDeleteRequest ? () => onDeleteRequest(user) : () => {}}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                canManage={canDelete}
                hideOwnershipBadge={true}
                body={<p className="text-sm text-foreground">{user.email || <span className="italic">No email provided</span>}</p>}
            />
          )}
        </SortableItem>
    );
}

function UserDropZone({ id, users, children, onDeleteRequest, expandedCardState, onToggleUserExpand }: { 
  id: string, 
  users: User[], 
  children?: React.ReactNode, 
  onDeleteRequest?: (user: User) => void,
  expandedCardState: Record<string, string[]>,
  onToggleUserExpand: (cardId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'user-list' }});
  
  const sortableUserIds = users.map(u => `user-dnd-${u.userId}-${id}`);

  return (
    <div ref={setNodeRef} className={cn(
        "p-1 space-y-1 rounded-md min-h-[60px] transition-all", 
        isOver && "ring-1 ring-border ring-inset"
    )}>
        <SortableContext items={sortableUserIds} strategy={verticalListSortingStrategy}>
            <div className="gap-4 [column-fill:_balance] columns-1 sm:columns-2 md:columns-3">
                {users.map((user) => (
                    <SortableUserCard 
                        key={user.userId} 
                        user={user} 
                        listId={id} 
                        onDeleteRequest={onDeleteRequest}
                        isExpanded={(expandedCardState['admins-tab'] || []).includes(user.userId)}
                        onToggleExpand={() => onToggleUserExpand(user.userId)}
                    />
                ))}
            </div>
        </SortableContext>
        {children}
    </div>
  )
}

export const AdminsManagement = ({ isActive }: { isActive: boolean }) => {
  const { viewAsUser, updateUser: updateContextUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [pendingUserMove, setPendingUserMove] = useState<{ user: User; fromListId: string; destListId: string } | null>(null);
  const [pendingUserDelete, setPendingUserDelete] = useState<User | null>(null);
  const [twoFactorActionType, setTwoFactorActionType] = useState<'toggleAdmin' | 'deleteUser' | null>(null);

  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEditing2fa, setIsEditing2fa] = useState(false);
  const twoFactorCodeInputRef = useRef<HTMLInputElement>(null);
  
  const [adminSearch, setAdminSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const [activeDragUser, setActiveDragUser] = useState<User | null>(null);
  const [isAddUserPopoverOpen, setIsAddUserPopoverOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  
  const { data: users = [] } = useQuery({
    queryKey: ['users', viewAsUser.workspaceId],
    queryFn: () => fetchUsers(viewAsUser.workspaceId),
    enabled: !!viewAsUser.workspaceId,
  });

  const { data: preApprovedEmails = [] } = useQuery({
    queryKey: ['preApprovedEmails', viewAsUser.workspaceId],
    queryFn: () => fetchPreApprovedEmails(viewAsUser.workspaceId),
    enabled: !!viewAsUser.workspaceId,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', viewAsUser.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['preApprovedEmails', viewAsUser.workspaceId] });
    },
    onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  };

  const updateUserMutation = useMutation({ mutationFn: updateUser, ...mutationOptions });
  const deleteUserMutation = useMutation({ mutationFn: deleteUser, ...mutationOptions });
  const addEmailMutation = useMutation({ mutationFn: addPreApprovedEmail, ...mutationOptions });
  const removeEmailMutation = useMutation({ mutationFn: removePreApprovedEmail, ...mutationOptions });

  
  const onToggleUserExpand = useCallback((userId: string) => {
    if (!viewAsUser) return;
    const contextKey = 'admins-tab';
    const currentState = viewAsUser.expandedCardState || {};
    const currentExpanded = new Set(currentState[contextKey] || []);
    
    if (currentExpanded.has(userId)) {
      currentExpanded.delete(userId);
    } else {
      currentExpanded.add(userId);
    }
    
    updateContextUser(viewAsUser.userId, { 
      expandedCardState: {
        ...currentState,
        [contextKey]: Array.from(currentExpanded)
      }
    });
  }, [viewAsUser, updateContextUser]);

  const handleAddPreApprovedEmail = () => {
    if(!viewAsUser) return;
    const trimmedEmail = newUserEmail.trim();
    if (trimmedEmail) {
      addEmailMutation.mutate({
        email: trimmedEmail,
        invitedBy: viewAsUser.userId,
        workspaceId: viewAsUser.workspaceId,
      });
      setNewUserEmail('');
    }
  };
  
  const removePreApprovedEmailAction = (email: string) => {
    const emailDoc = preApprovedEmails.find(e => e.email === email);
    if(emailDoc?.id) {
        removeEmailMutation.mutate(emailDoc.id);
    }
  }

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
        updateUserMutation.mutate({ userId: user.userId, data: { isAdmin: !user.isAdmin } });
        toast({ title: 'Success', description: `${user.displayName}'s admin status has been updated.` });
    } else if (twoFactorActionType === 'deleteUser' && pendingUserDelete) {
        deleteUserMutation.mutate(pendingUserDelete.userId);
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
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-foreground">Admins ({filteredAdminUsers.length})</CardTitle>
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
                        <UserDropZone id="admin-list" users={filteredAdminUsers} expandedCardState={viewAsUser?.expandedCardState || {}} onToggleUserExpand={onToggleUserExpand} />
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-2">
                                <CardTitle className="text-foreground">Users ({filteredNonAdminUsers.length})</CardTitle>
                                <Popover open={isAddUserPopoverOpen} onOpenChange={setIsAddUserPopoverOpen}>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <PopoverTrigger asChild>
                                              <Button variant="default" size="icon" className="p-0 text-foreground">
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
                                            <Button variant="default" size="icon" onClick={handleAddPreApprovedEmail} className="h-8 w-8"><GoogleSymbol name="add" /></Button>
                                        </div>
                                        {preApprovedEmails.length > 0 && (
                                            <ScrollArea className="max-h-40">
                                                <div className="p-2 space-y-1">
                                                {preApprovedEmails.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm p-1 rounded-md">
                                                        <span>{item.email}</span>
                                                        <Button variant="default" size="icon" className="h-5 w-5" onClick={() => removePreApprovedEmailAction(item.email)}>
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
                         <UserDropZone id="user-list" users={filteredNonAdminUsers} onDeleteRequest={handleDeleteUserRequest} expandedCardState={viewAsUser?.expandedCardState || {}} onToggleUserExpand={onToggleUserExpand} />
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
                                <Button variant="default" size="icon" onClick={handleVerify2fa}>
                                    <GoogleSymbol name="check" />
                                    <span className="sr-only">Verify Code</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Verify Code</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DialogHeader>
                    <UIDialogTitle className="font-headline font-thin text-foreground">Two-Factor Authentication</UIDialogTitle>
                    <DialogDescription>Enter the 6-digit code from your authenticator app to proceed.</DialogDescription>
                </DialogHeader>
                <div
                    className={cn("flex items-center gap-2 w-full text-left text-foreground transition-colors p-2 h-10",
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
function PageAccessControl({ page, onUpdate }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void }) {
    const { viewAsUser } = useUser();
    const { data: users = [] } = useQuery({
      queryKey: ['users', viewAsUser.workspaceId],
      queryFn: () => fetchUsers(viewAsUser.workspaceId),
      enabled: !!viewAsUser.workspaceId
    });
    // This part is problematic as it assumes a global `teams` state which we are removing.
    // It should be fetched if needed, or the logic re-evaluated.
    // For now, we'll pass an empty array to avoid breaking the UI.
    const teams: Team[] = []; 
    
    const handleToggle = (type: 'users' | 'teams', id: string) => {
        const access = page.access || { users: [], teams: [] };
        const currentIds = new Set(access[type] || []);
        if (currentIds.has(id)) {
            currentIds.delete(id);
        } else {
            currentIds.add(id);
        }
        onUpdate({ access: { ...access, [type]: Array.from(currentIds) } });
    };

    const userItemData = useMemo(() => users.map(user => ({
        id: user.userId,
        name: user.displayName,
        icon: user.avatarUrl || '',
        iconType: 'avatar' as const,
    })), [users]);
    
    const teamItemData = useMemo(() => teams.map(team => ({
        id: team.id,
        name: team.name,
        icon: team.icon,
        iconType: 'symbol' as const,
        color: team.color,
    })), [teams]);

    const tabs: ItemSelectionTab[] = [
        {
            value: 'users',
            label: 'Users',
            items: userItemData,
            selectedIds: page.access?.users || [],
        },
        {
            value: 'teams',
            label: 'Teams',
            items: teamItemData,
            selectedIds: page.access?.teams || [],
        }
    ];

    return (
        <ItemSelectionPopover
            tabs={tabs}
            onSelectionChange={(type, id) => handleToggle(type as 'users' | 'teams', id)}
            trigger={<Button variant="default" size="icon" className="h-8 w-8 text-foreground"><GoogleSymbol name="group_add" /></Button>}
            tooltip="Manage Page Access"
            showColorFilter={true}
        />
    );
}

function PageTabsControl({ page, onUpdate, appSettings }: { page: AppPage; onUpdate: (data: Partial<AppPage>) => void, appSettings: AppSettings }) {
  const systemTabIds = ['tab-admins', 'tab-settings'];

  const handleToggle = (tabId: string) => {
    const currentIds = new Set(page.associatedTabs || []);
    if (currentIds.has(tabId)) {
        currentIds.delete(tabId);
    } else {
        currentIds.add(tabId);
    }
    onUpdate({ associatedTabs: Array.from(currentIds) });
  };
  
  const tabItemData = useMemo(() => {
    return appSettings.tabs
      .filter(tab => !systemTabIds.includes(tab.id))
      .map(tab => ({
        id: tab.id,
        name: tab.name,
        icon: tab.icon,
        iconType: 'symbol' as const,
        color: tab.color,
      }));
  }, [appSettings.tabs]);
  
  const tabs: ItemSelectionTab[] = [
    {
      value: 'tabs',
      label: 'Tabs',
      items: tabItemData,
      selectedIds: page.associatedTabs || [],
    }
  ];

  return (
    <ItemSelectionPopover
      tabs={tabs}
      onSelectionChange={(_, id) => handleToggle(id)}
      trigger={<Button variant="default" size="icon" className="h-8 w-8 text-foreground"><GoogleSymbol name="layers" /></Button>}
      tooltip="Manage Associated Tabs"
      showColorFilter={true}
    />
  );
}

function SortablePageCard({ page, onUpdate, onDelete, isExpanded, onToggleExpand, isSharedPreview, appSettings }: { 
    page: AppPage; 
    onUpdate: (id: string, data: Partial<AppPage>) => void; 
    onDelete: (page: AppPage) => void; 
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSharedPreview?: boolean;
    appSettings: AppSettings;
}) {
    const { viewAsUser, users } = useUser();
    
    const canManage = viewAsUser.isAdmin;
    const isPinned = page.isSystemPage;
    
    const protectedSystemPages = ['page-admin-management', 'page-settings', 'page-notifications'];
    const isDeletable = viewAsUser.isAdmin && (!page.isSystemPage || !protectedSystemPages.includes(page.id));
    const canChangeOwnership = viewAsUser.isAdmin && !protectedSystemPages.includes(page.id);
    const isOwnershipBadgeHidden = protectedSystemPages.includes(page.id);

    const displayPath = page.isDynamic 
        ? `${page.path.replace('/dashboard/', '')}/[...]` 
        : page.path.replace('/dashboard/', '');
        
    const bodyContent = (
      <>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <InlineEditor
            value={page.description || ''}
            onSave={(newDesc) => onUpdate(page.id, { description: newDesc })}
            disabled={!canManage}
            placeholder="Click to add a description..."
            className="text-sm text-foreground"
          />
        </div>
        <p
          className={cn("text-xs text-foreground/60", !isPinned && canManage && "cursor-pointer hover:text-primary")}
          onPointerDown={(e) => {
              if(!isPinned && canManage) {
                  e.stopPropagation();
                  onUpdate(page.id, { isDynamic: !page.isDynamic });
              }
          }}
        >
          {displayPath}
        </p>
      </>
    );

    const footerContent = (
      <div className="flex items-center justify-end w-full">
          {!isPinned && <PageAccessControl page={page} onUpdate={(data) => onUpdate(page.id, data)} />}
          {!isPinned && <PageTabsControl page={page} onUpdate={(data) => onUpdate(page.id, data)} appSettings={appSettings} />}
      </div>
    );
    
    return (
        <CardTemplate
            entity={page}
            onUpdate={onUpdate}
            onDelete={() => onDelete(page)}
            canManage={canManage}
            canDelete={isDeletable}
            isPinned={isPinned}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            isSharedPreview={isSharedPreview}
            canChangeOwnership={canChangeOwnership}
            hideOwnershipBadge={isOwnershipBadgeHidden}
            body={bodyContent}
            footer={footerContent}
        />
    );
}

export const PagesManagement = ({ isActive, isSharedPanelOpen, setIsSharedPanelOpen, isDragging }: { isActive: boolean; isSharedPanelOpen?: boolean; setIsSharedPanelOpen?: (isOpen: boolean) => void; isDragging?: boolean; }) => {
    const { viewAsUser, updateUser } = useUser();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const contextKey = 'pages-management';
    
    const { data: appSettings = { pages: [], tabs: [] } } = useQuery({
      queryKey: ['appSettings', viewAsUser.workspaceId],
      queryFn: () => fetchAppSettings(viewAsUser.workspaceId),
      enabled: !!viewAsUser.workspaceId,
    });
    
    const updateSettingsMutation = useMutation({
        mutationFn: updateAppSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appSettings', viewAsUser.workspaceId] });
            toast({ title: 'Settings Updated' });
        },
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        if (!viewAsUser?.workspaceId) return;
        updateSettingsMutation.mutate({ workspaceId: viewAsUser.workspaceId, newSettings });
    }, [viewAsUser?.workspaceId, updateSettingsMutation]);
    
    const onToggleExpand = useCallback((pageId: string) => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        const currentExpanded = new Set(currentState[contextKey] || []);
        if (currentExpanded.has(pageId)) {
          currentExpanded.delete(pageId);
        } else {
          currentExpanded.add(pageId);
        }
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: Array.from(currentExpanded) } });
    }, [viewAsUser, updateUser, contextKey]);
    
    const onCollapseAll = () => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: [] } });
    };

    const handleUpdate = useCallback((pageId: string, data: Partial<AppPage>) => {
        const newPages = appSettings.pages.map(p => p.id === pageId ? { ...p, ...data } : p);
        updateSettings({ pages: newPages });
    }, [appSettings.pages, updateSettings]);
    
    const handleDelete = (page: AppPage) => {
        const isOwner = page.owner?.id === viewAsUser.userId;
        const canDeleteSystemPage = viewAsUser.isAdmin && page.isSystemPage && !['page-admin-management', 'page-settings', 'page-notifications'].includes(page.id);

        if (isOwner || canDeleteSystemPage) {
            const newPages = appSettings.pages.filter(p => p.id !== page.id);
            updateSettings({ pages: newPages });
            toast({ title: 'Page Deleted' });
        } else if (!isOwner && !page.isSystemPage) { // Unlink non-system page
            const updatedLinkedIds = (viewAsUser.linkedPageIds || []).filter(id => id !== page.id);
            updateUser(viewAsUser.userId, { linkedPageIds: updatedLinkedIds });
            toast({ title: 'Page Unlinked' });
        }
    };
    
    const reorderPages = useCallback((reorderedPages: AppPage[]) => {
      updateSettings({ pages: reorderedPages });
    }, [updateSettings]);
    
    const addPage = useCallback((sourcePage?: Partial<AppPage>) => {
      if(!viewAsUser) return;
      const isDuplicating = !!sourcePage?.id;
      const newPage: AppPage = {
        id: crypto.randomUUID(),
        name: isDuplicating ? `${sourcePage!.name} (Copy)` : 'New Page',
        icon: sourcePage?.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
        color: sourcePage?.color ? adjustHslColor(sourcePage.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
        path: isDuplicating ? `${sourcePage!.path}-${crypto.randomUUID().substring(0, 4)}` : `/dashboard/new-page-${crypto.randomUUID().substring(0, 4)}`,
        description: sourcePage?.description || '',
        isDynamic: sourcePage?.isDynamic || false,
        associatedTabs: sourcePage?.associatedTabs || [],
        access: sourcePage?.access || { users: [], teams: [] },
        owner: { type: 'user', id: viewAsUser.userId },
        workspaceId: viewAsUser.workspaceId,
      };
      
      const newPages = [...appSettings.pages, newPage];
      updateSettings({ pages: newPages });
      toast({ title: isDuplicating ? 'Page Duplicated' : 'Page Added' });

    }, [appSettings.pages, viewAsUser, updateSettings, toast]);

    const handleLinkPage = (pageId: string) => {
        if(!viewAsUser) return;
        const updatedLinkedIds = [...(viewAsUser.linkedPageIds || []), pageId];
        updateUser(viewAsUser.userId, { linkedPageIds: Array.from(new Set(updatedLinkedIds)) });
        toast({ title: 'Page Linked' });
    }
  
    const displayedPages = useMemo(() => {
        if (!viewAsUser) return [];

        const isViewingAdmin = viewAsUser.isAdmin;
        
        let pagesToShow: AppPage[];
        
        const ownedPages = appSettings.pages.filter(p => p.owner?.id === viewAsUser.userId);
        const linkedPageIds = new Set(viewAsUser.linkedPageIds || []);
        const linkedPages = appSettings.pages.filter(p => linkedPageIds.has(p.id));
        const systemAndPublicPages = appSettings.pages.filter(p => p.isSystemPage || (!p.owner?.id && !p.access?.users?.length && !p.access?.teams?.length));

        if (isViewingAdmin) {
             pagesToShow = appSettings.pages;
        } else {
             const combined = [...systemAndPublicPages, ...ownedPages, ...linkedPages];
             pagesToShow = Array.from(new Map(combined.map(p => [p.id, p])).values());
        }

        return pagesToShow.sort((a, b) => {
            const aIsSystem = a.isSystemPage;
            const bIsSystem = b.isSystemPage;
            if (aIsSystem && !bIsSystem) return -1;
            if (!aIsSystem && bIsSystem) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [appSettings.pages, viewAsUser]);


    const sharedPages = useMemo(() => {
        if(!viewAsUser) return [];
        const displayedIds = new Set(displayedPages.map(p => p.id));
        return appSettings.pages.filter(p => p.isShared && p.owner?.id !== viewAsUser.userId && !displayedIds.has(p.id));
    }, [appSettings.pages, displayedPages, viewAsUser.userId]);

    const renderPageCard = useCallback((page: AppPage) => {
        const expandedCardIds = viewAsUser?.expandedCardState?.[contextKey] || [];
      return (
      <SortableItem key={page.id} id={page.id} data={{ type: 'page-card', page, isSharedPreview: false }} disabled={page.isSystemPage}>
          {(isDragging: boolean) => (
              <SortablePageCard
                  page={page}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isExpanded={expandedCardIds.includes(page.id)}
                  onToggleExpand={() => onToggleExpand(page.id)}
                  appSettings={appSettings}
              />
          )}
      </SortableItem>
    )}, [handleUpdate, handleDelete, viewAsUser, onToggleExpand, contextKey, appSettings]);

    return (
        <div className="h-full flex flex-col">
            <ManagementPageLayout
                pageTitle="Pages"
                onPageTitleSave={() => {}} // No page title to save on this tab
                canManagePage={false}
                entityType="page"
                allItems={displayedPages}
                allSharedItems={sharedPages}
                onAddItem={(sourcePage) => addPage(sourcePage || {})}
                onUpdateItem={handleUpdate}
                onDeleteItem={handleDelete}
                onReorderItems={reorderPages}
                onLinkItem={handleLinkPage}
                onCollapseAll={onCollapseAll}
                renderItem={(item, isDragging) => renderPageCard(item as AppPage)}
                renderDragOverlay={(item) => <GoogleSymbol name={item.icon} style={{ color: item.color, fontSize: '48px' }} />}
                isActive={isActive}
                isSharedPanelOpen={isSharedPanelOpen || false}
                setIsSharedPanelOpen={setIsSharedPanelOpen || (() => {})}
                isDragging={isDragging || false}
            />
        </div>
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
    
    const descriptionContent = (
      <div onPointerDown={(e) => e.stopPropagation()}>
        <InlineEditor
            value={tab.description || ''}
            onSave={(newDesc) => onUpdate(tab.id, { description: newDesc })}
            disabled={!canManage}
            placeholder="Click to add description"
            className="text-sm text-foreground min-h-[20px]"
        />
      </div>
    );

    return (
        <CardTemplate
            entity={tab}
            onUpdate={onUpdate}
            onDelete={() => {}}
            canManage={canManage}
            canDelete={false}
            isPinned={false}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            hideOwnershipBadge={true}
            body={descriptionContent}
        />
    );
}

export const TabsManagement = ({ isActive }: { isActive: boolean }) => {
    const { viewAsUser, updateUser } = useUser();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const { data: appSettings = { pages: [], tabs: [] } } = useQuery({
      queryKey: ['appSettings', viewAsUser.workspaceId],
      queryFn: () => fetchAppSettings(viewAsUser.workspaceId),
      enabled: !!viewAsUser.workspaceId,
    });
    
    const updateSettingsMutation = useMutation({
        mutationFn: updateAppSettings,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings', viewAsUser.workspaceId] }),
        onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        if (!viewAsUser?.workspaceId) return;
        updateSettingsMutation.mutate({ workspaceId: viewAsUser.workspaceId, newSettings });
    }, [viewAsUser?.workspaceId, updateSettingsMutation]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const contextKey = 'tabs-management';

    const onToggleExpand = useCallback((tabId: string) => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        const currentExpanded = new Set(currentState[contextKey] || []);
        if (currentExpanded.has(tabId)) {
          currentExpanded.delete(tabId);
        } else {
          currentExpanded.add(tabId);
        }
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: Array.from(currentExpanded) } });
    }, [viewAsUser, updateUser, contextKey]);
    
    const onCollapseAll = () => {
        if (!viewAsUser) return;
        const currentState = viewAsUser.expandedCardState || {};
        updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: [] } });
    };

    const handleUpdateTab = useCallback((tabId: string, data: Partial<AppTab>) => {
        const newTabs = appSettings.tabs.map(t => t.id === tabId ? { ...t, ...data } : t);
        updateSettings({ tabs: newTabs });
    }, [appSettings.tabs, updateSettings]);
    
    const reorderTabs = useCallback((reorderedTabs: AppTab[]) => {
      updateSettings({ tabs: reorderedTabs });
    }, [updateSettings]);
    
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

    const renderTabCard = useCallback((tab: AppTab, isDragging: boolean) => {
        const expandedCardIds = viewAsUser?.expandedCardState?.[contextKey] || [];
        return (
            <SortableItem key={tab.id} id={tab.id}>
             {(isDragging) => (
                <SortableTabCard
                    key={tab.id}
                    tab={tab}
                    onUpdate={handleUpdateTab}
                    isExpanded={expandedCardIds.includes(tab.id)}
                    onToggleExpand={() => onToggleExpand(tab.id)}
                />
             )}
            </SortableItem>
        )
    }, [handleUpdateTab, viewAsUser, onToggleExpand, contextKey]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageTitle title="Tabs" />
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" onClick={onCollapseAll}>
                            <GoogleSymbol name="collapse_content" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Collapse All</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
            <DraggableGrid
                id="tabs-list"
                items={filteredTabs}
                setItems={reorderTabs}
                className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
            >
              {filteredTabs.map(tab => renderTabCard(tab, false))}
            </DraggableGrid>
        </div>
    );
};
// #endregion
