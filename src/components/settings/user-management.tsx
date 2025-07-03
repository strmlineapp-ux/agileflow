
'use client';

import { useState, Fragment, useRef, useEffect } from 'react';
import { type User, type Team } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const InlineSelectEditor = ({
  value,
  onSave,
  options,
  placeholder,
}: {
  value: string;
  onSave: (newValue: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <Select
        defaultValue={value}
        onValueChange={(newValue) => {
          onSave(newValue);
          setIsEditing(false);
        }}
        onOpenChange={(isOpen) => !isOpen && setIsEditing(false)}
        defaultOpen
      >
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const currentLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <Button variant="ghost" className="h-8 justify-start p-2 text-sm" onClick={() => setIsEditing(true)}>
      {currentLabel}
    </Button>
  );
};

export function UserManagement() {
    const { realUser, users, updateUser, linkGoogleCalendar, allRolesAndBadges } = useUser();
    const [editingPhoneUserId, setEditingPhoneUserId] = useState<string | null>(null);
    const [phoneValue, setPhoneValue] = useState('');
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (editingPhoneUserId && phoneInputRef.current) {
            phoneInputRef.current.focus();
        }
    }, [editingPhoneUserId]);
   
    const handleSavePhone = async () => {
        if (!editingPhoneUserId) return;
        
        if (editingPhoneUserId !== realUser.userId) {
            toast({ variant: 'destructive', title: 'Error', description: 'You can only edit your own phone number.' });
            setEditingPhoneUserId(null);
            return;
        }
        
        await updateUser(editingPhoneUserId, { phone: phoneValue });
        setEditingPhoneUserId(null);
        toast({ title: 'Success', description: 'Contact number updated.' });
    };

    const THEME_OPTIONS = [
      { name: 'light', label: 'Light' },
      { name: 'dark', label: 'Dark' },
      { name: 'high-visibility', label: 'High Visibility' },
      { name: 'firebase', label: 'Firebase' }
    ];

    return (
        <>
          <div className="grid grid-cols-1 gap-6">
            {users.map(user => {
              const isCurrentUser = user.userId === realUser.userId;
              return (
                <Card key={user.userId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {isCurrentUser && !user.googleCalendarLinked ? (
                                        <Button variant="ghost" className="relative h-12 w-12 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); linkGoogleCalendar(user.userId); }}>
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-gray-400 ring-2 ring-card" />
                                        </Button>
                                    ) : (
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className={cn(
                                                "absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-card",
                                                user.googleCalendarLinked ? "bg-green-500" : "bg-gray-400"
                                            )} />
                                        </div>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Google Calendar: {user.googleCalendarLinked ? 'Connected' : isCurrentUser ? 'Click to connect' : 'Not Connected'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div>
                            <p className="font-semibold text-lg">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                       <Label className="text-xs text-muted-foreground">Title</Label>
                       <p className="text-sm font-medium">{user.title || <span className="italic text-muted-foreground">Not provided</span>}</p>
                    </div>
                  </CardContent>
                  <Accordion type="single" collapsible className="w-full px-4">
                      <AccordionItem value="details" className="border-t">
                        <AccordionTrigger className="py-2 text-sm text-muted-foreground">
                          Details
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-2 pt-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Contact</Label>
                                    <div className="flex items-center gap-2">
                                        {editingPhoneUserId === user.userId && isCurrentUser ? (
                                            <Input
                                                ref={phoneInputRef}
                                                value={phoneValue}
                                                onChange={(e) => setPhoneValue(e.target.value)}
                                                onBlur={handleSavePhone}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSavePhone();
                                                    if (e.key === 'Escape') setEditingPhoneUserId(null);
                                                }}
                                                className="h-auto p-0 text-sm border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                                placeholder="Not provided"
                                            />
                                        ) : (
                                            <p
                                                className={cn(
                                                    "text-sm min-h-[32px] flex items-center",
                                                    isCurrentUser && "cursor-pointer hover:text-primary"
                                                )}
                                                onClick={() => {
                                                    if (isCurrentUser) {
                                                        setEditingPhoneUserId(user.userId);
                                                        setPhoneValue(user.phone || '');
                                                    }
                                                }}
                                            >
                                                {user.phone || <span className="italic text-muted-foreground">Not provided</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Badges</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {(user.roles || []).map(role => {
                                        const roleInfo = allRolesAndBadges.find(r => r.name === role);
                                        return (
                                        <Badge
                                            key={role}
                                            variant="outline"
                                            style={roleInfo ? { color: roleInfo.color, borderColor: roleInfo.color } : {}}
                                            className="rounded-full gap-1 text-xs py-0.5 px-2"
                                        >
                                            {roleInfo && <GoogleSymbol name={roleInfo.icon} className="text-sm" />}
                                            <span>{role}</span>
                                        </Badge>
                                        );
                                    })}
                                    {(user.roles || []).length === 0 && <p className="text-xs text-muted-foreground italic">No roles assigned</p>}
                                    </div>
                                </div>
                                {isCurrentUser && (
                                  <>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Theme</Label>
                                        <div className="flex items-center gap-2">
                                          {THEME_OPTIONS.map(theme => (
                                            <Button 
                                              key={theme.name}
                                              variant={realUser.theme === theme.name ? 'secondary' : 'ghost'}
                                              size="sm"
                                              onClick={() => updateUser(realUser.userId, { theme: theme.name as any })}
                                            >
                                              {theme.label}
                                            </Button>
                                          ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Default Calendar View</Label>
                                      <InlineSelectEditor
                                        value={realUser.defaultCalendarView || 'day'}
                                        onSave={(newValue) => updateUser(realUser.userId, { defaultCalendarView: newValue as any})}
                                        options={[
                                            { value: "month", label: "Month" },
                                            { value: "week", label: "Week" },
                                            { value: "day", label: "Day" },
                                            { value: "production-schedule", label: "Production Schedule" },
                                        ]}
                                        placeholder="Select Default View"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Time Format</Label>
                                      <InlineSelectEditor
                                        value={realUser.timeFormat || '12h'}
                                        onSave={(newValue) => updateUser(realUser.userId, { timeFormat: newValue as any})}
                                        options={[
                                            { value: "12h", label: "12-Hour" },
                                            { value: "24h", label: "24-Hour" },
                                        ]}
                                        placeholder="Select Time Format"
                                      />
                                    </div>
                                    <div className="space-y-1 self-end">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button variant="ghost" onClick={() => updateUser(realUser.userId, { easyBooking: !realUser.easyBooking })} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                                  <GoogleSymbol name={realUser.easyBooking ? 'toggle_on' : 'toggle_off'} className="text-2xl" />
                                                  <span className="text-sm">Easy Booking</span>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Click empty calendar slots to quickly create events.</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                  </>
                                )}
                             </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                </Card>
              )
            })}
          </div>
        </>
    )
}
