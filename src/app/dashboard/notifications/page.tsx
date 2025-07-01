

'use client';

import { useState, useMemo, useRef } from 'react';
import { NotificationList } from '@/components/notifications/notification-list';
import { Badge } from '@/components/ui/badge';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { type AppPage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_ID = 'page-notifications';

export default function NotificationsPage() {
  const { notifications, appSettings, updateAppSettings, loading } = useUser();
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);

  // Header Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const iconSearchInputRef = useRef<HTMLInputElement>(null);

  const updatePage = (data: Partial<AppPage>) => {
    if (!pageConfig) return;
    const newPages = appSettings.pages.map(p => p.id === PAGE_ID ? { ...p, ...data } : p);
    updateAppSettings({ pages: newPages });
  };
  
  const handleSaveTitle = () => {
    const newName = titleInputRef.current?.value.trim();
    if (newName && pageConfig && newName !== pageConfig.name) {
      updatePage({ name: newName });
    }
    setIsEditingTitle(false);
  };
  
  const filteredIcons = useMemo(() => googleSymbolNames.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())), [iconSearch]);

  if (loading || !pageConfig) {
      return <Skeleton className="h-full w-full" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-3xl shrink-0" style={{ color: pageConfig.color }}>
                <GoogleSymbol name={pageConfig.icon} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="flex items-center gap-1 p-2 border-b">
                  {!isSearchingIcons ? ( <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsSearchingIcons(true)}> <GoogleSymbol name="search" /> </Button> ) : (
                      <div className="flex items-center gap-1 w-full"> <GoogleSymbol name="search" className="text-muted-foreground text-xl" /> <input ref={iconSearchInputRef} placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} onBlur={() => !iconSearch && setIsSearchingIcons(false)} className="w-full h-8 p-0 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0" /> </div>
                  )}
              </div>
              <ScrollArea className="h-64"><div className="grid grid-cols-6 gap-1 p-2">{filteredIcons.slice(0, 300).map((iconName) => (<Button key={iconName} variant={pageConfig.icon === iconName ? "default" : "ghost"} size="icon" onClick={() => { updatePage({ icon: iconName }); setIsIconPopoverOpen(false);}} className="text-2xl"><GoogleSymbol name={iconName} /></Button>))}</div></ScrollArea>
            </PopoverContent>
          </Popover>
          {isEditingTitle ? (
            <Input ref={titleInputRef} defaultValue={pageConfig.name} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' ? handleSaveTitle() : e.key === 'Escape' && setIsEditingTitle(false)} className="h-auto p-0 font-headline text-3xl font-semibold border-0 rounded-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
          ) : (
            <h1 className="font-headline text-3xl font-semibold cursor-pointer" onClick={() => setIsEditingTitle(true)}>{pageConfig.name}</h1>
          )}
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full text-base px-3">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
      <NotificationList />
    </div>
  );
}
