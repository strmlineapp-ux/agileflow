
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type Badge, type BadgeCollection } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn, getContrastColor } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function EditableBadgeComponent({ 
    badge, 
    onUpdate, 
    onDelete,
    viewMode
}: { 
    badge: Badge, 
    onUpdate: (newValues: Partial<Badge>) => void, 
    onDelete: () => void,
    viewMode: BadgeCollection['viewMode']
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(badge.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

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
        if (name.trim() !== badge.name) {
            onUpdate({ name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveName();
        else if (e.key === 'Escape') setIsEditingName(false);
    };
    
    const iconColorEditor = (
        <div className="relative">
            <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-2xl" style={{ color: badge.color }}>
                        <GoogleSymbol name={badge.icon} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                    <div className="p-2 border-b"><Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} /></div>
                    <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={badge.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => {onUpdate({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
                </PopoverContent>
            </Popover>
            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                <PopoverTrigger asChild>
                    <div className="absolute -bottom-1 -right-0 h-4 w-4 rounded-full border-2 border-card cursor-pointer" style={{ backgroundColor: badge.color }} />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1">
                    {predefinedColors.map(color => (<button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => {onUpdate({ color }); setIsColorPopoverOpen(false);}}/>))}
                    <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                    <GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={badge.color} onChange={(e) => onUpdate({ color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/>
                    </div>
                </div>
                </PopoverContent>
            </Popover>
        </div>
    );
    
    const nameEditor = isEditingName ? (
        <Input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-base font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-24"/>
    ) : (
        <span onClick={() => setIsEditingName(true)} className="cursor-pointer font-semibold">{badge.name}</span>
    );
    
    const deleteButton = (
         <Button
            variant="ghost" size="icon"
            onClick={onDelete}
            className="h-5 w-5 hover:bg-destructive/20 text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete ${badge.name}`}
        >
            <GoogleSymbol name="delete" className="text-sm" />
        </Button>
    );

    if (viewMode === 'list') {
      return (
        <div className="group flex w-full items-center gap-2 p-2 rounded-md hover:bg-muted/50">
            {iconColorEditor}
            <div className="flex-1">{nameEditor}</div>
            {deleteButton}
        </div>
      );
    }

    if (viewMode === 'scale') {
        return (
            <Card className="group">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        {iconColorEditor}
                        {deleteButton}
                    </div>
                </CardHeader>
                <CardContent>
                    {nameEditor}
                </CardContent>
            </Card>
        );
    }
    
    // Default: 'assorted'
    return (
        <div 
            className="group relative inline-flex items-center gap-2 rounded-full border-2 p-1 pl-2"
            style={{ borderColor: badge.color, color: badge.color }}
        >
            {iconColorEditor}
            {nameEditor}
             <button
                type="button"
                onClick={onDelete}
                className="h-5 w-5 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete ${badge.name}`}
            >
                <GoogleSymbol name="close" className="text-sm" />
            </button>
        </div>
    );
}


function BadgeCollectionCard({ collection, team, onUpdateCollection, onDeleteCollection }: {
    collection: BadgeCollection;
    team: Team;
    onUpdateCollection: (collectionName: string, newValues: Partial<BadgeCollection>) => void;
    onDeleteCollection: (collectionName: string) => void;
}) {
    const { updateTeam } = useUser();
    const { toast } = useToast();

    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(collection.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

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

    const handleAddBadge = () => {
        const newBadgeName = `New Badge ${collection.badges.length + 1}`;
        if(collection.badges.some(b => b.name === newBadgeName)) {
            toast({ variant: 'destructive', title: 'Error', description: 'A badge with this name already exists.' });
            return;
        }

        const newBadge: Badge = { name: newBadgeName, icon: 'new_releases', color: '#64748B' };
        onUpdateCollection(collection.name, { badges: [...collection.badges, newBadge] });
    };

    const handleUpdateBadge = (badgeName: string, newValues: Partial<Badge>) => {
        const newBadges = collection.badges.map(badge => 
            badge.name === badgeName ? { ...badge, ...newValues } : badge
        );
        onUpdateCollection(collection.name, { badges: newBadges });
    };

    const handleDeleteBadge = (badgeName: string) => {
        const newBadges = collection.badges.filter(b => b.name !== badgeName);
        onUpdateCollection(collection.name, { badges: newBadges });
        toast({ title: "Badge Deleted", description: `"${badgeName}" has been deleted.` });
    };

    return (
        <Card>
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
                        {isEditingName ? (
                            <Input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                        ) : (
                            <CardTitle onClick={() => setIsEditingName(true)} className="cursor-pointer">{collection.name}</CardTitle>
                        )}
                    </div>

                    <div className="flex items-center -mr-2">
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
                        <Button variant="ghost" size="icon" onClick={() => handleAddBadge()}>
                            <GoogleSymbol name="add_circle" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    collection.viewMode === 'assorted' && "flex flex-wrap gap-2",
                    collection.viewMode === 'list' && "flex flex-col gap-1",
                    collection.viewMode === 'scale' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                )}>
                    {collection.badges.map(badge => (
                        <EditableBadgeComponent
                            key={badge.name}
                            badge={badge}
                            onUpdate={(newValues) => handleUpdateBadge(badge.name, newValues)}
                            onDelete={() => handleDeleteBadge(badge.name)}
                            viewMode={collection.viewMode}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}


export function BadgeManagement({ team }: { team: Team }) {
    const { updateTeam } = useUser();

    const handleUpdateCollection = (collectionName: string, newValues: Partial<BadgeCollection>) => {
        const newCollections = team.badgeCollections.map(collection => {
            if (collection.name === collectionName) {
                // If name is being changed, we need to find by old name and update with new name
                const oldName = collection.name;
                const updatedCollection = { ...collection, ...newValues };
                if (newValues.name && newValues.name !== oldName) {
                    // This is a simplified name update. A more robust solution might check for name conflicts.
                }
                return updatedCollection;
            }
            return collection;
        });
        updateTeam(team.id, { badgeCollections: newCollections });
    };

    const handleDeleteCollection = (collectionName: string) => {
        // Implement deletion logic if needed, currently no UI for this
    };

    return (
        <div className="space-y-6">
            {(team.badgeCollections || []).map(collection => (
                <BadgeCollectionCard
                    key={collection.name}
                    collection={collection}
                    team={team}
                    onUpdateCollection={handleUpdateCollection}
                    onDeleteCollection={handleDeleteCollection}
                />
            ))}
        </div>
    );
}
