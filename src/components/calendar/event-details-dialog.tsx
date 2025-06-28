
'use client';

import * as React from 'react';
import { type Event } from '@/types';
import { useUser } from '@/context/user-context';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from './priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { GoogleSymbol } from '../icons/google-symbol';
import { cn, getContrastColor } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { canManageEventOnCalendar } from '@/lib/permissions';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { EventForm } from './new-event-form';
import { type AttachmentType } from '@/types';

// --- ICON COMPONENTS ---
const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M9.19,4.5l-3.2,0l-1.7,2.9l3.2,5.7l4.9,0l1.7,-2.9l-4.9,-5.7Z" fill="#0f9d58"></path><path d="M5.99,4.5l-3.2,5.7l1.7,2.9l3.2,-5.7l-1.7,-2.9Z" fill="#ffc107"></path><path d="M10.89,7.4l-3.2,0l-1.7,-2.9l4.9,0l0,0Z" fill="#1976d2"></path></svg>
);
const GoogleDocsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#4285f4"></path><path d="M10,9H6V8h4V9z M11,7H6V6h5V7z M11,5H6V4h5V5z" fill="#ffffff"></path></svg>
);
const GoogleSheetsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#0f9d58"></path><path d="M7,11v-1H5v-1h2V8H5V7h2V6H4v6h3V11z M12,12H8v-1h1V8H8V7h4v1h-1v2h1V12z" fill="#ffffff"></path></svg>
);
const GoogleSlidesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#ffc107"></path><path d="M12,4H4v6h8V4z" fill="#ffffff"></path></svg>
);
const GoogleFormsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}><path d="M13,2H3C2.4,2,2,2.4,2,3v10c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V3C14,2.4,13.6,2,13,2z" fill="#7e57c2"></path><path d="M10,11H6v-1h4V11z M11,8H6V7h5V8z M8,5H6V4h2V5z" fill="#ffffff"></path></svg>
);
const GoogleMeetIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#00897B"/></svg>
);


const attachmentIcons: Record<AttachmentType, React.ReactNode> = {
  drive: <GoogleDriveIcon className="h-5 w-5" />,
  docs: <GoogleDocsIcon className="h-5 w-5" />,
  sheets: <GoogleSheetsIcon className="h-5 w-5" />,
  slides: <GoogleSlidesIcon className="h-5 w-5" />,
  forms: <GoogleFormsIcon className="h-5 w-5" />,
  meet: <GoogleMeetIcon className="h-5 w-5" />,
  local: <GoogleSymbol name="description" className="text-xl" />,
  link: <GoogleSymbol name="link" className="text-xl" />,
};


// --- DISPLAY VIEW ---
const EventDisplayView = ({ event }: { event: Event }) => {
    const { users, calendars, teams } = useUser();
    const calendar = calendars.find(c => c.id === event.calendarId);
    if (!calendar) return null;

    const timeFormat = format(event.startTime, 'eeee, MMM d, yyyy') + ' ⋅ ' + format(event.startTime, 'p') + ' - ' + format(event.endTime, 'p');
    const teamForEvent = teams.find(t => t.id === event.calendarId);
    const eventTemplate = teamForEvent?.eventTemplates?.find(t => t.id === event.templateId);
    const roleAssignmentsLabel = calendar?.roleAssignmentsLabel || 'Role Assignments';
    
    const assignedUserIds = new Set(Object.values(event.roleAssignments || {}).filter(Boolean) as string[]);
    const guestsToDisplay = (event.attendees || []).filter(attendee => !attendee.userId || !assignedUserIds.has(attendee.userId));

    return (
        <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{timeFormat}</p>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 pr-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {calendar && (
                            <Badge style={{ backgroundColor: calendar.color, color: getContrastColor(calendar.color) }} className="border-transparent">{calendar.name}</Badge>
                        )}
                        <PriorityBadge priorityId={event.priority} />
                        {eventTemplate && <TooltipProvider><Tooltip><TooltipTrigger asChild><Badge variant="secondary" className="p-1"><GoogleSymbol name={eventTemplate.icon} className="text-sm" /></Badge></TooltipTrigger><TooltipContent>{eventTemplate.name}</TooltipContent></Tooltip></TooltipProvider>}
                    </div>
                    
                    {event.location && (
                        <div className="flex items-start gap-4">
                            <GoogleSymbol name="location_on" className="text-2xl text-muted-foreground mt-0.5" />
                            <p className="font-medium">{event.location}</p>
                        </div>
                    )}
                    
                    {event.description && (
                         <div className="flex items-start gap-4">
                            <GoogleSymbol name="subject" className="text-2xl text-muted-foreground mt-0.5" />
                            <p className="text-sm">{event.description}</p>
                        </div>
                    )}
                    
                    {teamForEvent && event.roleAssignments && Object.keys(event.roleAssignments).length > 0 && (
                         <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                <GoogleSymbol name="badge" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{roleAssignmentsLabel}</p>
                                    <div className="space-y-2">
                                        {Object.entries(event.roleAssignments).map(([role, userId]) => {
                                            const user = users.find(u => u.userId === userId);
                                            return (
                                                <div key={role} className="flex items-center gap-2 text-sm">
                                                    <span className="font-semibold w-24">{role}:</span>
                                                    {user ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6"><AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" /><AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                            <span>{user.displayName}</span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground italic">Not assigned</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {guestsToDisplay.length > 0 && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                <GoogleSymbol name="group" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{guestsToDisplay.length} Guests</p>
                                    <div className="space-y-2">
                                        {guestsToDisplay.map(attendee => (
                                            <div key={attendee.email} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={attendee.avatarUrl} alt={attendee.displayName} data-ai-hint="user avatar" />
                                                    <AvatarFallback>{attendee.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{attendee.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {event.attachments && event.attachments.length > 0 && (
                         <>
                            <Separator />
                            <div className="flex items-start gap-4">
                                 <GoogleSymbol name="attachment" className="text-2xl text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium mb-2">{event.attachments.length} Attachments</p>
                                    <div className="space-y-2">
                                        {event.attachments.map((att, index) => (
                                            <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                                {attachmentIcons[att.type]}
                                                <span className="text-sm font-medium underline-offset-4 hover:underline">{att.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </>
    );
};


// --- MAIN DIALOG COMPONENT ---
type EventDetailsDialogProps = {
  event: Event | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventDetailsDialog({ event, isOpen, onOpenChange }: EventDetailsDialogProps) {
  const { viewAsUser, calendars } = useUser();

  if (!event) return null;
  
  const calendar = calendars.find(c => c.id === event.calendarId);
  if (!calendar) return null;

  const canManage = canManageEventOnCalendar(viewAsUser, calendar);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {canManage ? (
            <EventForm event={event} onFinished={() => onOpenChange(false)} />
        ) : (
            <EventDisplayView event={event} />
        )}
      </DialogContent>
    </Dialog>
  );
}
