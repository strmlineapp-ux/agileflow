
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type PriorityStrategy } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityStrategyForm } from './priority-strategy-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

export function StrategyManagement() {
  const { priorityStrategies, deletePriorityStrategy } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<PriorityStrategy | null>(null);
  const [strategyToDelete, setStrategyToDelete] = useState<PriorityStrategy | null>(null);

  const openAddDialog = () => {
    setEditingStrategy(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (strategy: PriorityStrategy) => {
    setEditingStrategy(strategy);
    setIsFormOpen(true);
  };
  
  const openDeleteDialog = (strategy: PriorityStrategy) => {
      setStrategyToDelete(strategy);
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStrategy(null);
  };
  
  const handleDelete = () => {
      if (!strategyToDelete) return;
      deletePriorityStrategy(strategyToDelete.id);
      toast({ title: 'Success', description: `Strategy "${strategyToDelete.name}" has been deleted.` });
      setStrategyToDelete(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-semibold tracking-tight">Priority Strategies</h2>
            <p className="text-muted-foreground">
                Define sets of priorities and apply them to different parts of the application.
            </p>
        </div>
      </div>

       <div className="flex flex-wrap gap-3">
          {priorityStrategies.map(strategy => (
            <Button key={strategy.id} variant="outline" className="h-auto font-medium" onClick={() => openEditDialog(strategy)}>
                {strategy.name}
            </Button>
          ))}
           <Button variant="outline" className="h-auto font-medium border-dashed" onClick={openAddDialog}>
                <GoogleSymbol name="add" className="mr-2" />
                New Strategy
            </Button>
      </div>

      {isFormOpen && (
        <PriorityStrategyForm
          isOpen={isFormOpen}
          onClose={closeForm}
          strategy={editingStrategy}
        />
      )}
      
      <AlertDialog open={!!strategyToDelete} onOpenChange={() => setStrategyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{strategyToDelete?.name}" strategy and all of its priorities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
