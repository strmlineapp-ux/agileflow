
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type SharedCalendar, type AppTab, type AppPage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../icons/google-symbol';
import { CardTemplate } from '@/components/common/card-template';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ManagementPageLayout } from '../common/management-page-layout';
import { SortableItem } from '../common/sortable-item';
import { InlineEditor } from '../common/inline-editor';
import { PageTitle } from '../common/page-title';
import { linkAndWatchCalendar } from '@/ai/flows/link-and-watch-calendar-flow';
import { useRouter } from 'next/navigation';

function CalendarCard({
    calendar,
    onUpdate,
    onDelete,
    isExpanded,
    onToggleExpand,
    isSharedPreview = false,
}: {
    calendar: SharedCalendar;
    onUpdate: (id: string, data: Partial<SharedCalendar>) => void;
    onDelete: (calendar: SharedCalendar) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSharedPreview?: boolean;
}) {
  const { viewAsUser, googleApiAuthorized } = useUser();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [googleCalendarIdInput, setGoogleCalendarIdInput] = useState('');
  const linkDialogInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const {toast} = useToast();
  
  const canManage = useMemo(() => !isSharedPreview && viewAsUser.userId === calendar.owner?.id, [isSharedPreview, viewAsUser, calendar]);

  React.useEffect(() => {
    if (isLinkDialogOpen) {
      setTimeout(() => linkDialogInputRef.current?.focus(), 100);
    }
  }, [isLinkDialogOpen]);

  const handleLinkClick = () => {
    if (!googleApiAuthorized) {
        toast({
            variant: 'destructive',
            title: 'Google Account Not Connected',
            description: 'Please connect your Google account in settings before linking calendars.',
        });
        router.push('/dashboard/settings/google-auth');
    } else {
        setIsLinkDialogOpen(true);
    }
  };
  
  const handleLinkAndWatchCalendar = async () => {
    if (!canManage) return;

    const calendarIdToLink = googleCalendarIdInput.trim();
    if (!calendarIdToLink) return;
    
    setIsLinkDialogOpen(false);
    toast({ title: 'Linking Calendar...', description: 'Setting up real-time sync. This may take a moment.' });
    
    try {
        await linkAndWatchCalendar({
            calendarId: calendar.id,
            googleCalendarId: calendarIdToLink,
        });
        toast({ title: 'Calendar Linked!', description: `Successfully linked and started watching ${calendar.name}.` });
    } catch (error) {
        console.error('Failed to link and watch calendar:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not set up real-time sync. Please check the calendar ID and permissions.' });
    } finally {
        setGoogleCalendarIdInput('');
    }
  };


  return (
    <>
      <CardTemplate
        entity={calendar}
        onUpdate={onUpdate}
        onDelete={() => onDelete(calendar)}
        canManage={canManage}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        isSharedPreview={isSharedPreview}
        headerControls={
            <>
            {canManage && !calendar.googleCalendarId && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleLinkClick}>
                                <GoogleSymbol name="add_link" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Link Google Calendar</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            </>
        }
        body={
            <div className="space-y-1" onPointerDown={(e) => e.stopPropagation()}>
               <InlineEditor
                  value={calendar.defaultEventTitle || ''}
                  onSave={(newTitle) => onUpdate(calendar.id, { defaultEventTitle: newTitle })}
                  disabled={!canManage}
                  placeholder="No default title"
                  className="italic text-xs text-muted-foreground"
                />
            </div>
        }
      />
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLinkAndWatchCalendar}>
                  <GoogleSymbol name="check" className="text-xl" />
                  <span className="sr-only">Link Calendar</span>
              </Button>
            </div>
            <DialogHeader>
                <UIDialogTitle className="font-headline font-thin">Link Google Calendar</UIDialogTitle>
                <DialogDescription>
                    Paste the Google Calendar ID here to link it for syncing.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <Input
                  ref={linkDialogInputRef}
                  id="google-calendar-id"
                  placeholder="your-calendar-id@group.calendar.google.com"
                  value={googleCalendarIdInput}
                  onChange={(e) => setGoogleCalendarIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkAndWatchCalendar()}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


