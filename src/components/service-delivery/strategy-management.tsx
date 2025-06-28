
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type Priority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityBadge } from '../calendar/priority-badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';

export function StrategyManagement() {
  const { priorities, addPriority, updatePriority, deletePriority } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);

  const openAddDialog = () => {
    setEditingPriority(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (priority: Priority) => {
    setEditingPriority(priority);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPriority(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manage Priorities</CardTitle>
              <CardDescription>
                Define the priorities used for tasks and events across the application.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={openAddDialog}>
              <GoogleSymbol name="add_circle" className="text-2xl" />
              <span className="sr-only">Add New Priority</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border -mx-6">
            {priorities.map(p => (
              <div key={p.id} className="p-4 px-6 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <PriorityBadge priorityId={p.id} />
                  <div>
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                    <GoogleSymbol name="edit" />
                  </Button>
                  {priorities.length > 1 && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deletePriority(p.id)}>
                        <GoogleSymbol name="delete" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {isFormOpen && (
        <PriorityFormDialog
          isOpen={isFormOpen}
          onClose={closeForm}
          priority={editingPriority}
          addPriority={addPriority}
          updatePriority={updatePriority}
        />
      )}
    </>
  );
}


type PriorityFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  priority: Priority | null;
  addPriority: (data: Omit<Priority, 'id'>) => Promise<void>;
  updatePriority: (id: string, data: Partial<Priority>) => Promise<void>;
};

function PriorityFormDialog({ isOpen, onClose, priority, addPriority, updatePriority }: PriorityFormDialogProps) {
  const [label, setLabel] = useState(priority?.label || '');
  const [description, setDescription] = useState(priority?.description || '');
  const [color, setColor] = useState(priority?.color || '#ff0000');
  const [shape, setShape] = useState<'rounded-md' | 'rounded-full'>(priority?.shape || 'rounded-md');
  const { toast } = useToast();

  const handleSave = () => {
    if (!label.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Priority label cannot be empty.' });
      return;
    }

    const priorityData = { label, description, color, shape };

    if (priority) {
      updatePriority(priority.id, priorityData);
      toast({ title: 'Success', description: 'Priority updated.' });
    } else {
      addPriority(priorityData);
      toast({ title: 'Success', description: 'Priority created.' });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{priority ? 'Edit Priority' : 'Add New Priority'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input id="label" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (for tooltip)</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" type="color" value={color} onChange={e => setColor(e.target.value)} className="p-1" />
            </div>
            <div className="space-y-2">
              <Label>Shape</Label>
              <RadioGroup value={shape} onValueChange={(v) => setShape(v as any)} className="flex items-center gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rounded-md" id="shape-md" />
                  <Label htmlFor="shape-md">Square</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rounded-full" id="shape-full" />
                  <Label htmlFor="shape-full">Round</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
