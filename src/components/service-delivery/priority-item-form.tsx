
'use client';

import { useState } from 'react';
import { type Priority } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';

type PriorityItemFormProps = {
  isOpen: boolean;
  onClose: () => void;
  priority: Omit<Priority, 'id'> | null;
  onSave: (data: Omit<Priority, 'id'>) => void;
};

export function PriorityItemForm({ isOpen, onClose, priority, onSave }: PriorityItemFormProps) {
  const [label, setLabel] = useState(priority?.label || '');
  const [description, setDescription] = useState(priority?.description || '');
  const [color, setColor] = useState(priority?.color || '#888888');
  const [shape, setShape] = useState<'rounded-md' | 'rounded-full'>(priority?.shape || 'rounded-full');
  const { toast } = useToast();

  const handleSave = () => {
    if (!label.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Priority label cannot be empty.' });
      return;
    }
    onSave({ label, description, color, shape });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
         <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
              <GoogleSymbol name="check" className="text-xl" />
              <span className="sr-only">Save Priority</span>
            </Button>
        </div>
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
              <Label>Color</Label>
              <div className="relative h-9 w-full">
                  <div
                      className="absolute inset-0 h-full w-full rounded-md border"
                      style={{ backgroundColor: color }}
                  />
                  <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                      aria-label="Priority color"
                  />
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
