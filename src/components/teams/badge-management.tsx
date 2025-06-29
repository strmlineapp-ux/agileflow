

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type User, type Attachment, type AttachmentType } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn, getContrastColor } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader as AlertDialogHeaderUI, AlertDialogTitle as AlertDialogTitleUI, AlertDialogDescription as AlertDialogDescriptionUI, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';
import { createMeetLink } from '@/ai/flows/create-meet-link-flow';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';


const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M9.19,4.5l-3.2,0l-1.7,2.9l3.2,5.7l4.9,0l-1.7,-2.9l-4.9,-5.7Z" fill="#0f9d58"></path><path d="M5.99,4.5l-3.2,5.7l1.7,2.9l3.2,-5.7l-1.7,-2.9Z" fill="#ffc107"></path><path d="M10.89,7.4l-3.2,0l-1.7,-2.9l4.9,0l0,0Z" fill="#1976d2"></path></svg>
);
const GoogleDocsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#4285f4"></path><path d="M10,9H6V8h4V9z M11,7H6V6h5V7z M11,5H6V4h5V5z" fill="#ffffff"></path></svg>
);
const GoogleSheetsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#0f9d58"></path><path d="M7,11v-1H5v-1h2V8H5V7h2V6H4v6h3V11z M12,12H8v-1h1V8H8V7h4v1h-1v2h1V12z" fill="#ffffff"></path></svg>
);
const GoogleSlidesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#ffc107"></path><path d="M12,4H4v6h8V4z" fill="#ffffff"></path></svg>
);
const GoogleFormsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#7e57c2"></path><path d="M10,11H6v-1h4V11z M11,8H6V7h5V8z M8,5H6V4h2V5z" fill="#ffffff"></path></svg>
);
const GoogleMeetIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#00897B"/></svg>
);

const attachmentIcons: Record<AttachmentType, React.ReactNode> = {
  drive: <GoogleDriveIcon className="mr-2 h-4 w-4" />,
  docs: <GoogleDocsIcon className="mr-2 h-4 w-4" />,
  sheets: <GoogleSheetsIcon className="mr-2 h-4 w-4" />,
  slides: <GoogleSlidesIcon className="mr-2 h-4 w-4" />,
  forms: <GoogleFormsIcon className="mr-2 h-4 w-4" />,
  meet: <GoogleMeetIcon className="mr-2 h-4 w-4" />,
  local: <GoogleSymbol name="description" className="mr-2 text-lg" />,
  link: <GoogleSymbol name="link" className="mr-2 text-lg" />,
};

// Wrapper to fix issues with react-beautiful-dnd and React 18 Strict Mode
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

