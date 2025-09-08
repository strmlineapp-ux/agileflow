
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { getDb } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { googleSymbolNames }from '@/lib/google-symbols';
import { predefinedColors } from '@/lib/colors';
import { adjustHslColor } from '@/lib/utils';


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
  const { viewAsUser, googleLogin } = useUser();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [googleCalendarIdInput, setGoogleCalendarIdInput] = useState('');
  const linkDialogInputRef = React.useRef<HTMLInputElement>(null);
  
  const {toast} = useToast();
  
  const canManage = useMemo(() => !isSharedPreview && viewAsUser?.userId === calendar.owner?.id, [isSharedPreview, viewAsUser, calendar]);

  React.useEffect(() => {
    if (isLinkDialogOpen) {
      setTimeout(() => linkDialogInputRef.current?.focus(), 100);
    }
  }, [isLinkDialogOpen]);

  const handleLinkClick = async () => {
    if (!viewAsUser?.googleCalendarLinked) {
        toast({
            variant: 'destructive',
            title: 'Google Account Not Connected',
            description: 'Please connect your Google account before linking calendars.',
        });
        await googleLogin();
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
        const watchResult = await linkAndWatchCalendar({
            calendarId: calendar.id,
            googleCalendarId: calendarIdToLink,
        });

        onUpdate(calendar.id, { googleCalendarId: calendarIdToLink });
        
        toast({ title: 'Calendar Linked!', description: `Successfully linked and started watching ${calendar.name}. It expires on ${new Date(parseInt(watchResult.expiration)).toLocaleDateString()}` });
    } catch (error: any) {
        console.error('Failed to link and watch calendar:', error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not set up real-time sync.' });
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
  const { viewAsUser, updateUser } = useUser();
  const { toast } = useToast();
  const contextKey = `calendars-${page.id}`;

  const [allCalendars, setAllCalendars] = useState<SharedCalendar[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!viewAsUser?.workspaceId) return;
    setDataLoading(true);
    const db = getDb();
    const q = query(collection(db, "calendars"), where("workspaceId", "==", viewAsUser.workspaceId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const calendarsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedCalendar));
        setAllCalendars(calendarsData);
        setDataLoading(false);
    }, (error) => {
        console.error("Error fetching calendars:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load calendars."});
        setDataLoading(false);
    });

    return () => unsubscribe();
  }, [viewAsUser?.workspaceId, toast]);
  
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
  const canManagePage = viewAsUser?.isAdmin ?? false;
  
  const handleTitleSave = (newTitle: string) => {
    if(!viewAsUser) return;
    const db = getDb();
    updateDoc(doc(db, 'app-settings', viewAsUser.workspaceId, 'pages', page.id), { displayTitle: newTitle });
  };

  const handleTitleReset = (e: React.MouseEvent) => {
    if(!viewAsUser) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        const db = getDb();
        updateDoc(doc(db, 'app-settings', viewAsUser.workspaceId, 'pages', page.id), { displayTitle: null });
        toast({title: "Title Reset", description: "The page title has been reset to its default."});
    }
  };

  const handleAddCalendar = async (sourceCalendar?: SharedCalendar) => {
    if(!viewAsUser) return;
    const isDuplicating = !!sourceCalendar;
    const newCalendarData = {
      ...(sourceCalendar || {}),
      name: isDuplicating && sourceCalendar?.name ? `${sourceCalendar.name} (Copy)` : 'New Calendar',
      icon: sourceCalendar?.icon || googleSymbolNames[Math.floor(Math.random() * googleSymbolNames.length)],
      color: isDuplicating && sourceCalendar?.color ? adjustHslColor(sourceCalendar.color) : predefinedColors[Math.floor(Math.random() * predefinedColors.length)],
      owner: { type: 'user', id: viewAsUser.userId },
      workspaceId: viewAsUser.workspaceId,
      isShared: false,
    };
    delete (newCalendarData as any).id; // Remove id before adding
    
    const db = getDb();
    await addDoc(collection(db, 'calendars'), newCalendarData);
    toast({ title: sourceCalendar ? 'Calendar Duplicated' : 'New Calendar Added' });
  };
  
  const handleUpdate = async (calendarId: string, data: Partial<SharedCalendar>) => {
    const db = getDb();
    await updateDoc(doc(db, 'calendars', calendarId), data);
  };
  
  const handleDelete = (calendar: SharedCalendar) => {
    if(!viewAsUser) return;
    const isOwner = calendar.owner?.id === viewAsUser.userId;
    if (isOwner) {
        const db = getDb();
        deleteDoc(doc(db, 'calendars', calendar.id));
        toast({ title: 'Calendar Deleted' });
    } else { // Unlink
        const updatedLinkedIds = (viewAsUser.linkedCalendarIds || []).filter(id => id !== calendar.id);
        updateUser(viewAsUser.userId, { linkedCalendarIds: updatedLinkedIds });
        toast({ title: 'Calendar Unlinked', description: `"${calendar.name}" has been removed from your board.`});
    }
  };

  const handleLinkCalendar = (calendarId: string) => {
    if(!viewAsUser) return;
    const updatedLinkedIds = [...(viewAsUser.linkedCalendarIds || []), calendarId];
    updateUser(viewAsUser.userId, { linkedCalendarIds: Array.from(new Set(updatedLinkedIds)) });
    toast({ title: 'Calendar Linked' });
  }
  
  const reorderCalendars = async (items: SharedCalendar[]) => {
    setAllCalendars(items); // Optimistic update
    // In a real app, you might save the order to user preferences.
  };

  const displayedCalendars = useMemo(() => {
    if(!viewAsUser) return [];
    return allCalendars
      .filter(c => (c.owner && c.owner.id === viewAsUser.userId) || (viewAsUser.linkedCalendarIds || []).includes(c.id));
  }, [allCalendars, viewAsUser]);

  const sharedCalendars = useMemo(() => {
    if(!viewAsUser) return [];
    const displayedIds = new Set(displayedCalendars.map(c => c.id));
    return allCalendars.filter(c => c.isShared && c.owner?.id !== viewAsUser.userId && !displayedIds.has(c.id));
  }, [allCalendars, displayedCalendars, viewAsUser]);

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

  if (dataLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <GoogleSymbol name="progress_activity" className="animate-spin text-4xl" />
        </div>
    );
  }

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
