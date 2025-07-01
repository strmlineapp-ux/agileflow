

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { type Priority, type PriorityStrategy, type PriorityStrategyApplication, type PriorityStrategyType } from '@/types';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { cn } from '@/lib/utils';

type PriorityStrategyFormProps = {
  isOpen: boolean;
  onClose: () => void;
  strategy: PriorityStrategy | null;
};

const APPLICATIONS: PriorityStrategyApplication[] = ['events', 'tasks'];
const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

export function PriorityStrategyForm({ isOpen, onClose, strategy }: PriorityStrategyFormProps) {
  const { priorityStrategies, addPriorityStrategy, updatePriorityStrategy } = useUser();
  const [strategyState, setStrategyState] = useState<Omit<PriorityStrategy, 'id'>>({
    name: '',
    description: '',
    applications: [],
    type: 'tier',
    priorities: [],
  });
  const [isPriorityFormOpen, setIsPriorityFormOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<{ priority: Omit<Priority, 'id'>, index: number } | null>(null);
  
  // States for icon picker
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isSymbolColorPopoverOpen, setIsSymbolColorPopoverOpen] = useState(false);
  const [openIntervalColorPopoverIndex, setOpenIntervalColorPopoverIndex] = useState<number | null>(null);

  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  
  useEffect(() => {
    if (!isIconPopoverOpen) {
        setIsSearchingIcons(false);
        setIconSearch('');
    }
  }, [isIconPopoverOpen]);
  
  useEffect(() => {
    if (isSearchingIcons) iconSearchInputRef.current?.focus();
  }, [isSearchingIcons]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);


  useEffect(() => {
    if (strategy) {
      setStrategyState(strategy);
    } else {
        // Reset to default for new strategy
        setStrategyState({
            name: '',
            description: '',
            applications: [],
            type: 'tier',
            priorities: [],
        });
    }
  }, [strategy, isOpen]);

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
    if (strategyState.type !== 'tier') return;
    setStrategyState(prev => {
        if (prev.type !== 'tier') return prev;
        const newPriorities = [...prev.priorities];
        const strategyId = strategy?.id || strategyState.name.toLowerCase().replace(/\s+/g, '-');
        const newPriority: Priority = {
            ...priorityData,
            id: `${strategyId}:${priorityData.label.toLowerCase().replace(/\s+/g, '-')}`,
        };

        if (editingPriority && editingPriority.index > -1) { // Editing existing
            newPriorities[editingPriority.index] = newPriority;
        } else { // Adding new
            newPriorities.push(newPriority);
        }
        return { ...prev, priorities: newPriorities };
    });
  };
  
  const handleDeletePriority = (index: number) => {
      if (strategyState.type !== 'tier') return;
      setStrategyState(prev => {
        if (prev.type !== 'tier') return prev;
        return {
          ...prev,
          priorities: prev.priorities.filter((_, i) => i !== index),
        }
      });
  }

  const handleStrategyTypeChange = (type: PriorityStrategyType) => {
    setStrategyState(prev => {
        const base = { ...prev, type };
        switch(type) {
            case 'tier':
                return { ...base, priorities: [] };
            case 'symbol':
                return { ...base, icon: 'star', max: 5, color: '#FFC107' };
            case 'scale':
                return { ...base, min: 0, max: 100, intervals: [] };
            default:
                return prev;
        }
    })
  }
  
  const handleAddInterval = () => {
    if (strategyState.type !== 'scale') return;
    setStrategyState(prev => {
        if (prev.type !== 'scale') return prev;
        const newInterval = { label: 'New Interval', from: 0, to: 10, color: '#CCCCCC' };
        return { ...prev, intervals: [...prev.intervals, newInterval] };
    });
  }

  const handleIntervalChange = (index: number, field: string, value: any) => {
     if (strategyState.type !== 'scale') return;
     setStrategyState(prev => {
        if (prev.type !== 'scale') return prev;
        const newIntervals = [...prev.intervals];
        newIntervals[index] = { ...newIntervals[index], [field]: value };
        return { ...prev, intervals: newIntervals };
     });
  }
  
  const handleDeleteInterval = (index: number) => {
      if (strategyState.type !== 'scale') return;
      setStrategyState(prev => {
          if (prev.type !== 'scale') return prev;
          return { ...prev, intervals: prev.intervals.filter((_, i) => i !== index) };
      });
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
              <Input 
                id="strategy-name" 
                value={strategyState.name}
                onChange={e => setStrategyState(s => ({ ...s, name: e.target.value }))}
                placeholder="Strategy Name"
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                id="strategy-desc" 
                value={strategyState.description}
                onChange={e => setStrategyState(s => ({ ...s, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Apply To</p>
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
                <p className="text-sm text-muted-foreground">Strategy Type</p>
                <RadioGroup value={strategyState.type} onValueChange={(v) => handleStrategyTypeChange(v as any)} className="flex items-center gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="tier" id="type-tier" /><Label htmlFor="type-tier">Tier</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="symbol" id="type-symbol" /><Label htmlFor="type-symbol">Symbol</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="scale" id="type-scale" /><Label htmlFor="type-scale">Scale</Label></div>
                </RadioGroup>
            </div>

            {strategyState.type === 'tier' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Priorities</p>
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
            )}
            
            {strategyState.type === 'symbol' && (
                <div className="space-y-4 rounded-md border p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                              <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start">
                                      <GoogleSymbol name={strategyState.icon} className="mr-2" />
                                      {strategyState.icon}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0">
                                  <div className="flex items-center gap-1 p-2 border-b">
                                      {!isSearchingIcons ? (
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}>
                                              <GoogleSymbol name="search" />
                                          </Button>
                                      ) : (
                                          <div className="flex items-center gap-1 w-full">
                                            <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                            <input
                                                ref={iconSearchInputRef}
                                                placeholder="Search icons..."
                                                value={iconSearch}
                                                onChange={(e) => setIconSearch(e.target.value)}
                                                onBlur={() => !iconSearch && setIsSearchingIcons(false)}
                                                className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                                            />
                                          </div>
                                      )}
                                  </div>
                                  <ScrollArea className="h-64">
                                      <div className="grid grid-cols-6 gap-1 p-2">
                                          {filteredIcons.slice(0, 300).map((iconName) => (
                                              <Button
                                                  key={iconName}
                                                  variant={strategyState.icon === iconName ? "default" : "ghost"}
                                                  size="icon"
                                                  onClick={() => {
                                                      setStrategyState(s => ({ ...s, type: 'symbol', icon: iconName }))
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
                        </div>
                         <div className="space-y-2">
                            <Input id="symbol-max" type="number" value={strategyState.max} onChange={e => setStrategyState(s => ({ ...s, type: 'symbol', max: Number(e.target.value) }))} min={1} placeholder="Max Value" />
                        </div>
                         <div className="space-y-2">
                            <Popover open={isSymbolColorPopoverOpen} onOpenChange={setIsSymbolColorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" style={{ backgroundColor: strategyState.color }} className="w-full justify-center h-10" />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-8 gap-1">
                                    {predefinedColors.map(c => (
                                        <button
                                            key={c}
                                            className="h-6 w-6 rounded-full border"
                                            style={{ backgroundColor: c }}
                                            onClick={() => {
                                                setStrategyState(s => ({ ...s, type: 'symbol', color: c }));
                                                setIsSymbolColorPopoverOpen(false);
                                            }}
                                            aria-label={`Set color to ${c}`}
                                        />
                                    ))}
                                    <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                        <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                        <Input
                                            type="color"
                                            value={strategyState.color}
                                            onChange={(e) => setStrategyState(s => ({ ...s, type: 'symbol', color: e.target.value }))}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                            aria-label="Custom color picker"
                                        />
                                    </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            )}

            {strategyState.type === 'scale' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                        <div className="space-y-2">
                            <Input id="scale-min" type="number" value={strategyState.min} onChange={e => setStrategyState(s => ({ ...s, type: 'scale', min: Number(e.target.value) }))} placeholder="Min Value" />
                        </div>
                        <div className="space-y-2">
                            <Input id="scale-max" type="number" value={strategyState.max} onChange={e => setStrategyState(s => ({ ...s, type: 'scale', max: Number(e.target.value) }))} placeholder="Max Value" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Intervals</p>
                            <Button variant="outline" size="sm" onClick={handleAddInterval}>
                                <GoogleSymbol name="add" className="mr-1" />
                                Add Interval
                            </Button>
                        </div>
                        <div className="space-y-2 rounded-md border p-2">
                           {strategyState.intervals.map((interval, index) => (
                               <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                                   <Input placeholder="Label" value={interval.label} onChange={e => handleIntervalChange(index, 'label', e.target.value)} className="w-1/3" />
                                   <Input type="number" placeholder="From" value={interval.from} onChange={e => handleIntervalChange(index, 'from', Number(e.target.value))} />
                                   <Input type="number" placeholder="To" value={interval.to} onChange={e => handleIntervalChange(index, 'to', Number(e.target.value))} />
                                   <Popover open={openIntervalColorPopoverIndex === index} onOpenChange={(isOpen) => setOpenIntervalColorPopoverIndex(isOpen ? index : null)}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" style={{ backgroundColor: interval.color }} className="h-10 w-16 shrink-0" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2">
                                        <div className="grid grid-cols-8 gap-1">
                                            {predefinedColors.map(c => (
                                                <button
                                                    key={c}
                                                    className="h-6 w-6 rounded-full border"
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => {
                                                        handleIntervalChange(index, 'color', c);
                                                        setOpenIntervalColorPopoverIndex(null);
                                                    }}
                                                    aria-label={`Set color to ${c}`}
                                                />
                                            ))}
                                            <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                                <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                                <Input
                                                    type="color"
                                                    value={interval.color}
                                                    onChange={(e) => handleIntervalChange(index, 'color', e.target.value)}
                                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
                                                    aria-label="Custom color picker"
                                                />
                                            </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteInterval(index)}><GoogleSymbol name="delete" /></Button>
                               </div>
                           ))}
                           {strategyState.intervals.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center p-4">No intervals defined.</p>
                           )}
                        </div>
                    </div>
                </div>
            )}

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
