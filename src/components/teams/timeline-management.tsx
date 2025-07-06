'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Team, type AppTab } from '@/types';
import { GoogleSymbol } from '../icons/google-symbol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TimelineManagement({ team, tab }: { team: Team, tab: AppTab }) {
  const { updateAppTab } = useUser();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                  Custom Timelines
                   <Button variant="ghost" size="icon" className="p-0">
                    <GoogleSymbol name="add_circle" className="text-4xl" weight={100} />
                    <span className="sr-only">New Timeline</span>
                  </Button>
              </CardTitle>
              <CardDescription>
                Design and manage custom timelines for different production workflows.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground min-h-[150px]">
                <p>Timeline management functionality coming soon.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