export function CalendarManagement({ tab, page, isActive, isSharedPanelOpen, setIsSharedPanelOpen, isDragging }: { tab: AppTab; page: AppPage, isActive?: boolean, isSharedPanelOpen: boolean, setIsSharedPanelOpen: (isOpen: boolean) => void, isDragging: boolean }) {
  const { viewAsUser, calendars, addCalendar, updateCalendar, deleteCalendar, updatePage, updateUser, reorderCalendars } = useUser();
  const { toast } = useToast();
  const contextKey = `calendars-${page.id}`;
  
  const onToggleExpand = useCallback((calendarId: string) => {
    if (!viewAsUser) return;
      const currentState = viewAsUser.expandedCardState || {};
      const currentExpanded = new Set(currentState[contextKey] || []);
      if (currentExpanded.has(calendarId)) {
        currentExpanded.delete(calendarId);
      } else {
        currentExpanded.add(calendarId);
      }
      updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: Array.from(currentExpanded) } });
  }, [viewAsUser, updateUser, contextKey]);
  
  const onCollapseAll = () => {
    if (!viewAsUser) return;
    const currentState = viewAsUser.expandedCardState || {};
    updateUser(viewAsUser.userId, { expandedCardState: { ...currentState, [contextKey]: [] } });
  };

  const title = page.displayTitle ?? tab.name;
  const canManagePage = viewAsUser.isAdmin;
  
  const handleTitleSave = (newTitle: string) => {
    updatePage(page.id, { displayTitle: newTitle });
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        updatePage(page.id, { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  const handleAddCalendar = (sourceCalendar?: SharedCalendar) => {
    addCalendar(sourceCalendar || {});
    toast({ title: sourceCalendar ? 'Calendar Duplicated' : 'New Calendar Added' });
  };
  
  const handleUpdate = (calendarId: string, data: Partial<SharedCalendar>) => {
    updateCalendar(calendarId, data);
  };
  
  const handleDelete = (calendar: SharedCalendar) => {
    const isOwner = calendar.owner?.id === viewAsUser.userId;
    if (isOwner) {
        deleteCalendar(calendar.id);
        toast({ title: 'Calendar Deleted' });
    } else { // Unlink
        const updatedLinkedIds = (viewAsUser.linkedCalendarIds || []).filter(id => id !== calendar.id);
        updateUser(viewAsUser.userId, { linkedCalendarIds: updatedLinkedIds });
        toast({ title: 'Calendar Unlinked', description: `"${calendar.name}" has been removed from your board.`});
    }
  };

  const handleLinkCalendar = (calendarId: string) => {
    const updatedLinkedIds = [...(viewAsUser.linkedCalendarIds || []), calendarId];
    updateUser(viewAsUser.userId, { linkedCalendarIds: Array.from(new Set(updatedLinkedIds)) });
    toast({ title: 'Calendar Linked' });
  }
  
  const displayedCalendars = useMemo(() => {
    return calendars
      .filter(c => (c.owner && c.owner.id === viewAsUser.userId) || (viewAsUser.linkedCalendarIds || []).includes(c.id));
  }, [calendars, viewAsUser]);

  const sharedCalendars = useMemo(() => {
    const displayedIds = new Set(displayedCalendars.map(c => c.id));
    return calendars.filter(c => c.isShared && c.owner?.id !== viewAsUser.userId && !displayedIds.has(c.id));
  }, [calendars, displayedCalendars, viewAsUser.userId]);

  const renderCalendarCard = useCallback((calendar: SharedCalendar) => {
      const expandedCardIds = viewAsUser?.expandedCardState?.[contextKey] || [];
      return (
      <SortableItem key={calendar.id} id={calendar.id} data={{ type: 'calendar-card', calendar, isSharedPreview: false }}>
        {(isDragging: boolean) => (
          <CalendarCard
            calendar={calendar}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isExpanded={expandedCardIds.includes(calendar.id)}
            onToggleExpand={() => onToggleExpand(calendar.id)}
          />
        )}
      </SortableItem>
  )}, [handleUpdate, handleDelete, viewAsUser, onToggleExpand, contextKey]);

  const renderDragOverlay = useCallback((item: SharedCalendar) => (
      <GoogleSymbol name={item.icon} style={{color: item.color, fontSize: '48px'}} />
  ), []);

  return (
    <ManagementPageLayout
        pageTitle={title}
        onPageTitleSave={handleTitleSave}
        onPageTitleReset={handleTitleReset}
        canManagePage={canManagePage}
        entityType="calendar"
        allItems={displayedCalendars}
        allSharedItems={sharedCalendars}
        onAddItem={handleAddCalendar}
        onUpdateItem={handleUpdate}
        onDeleteItem={handleDelete}
        onReorderItems={reorderCalendars}
        onLinkItem={handleLinkCalendar}
        onCollapseAll={onCollapseAll}
        renderItem={(item, isDragging) => renderCalendarCard(item as SharedCalendar)}
        renderDragOverlay={renderDragOverlay}
        isActive={isActive ?? false}
        isSharedPanelOpen={isSharedPanelOpen}
        setIsSharedPanelOpen={setIsSharedPanelOpen}
        isDragging={isDragging}
    />
  );
}

    