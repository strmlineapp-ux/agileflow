

'use client';

import React from 'react';
import { useUser } from '@/context/user-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarManagement } from '@/components/service-delivery/calendar-management';
import { TeamManagement } from '@/components/service-delivery/team-management';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { type AppTab } from '@/types';

// This is a mapping from the componentKey in our AppTab model to the actual component to render.
const componentMap: Record<string, React.ComponentType<{ tab: AppTab }>> = {
  calendars: CalendarManagement,
  teams: TeamManagement,
};

// Define a unique identifier for this page
const PAGE_ID = 'page-service-delivery';

export default function ServiceDeliveryPage() {
  const { appSettings } = useUser();

  const pageConfig = appSettings.pages.find(p => p.id === PAGE_ID);
  
  if (!pageConfig) {
    // Optionally return a skeleton or a not-found message if the page config isn't available
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pageTabs = appSettings.tabs.filter(t => pageConfig.associatedTabs.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <GoogleSymbol name={pageConfig.icon} className="text-3xl" style={{color: pageConfig.color}} />
        <h1 className="font-headline text-3xl font-semibold">{pageConfig.name}</h1>
      </div>
      
      <Tabs defaultValue={pageTabs[0]?.id} className="w-full">
        <TabsList className={`grid w-full grid-cols-${pageTabs.length}`}>
          {pageTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.name}</TabsTrigger>
          ))}
        </TabsList>
        {pageTabs.map(tab => {
          const ContentComponent = componentMap[tab.componentKey];
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {ContentComponent ? <ContentComponent tab={tab} /> : <div>Component for {tab.name} not found.</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
