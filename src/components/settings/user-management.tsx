
'use client';

import { useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { type User, type Team } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { GoogleSymbol } from '../icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CompactSearchInput } from '../common/compact-search-input';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const SettingSelect = ({
  value,
  onSave,
  options,
  placeholder,
  icon,
  tooltip,
}: {
  value: string;
  onSave: (newValue: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon: string;
  tooltip: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-1 text-muted-foreground hover:bg-transparent hover:text-foreground h-9 w-auto px-2">
                            <GoogleSymbol name={icon} className="text-xl" weight={100} />
                            <span className="text-sm">{currentLabel}</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-auto p-1" align="start">
            {options.map(option => (
            <Button
                key={option.value}
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={() => {
                onSave(option.value);
                setIsOpen(false);
                }}
            >
                {option.label}
            </Button>
            ))}
      </PopoverContent>
    </Popover>
  );
};


export function UserManagement({ showSearch = false }: { showSearch?: boolean }) {
    const { realUser, users, updateUser, linkGoogleCalendar, allBadges } = useUser();
    const { toast } = useToast();
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user => user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);
    
    const handleSetPrimaryColor = (color: string) => {
      updateUser(realUser.userId, { primaryColor: color });
      setIsColorPopoverOpen(false);
    }
    
    const handleThemeChange = () => {
        const newTheme = realUser.theme === 'dark' ? 'light' : 'dark';
        updateUser(realUser.userId, { theme: newTheme, primaryColor: undefined });
    }

    return (
        <>
          {showSearch && (
              <div className="flex justify-end mb-4">
                  <CompactSearchInput 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    placeholder="Search users..." 
                    autoFocus={true} 
                  />
              </div>
          )}
          <div className="grid grid-cols-1 gap-6">
            {filteredUsers.map(user => {
              const isCurrentUser = user.userId === realUser.userId;
              return (
                <Card key={user.userId} className="bg-transparent">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
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
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Google Calendar: {user.googleCalendarLinked ? 'Connected' : isCurrentUser ? 'Click to connect' : 'Not Connected'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <div>
                                    <p className="font-semibold text-lg">{user.displayName}</p>
                                    <p className="text-sm font-medium">{user.title || <span className="italic text-muted-foreground">Not provided</span>}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            {isCurrentUser && (
                                <div className="flex items-center gap-2">
                                    <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" style={{ color: 'hsl(var(--primary))' }}>
                                                            <GoogleSymbol name="palette" weight={100} />
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
                                    
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleThemeChange}
                                                    className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground"
                                                >
                                                    <GoogleSymbol name={realUser.theme === 'dark' ? 'dark_mode' : 'light_mode'} className="text-lg" weight={100} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Switch to {realUser.theme === 'dark' ? 'Light' : 'Dark'} Theme</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <SettingSelect
                                        value={realUser.defaultCalendarView || 'day'}
                                        onSave={(newValue) => updateUser(realUser.userId, { defaultCalendarView: newValue as any})}
                                        options={[
                                            { value: "month", label: "Month" },
                                            { value: "week", label: "Week" },
                                            { value: "day", label: "Day" },
                                            { value: "production-schedule", label: "Production Schedule" },
                                        ]}
                                        placeholder="Select Default View"
                                        icon="edit_calendar"
                                        tooltip="Default Calendar View"
                                    />
                                    <SettingSelect
                                        value={realUser.timeFormat || '12h'}
                                        onSave={(newValue) => updateUser(realUser.userId, { timeFormat: newValue as any})}
                                        options={[
                                            { value: "12h", label: "12-Hour" },
                                            { value: "24h", label: "24-Hour" },
                                        ]}
                                        placeholder="Select Time Format"
                                        icon="schedule"
                                        tooltip="Time Format"
                                    />
                                    <TooltipProvider>
                                        <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" onClick={() => updateUser(realUser.userId, { easyBooking: !realUser.easyBooking })} className="flex items-center gap-1 text-muted-foreground hover:bg-transparent hover:text-foreground h-9 px-2">
                                                <GoogleSymbol name={realUser.easyBooking ? 'toggle_on' : 'toggle_off'} className="text-2xl" weight={100} />
                                                <span className="text-sm">Easy Booking</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click empty calendar slots to quickly create events.</p>
                                        </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>
              )
            })}
          </div>
        </>
    )
}