function BadgeForm({ badge: initialBadge, onSave, onClose }: { badge: Badge, onSave: (badge: Badge) => void, onClose: () => void }) {
    const { toast } = useToast();
    const { users } = useUser();

    // Use a state to manage the badge data, fetching rich data if needed
    const [badge, setBadge] = useState<Badge>(initialBadge);
    
    // States for inline name editing
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    
    // States for popovers and dialogs
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isSchedulePopoverOpen, setIsSchedulePopoverOpen] = useState(false);
    const [isUsersPopoverOpen, setIsUsersPopoverOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

    // States for popover content
    const [iconSearch, setIconSearch] = useState('');
    const [guestSearch, setGuestSearch] = useState('');
    const [linkName, setLinkName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [isCreatingMeetLink, setIsCreatingMeetLink] = useState(false);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
    }, [isEditingName]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value;
        if (!newName?.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
            setBadge(b => ({ ...b, name: initialBadge.name })); // revert
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') {
          setBadge(b => ({ ...b, name: initialBadge.name }));
          setIsEditingName(false);
        }
    };
    
    const handleAddAttachment = (type: AttachmentType, name: string, url: string = '#') => {
        const currentAttachments = badge.attachments || [];
        setBadge(b => ({...b, attachments: [...currentAttachments, { type, name, url }]}));
    };
    
    const handleAddLink = () => {
        if (!linkUrl.trim() || !linkName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Both URL and display name are required.' });
            return;
        }
        handleAddAttachment('link', linkName.trim(), linkUrl.trim());
        setIsLinkDialogOpen(false);
    };

    useEffect(() => {
        if (!isLinkDialogOpen) {
            setLinkName('');
            setLinkUrl('');
        }
    }, [isLinkDialogOpen]);

    const handleToggleUser = (userToToggle: User) => {
        const currentUsers = badge.assignedUsers || [];
        const isAssigned = currentUsers.some(u => u === userToToggle.userId);
        const newUsers = isAssigned 
            ? currentUsers.filter(id => id !== userToToggle.userId)
            : [...currentUsers, userToToggle.userId];
        setBadge(b => ({ ...b, assignedUsers: newUsers }));
    };

    const filteredGuests = useMemo(() => {
        const assignedSet = new Set(badge.assignedUsers || []);
        return users.filter(user => !assignedSet.has(user.userId));
    }, [users, badge.assignedUsers]);
    
    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName => iconName.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

    const handleSaveClick = () => {
        if (!badge.name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
            return;
        }
        onSave(badge);
        onClose();
    };
    
    const { startDate, endDate } = badge.schedule || {};
    
    return (
        <DialogContent>
            <div className="absolute top-4 right-4 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close">
                    <GoogleSymbol name="close" className="text-xl" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveClick} aria-label="Save Changes">
                    <GoogleSymbol name="check" className="text-xl" />
                </Button>
            </div>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                 <div className="flex items-center gap-3">
                     <div className="relative">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <PopoverTrigger asChild><Button variant="outline" size="icon" className="h-10 w-10 text-2xl" style={{ color: badge.color }}><GoogleSymbol name={badge.icon} /></Button></PopoverTrigger>
                            <PopoverContent className="w-80 p-0"><div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div><ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { setBadge(b => ({ ...b, icon: iconName })); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea></PopoverContent>
                        </Popover>
                         <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}><PopoverTrigger asChild><div className="absolute -bottom-1 -right-0 h-5 w-5 rounded-full border-2 border-dialog cursor-pointer" style={{ backgroundColor: badge.color }} /></PopoverTrigger><PopoverContent className="w-auto p-2"><div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {setBadge(b => ({ ...b, color: c })); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => setBadge(b => ({ ...b, color: e.target.value }))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div></PopoverContent></Popover>
                    </div>
                     {isEditingName ? (
                        <Input ref={nameInputRef} value={badge.name} onChange={e => setBadge(b => ({ ...b, name: e.target.value }))} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                    ) : (
                        <h3 onClick={() => setIsEditingName(true)} className="text-2xl font-semibold cursor-pointer">{badge.name || 'New Badge'}</h3>
                    )}
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Popover open={isSchedulePopoverOpen} onOpenChange={setIsSchedulePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><GoogleSymbol name="calendar_month" className="text-xl" /></Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                            mode="range"
                                            selected={{ from: startDate, to: endDate }}
                                            onSelect={(range) => setBadge(b => ({ ...b, schedule: { startDate: range?.from, endDate: range?.to }}))}
                                            numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TooltipTrigger>
                                <TooltipContent><p>Set Dates</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Popover open={isUsersPopoverOpen} onOpenChange={setIsUsersPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><GoogleSymbol name="group_add" className="text-xl" /></Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <div className="p-2"><Input placeholder="Search by name..." value={guestSearch} onChange={e => setGuestSearch(e.target.value)} /></div>
                                            <Separator />
                                            <ScrollArea className="max-h-60">
                                                <div className="p-1">
                                                    {filteredGuests.filter(g => g.displayName.toLowerCase().includes(guestSearch.toLowerCase())).map(user => (
                                                        <div key={user.userId} onClick={() => handleToggleUser(user)} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                            <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                            <div><p className="font-medium text-sm">{user.displayName}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                </TooltipTrigger>
                                <TooltipContent><p>Assign Users</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Textarea id="description" value={badge.description} onChange={e => setBadge(b => ({ ...b, description: e.target.value }))} placeholder="Description (optional)" />
                </div>
            </div>
        </DialogContent>
    );
}

function DetailedBadgeCard({ badge, onEdit, onDelete, isLink, linkColor }: { badge: Badge, onEdit: () => void, onDelete: () => void, isLink: boolean, linkColor?: string }) {
    return (
        <Card className="group cursor-pointer" onClick={onEdit}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <GoogleSymbol name={badge.icon} className="text-3xl" style={{ color: badge.color }} />
                             {isLink && (
                                <div 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center"
                                    style={{ backgroundColor: linkColor }}
                                    title="Linked Badge"
                                >
                                    <GoogleSymbol name="link" style={{ fontSize: '14px', color: getContrastColor(linkColor || '#000') }}/>
                                </div>
                            )}
                        </div>
                        <CardTitle>{badge.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <GoogleSymbol name="delete" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                {badge.description && <p className="text-sm text-muted-foreground">{badge.description}</p>}
            </CardContent>
        </Card>
    );
}

function BadgeDisplayItem({ badge, viewMode, isLink, linkColor, onEdit, onDelete }: { badge: Badge; viewMode: BadgeCollection['viewMode']; isLink: boolean; linkColor?: string; onEdit: () => void; onDelete: () => void; }) {
    if (viewMode === 'list') {
      return (
        <div className="group flex w-full items-center gap-4 p-2 rounded-md hover:bg-muted/50">
            <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <GoogleSymbol name={badge.icon} className="text-2xl" style={{ color: badge.color }} />
                {isLink && (
                    <div
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-card bg-muted flex items-center justify-center"
                        style={{ backgroundColor: linkColor }}
                        title="Linked Badge"
                    >
                        <GoogleSymbol name="link" style={{fontSize: '12px', color: getContrastColor(linkColor || '#000')}}/>
                    </div>
                )}
            </div>
            <div className="flex-1 font-semibold">{badge.name}</div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <GoogleSymbol name="delete" />
            </Button>
        </div>
      );
    }

    if (viewMode === 'scale') {
        return <DetailedBadgeCard badge={badge} onEdit={onEdit} onDelete={onDelete} isLink={isLink} linkColor={linkColor} />;
    }
    
    return (
        <div className="group relative inline-flex items-center gap-2 rounded-full border-2 p-1 pr-2 cursor-pointer" style={{ borderColor: badge.color, color: badge.color }} onClick={onEdit}>
             <div className="relative">
                <GoogleSymbol name={badge.icon} className="text-base" />
                {isLink && (
                    <div
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                        style={{ backgroundColor: linkColor }}
                        title="Linked Badge"
                    >
                        <GoogleSymbol name="link" style={{fontSize: '10px', color: getContrastColor(linkColor || '#000')}}/>
                    </div>
                )}
            </div>
            <span className="font-semibold">{badge.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="ml-1 h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete ${badge.name}`}>
                <GoogleSymbol name="close" className="text-sm" />
            </button>
        </div>
    );
}

function BadgeCollectionCard({ collection, allBadgesInTeam, allCollectionsInTeam, onUpdateCollection, onDeleteCollection, onAddBadge, onUpdateBadge, onDeleteBadge, onMoveBadge }: {
    collection: BadgeCollection;
    allBadgesInTeam: Badge[];
    allCollectionsInTeam: BadgeCollection[];
    onUpdateCollection: (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => void;
    onDeleteCollection: (collectionId: string) => void;
    onAddBadge: (collectionId: string) => void;
    onUpdateBadge: (badgeData: Badge) => void;
    onDeleteBadge: (collectionId: string, badgeId: string) => void;
    onMoveBadge: (badgeId: string, sourceCollectionId: string, destCollectionId: string, sourceIndex: number, destIndex: number) => void;
}) {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName => iconName.toLowerCase().includes(iconSearch.toLowerCase()));
    }, [iconSearch]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) { nameInputRef.current.focus(); nameInputRef.current.select(); }
    }, [isEditingName]);

    const handleSaveName = () => {
        const newName = nameInputRef.current?.value || collection.name;
        if (newName.trim() !== collection.name) {
            onUpdateCollection(collection.id, { name: newName.trim() });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };

    const openForm = (badge: Badge) => {
        setEditingBadge(badge);
        setIsFormOpen(true);
    };
    
    const collectionBadges = collection.badgeIds.map(id => allBadgesInTeam.find(b => b.id === id)).filter((b): b is Badge => !!b);

    return (
        <Card>
             {isFormOpen && editingBadge && (<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><BadgeForm badge={editingBadge} onClose={() => setIsFormOpen(false)} onSave={onUpdateBadge} /></Dialog>)}
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 text-2xl" style={{ color: collection.color }}><GoogleSymbol name={collection.icon} /></Button></PopoverTrigger><PopoverContent className="w-80 p-0"><div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div><ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={collection.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateCollection(collection.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea></PopoverContent></Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}><PopoverTrigger asChild><div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: collection.color }} /></PopoverTrigger><PopoverContent className="w-auto p-2"><div className="grid grid-cols-8 gap-1">{predefinedColors.map(color => (<button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => {onUpdateCollection(collection.id, { color }); setIsColorPopoverOpen(false);}}/>))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={collection.color} onChange={(e) => onUpdateCollection(collection.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div></PopoverContent></Popover>
                        </div>
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            {isEditingName ? (
                                <Input ref={nameInputRef} defaultValue={collection.name} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer truncate">{collection.name}</CardTitle>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onAddBadge(collection.id)}><GoogleSymbol name="add_circle" className="text-xl" /><span className="sr-only">Add Badge</span></Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-end -mr-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'assorted' })}><GoogleSymbol name="view_module" className="mr-2" />Assorted View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'scale' })}><GoogleSymbol name="view_comfy_alt" className="mr-2" />Scale View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.id, { viewMode: 'list' })}><GoogleSymbol name="view_list" className="mr-2" />List View</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDeleteCollection(collection.id)} className="text-destructive focus:text-destructive"><GoogleSymbol name="delete" className="mr-2"/>Delete Collection</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                 {collection.description && <CardDescription className="pt-2">{collection.description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <StrictModeDroppable droppableId={collection.id}>
                    {(provided) => (
                         <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[60px]",
                                collection.viewMode === 'assorted' && "flex flex-wrap gap-2",
                                collection.viewMode === 'list' && "flex flex-col gap-1",
                                collection.viewMode === 'scale' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            )}>
                            {collectionBadges.map((badge, index) => {
                                const isLink = badge.ownerCollectionId !== collection.id;
                                const ownerCollection = isLink ? allCollectionsInTeam.find(c => c.id === badge.ownerCollectionId) : undefined;
                                const linkColor = ownerCollection?.color;

                                return (
                                <Draggable key={badge.id} draggableId={badge.id} index={index}>
                                    {(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <BadgeDisplayItem 
                                            badge={badge} 
                                            viewMode={collection.viewMode} 
                                            isLink={isLink} 
                                            linkColor={linkColor}
                                            onEdit={() => openForm(badge)} 
                                            onDelete={() => onDeleteBadge(collection.id, badge.id)}
                                        />
                                    </div>)}
                                </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </StrictModeDroppable>
            </CardContent>
        </Card>
    );
}

export function BadgeManagement({ team }: { team: Team }) {
    const { updateTeam } = useUser();
    const { toast } = useToast();
    
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

    const handleUpdateCollection = (collectionId: string, newValues: Partial<Omit<BadgeCollection, 'id' | 'badgeIds'>>) => {
        const newCollections = team.badgeCollections.map(collection => 
            collection.id === collectionId ? { ...collection, ...newValues } : collection
        );
        updateTeam(team.id, { badgeCollections: newCollections });
    };

    const handleAddCollection = () => {
        const newName = `New Collection ${team.badgeCollections.length + 1}`;
        if (team.badgeCollections.some(c => c.name === newName)) {
            toast({ variant: 'destructive', title: 'Error', description: 'A collection with this name already exists.' });
            return;
        }
        const newCollection: BadgeCollection = {
            id: crypto.randomUUID(),
            name: newName,
            icon: 'category',
            color: '#64748B',
            viewMode: 'assorted',
            badgeIds: [],
            description: '',
        };
        const newCollections = [...team.badgeCollections, newCollection];
        updateTeam(team.id, { badgeCollections: newCollections });
        toast({ title: 'Collection Added', description: `"${newName}" has been created.`});
    };
    
    const handleDeleteCollection = () => {
        if (!collectionToDelete) return;
        const collection = team.badgeCollections.find(c => c.id === collectionToDelete);
        if (!collection) return;

        // Remove the collection itself
        const newCollections = team.badgeCollections.filter(c => c.id !== collectionToDelete);
        
        // Find all badges owned by this collection
        const ownedBadgeIds = new Set(team.allBadges.filter(b => b.ownerCollectionId === collectionToDelete).map(b => b.id));
        
        // Remove those badges from the central list
        const newAllBadges = team.allBadges.filter(b => !ownedBadgeIds.has(b.id));

        // Remove any links to those badges from the remaining collections
        const finalCollections = newCollections.map(c => ({
            ...c,
            badgeIds: c.badgeIds.filter(id => !ownedBadgeIds.has(id))
        }));

        updateTeam(team.id, { badgeCollections: finalCollections, allBadges: newAllBadges });
        toast({ title: 'Collection Deleted', description: `"${collection.name}" and all its owned badges have been deleted.`});
        setCollectionToDelete(null);
    };

    const handleAddBadge = (collectionId: string) => {
        const badgeCount = team.allBadges.length;
        const newBadge: Badge = {
            id: crypto.randomUUID(),
            ownerCollectionId: collectionId,
            name: `New Badge ${badgeCount + 1}`,
            icon: googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
            color: predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
        };
        const newAllBadges = [...team.allBadges, newBadge];
        const newCollections = team.badgeCollections.map(c => {
            if (c.id === collectionId) {
                return { ...c, badgeIds: [...c.badgeIds, newBadge.id] };
            }
            return c;
        });
        updateTeam(team.id, { allBadges: newAllBadges, badgeCollections: newCollections });
    };
    
    const handleUpdateBadge = (badgeData: Badge) => {
        const newAllBadges = team.allBadges.map(b => b.id === badgeData.id ? badgeData : b);
        updateTeam(team.id, { allBadges: newAllBadges });
        toast({ title: 'Badge Updated', description: `"${badgeData.name}" has been saved.` });
    };

    const handleDeleteBadge = (collectionId: string, badgeId: string) => {
        const badge = team.allBadges.find(b => b.id === badgeId);
        if (!badge) return;

        if (badge.ownerCollectionId === collectionId) { // Full delete
            const newAllBadges = team.allBadges.filter(b => b.id !== badgeId);
            const newCollections = team.badgeCollections.map(c => ({
                ...c,
                badgeIds: c.badgeIds.filter(id => id !== badgeId)
            }));
            updateTeam(team.id, { allBadges: newAllBadges, badgeCollections: newCollections });
            toast({ title: 'Badge Deleted', description: `"${badge.name}" was permanently deleted.` });
        } else { // Unlink
            const newCollections = team.badgeCollections.map(c => {
                if (c.id === collectionId) {
                    return { ...c, badgeIds: c.badgeIds.filter(id => id !== badgeId) };
                }
                return c;
            });
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Badge Unlinked', description: `"${badge.name}" was unlinked from this collection.` });
        }
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const sourceCollection = team.badgeCollections.find(c => c.id === source.droppableId);
        const destCollection = team.badgeCollections.find(c => c.id === destination.droppableId);

        if (!sourceCollection || !destCollection) return;

        if (source.droppableId === destination.droppableId) { // Reorder
            const reorderedIds = Array.from(sourceCollection.badgeIds);
            const [movedId] = reorderedIds.splice(source.index, 1);
            reorderedIds.splice(destination.index, 0, movedId);

            const newCollections = team.badgeCollections.map(c => c.id === sourceCollection.id ? { ...c, badgeIds: reorderedIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
        } else { // Share
            if (destCollection.badgeIds.includes(draggableId)) {
                toast({ variant: 'default', title: 'Already linked', description: 'This badge is already in the destination collection.'});
                return;
            }
            const newDestIds = Array.from(destCollection.badgeIds);
            newDestIds.splice(destination.index, 0, draggableId);
            
            const newCollections = team.badgeCollections.map(c => c.id === destCollection.id ? { ...c, badgeIds: newDestIds } : c);
            updateTeam(team.id, { badgeCollections: newCollections });
            toast({ title: 'Badge Shared', description: 'A link to the badge has been added to the new collection.' });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">Badge Collections</h2>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleAddCollection}>
                        <GoogleSymbol name="add_circle" className="text-xl" />
                        <span className="sr-only">New Collection</span>
                    </Button>
                </div>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-6">
                {(team.badgeCollections || []).map(collection => (
                    <BadgeCollectionCard
                        key={collection.id}
                        collection={collection}
                        allBadgesInTeam={team.allBadges}
                        allCollectionsInTeam={team.badgeCollections}
                        onUpdateCollection={handleUpdateCollection}
                        onDeleteCollection={() => setCollectionToDelete(collection.id)}
                        onAddBadge={handleAddBadge}
                        onUpdateBadge={handleUpdateBadge}
                        onDeleteBadge={handleDeleteBadge}
                        onMoveBadge={()=>{}} // Drag and drop handles move now
                    />
                ))}
                </div>
            </DragDropContext>
             <AlertDialog open={!!collectionToDelete} onOpenChange={(isOpen) => !isOpen && setCollectionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeaderUI>
                        <AlertDialogTitleUI>Are you absolutely sure?</AlertDialogTitleUI>
                        <AlertDialogDescriptionUI>
                        This action cannot be undone. This will permanently delete the collection and all badges it owns.
                        </AlertDialogDescriptionUI>
                    </AlertDialogHeaderUI>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
