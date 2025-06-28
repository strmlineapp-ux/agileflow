
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Team, type EventTemplate } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';

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
  const [requestedRoles, setRequestedRoles] = useState<string[]>(template?.requestedRoles || []);
  const [isAddRolePopoverOpen, setIsAddRolePopoverOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  const availableRoles = team.roles.filter(role => !requestedRoles.includes(role) && role.toLowerCase().includes(roleSearch.toLowerCase()));

  const handleAddRole = (role: string) => {
    setRequestedRoles(prev => [...prev, role]);
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
    onSave({ name, requestedRoles });
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
            <Input 
                id="template-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Template Tag Name" 
            />
        </div>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Requested Roles</p>
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
                          placeholder="Search roles..."
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-40">
                        {availableRoles.length > 0 ? availableRoles.map(role => (
                            <div 
                                key={role} 
                                className="p-2 hover:bg-accent cursor-pointer text-sm"
                                onClick={() => handleAddRole(role)}
                            >
                                {role}
                            </div>
                        )) : (
                            <p className="p-4 text-center text-sm text-muted-foreground">No matching roles.</p>
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


export function EventTemplateManagement({ team }: { team: Team }) {
  const { updateTeam } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EventTemplate | null>(null);
  
  const templates = team.eventTemplates || [];

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
        id: `template-${Date.now()}` // simple unique id
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card 
              key={template.id} 
              className="flex flex-col cursor-pointer hover:border-primary/50"
              onClick={() => openEditDialog(template)}
            >
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Badge className="text-base">{template.name}</Badge>
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
                    <p className="text-sm font-medium text-muted-foreground mb-2">Requested Roles</p>
                    <div className="flex flex-wrap gap-1 min-h-[24px]">
                      {template.requestedRoles.length > 0 ? (
                        template.requestedRoles.map(role => <Badge key={role} variant="secondary" className="rounded-full">{role}</Badge>)
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No roles requested.</p>
                      )}
                    </div>
                </CardContent>
            </Card>
          ))}
          <button
            onClick={openAddDialog}
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[190px]"
            >
            <div className="flex flex-col items-center gap-2">
                <GoogleSymbol name="add_circle" className="text-4xl" />
                <span className="font-semibold">New Template</span>
            </div>
          </button>
      </div>
      
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
