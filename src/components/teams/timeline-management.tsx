

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@/context/user-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, addHours, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { Textarea } from '../ui/textarea';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const TimelineHourHeader = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const timeFormat = 'HH:mm';
  return (
    <div className="flex sticky top-0 bg-card z-10 border-b">
      <div className="w-40 shrink-0 border-r p-2 font-medium">Item</div>
      {hours.map(hour => (
        <div key={hour} className="shrink-0 text-left p-2 border-r w-24">
          <span className="text-xs text-muted-foreground">
            {format(addHours(startOfDay(new Date()), hour), timeFormat)}
          </span>
        </div>
      ))}
    </div>
  );
};

const TimelineRow = ({ name }: { name: string }) => {
  return (
    <div className="flex border-b">
      <div className="w-40 shrink-0 border-r p-2 flex items-center">
        {name}
      </div>
      <div className="flex-1 relative h-10">
        {/* Placeholder for timeline items */}
      </div>
    </div>
  )
}

function EditableTimelineView({ timeline, onUpdate, onDelete }: {
  timeline: { id: string, name: string, icon: string, color: string, description?: string, rows: {id: string, name: string}[] };
  onUpdate: (id: string, data: Partial<Omit<typeof timeline, 'id'>>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription) {
      descriptionTextareaRef.current?.focus();
      descriptionTextareaRef.current?.select();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (isIconPopoverOpen) {
      setTimeout(() => iconSearchInputRef.current?.focus(), 100);
    } else {
      setIconSearch('');
    }
  }, [isIconPopoverOpen]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return googleSymbolNames;
    return googleSymbolNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  const handleSaveName = () => {
    const newName = nameInputRef.current?.value.trim();
    if (newName && newName !== timeline.name) {
      onUpdate(timeline.id, { name: newName });
    }
    setIsEditingName(false);
  };
  
  const handleSaveDescription = () => {
    const newDescription = descriptionTextareaRef.current?.value.trim();
    if (newDescription !== timeline.description) {
        onUpdate(timeline.id, { description: newDescription });
    }
    setIsEditingDescription(false);
  };

  return (
    <Card className="overflow-hidden">
        <div className="p-4 border-b">
            <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="h-12 w-12 flex items-center justify-center">
                                        <GoogleSymbol name={timeline.icon} className="text-6xl" weight={100} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent><p>Change Icon</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <PopoverContent className="w-80 p-0">
                            <div className="flex items-center gap-1 p-2 border-b">
                                <GoogleSymbol name="search" className="text-muted-foreground text-xl" />
                                <input ref={iconSearchInputRef} placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0" />
                            </div>
                            <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={timeline.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { onUpdate(timeline.id, { icon: iconName }); setIsIconPopoverOpen(false);}} className="h-8 w-8 p-0"><GoogleSymbol name={iconName} className="text-4xl" weight={100} /></Button>))}</div></ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background cursor-pointer" style={{ backgroundColor: timeline.color }} />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Change Color</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-8 gap-1">{predefinedColors.map(c => (<button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => onUpdate(timeline.id, { color: c })} />))}<div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted"><GoogleSymbol name="colorize" className="text-muted-foreground" /><Input type="color" value={timeline.color} onChange={(e) => onUpdate(timeline.id, { color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"/></div></div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1">
                    {isEditingName ? (
                        <Input
                        ref={nameInputRef}
                        defaultValue={timeline.name}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') handleSaveName();
                            if(e.key === 'Escape') setIsEditingName(false);
                        }}
                        className="h-auto p-0 text-xl font-headline font-thin border-0 shadow-none bg-transparent"
                        />
                    ) : (
                        <h3 className="font-headline font-thin text-xl cursor-pointer" onClick={() => setIsEditingName(true)}>{timeline.name}</h3>
                    )}
                    {isEditingDescription ? (
                        <Textarea 
                            ref={descriptionTextareaRef}
                            defaultValue={timeline.description}
                            onBlur={handleSaveDescription}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveDescription();
                                } else if (e.key === 'Escape') {
                                    setIsEditingDescription(false);
                                }
                            }}
                            className="p-0 text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none h-auto"
                            placeholder="Click to add a description."
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground cursor-text min-h-[20px]" onClick={() => setIsEditingDescription(true)}>
                            {timeline.description || 'Click to add a description.'}
                        </p>
                    )}
                </div>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(timeline.id)}>
                <GoogleSymbol name="delete" />
            </Button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <div style={{ width: '2440px' }}>
                <TimelineHourHeader />
                {(timeline.rows || []).map(row => (
                    <TimelineRow key={row.id} name={row.name} />
                ))}
                {(timeline.rows || []).length === 0 && (
                    <div className="flex h-24 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                        No rows in this timeline yet.
                    </div>
                )}
            </div>
        </div>
    </Card>
  )
}

export function TimelineManagement({ team, tab }: { team: Team, tab: AppTab }) {
  const { updateTeam, updateAppTab } = useUser();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const timelines = team.timelines || [];

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && newName !== tab.name) {
      updateAppTab(tab.id, { name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const addTimeline = () => {
    const newTimeline = {
        id: crypto.randomUUID(),
        name: `New Timeline ${timelines.length + 1}`,
        icon: 'timeline',
        color: '#64748B',
        description: 'A new timeline for planning work.',
        rows: [],
    };
    updateTeam(team.id, { timelines: [...timelines, newTimeline] });
  }

  const updateTimeline = (id: string, data: Partial<Omit<typeof timelines[0], 'id'>>) => {
    const newTimelines = timelines.map(t => t.id === id ? { ...t, ...data } : t);
    updateTeam(team.id, { timelines: newTimelines });
  }

  const deleteTimeline = (id: string) => {
    const newTimelines = timelines.filter(t => t.id !== id);
    updateTeam(team.id, { timelines: newTimelines });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        {isEditingTitle ? (
            <Input
                ref={titleInputRef}
                defaultValue={tab.name}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                className="h-auto p-0 font-headline text-2xl font-thin border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        ) : (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <h2 className="font-headline text-2xl font-thin tracking-tight cursor-text border-b border-dashed border-transparent hover:border-foreground" onClick={() => setIsEditingTitle(true)}>{tab.name}</h2>
                    </TooltipTrigger>
                    {tab.description && (
                        <TooltipContent><p className="max-w-xs">{tab.description}</p></TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        )}
         <Button variant="ghost" size="icon" className="p-0" onClick={addTimeline}>
          <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
          <span className="sr-only">New Timeline</span>
        </Button>
      </div>

      {timelines.length === 0 ? (
         <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground min-h-[150px]">
            <p>No timelines yet. Click the '+' button to add one.</p>
         </div>
      ) : (
        <div className="space-y-8">
          {timelines.map(timeline => (
            <EditableTimelineView 
              key={timeline.id} 
              timeline={timeline}
              onUpdate={updateTimeline}
              onDelete={deleteTimeline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
