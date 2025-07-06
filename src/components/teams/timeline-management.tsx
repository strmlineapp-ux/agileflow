
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, addHours, startOfDay } from 'date-fns';

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

function EditableTimelineView({ timeline, onNameChange, onDelete }: {
  timeline: { id: string, name: string };
  onNameChange: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newName = inputRef.current?.value.trim();
    if (newName && newName !== timeline.name) {
      onNameChange(timeline.id, newName);
    }
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <Input
              ref={inputRef}
              defaultValue={timeline.name}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if(e.key === 'Enter') handleSave();
                if(e.key === 'Escape') setIsEditing(false);
              }}
              className="h-auto p-0 text-xl font-headline font-thin border-0 shadow-none bg-transparent"
            />
          ) : (
            <CardTitle className="font-headline font-thin text-xl cursor-pointer" onClick={() => setIsEditing(true)}>{timeline.name}</CardTitle>
          )}
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(timeline.id)}>
            <GoogleSymbol name="delete" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[2440px]">
            <TimelineHourHeader />
            <TimelineRow name="Row 1" />
            <TimelineRow name="Row 2" />
          </div>
        </div>
      </CardContent>
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
    const newTimeline = { id: crypto.randomUUID(), name: `New Timeline ${timelines.length + 1}` };
    updateTeam(team.id, { timelines: [...timelines, newTimeline] });
  }

  const updateTimelineName = (id: string, newName: string) => {
    const newTimelines = timelines.map(t => t.id === id ? { ...t, name: newName } : t);
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
              onNameChange={updateTimelineName}
              onDelete={deleteTimeline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
