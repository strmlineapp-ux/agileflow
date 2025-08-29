

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type EventTemplate, type AppTab, type Badge } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge as UiBadge } from '../ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditor } from '../common/inline-editor';
import { IconColorPicker } from '../common/icon-color-picker';
import { getContrastColor } from '@/lib/utils';

function EventPresetForm({ 
  team, 
  preset,
  onSave,
  onClose,
}: {
  team: Team;
  preset: Omit<EventTemplate, 'id'> | EventTemplate | null;
  onSave: (templateData: Omit<EventTemplate, 'id'>) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { allBadges, allBadgeCollections } = useUser();
  const [name, setName] = useState(preset?.name || '');
  const [icon, setIcon] = useState(preset?.icon || 'label');
  const [color, setColor] = useState(preset?.color || 'hsl(220, 13%, 47%)');
  const [requestedRoles, setRequestedRoles] = useState<string[]>(preset?.requestedRoles || []);
  
  const [isAddRolePopoverOpen, setIsAddRolePopoverOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  
  const teamBadges = useMemo(() => {
    const activeBadgeIds = new Set(
      team.activeBadgeCollections?.flatMap(collectionId => {
        const collection = allBadgeCollections.find(c => c.id === collectionId);
        return collection ? collection.badgeIds : [];
      }) || []
    );
    return allBadges.filter(badge => activeBadgeIds.has(badge.id));
  }, [team.activeBadgeCollections, allBadges, allBadgeCollections]);
  
  const availableBadges = teamBadges.filter(badge => !requestedRoles.includes(badge.name) && badge.name.toLowerCase().includes(roleSearch.toLowerCase()));

  const handleAddRole = (roleName: string) => {
    setRequestedRoles(prev => [...prev, roleName]);
    setIsAddRolePopoverOpen(false);
    setRoleSearch('');
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setRequestedRoles(prev => prev.filter(r => r !== roleToRemove));
  };

  const handleSaveClick = () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Preset name cannot be empty.' });
      return;
    }
    onSave({ name, icon, color, requestedRoles });
    onClose();
  };
  
  return (
    <>
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" className="p-0" onClick={handleSaveClick}>
            <GoogleSymbol name="check" />
            <span className="sr-only">Save Preset</span>
        </Button>
      </div>
      <DialogHeader>
        <DialogTitle className="text-muted-foreground">{preset ? 'Edit Event Preset' : 'New Event Preset'}</DialogTitle>
        <DialogDescription>
          Create a reusable preset of requested roles for common event types.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
            <div className="flex items-center gap-2 border rounded-md px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <IconColorPicker 
                    icon={icon} 
                    color={color}
                    onUpdateIcon={setIcon}
                    onUpdateColor={setColor}
                />
                <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Preset Tag Name"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-9"
                />
            </div>
        </div>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Requested Badges</p>
            <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-2 border rounded-md bg-muted/50">
              {requestedRoles.map(role => (
                <UiBadge key={role} variant="outline" className="group text-base py-1 pl-3 pr-1 rounded-full">
                    <span className="font-medium">{role}</span>
                    <button 
                        type="button" 
                        className="ml-1 h-4 w-4 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center" 
                        onClick={() => handleRemoveRole(role)}
                    >
                        <GoogleSymbol name="cancel" className="text-sm" />
                        <span className="sr-only">Remove {role}</span>
                    </button>
                </UiBadge>
              ))}
              <Popover open={isAddRolePopoverOpen} onOpenChange={setIsAddRolePopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <GoogleSymbol name="add" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                    <div className="p-2 border-b">
                        <Input
                          placeholder="Search badges..."
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-40">
                        {availableBadges.length > 0 ? availableBadges.map(badge => (
                            <div 
                                key={badge.name} 
                                className="p-2 hover:bg-accent cursor-pointer text-sm"
                                onClick={() => handleAddRole(badge.name)}
                            >
                                {badge.name}
                            </div>
                        )) : (
                            <p className="p-4 text-center text-sm text-muted-foreground">No matching badges.</p>
                        )}
                    </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
        </div>
      </div>
    </>
  );
}


export function EventTemplateManagement({ team, tab }: { team: Team, tab: AppTab }) {
  if (!team) {
    return null;
  }
  
  const { updateTeam, updateAppTab, viewAsUser } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<EventTemplate | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<EventTemplate | null>(null);
  
  const canManage = viewAsUser.isAdmin || team.teamAdmins?.includes(viewAsUser.userId);
  const presets = team.eventTemplates || [];

  const handleSavePresetName = (presetId: string, newName: string) => {
    const presetToEdit = presets.find(t => t.id === presetId);
    if (!presetToEdit) return;
    
    if (newName && newName !== presetToEdit.name) {
        updateTeam(team.id, { 
            eventTemplates: presets.map(t => t.id === presetId ? { ...t, name: newName } : t) 
        });
        toast({ title: "Preset name updated" });
    }
  };

  const openAddDialog = () => {
    setEditingPreset(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (preset: EventTemplate) => {
    setEditingPreset(preset);
    setIsFormOpen(true);
  };
  
  const handleSavePreset = (presetData: Omit<EventTemplate, 'id'>) => {
    let updatedPresets;
    if (editingPreset) { // Editing existing
      updatedPresets = presets.map(t => 
        t.id === editingPreset.id ? { ...t, ...presetData } : t
      );
      toast({ title: 'Preset Updated', description: `"${presetData.name}" has been saved.` });
    } else { // Adding new
      const newPreset: EventTemplate = {
        ...presetData,
        id: crypto.randomUUID(),
      };
      updatedPresets = [...presets, newPreset];
      toast({ title: 'Preset Created', description: `"${presetData.name}" has been added.` });
    }
    updateTeam(team.id, { eventTemplates: updatedPresets });
  };

  const handleDeletePreset = () => {
    if (!deletingPreset) return;
    const updatedPresets = presets.filter(t => t.id !== deletingPreset.id);
    updateTeam(team.id, { eventTemplates: updatedPresets });
    toast({ title: 'Preset Deleted', description: `"${deletingPreset.name}" has been deleted.` });
    setDeletingPreset(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <InlineEditor
            value={tab.name}
            onSave={(newValue) => updateAppTab(tab.id, { name: newValue })}
            className="h-auto p-0 font-headline text-2xl font-thin tracking-tight border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={!canManage}
        />
      </div>
      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                      Event Presets
                       <Button variant="circle" size="icon" onClick={openAddDialog} disabled={!canManage}>
                        <GoogleSymbol name="add_circle" />
                        <span className="sr-only">New Preset</span>
                      </Button>
                  </CardTitle>
                  <CardDescription>
                    Create reusable presets for common events, pre-filling requested roles to speed up event creation.
                  </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.length > 0 ? (
              presets.map(preset => (
                <Card key={preset.id} className="flex flex-col bg-transparent">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                             <CardTitle className="flex-1 min-w-0">
                                <UiBadge className="text-base py-1 px-3 gap-2" style={{ backgroundColor: preset.color, color: getContrastColor(preset.color || 'hsl(220, 13%, 47%)')}}>
                                    <GoogleSymbol name={preset.icon} />
                                    <InlineEditor
                                        value={preset.name}
                                        onSave={(newValue) => handleSavePresetName(preset.id, newValue)}
                                        className="text-primary-foreground"
                                        disabled={!canManage}
                                    />
                                </UiBadge>
                            </CardTitle>
                            <div className="flex items-center -mr-4 -mt-2">
                                <Button
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-muted-foreground p-0"
                                  onClick={() => openEditDialog(preset)}
                                  disabled={!canManage}
                                >
                                    <GoogleSymbol name="edit" />
                                    <span className="sr-only">Edit roles for {preset.name}</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    canManage && setDeletingPreset(preset);
                                  }}
                                  disabled={!canManage}
                                >
                                    <GoogleSymbol name="delete" />
                                    <span className="sr-only">Delete {preset.name}</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Requested Badges</p>
                        <div className="flex flex-wrap gap-1 min-h-[24px]">
                          {preset.requestedRoles.length > 0 ? (
                            preset.requestedRoles.map(role => <UiBadge key={role} variant="outline" className="rounded-full">{role}</UiBadge>)
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No badges requested.</p>
                          )}
                        </div>
                    </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground min-h-[150px]">
                <p>No presets yet. Click the '+' button to add one.</p>
              </div>
            )}
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <EventPresetForm 
            team={team}
            preset={editingPreset}
            onSave={handleSavePreset}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!deletingPreset} onOpenChange={(isOpen) => !isOpen && setDeletingPreset(null)}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="hover:text-destructive p-0 hover:bg-transparent" onClick={handleDeletePreset}>
                    <GoogleSymbol name="delete" />
                    <span className="sr-only">Delete Preset</span>
                </Button>
            </div>
            <DialogHeader>
                <DialogTitle className="text-muted-foreground">Delete "{deletingPreset?.name}"?</DialogTitle>
                <DialogDescription>
                    This will permanently delete the preset. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

    