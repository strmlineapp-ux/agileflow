
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { type PriorityStrategy, type AppTab } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { PriorityStrategyForm } from './priority-strategy-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as UIAlertDialogTitle } from '../ui/alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PriorityBadge } from '../calendar/priority-badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

export function StrategyManagement({ tab }: { tab: AppTab }) {
  const { appSettings, updateAppSettings, priorityStrategies, deletePriorityStrategy } = useUser();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<PriorityStrategy | null>(null);
  const [strategyToDelete, setStrategyToDelete] = useState<PriorityStrategy | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const title = appSettings.strategyLabel || tab.name;

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== title) {
      updateAppSettings({ strategyLabel: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

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
        return strategy.priorities?.slice(0, 5).map(p => <PriorityBadge key={p.id} priorityId={p.id} />);
      case 'symbol':
        return [3, 2, 1].map(num => (
          <PriorityBadge key={num} priorityId={`${strategy.id}:${num}`} />
        ));
      case 'scale':
         return strategy.intervals?.slice(0, 3).map((interval, index) => {
            const midPoint = Math.floor((interval.from + interval.to) / 2);
            return <PriorityBadge key={index} priorityId={`${strategy.id}:${midPoint}`} />;
         });
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
          {isEditingTitle ? (
            <Input ref={titleInputRef} defaultValue={title} onBlur={handleSaveTitle} onKeyDown={handleTitleKeyDown} className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
          ) : (
            <h3 className="font-headline text-2xl font-thin tracking-tight cursor-text" onClick={() => setIsEditingTitle(true)}>{title}</h3>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={openAddDialog}>
              <GoogleSymbol name="add_circle" className="text-2xl" />
              <span className="sr-only">New Strategy</span>
          </Button>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorityStrategies.map(strategy => (
            <Card 
              key={strategy.id} 
              className={cn(
                "flex flex-col transition-all",
                strategy.applications.length > 0 && "border-primary/50 shadow-lg"
              )}
            >
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {strategy.name}
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(strategy)}>
                                <GoogleSymbol name="edit" className="text-lg" />
                                <span className="sr-only">Edit strategy</span>
                            </Button>
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive -mr-4 -mt-2" onClick={() => openDeleteDialog(strategy)}>
                            <GoogleSymbol name="delete" />
                            <span className="sr-only">Delete strategy</span>
                        </Button>
                    </div>
                    <CardDescription>{strategy.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <div className="flex flex-wrap gap-2 min-h-[24px]">
                        {strategy.applications.map(app => <Badge key={app} variant="outline">{app}</Badge>)}
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex flex-wrap gap-2 items-center">
                        {renderPriorityPreview(strategy)}
                    </div>
                </CardFooter>
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
            <UIAlertDialogTitle>Are you absolutely sure?</UIAlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{strategyToDelete?.name}" strategy and all of its priorities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
