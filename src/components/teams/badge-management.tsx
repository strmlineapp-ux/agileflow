
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection, type Attachment, type AttachmentType } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn, getContrastColor } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps } from 'react-beautiful-dnd';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const attachmentIcons: Record<AttachmentType, React.ReactNode> = {
  drive: <GoogleSymbol name="folder" className="text-lg text-yellow-500" />,
  docs: <GoogleSymbol name="article" className="text-lg text-blue-500" />,
  sheets: <GoogleSymbol name="assessment" className="text-lg text-green-500" />,
  slides: <GoogleSymbol name="slideshow" className="text-lg text-yellow-600" />,
  forms: <GoogleSymbol name="quiz" className="text-lg text-purple-500" />,
  meet: <GoogleSymbol name="videocam" className="text-lg text-green-600" />,
  local: <GoogleSymbol name="description" className="text-lg" />,
  link: <GoogleSymbol name="link" className="text-lg" />,
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

function BadgeForm({ badge, onSave, onClose }: { badge: Badge | null, onSave: (badge: Badge) => void, onClose: () => void }) {
    const { toast } = useToast();
    const [name, setName] = useState(badge?.name || '');
    const [description, setDescription] = useState(badge?.description || '');
    const [icon, setIcon] = useState(badge?.icon || 'new_releases');
    const [color, setColor] = useState(badge?.color || '#64748B');
    const [attachments, setAttachments] = useState<Attachment[]>(badge?.attachments || []);
    
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkName, setLinkName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    const handleSaveClick = () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Badge name cannot be empty.' });
            return;
        }
        onSave({ name, icon, color, description, attachments });
        onClose();
    };
    
     const handleAddAttachment = (type: AttachmentType, name: string, url: string = '#') => {
        setAttachments(prev => [...prev, { type, name, url }]);
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
    
    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    return <>
        <DialogContent>
             <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveClick}>
                    <GoogleSymbol name="check" className="text-xl" />
                    <span className="sr-only">Save Badge</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle>{badge ? 'Edit Badge' : 'Add New Badge'}</DialogTitle>
                <DialogDescription>
                    Manage the badge's details, description, and linked resources.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                 <div className="flex items-center gap-2">
                     <div className="relative">
                        <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 text-2xl" style={{ color: color }}>
                                    <GoogleSymbol name={icon} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0">
                                <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                                <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { setIcon(iconName); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                            </PopoverContent>
                        </Popover>
                         <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                            <PopoverTrigger asChild>
                                <div className="absolute -bottom-1 -right-0 h-5 w-5 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: color }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">
                                {predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => {setColor(c); setIsColorPopoverOpen(false);}}/>))}
                                <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                </div>
                            </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Badge Name" />
                </div>
                 <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
                 
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Attachments</h4>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary">
                                <GoogleSymbol name="add" className="text-xl" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onSelect={() => handleAddAttachment('local', 'New Document.pdf')}>
                                <GoogleSymbol name="description" className="mr-2 text-lg" />
                                <span>Attach file</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsLinkDialogOpen(true)}>
                                <GoogleSymbol name="link" className="mr-2 text-lg" />
                                <span>Add Link</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {attachments.length > 0 && (
                        <div className="space-y-2 rounded-md border p-2">
                        {attachments.map((att, index) => (
                            <div key={index} className="flex items-center justify-between gap-2 text-sm p-1 pr-2 rounded-md hover:bg-muted">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
                                {attachmentIcons[att.type]}
                                <span className="truncate underline-offset-4 hover:underline">{att.name}</span>
                            </a>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveAttachment(index)}
                            >
                                <GoogleSymbol name="close" className="text-sm" />
                                <span className="sr-only">Remove attachment</span>
                            </Button>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogContent className="max-w-md">
                <div className="absolute top-4 right-4 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsLinkDialogOpen(false)}>
                        <GoogleSymbol name="close" className="text-xl" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddLink}>
                        <GoogleSymbol name="check" className="text-xl" />
                    </Button>
                </div>
                <DialogHeader>
                    <DialogTitle>Add Link Attachment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 pt-4">
                    <Input placeholder="URL (e.g., https://example.com)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                    <Input placeholder="Display Name (e.g., Project Website)" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
                </div>
            </DialogContent>
        </Dialog>
    </>;
}

function DraggableBadge({ badge, viewMode, onEdit, onDelete }: { badge: Badge, viewMode: BadgeCollection['viewMode'], onEdit: () => void, onDelete: () => void }) {
    if (viewMode === 'list') {
      return (
        <div className="group flex w-full items-center gap-4 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={onEdit}>
            <GoogleSymbol name={badge.icon} className="text-2xl" style={{ color: badge.color }} />
            <div className="flex-1 font-semibold">{badge.name}</div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <GoogleSymbol name="delete" />
            </Button>
        </div>
      );
    }

    if (viewMode === 'scale') {
        return (
            <Card className="group cursor-pointer" onClick={onEdit}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <GoogleSymbol name={badge.icon} className="text-3xl" style={{ color: badge.color }} />
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                           <GoogleSymbol name="delete" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{badge.description}</p>
                </CardContent>
            </Card>
        );
    }
    
    // Default: 'assorted'
    return (
        <div 
            className="group relative inline-flex items-center gap-2 rounded-full border-2 p-1 pr-2 cursor-pointer"
            style={{ borderColor: badge.color, color: badge.color }}
            onClick={onEdit}
        >
            <GoogleSymbol name={badge.icon} className="text-base" />
            <span className="font-semibold">{badge.name}</span>
             <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="ml-1 h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete ${badge.name}`}
            >
                <GoogleSymbol name="close" className="text-sm" />
            </button>
        </div>
    );
}

function BadgeCollectionCard({ collection, onUpdateCollection }: {
    collection: BadgeCollection;
    onUpdateCollection: (collectionName: string, newValues: Partial<BadgeCollection>) => void;
}) {
    const { toast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(collection.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return googleSymbolNames;
        return googleSymbolNames.filter(iconName =>
            iconName.toLowerCase().includes(iconSearch.toLowerCase())
        );
    }, [iconSearch]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    const handleSaveName = () => {
        if (name.trim() !== collection.name) {
            onUpdateCollection(collection.name, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };

    const openForm = (badge: Badge | null) => {
        setEditingBadge(badge);
        setIsFormOpen(true);
    };

    const handleSaveBadge = (badgeData: Badge) => {
        const isEditing = !!editingBadge;
        let newBadges: Badge[];

        if (isEditing) {
            newBadges = collection.badges.map(b => b.name === editingBadge.name ? badgeData : b);
        } else {
            if (collection.badges.some(b => b.name === badgeData.name)) {
                toast({ variant: 'destructive', title: 'Error', description: 'A badge with this name already exists.' });
                return;
            }
            newBadges = [...collection.badges, badgeData];
        }
        onUpdateCollection(collection.name, { badges: newBadges });
    };

    const handleDeleteBadge = (badgeName: string) => {
        const newBadges = collection.badges.filter(b => b.name !== badgeName);
        onUpdateCollection(collection.name, { badges: newBadges });
        toast({ title: "Badge Deleted", description: `"${badgeName}" has been deleted.` });
    };
    
    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index) return;

        const reorderedBadges = Array.from(collection.badges);
        const [movedBadge] = reorderedBadges.splice(source.index, 1);
        reorderedBadges.splice(destination.index, 0, movedBadge);

        onUpdateCollection(collection.name, { badges: reorderedBadges });
    };

    return (
        <Card>
             {isFormOpen && (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <BadgeForm badge={editingBadge} onClose={() => setIsFormOpen(false)} onSave={handleSaveBadge} />
                </Dialog>
            )}
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                         <div className="relative">
                            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl" style={{ color: collection.color }}>
                                        <GoogleSymbol name={collection.icon} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0">
                                    <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={collection.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdateCollection(collection.name, { icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: collection.color }} />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">
                                    {predefinedColors.map(color => (<button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => {onUpdateCollection(collection.name, { color }); setIsColorPopoverOpen(false);}}/>))}
                                    <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                    <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={collection.color} onChange={(e) => onUpdateCollection(collection.name, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                                    </div>
                                </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                            {isEditingName ? (
                                <Input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                            ) : (
                                <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{collection.name}</CardTitle>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(null)}>
                                <GoogleSymbol name="add_circle" className="text-xl" />
                                <span className="sr-only">Add Badge</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-end -mr-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><GoogleSymbol name="more_vert" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.name, { viewMode: 'assorted' })}>
                                    <GoogleSymbol name="view_module" className="mr-2" />Assorted View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.name, { viewMode: 'scale' })}>
                                    <GoogleSymbol name="view_comfy_alt" className="mr-2" />Scale View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateCollection(collection.name, { viewMode: 'list' })}>
                                    <GoogleSymbol name="view_list" className="mr-2" />List View
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                    <StrictModeDroppable droppableId={collection.name}>
                        {(provided) => (
                             <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                    collection.viewMode === 'assorted' && "flex flex-wrap gap-2",
                                    collection.viewMode === 'list' && "flex flex-col gap-1",
                                    collection.viewMode === 'scale' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                )}>
                                {collection.badges.map((badge, index) => (
                                    <Draggable key={badge.name} draggableId={badge.name} index={index}>
                                        {(provided) => (
                                             <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <DraggableBadge
                                                    badge={badge}
                                                    viewMode={collection.viewMode}
                                                    onEdit={() => openForm(badge)}
                                                    onDelete={() => handleDeleteBadge(badge.name)}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </StrictModeDroppable>
                </DragDropContext>
            </CardContent>
        </Card>
    );
}

export function BadgeManagement({ team }: { team: Team }) {
    const { updateTeam } = useUser();

    const handleUpdateCollection = (collectionName: string, newValues: Partial<BadgeCollection>) => {
        const newCollections = team.badgeCollections.map(collection => {
            if (collection.name === collectionName) {
                const oldName = collection.name;
                const updatedCollection = { ...collection, ...newValues };
                if (newValues.name && newValues.name !== oldName) {
                }
                return updatedCollection;
            }
            return collection;
        });
        updateTeam(team.id, { badgeCollections: newCollections });
    };

    return (
        <div className="space-y-6">
            {(team.badgeCollections || []).map(collection => (
                <BadgeCollectionCard
                    key={collection.name}
                    collection={collection}
                    onUpdateCollection={handleUpdateCollection}
                />
            ))}
        </div>
    );
}
