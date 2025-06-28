
'use client';

import { useState, useEffect } from 'react';
import { type Priority, type PriorityStrategy, type PriorityStrategyApplication } from '@/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityBadge } from '../calendar/priority-badge';
import { PriorityItemForm } from './priority-item-form';
import { Separator } from '../ui/separator';

type PriorityStrategyFormProps = {
  isOpen: boolean;
  onClose: () => void;
  strategy: PriorityStrategy | null;
};

const APPLICATIONS: PriorityStrategyApplication[] = ['events', 'tasks'];

export function PriorityStrategyForm({ isOpen, onClose, strategy }: PriorityStrategyFormProps) {
  const { priorityStrategies, addPriorityStrategy, updatePriorityStrategy } = useUser();
  const [strategyState, setStrategyState] = useState<Omit<PriorityStrategy, 'id'>>({
    name: '',
    description: '',
    applications: [],
    priorities: [],
  });
  const [isPriorityFormOpen, setIsPriorityFormOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<{ priority: Omit<Priority, 'id'>, index: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (strategy) {
      setStrategyState(strategy);
    }
  }, [strategy]);

  const handleSave = () => {
    if (!strategyState.name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Strategy name is required.' });
      return;
    }
    
    // Ensure no other strategy is applied to the same application
    for (const app of strategyState.applications) {
        const conflictingStrategy = priorityStrategies.find(s => s.id !== strategy?.id && s.applications.includes(app));
        if (conflictingStrategy) {
            toast({
                variant: 'destructive',
                title: 'Application Conflict',
                description: `The "${app}" application is already handled by the "${conflictingStrategy.name}" strategy.`,
            });
            return;
        }
    }


    if (strategy) {
      updatePriorityStrategy(strategy.id, strategyState);
      toast({ title: 'Success', description: 'Strategy updated.' });
    } else {
      addPriorityStrategy(strategyState);
      toast({ title: 'Success', description: 'Strategy created.' });
    }
    onClose();
  };

  const handleApplicationChange = (app: PriorityStrategyApplication, checked: boolean) => {
    setStrategyState(prev => {
      const newApplications = new Set(prev.applications);
      if (checked) newApplications.add(app);
      else newApplications.delete(app);
      return { ...prev, applications: Array.from(newApplications) };
    });
  };
  
  const handleOpenPriorityForm = (priorityData: Omit<Priority, 'id'> | null, index: number = -1) => {
      setEditingPriority(priorityData ? { priority: priorityData, index } : null);
      setIsPriorityFormOpen(true);
  }

  const handleSavePriority = (priorityData: Omit<Priority, 'id'>) => {
    setStrategyState(prev => {
        const newPriorities = [...prev.priorities];
        const strategyId = strategy?.id || strategyState.name.toLowerCase().replace(/\s+/g, '-');
        const newPriority: Priority = {
            ...priorityData,
            id: `${strategyId}:${priorityData.label.toLowerCase().replace(/\s+/g, '-')}`,
        };

        if (editingPriority) { // Editing existing
            newPriorities[editingPriority.index] = newPriority;
        } else { // Adding new
            newPriorities.push(newPriority);
        }
        return { ...prev, priorities: newPriorities };
    });
  };
  
  const handleDeletePriority = (index: number) => {
      setStrategyState(prev => ({
          ...prev,
          priorities: prev.priorities.filter((_, i) => i !== index),
      }));
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
           <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
              <GoogleSymbol name="check" className="text-xl" />
              <span className="sr-only">Save Strategy</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>{strategy ? 'Edit Priority Strategy' : 'New Priority Strategy'}</DialogTitle>
            <DialogDescription>
              Define a set of priorities and where they should be applied in the app.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">Strategy Name</Label>
              <Input 
                id="strategy-name" 
                value={strategyState.name}
                onChange={e => setStrategyState(s => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy-desc">Description</Label>
              <Textarea 
                id="strategy-desc" 
                value={strategyState.description}
                onChange={e => setStrategyState(s => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Apply To</Label>
              <div className="flex items-center gap-4">
                {APPLICATIONS.map(app => (
                  <div key={app} className="flex items-center space-x-2">
                    <Checkbox
                      id={`app-${app}`}
                      checked={strategyState.applications.includes(app)}
                      onCheckedChange={(checked) => handleApplicationChange(app, !!checked)}
                    />
                    <Label htmlFor={`app-${app}`} className="capitalize font-normal">
                      {app}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Priorities in this Strategy</Label>
                    <Button variant="outline" size="sm" onClick={() => handleOpenPriorityForm(null)}>
                        <GoogleSymbol name="add" className="mr-1" />
                        Add Priority
                    </Button>
                </div>
                <div className="divide-y divide-border rounded-md border">
                    {strategyState.priorities.map((p, index) => (
                    <div key={index} className="p-2 px-3 flex items-center justify-between hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                        <PriorityBadge priorityId={p.id} />
                        <div>
                            <p className="font-semibold">{p.label}</p>
                            <p className="text-sm text-muted-foreground">{p.description}</p>
                        </div>
                        </div>
                        <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPriorityForm(p, index)}>
                            <GoogleSymbol name="edit" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePriority(index)}>
                            <GoogleSymbol name="delete" />
                        </Button>
                        </div>
                    </div>
                    ))}
                    {strategyState.priorities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center p-4">No priorities defined for this strategy.</p>
                    )}
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {isPriorityFormOpen && (
          <PriorityItemForm
            isOpen={isPriorityFormOpen}
            onClose={() => setIsPriorityFormOpen(false)}
            priority={editingPriority?.priority || null}
            onSave={handleSavePriority}
          />
      )}
    </>
  );
}
