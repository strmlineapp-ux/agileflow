
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type EventTemplate, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';

function EventTemplateForm({ 
  team, 
  template,
  onSave,
  onClose,
}: {
  team: Team;
  template: Omit<EventTemplate, 'id'> | EventTemplate | null;
  onSave: (templateData: Omit<EventTemplate, 'id'>) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(template?.name || '');
  const [icon, setIcon] = useState(template?.icon || 'label');
  const [requestedRoles, setRequestedRoles] = useState<string[]>(template?.requestedRoles || []);
  
  const [isAddRolePopoverOpen, setIsAddRolePopoverOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  
  const availableBadges = (team.allBadges || []).filter(badge => !requestedRoles.includes(badge.name) && badge.name.toLowerCase().includes(roleSearch.toLowerCase()));

  const filteredIcons = googleSymbolNames.filter(iconName =>
    iconName.toLowerCase().includes(iconSearch.toLowerCase())
  );

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
      toast({ variant: 'destructive', title: 'Error', description: 'Tag name cannot be empty.' });
      return;
    }
    onSave({ name, icon, requestedRoles });
    onClose();
  };
  
  return (
    <>
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveClick}>
            <GoogleSymbol name="check" className="text-xl" />
            <span className="sr-only">Save Template</span>
        </Button>
      </div>
      <DialogHeader>
        <DialogTitle>{template ? 'Edit Event Template' : 'New Event Template'}</DialogTitle>
        <DialogDescription>
          Create a reusable template of requested roles for common event types.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
            <div className="flex items-center gap-2 border rounded-md px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <GoogleSymbol name={icon} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                        <div className="p-2 border-b">
                            <Input
                                placeholder="Search icons..."
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-64">
                            <div className="grid grid-cols-6 gap-1 p-2">
                                {filteredIcons.slice(0, 300).map((iconName) => (
                                    <Button
                                        key={iconName}
                                        variant={icon === iconName ? "default" : "ghost"}
                                        size="icon"
                                        onClick={() => {
                                            setIcon(iconName);
                                            setIsIconPopoverOpen(false);
                                        }}
                                        className="text-2xl"
                                    >
                                        <GoogleSymbol name={iconName} />
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
                <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Template Tag Name"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-9"
                />
            </div>
        </div>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Requested Badges</p>
            <div className="flex flex-wrap gap-2 items-center min-h-[40px] p-2 border rounded-md bg-muted/50">
              {requestedRoles.map(role => (
                <Badge key={role} variant="secondary" className="group text-base py-1 pl-3 pr-1 rounded-full">
                    <span className="font-medium">{role}</span>
                    <button 
                        type="button" 
                        className="ml-1 h-4 w-4 hover:bg-destructive/20 rounded-full inline-flex items-center justify-center" 
                        onClick={() => handleRemoveRole(role)}
                    >
                        <GoogleSymbol name="cancel" className="text-sm" />
                        <span className="sr-only">Remove {role}</span>
                    </button>
                </Badge>
              ))}
              <Popover open={isAddRolePopoverOpen} onOpenChange={setIsAddRolePopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <GoogleSymbol name="add" className="text-lg" />
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
  const { updateTeam, updateAppTab } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EventTemplate | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const templates = team.eventTemplates || [];
  
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== tab.name) {
      updateAppTab(tab.id, { name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const openAddDialog = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (template: EventTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (template: EventTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSaveTemplate = (templateData: Omit<EventTemplate, 'id'>) => {
    let updatedTemplates;
    if (editingTemplate) { // Editing existing
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? { ...t, ...templateData } : t
      );
      toast({ title: 'Template Updated', description: `"${templateData.name}" has been saved.` });
    } else { // Adding new
      const newTemplate: EventTemplate = {
        ...templateData,
        id: crypto.randomUUID(),
      };
      updatedTemplates = [...templates, newTemplate];
      toast({ title: 'Template Created', description: `"${templateData.name}" has been added.` });
    }
    updateTeam(team.id, { eventTemplates: updatedTemplates });
  };

  const handleDeleteTemplate = () => {
    if (!templateToDelete) return;
    const updatedTemplates = templates.filter(t => t.id !== templateToDelete.id);
    updateTeam(team.id, { eventTemplates: updatedTemplates });
    toast({ title: 'Template Deleted', description: `"${templateToDelete.name}" has been deleted.` });
    setTemplateToDelete(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        {isEditingTitle ? (
            <Input
                ref={titleInputRef}
                defaultValue={tab.name}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                className="h-auto p-0 font-headline text-2xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        ) : (
            <h2 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>
                {tab.name}
            </h2>
        )}
      </div>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                      Event Templates
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
                        <GoogleSymbol name="add_circle" className="text-xl" />
                        <span className="sr-only">New Template</span>
                      </Button>
                  </CardTitle>
                  <CardDescription>
                    Create reusable templates for common events, pre-filling requested roles to speed up event creation.
                  </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length > 0 ? (
              templates.map(template => (
                <Card 
                  key={template.id} 
                  className="flex flex-col cursor-pointer hover:border-primary/50"
                  onClick={() => openEditDialog(template)}
                >
                    <CardHeader>
                        <div className="flex items-start justify-between">
                             <CardTitle>
                                <Badge className="text-base py-1 px-3 gap-2">
                                    <GoogleSymbol name={template.icon} />
                                    {template.name}
                                </Badge>
                            </CardTitle>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="-mr-4 -mt-2 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(template);
                              }}
                            >
                                <GoogleSymbol name="delete" />
                                <span className="sr-only">Delete {template.name}</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Requested Badges</p>
                        <div className="flex flex-wrap gap-1 min-h-[24px]">
                          {template.requestedRoles.length > 0 ? (
                            template.requestedRoles.map(role => <Badge key={role} variant="secondary" className="rounded-full">{role}</Badge>)
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No badges requested.</p>
                          )}
                        </div>
                    </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground min-h-[150px]">
                <p>No templates yet. Click the '+' button to add one.</p>
              </div>
            )}
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <EventTemplateForm 
            team={team}
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!templateToDelete} onOpenChange={(isOpen) => !isOpen && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{templateToDelete?.name}" template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
