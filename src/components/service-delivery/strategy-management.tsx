
'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type PriorityStrategy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityBadge } from '../calendar/priority-badge';
import { PriorityStrategyForm } from './priority-strategy-form';
import { Badge } from '../ui/badge';
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
        <Button onClick={openAddDialog}>
          <GoogleSymbol name="add_circle" className="mr-2" />
          New Strategy
        </Button>
      </div>

      <div className="space-y-6">
        {priorityStrategies.map(strategy => (
          <Card key={strategy.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{strategy.name}</CardTitle>
                        <CardDescription>{strategy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(strategy)}>
                            <GoogleSymbol name="edit" />
                            <span className="sr-only">Edit Strategy</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(strategy)}>
                            <GoogleSymbol name="delete" />
                            <span className="sr-only">Delete Strategy</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Priorities</h4>
                        <div className="flex flex-wrap gap-1">
                            {strategy.priorities.map(p => <PriorityBadge key={p.id} priorityId={p.id} />)}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-2">Applied To</h4>
                        <div className="flex flex-wrap gap-2">
                            {strategy.applications.length > 0 ? (
                                strategy.applications.map(app => <Badge key={app} variant="secondary" className="capitalize">{app}</Badge>)
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Not applied to any area.</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
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
