

'use client';

import { useState } from 'react';
import { type Priority } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type PriorityItemFormProps = {
  isOpen: boolean;
  onClose: () => void;
  priority: Omit<Priority, 'id'> | null;
  onSave: (data: Omit<Priority, 'id'>) => void;
};

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

export function PriorityItemForm({ isOpen, onClose, priority, onSave }: PriorityItemFormProps) {
  const [label, setLabel] = useState(priority?.label || '');
  const [description, setDescription] = useState(priority?.description || '');
  const [color, setColor] = useState(priority?.color || '#888888');
  const [shape, setShape] = useState<'rounded-md' | 'rounded-full'>(priority?.shape || 'rounded-full');
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
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
            <Input id="label" value={label} onChange={e => setLabel(e.target.value)} placeholder="Priority Label" />
          </div>
          <div className="space-y-2">
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (for tooltip)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                  <PopoverTrigger asChild>
                      <button className="h-9 w-full rounded-md border" style={{ backgroundColor: color }} aria-label="Open color picker" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-8 gap-1">
                          {predefinedColors.map(c => (
                          <button
                              key={c}
                              className="h-6 w-6 rounded-full border"
                              style={{ backgroundColor: c }}
                              onClick={() => {
                                  setColor(c);
                                  setIsColorPopoverOpen(false);
                              }}
                              aria-label={`Set color to ${c}`}
                          />
                          ))}
                          <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                          <GoogleSymbol name="colorize" className="text-muted-foreground" />
                          <Input
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                              aria-label="Custom color picker"
                          />
                          </div>
                      </div>
                  </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
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
