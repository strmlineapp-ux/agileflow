
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
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function EditableBadge({ badge, onUpdate, onDelete }: { badge: Badge, onUpdate: (newValues: Partial<Badge>) => void, onDelete: () => void }) {
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
    
    return (
        <div 
            className="group relative inline-flex items-center gap-2 rounded-full border-2 p-1 pl-2"
            style={{ borderColor: badge.color, color: badge.color }}
        >
            <div className="relative">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: badge.color }}>
                            <GoogleSymbol name={badge.icon} className="text-xl" />
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
             {isEditingName ? (
                <Input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={handleNameKeyDown} className="h-auto p-0 text-base font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-24"/>
            ) : (
                <span onClick={() => setIsEditingName(true)} className="cursor-pointer font-semibold">{badge.name}</span>
            )}
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

export function BadgeManagement({ team }: { team: Team }) {
    const { updateTeam } = useUser();
    const { toast } = useToast();
    const [badgeToDelete, setBadgeToDelete] = useState<{ badge: Badge, collectionName: string } | null>(null);

    const handleUpdateBadge = (collectionName: string, badgeName: string, newValues: Partial<Badge>) => {
        const newCollections = team.badgeCollections.map(collection => {
            if (collection.name === collectionName) {
                return {
                    ...collection,
                    badges: collection.badges.map(badge => 
                        badge.name === badgeName ? { ...badge, ...newValues } : badge
                    )
                };
            }
            return collection;
        });
        updateTeam(team.id, { badgeCollections: newCollections });
    };

    const handleDeleteBadge = () => {
        if (!badgeToDelete) return;
        const { badge, collectionName } = badgeToDelete;
         const newCollections = team.badgeCollections.map(collection => {
            if (collection.name === collectionName) {
                return {
                    ...collection,
                    badges: collection.badges.filter(b => b.name !== badge.name)
                };
            }
            return collection;
        });
        updateTeam(team.id, { badgeCollections: newCollections });
        toast({ title: "Badge Deleted", description: `"${badge.name}" has been deleted.` });
        setBadgeToDelete(null);
    };

    const handleAddBadge = (collectionName: string) => {
        const collection = team.badgeCollections.find(c => c.name === collectionName);
        if (!collection) return;

        const newBadgeName = `New Badge ${collection.badges.length + 1}`;
        if(collection.badges.some(b => b.name === newBadgeName)) {
            toast({ variant: 'destructive', title: 'Error', description: 'A badge with this name already exists.' });
            return;
        }

        const newBadge: Badge = {
            name: newBadgeName,
            icon: 'new_releases',
            color: '#64748B'
        };

        const newCollections = team.badgeCollections.map(c => {
            if (c.name === collectionName) {
                return { ...c, badges: [...c.badges, newBadge] };
            }
            return c;
        });

        updateTeam(team.id, { badgeCollections: newCollections });
    }

    return (
        <>
            <div className="space-y-6">
                {(team.badgeCollections || []).map(collection => (
                    <Card key={collection.name}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {collection.name}
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleAddBadge(collection.name)}>
                                    <GoogleSymbol name="add_circle" className="text-xl" />
                                    <span className="sr-only">Add New Badge</span>
                                </Button>
                            </CardTitle>
                            <CardDescription>Badges that can be assigned to members of the {team.name} team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                {collection.badges.map(badge => (
                                    <EditableBadge
                                        key={badge.name}
                                        badge={badge}
                                        onUpdate={(newValues) => handleUpdateBadge(collection.name, badge.name, newValues)}
                                        onDelete={() => setBadgeToDelete({ badge, collectionName: collection.name })}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <AlertDialog open={!!badgeToDelete} onOpenChange={(isOpen) => !isOpen && setBadgeToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will permanently delete the "{badgeToDelete?.badge.name}" badge and unassign it from all team members.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBadge} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
