

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { HslStringColorPicker } from 'react-colorful';
import { Slider } from '../ui/slider';
import { UserCard } from '@/components/common/user-card';

const predefinedColors = [
    'hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(45, 93%, 47%)', 'hsl(88, 62%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(160, 100%, 37%)',
    'hsl(174, 100%, 34%)', 'hsl(188, 95%, 43%)', 'hsl(207, 90%, 54%)', 'hsl(221, 83%, 61%)', 'hsl(244, 100%, 72%)', 'hsl(262, 88%, 66%)',
    'hsl(271, 91%, 65%)', 'hsl(328, 84%, 60%)', 'hsl(347, 89%, 61%)', 'hsl(358, 86%, 56%)'
];

const fontWeightOptions = [
  { value: 100, label: 'Thin' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 700, label: 'Bold' },
];

const iconGradeOptions = [
    { value: -25, label: 'Light' },
    { value: 0, label: 'Normal' },
    { value: 200, label: 'Bold' },
];

const iconOpticalSizeOptions = [
    { value: 20, label: 'Small' },
    { value: 24, label: 'Normal' },
    { value: 40, label: 'Large' },
    { value: 48, label: 'Extra Large' },
];

const CustomColorPicker = ({ colorValue, onUpdate, onClose }: { colorValue: string | null, onUpdate: (newColor: string | null) => void, onClose: () => void }) => {
    const [color, setColor] = useState(colorValue || 'hsl(221, 83%, 61%)');
    const popoverRef = useRef<HTMLDivElement>(null);
    
    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        onUpdate(newColor);
    };

    const handleSwatchClick = (newColor: string) => {
        setColor(newColor);
        onUpdate(newColor);
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div ref={popoverRef} className="space-y-4">
             <HslStringColorPicker color={color} onChange={handleColorChange} className="!w-full" />
             <div className="grid grid-cols-8 gap-1">
                {predefinedColors.map(c => (
                    <button key={c} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} onClick={() => handleSwatchClick(c)} />
                ))}
            </div>
        </div>
    );
};

