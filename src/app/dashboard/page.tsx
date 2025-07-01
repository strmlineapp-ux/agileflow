

'use client';

import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/tasks/task-list';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { useUser } from '@/context/user-context';
import { type AppPage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';

const PAGE_ID = 'page-overview';

const stats = [
  { title: 'Active Tasks', value: '12', icon: 'checklist' },
  { title: 'Due this week', value: '5', icon: 'schedule' },
  { title: 'Completed', value: '28', icon: 'check_circle' },
  { title: 'Team Members', value: '8', icon: 'group' },
];

export default function DashboardPage() {
  const { appSettings, updateAppSettings, loading } = useUser();
  
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
      return (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64" />
          </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
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
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <GoogleSymbol name={stat.icon} className="text-muted-foreground text-2xl" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="font-headline text-2xl font-semibold mb-4">Recent Tasks</h2>
        <TaskList limit={5} />
      </div>
    </div>
  );
}
