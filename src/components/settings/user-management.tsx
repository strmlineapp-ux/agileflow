

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
import { HexColorPicker, HexColorInput } from 'react-colorful';

const predefinedColors = [
    '#EF4444', '#F97316', '#FBBF24', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
];

const CustomColorPicker = ({ user, onUpdate, onClose }: { user: User, onUpdate: (newColor: string) => void, onClose: () => void }) => {
    const [color, setColor] = useState(user.primaryColor || '#64748B');
    
    const handleSave = () => {
        onUpdate(color);
        onClose();
    };

    return (
        <div className="space-y-4">
             <HexColorPicker color={color} onChange={setColor} className="!w-full" />
             <div className="flex items-center gap-2">
                <span className="p-2 border rounded-md shadow-sm" style={{ backgroundColor: color }} />
                <HexColorInput prefixed alpha color={color} onChange={setColor} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50" />
             </div>
             <div className="grid grid-cols-8 gap-1">
                {predefinedColors.map(c => (
                    <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => onUpdate(c)} />
                ))}
            </div>
            <Button onClick={handleSave} className="w-full bg-primary">Set Color</Button>
        </div>
    );
};


const SettingSelect = ({
  value,
  onSave,
  options,
  placeholder,
  icon,
  tooltip,
  disabled = false,
}: {
  value: string;
  onSave: (newValue: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon: string;
  tooltip: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" disabled={disabled}>
                            <GoogleSymbol name={icon} className="text-xl" grade={-25} weight={100} opticalSize={20} />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}: <span className="font-semibold">{currentLabel}</span></p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-auto p-1" align="start">
            {options.map(option => (
            <Button
                key={option.value}
                variant="ghost"
                className="justify-start h-8 px-2"
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

const DragActivationKeySetting = ({ user, onUpdate }: { user: User, onUpdate: (key: User['dragActivationKey']) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const keyInput = user.dragActivationKey || 'shift';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (['alt', 'control', 'meta', 'shift'].includes(key)) {
            const newKey = key === 'control' ? 'ctrl' : key as 'alt' | 'meta' | 'shift';
            onUpdate(newKey);
            setIsOpen(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground">
                                <GoogleSymbol name="smart_button" className="text-xl" grade={-25} weight={100} opticalSize={20} />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Drag Modifier: <span className="font-semibold capitalize">{keyInput}</span>+Click. Click to change.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-auto p-2" align="start">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Press a modifier key...</p>
                    <Input
                        value={keyInput.charAt(0).toUpperCase() + keyInput.slice(1)}
                        onKeyDown={handleKeyDown}
                        className="text-center w-24"
                        readOnly
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}

function UserCard({ user, isCurrentUser, canEditPreferences, className }: { user: User, isCurrentUser: boolean, canEditPreferences: boolean, className?: string }) {
    const { updateUser, linkGoogleCalendar } = useUser();
    const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
    
    const handleSetPrimaryColor = (color: string) => {
      updateUser(user.userId, { primaryColor: color });
      setIsColorPopoverOpen(false);
    }
    
    const handleThemeChange = () => {
        const newTheme = user.theme === 'dark' ? 'light' : 'dark';
        updateUser(user.userId, { theme: newTheme, primaryColor: undefined });
    }
    
    return (
        <Card className={cn("bg-transparent", className)}>
            <CardHeader>
                <div className="flex items-start justify-between">
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
                                            user.googleCalendarLinked ? "bg-green-500" : "bg-gray-400",
                                            isCurrentUser && !user.googleCalendarLinked && "cursor-pointer"
                                        )} 
                                        onClick={(e) => {
                                            if (isCurrentUser && !user.googleCalendarLinked) {
                                              e.stopPropagation();
                                              linkGoogleCalendar(user.userId);
                                            }
                                        }}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Google Calendar: {user.googleCalendarLinked ? 'Connected' : isCurrentUser ? 'Click to connect' : 'Not Connected'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div>
                            <p className="font-semibold text-lg">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.title || <span className="italic">Not provided</span>}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    {canEditPreferences && (
                        <div className="flex items-center gap-1">
                            <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" style={{ color: 'hsl(var(--primary))' }}>
                                                    <GoogleSymbol name="palette" grade={-25} weight={100} opticalSize={20} />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Set custom primary color</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent 
                                    className="w-auto p-4" 
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                >
                                    <CustomColorPicker user={user} onUpdate={handleSetPrimaryColor} onClose={() => setIsColorPopoverOpen(false)} />
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
                                            <GoogleSymbol name={user.theme === 'dark' ? 'dark_mode' : 'light_mode'} className="text-lg" grade={-25} weight={100} opticalSize={20} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Switch to {user.theme === 'dark' ? 'Light' : 'Dark'} Theme</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <SettingSelect
                                value={user.defaultCalendarView || 'day'}
                                onSave={(newValue) => updateUser(user.userId, { defaultCalendarView: newValue as any})}
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
                                value={user.timeFormat || '12h'}
                                onSave={(newValue) => updateUser(user.userId, { timeFormat: newValue as any})}
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
                                    <Button variant="ghost" size="icon" onClick={() => updateUser(user.userId, { easyBooking: !user.easyBooking })} className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground">
                                        <GoogleSymbol name={user.easyBooking ? 'toggle_on' : 'toggle_off'} className="text-2xl" grade={-25} weight={100} opticalSize={20} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Easy Booking: <span className="font-semibold">{user.easyBooking ? 'On' : 'Off'}</span>. Click empty calendar slots to quickly create events.</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DragActivationKeySetting
                                user={user}
                                onUpdate={(newKey) => updateUser(user.userId, { dragActivationKey: newKey })}
                            />
                        </div>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}


export function UserManagement({ showSearch = false }: { showSearch?: boolean }) {
    const { realUser, viewAsUser, users } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    
    const { currentUser, otherUsers } = useMemo(() => {
        if (!viewAsUser) {
            return { currentUser: null, otherUsers: [] };
        }
        const currentUser = users.find(u => u.userId === viewAsUser.userId);
        
        const otherUsers = users
            .filter(user => user.userId !== viewAsUser.userId)
            .filter(user => user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

        return { currentUser, otherUsers };
    }, [users, viewAsUser, searchTerm]);

    if (!viewAsUser || !currentUser) {
        return null; // or a loading skeleton
    }
    
    const isCurrentUser = realUser ? realUser.userId === viewAsUser.userId : false;
    const canEditPreferences = isCurrentUser || (realUser ? realUser.isAdmin : false);

    return (
        <div className="space-y-6">
          <UserCard user={currentUser} isCurrentUser={isCurrentUser} canEditPreferences={canEditPreferences} className="border-0" />

          {showSearch && (
              <div className="flex justify-end mb-4">
                  <CompactSearchInput 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    placeholder="Search users..."
                  />
              </div>
          )}
          
          {otherUsers.length > 0 && (
              <div className="flex flex-wrap -m-2">
                  {otherUsers.map(user => (
                      <div key={user.userId} className="p-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5">
                          <UserCard user={user} isCurrentUser={false} canEditPreferences={false} />
                      </div>
                  ))}
              </div>
          )}
        </div>
    )
}
