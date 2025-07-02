
'use client';

import { useState, Fragment, useRef } from 'react';
import { type User, type Team } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const THEME_OPTIONS = [
  { name: 'light', label: 'Light', icon: 'light_mode', defaultPrimary: '#6B8CC3' },
  { name: 'dark', label: 'Dark', icon: 'dark_mode', defaultPrimary: '#D98242' },
];

const PREDEFINED_COLORS = [
    '#6B8CC3', '#D98242', '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

function ColorPicker({ user, onColorChange }: { user: User; onColorChange: (color: string) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeTheme = THEME_OPTIONS.find(t => t.name === (user.theme || 'light')) || THEME_OPTIONS[0];
  const displayColor = user.primaryColor || activeTheme.defaultPrimary;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-10 p-0"
          style={{ backgroundColor: displayColor }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {PREDEFINED_COLORS.map(color => (
            <button
              key={color}
              className="h-6 w-6 rounded-full border"
              style={{ backgroundColor: color }}
              onClick={() => {
                onColorChange(color);
                setIsOpen(false);
              }}
            />
          ))}
          <div className="relative h-6 w-6 rounded-full border flex items-center justify-center bg-muted">
            <GoogleSymbol name="colorize" className="text-muted-foreground" />
            <Input
              type="color"
              value={displayColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 p-0"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


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
    
    // State for editing user contact
    const [editingContactUser, setEditingContactUser] = useState<User | null>(null);
    const [phone, setPhone] = useState('');

    const { toast } = useToast();
   
    const handleSavePhone = async () => {
        if (!editingContactUser) return;
        if (editingContactUser.userId !== realUser.userId) {
            toast({ variant: 'destructive', title: 'Error', description: 'You can only edit your own phone number.' });
            return;
        }
        await updateUser(editingContactUser.userId, { phone });
        setEditingContactUser(null);
        toast({ title: 'Success', description: 'Contact number updated.' });
    };

    return (
        <>
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {users.map(user => {
                    const isCurrentUser = user.userId === realUser.userId;
                    return (
                      <AccordionItem key={user.userId} value={user.userId}>
                        <AccordionTrigger className="p-4 hover:no-underline">
                           <div className="flex items-center gap-4">
                              <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          {isCurrentUser && !user.googleCalendarLinked ? (
                                              <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); linkGoogleCalendar(user.userId); }}>
                                                  <Avatar className="h-10 w-10">
                                                      <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                      <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-gray-400 ring-2 ring-card" />
                                              </Button>
                                          ) : (
                                              <div className="relative">
                                                  <Avatar>
                                                      <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
                                                      <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                  <span className={cn(
                                                      "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card",
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
                                  <p className="font-semibold">{user.displayName}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 pt-0 pl-16">
                             <div className="p-4 rounded-md bg-muted/50 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Title</Label>
                                    <p className="text-sm font-medium">{user.title || <span className="italic text-muted-foreground">Not provided</span>}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Roles &amp; Badges</Label>
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
                                      {(user.roles || []).length === 0 && <p className="text-sm text-muted-foreground italic">No roles assigned</p>}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Contact</Label>
                                    <div className="flex items-center gap-2">
                                        {user.phone ? <p className="text-sm">{user.phone}</p> : <p className="text-sm text-muted-foreground italic">Not provided</p>}
                                        {isCurrentUser && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                setEditingContactUser(user);
                                                setPhone(user.phone || '');
                                            }}>
                                                <GoogleSymbol name="edit" className="text-base" />
                                                <span className="sr-only">Edit phone number</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ColorPicker
                                            user={realUser}
                                            onColorChange={(color) => updateUser(realUser.userId, { primaryColor: color })}
                                        />
                                        <Tabs
                                            value={realUser.theme || 'light'}
                                            onValueChange={(theme) => {
                                                updateUser(realUser.userId, { theme: theme as any, primaryColor: undefined });
                                            }}
                                            className="w-full"
                                        >
                                            <TabsList className="grid w-full grid-cols-2">
                                                {THEME_OPTIONS.map((theme) => (
                                                <TabsTrigger
                                                    key={theme.name}
                                                    value={theme.name}
                                                    className="flex-1 gap-2"
                                                >
                                                    <GoogleSymbol name={theme.icon} className="text-lg" />
                                                    <span>{theme.label}</span>
                                                </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                                {isCurrentUser && (
                                  <>
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
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>

            <Dialog open={!!editingContactUser} onOpenChange={(isOpen) => !isOpen && setEditingContactUser(null)}>
                <DialogContent>
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSavePhone}>
                            <GoogleSymbol name="check" className="text-xl" />
                            <span className="sr-only">Save Phone Number</span>
                        </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle>Edit contact number</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input id="phone-number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 123-456-7890" />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
