

'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { type PriorityStrategy } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityStrategyForm } from './priority-strategy-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PriorityBadge } from '../calendar/priority-badge';

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

  const renderPriorityPreview = (strategy: PriorityStrategy) => {
    switch (strategy.type) {
      case 'tier':
        return strategy.priorities.slice(0, 5).map(p => <PriorityBadge key={p.id} priorityId={p.id} />);
      case 'symbol':
        return [3, 2, 1].map(num => (
          <PriorityBadge key={num} priorityId={`${strategy.id}:${num}`} />
        ));
      case 'scale':
         return strategy.intervals.slice(0, 3).map(interval => {
            const midPoint = Math.floor((interval.from + interval.to) / 2);
            return <PriorityBadge key={interval.label} priorityId={`${strategy.id}:${midPoint}`} />;
         });
      default:
        return null;
    }
  };

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

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorityStrategies.map(strategy => (
            <Card key={strategy.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle>{strategy.name}</CardTitle>
                        <div className="flex -mr-4 -mt-2">
                             <Button variant="ghost" size="icon" onClick={() => openEditDialog(strategy)}>
                                <GoogleSymbol name="edit" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(strategy)}>
                                <GoogleSymbol name="delete" />
                            </Button>
                        </div>
                    </div>
                    <CardDescription>{strategy.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <div className="flex flex-wrap gap-2">
                        {strategy.applications.length > 0 ? 
                            strategy.applications.map(app => <Badge key={app} variant="secondary">{app}</Badge>) :
                            <Badge variant="outline">Not Applied</Badge>
                        }
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex flex-wrap gap-2 items-center">
                        {renderPriorityPreview(strategy)}
                    </div>
                </CardFooter>
            </Card>
          ))}
          <button
            onClick={openAddDialog}
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[220px]"
            >
             <div className="flex flex-col items-center gap-2">
                <GoogleSymbol name="add_circle" className="text-4xl" />
                <span className="font-semibold">New Strategy</span>
            </div>
          </button>
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
