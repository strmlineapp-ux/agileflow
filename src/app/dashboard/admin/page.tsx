


'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type User, type AdminGroup, type AppPage, type AppTab, type Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { googleSymbolNames } from '@/lib/google-symbols';
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProps, type DraggableLocation } from 'react-beautiful-dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getContrastColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PagesManagement, AdminGroupsManagement, TabsManagement } from '@/components/admin/page';

const componentMap: Record<string, React.ComponentType<{ tab: AppTab }>> = {
  adminGroups: AdminGroupsManagement,
  pages: PagesManagement,
  tabs: TabsManagement,
};

const PAGE_ID = 'page-admin-management';

export default function AdminPage() {
  const { viewAsUser, loading, appSettings } = useUser();
  
  if (loading) {
    return <AdminPageSkeleton />;
  }

  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);

  if (!viewAsUser.isAdmin || !pageConfig) {
    return null; // Navigation is filtered, so this prevents direct URL access.
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <GoogleSymbol name={pageConfig.icon} className="text-6xl" weight={100} />
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <h1 className="font-headline text-3xl font-thin">{pageConfig.name}</h1>
                </TooltipTrigger>
                {pageConfig.description && (
                    <TooltipContent><p className="max-w-xs">{pageConfig.description}</p></TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className="flex w-full">
          {pageTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 gap-2">
              <GoogleSymbol name={tab.icon} className="text-4xl" weight={100} />
              <span>{tab.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

const AdminPageSkeleton = () => (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-wrap gap-6">
        <Skeleton className="h-64 basis-full md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]" />
        <Skeleton className="h-64 basis-full md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]" />
        <Skeleton className="h-64 basis-full md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]" />
      </div>
    </div>
);