function CurrentUserCard({ user, isCurrentUser, canEditPreferences, className }: { user: User, isCurrentUser: boolean, canEditPreferences: boolean, className?: string }) {
    const { updateUser, linkGoogleCalendar } = useUser();
    const [isPrimaryColorPopoverOpen, setIsPrimaryColorPopoverOpen] = useState(false);
    const [isFontWeightPopoverOpen, setIsFontWeightPopoverOpen] = useState(false);
    const [isIconGradePopoverOpen, setIsIconGradePopoverOpen] = useState(false);
    const [isIconOpticalSizePopoverOpen, setIsIconOpticalSizePopoverOpen] = useState(false);
    const [isCalendarViewPopoverOpen, setIsCalendarViewPopoverOpen] = useState(false);
    const [isTimeFormatPopoverOpen, setIsTimeFormatPopoverOpen] = useState(false);
    
    const handleSetPrimaryColor = (color: string | null) => {
      updateUser(user.userId, { primaryColor: color });
    }
    
    const handleThemeChange = (e: React.MouseEvent) => {
        const isModifierPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
        if (isModifierPressed) {
            e.preventDefault();
            // Just toggle the wash
            updateUser(user.userId, { hideWash: !user.hideWash });
        } else {
            // Toggle theme and turn wash off
            const newTheme = user.theme === 'dark' ? 'light' : 'dark';
            updateUser(user.userId, { theme: newTheme, hideWash: true });
        }
    }

    const handleResetColors = (e: React.MouseEvent) => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault();
            updateUser(user.userId, { primaryColor: null, hideWash: true });
        }
    }
    
    const handleFontWeightChange = (value: number[]) => {
        const index = value[0];
        const weight = fontWeightOptions[index]?.value;
        if(weight) {
            updateUser(user.userId, { fontWeight: weight });
        }
    }
    
    const handleIconGradeChange = (value: number[]) => {
        const index = value[0];
        const grade = iconGradeOptions[index]?.value;
        if (grade !== undefined) {
            updateUser(user.userId, { iconGrade: grade });
        }
    }

    const handleIconOpticalSizeChange = (value: number[]) => {
        const index = value[0];
        const size = iconOpticalSizeOptions[index]?.value;
        if (size !== undefined) {
            updateUser(user.userId, { iconOpticalSize: size });
        }
    }
    
    const currentWeight = user.fontWeight || 100;
    const currentFontWeightLabel = fontWeightOptions.find(opt => opt.value === currentWeight)?.label || 'Thin';
    const currentWeightIndex = fontWeightOptions.findIndex(opt => opt.value === currentWeight);

    const currentIconGrade = user.iconGrade ?? 0;
    const currentIconGradeLabel = iconGradeOptions.find(opt => opt.value === currentIconGrade)?.label || 'Normal';
    const currentIconGradeIndex = iconGradeOptions.findIndex(opt => opt.value === currentIconGrade);

    const currentIconOpticalSize = user.iconOpticalSize ?? 24;
    const currentIconOpticalSizeLabel = iconOpticalSizeOptions.find(opt => opt.value === currentIconOpticalSize)?.label || 'Normal';
    const currentIconOpticalSizeIndex = iconOpticalSizeOptions.findIndex(opt => opt.value === currentIconOpticalSize);

    
    const calendarViewOptions = [
        { value: "month", label: "Month" },
        { value: "week", label: "Week" },
        { value: "day", label: "Day" },
        { value: "production-schedule", label: "Production Schedule" },
    ];
    const currentCalendarViewLabel = calendarViewOptions.find(opt => opt.value === (user.defaultCalendarView || 'day'))?.label || 'Day';

    const timeFormatOptions = [
        { value: "12h", label: "12-Hour" },
        { value: "24h", label: "24-Hour" },
    ];
    const currentTimeFormatLabel = timeFormatOptions.find(opt => opt.value === (user.timeFormat || '12h'))?.label || '12-Hour';

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
                            <p className="text-lg text-foreground">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.title || <span className="italic">Not provided</span>}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    {canEditPreferences && (
                        <div className="flex items-center gap-1">
                            <Popover open={isPrimaryColorPopoverOpen} onOpenChange={setIsPrimaryColorPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" style={{ color: 'hsl(var(--primary))' }} onClick={handleResetColors}>
                                                    <GoogleSymbol name="radio_button_checked" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Set custom primary color. Modifier+Click to reset.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent 
                                    className="w-auto p-4" 
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                >
                                    <CustomColorPicker colorValue={user.primaryColor || null} onUpdate={handleSetPrimaryColor} onClose={() => setIsPrimaryColorPopoverOpen(false)} />
                                </PopoverContent>
                            </Popover>
                            
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground"
                                            onClick={handleThemeChange}
                                        >
                                            <GoogleSymbol
                                                name={user.theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                            />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                          {`Switch to ${user.theme === 'dark' ? 'Light' : 'Dark'} Theme. Modifier+Click to toggle wash.`}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => {
                                        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { iconFill: false }); }
                                        else { updateUser(user.userId, { iconFill: !user.iconFill }); }
                                     }} className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground">
                                        <GoogleSymbol name="opacity" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Icon Fill: <span className="font-semibold">{user.iconFill ? 'On' : 'Off'}</span></p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                           <Popover open={isFontWeightPopoverOpen} onOpenChange={setIsFontWeightPopoverOpen}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={(e) => { if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { fontWeight: 400 }); } }}>
                                        <GoogleSymbol name="fitness_center" />
                                      </Button>
                                    </PopoverTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Weight: <span className="font-semibold">{currentFontWeightLabel}</span></p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <PopoverContent className="w-48 p-4" align="center">
                                <Slider
                                    value={[currentWeightIndex]}
                                    onValueChange={handleFontWeightChange}
                                    min={0}
                                    max={4}
                                    step={1}
                                />
                              </PopoverContent>
                            </Popover>

                            <Popover open={isIconGradePopoverOpen} onOpenChange={setIsIconGradePopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={(e) => { if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { iconGrade: -25 }); } }}>
                                                    <GoogleSymbol name="tonality" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Icon Grade: <span className="font-semibold">{currentIconGradeLabel}</span></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-48 p-4" align="center">
                                    <Slider value={[currentIconGradeIndex]} onValueChange={handleIconGradeChange} min={0} max={2} step={1} />
                                </PopoverContent>
                            </Popover>
                            
                            <Popover open={isIconOpticalSizePopoverOpen} onOpenChange={setIsIconOpticalSizePopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={(e) => { if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { iconOpticalSize: 20 }); } }}>
                                                    <GoogleSymbol name="visibility" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Optical Size: <span className="font-semibold">{currentIconOpticalSizeLabel}</span></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-48 p-4" align="center">
                                    <Slider value={[currentIconOpticalSizeIndex]} onValueChange={handleIconOpticalSizeChange} min={0} max={3} step={1} />
                                </PopoverContent>
                            </Popover>

                            <Popover open={isCalendarViewPopoverOpen} onOpenChange={setIsCalendarViewPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={(e) => { if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { defaultCalendarView: 'production-schedule' }); } }}>
                                                    <GoogleSymbol name="edit_calendar" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Default Calendar View: <span className="font-semibold">{currentCalendarViewLabel}</span></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-1" align="start">
                                    {calendarViewOptions.map(option => (
                                    <Button
                                        key={option.value}
                                        variant="ghost"
                                        className="justify-start h-8 px-2"
                                        onClick={() => { updateUser(user.userId, { defaultCalendarView: option.value as any }); setIsCalendarViewPopoverOpen(false); }}
                                    >
                                        {option.label}
                                    </Button>
                                    ))}
                              </PopoverContent>
                            </Popover>

                            <Popover open={isTimeFormatPopoverOpen} onOpenChange={setIsTimeFormatPopoverOpen}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={(e) => { if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { timeFormat: '12h' }); } }}>
                                                    <GoogleSymbol name="schedule" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Time Format: <span className="font-semibold">{currentTimeFormatLabel}</span></p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent className="w-auto p-1" align="start">
                                    {timeFormatOptions.map(option => (
                                    <Button
                                        key={option.value}
                                        variant="ghost"
                                        className="justify-start h-8 px-2"
                                        onClick={() => { updateUser(user.userId, { timeFormat: option.value as any }); setIsTimeFormatPopoverOpen(false); }}
                                    >
                                        {option.label}
                                    </Button>
                                    ))}
                                </PopoverContent>
                            </Popover>

                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => {
                                        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); updateUser(user.userId, { easyBooking: false }); }
                                        else { updateUser(user.userId, { easyBooking: !user.easyBooking }); }
                                    }} className="h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground">
                                        <GoogleSymbol name={user.easyBooking ? 'toggle_on' : 'toggle_off'} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Easy Booking: <span className="font-semibold">{user.easyBooking ? 'On' : 'Off'}</span>. Click empty calendar slots to quickly create events.</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                        </div>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}


export function UserManagement({ showSearch = false, isActive = false }: { showSearch?: boolean, isActive?: boolean }) {
    const { realUser, viewAsUser, users } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    
    const currentUser = users.find(u => u.userId === viewAsUser.userId);
        
    const otherUsers = users
        .filter(user => user.userId !== viewAsUser.userId)
        .filter(user => user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    const isCurrentUser = realUser.userId === viewAsUser.userId;
    const canEditPreferences = isCurrentUser || realUser.isAdmin;

    return (
        <div className="space-y-6">
          {currentUser && <CurrentUserCard user={currentUser} isCurrentUser={isCurrentUser} canEditPreferences={canEditPreferences} className="border-0" />}

          {showSearch && (
              <div className="flex justify-end mb-4">
                  <CompactSearchInput 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    placeholder="Search users..." 
                    isActive={isActive}
                  />
              </div>
          )}
          
          {otherUsers.length > 0 && (
              <div className="gap-4 [column-fill:_balance] columns-1 sm:columns-2 md:columns-3 lg:columns-4">
                  {otherUsers.map(user => (
                      <div key={user.userId} className="break-inside-avoid p-2">
                          <UserCard user={user} />
                      </div>
                  ))}
              </div>
          )}
        </div>
    )
}
