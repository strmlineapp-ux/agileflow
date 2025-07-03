
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

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
    <Button variant="ghost" className="h-8 justify-start p-2 text-sm text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}>
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
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);

    useEffect(() => {
        if (editingPhoneUserId && phoneInputRef.current) {
            phoneInputRef.current.focus();
            phoneInputRef.current.select();
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
      { name: 'light', label: 'Light', icon: 'light_mode' },
      { name: 'dark', label: 'Dark', icon: 'dark_mode' },
    ];
    
    const handleSetPrimaryColor = (color: string) => {
      updateUser(realUser.userId, { primaryColor: color });
      setIsColorPopoverOpen(false);
    }

    return (
        <>
          <div className="grid grid-cols-1 gap-6">
            {users.map(user => {
              const isCurrentUser = user.userId === realUser.userId;
              return (
                <Card key={user.userId}>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-none">
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
                           {isCurrentUser && (
                            <AccordionTrigger className="py-2 text-sm text-muted-foreground justify-end hover:no-underline [&[data-state=open]>span]:rotate-180">
                                <span className="sr-only">Toggle Details</span>
                            </AccordionTrigger>
                           )}
                        </div>
                      </CardHeader>
                        <AccordionContent>
                           <CardContent className="pt-0">
                               <div className="p-2 pt-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Contact</Label>
                                        <div
                                            className={cn(
                                                "text-sm min-h-[36px] flex items-center",
                                                isCurrentUser && !editingPhoneUserId && "cursor-pointer"
                                            )}
                                            onClick={() => {
                                                if (isCurrentUser && !editingPhoneUserId) {
                                                    setEditingPhoneUserId(user.userId);
                                                    setPhoneValue(user.phone || '');
                                                }
                                            }}
                                        >
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
                                                user.phone || <span className="italic text-muted-foreground">Not provided</span>
                                            )}
                                        </div>
                                    </div>
                                     <div>
                                        <Label className="text-xs text-muted-foreground">Title</Label>
                                        <p className="text-sm font-medium">{user.title || <span className="italic text-muted-foreground">Not provided</span>}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Badges</Label>
                                        <div className="flex flex-wrap gap-1 mt-2">
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
                                        {(user.roles || []).length === 0 && <p className="text-xs text-muted-foreground italic">No badges assigned</p>}
                                        </div>
                                    </div>
                                    {isCurrentUser && (
                                      <>
                                        <div className="space-y-1">
                                          <div className="relative w-full border-b">
                                              <div className="flex h-10 items-center justify-center p-0 text-muted-foreground">
                                                  <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                                      <TooltipProvider>
                                                          <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                  <PopoverTrigger asChild>
                                                                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                                                          <GoogleSymbol name="palette" className="text-primary"/>
                                                                      </Button>
                                                                  </PopoverTrigger>
                                                              </TooltipTrigger>
                                                              <TooltipContent>Set custom primary color</TooltipContent>
                                                          </Tooltip>
                                                      </TooltipProvider>
                                                      <PopoverContent className="w-auto p-2">
                                                          <div className="grid grid-cols-8 gap-1">
                                                              {predefinedColors.map(color => (
                                                                  <button key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} onClick={() => handleSetPrimaryColor(color)} aria-label={`Set color to ${color}`}/>
                                                              ))}
                                                              <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
                                                                  <GoogleSymbol name="colorize" className="text-muted-foreground" />
                                                                  <Input type="color" value={realUser.primaryColor || '#000000'} onChange={(e) => handleSetPrimaryColor(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0" aria-label="Custom color picker"/>
                                                              </div>
                                                          </div>
                                                      </PopoverContent>
                                                  </Popover>
                                                  {THEME_OPTIONS.map(theme => (
                                                  <Button
                                                      key={theme.name}
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => updateUser(realUser.userId, { theme: theme.name as any, primaryColor: undefined })}
                                                      className={cn(
                                                      "w-full rounded-none gap-2 py-1.5",
                                                      realUser.theme === theme.name ? "text-primary" : ""
                                                      )}
                                                  >
                                                      <GoogleSymbol name={theme.icon} className="text-lg" />
                                                      {theme.label}
                                                  </Button>
                                                  ))}
                                              </div>
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
                                        <div className="space-y-1 self-center">
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
                           </CardContent>
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
