
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { GoogleSymbol } from '@/components/icons/google-symbol';
import { hasAccess } from '@/lib/permissions';
import { type AppTab, type Project } from '@/types';
import { EventsContent } from '@/components/dashboard/tabs/events-tab';
import { TasksContent } from '@/components/dashboard/tabs/tasks-tab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const componentMap = {
  events: EventsContent,
  tasks: TasksContent,
};


export default function ProjectDetailsPage() {
  const params = useParams();
  const { appSettings, viewAsUser, loading, projects } = useUser();
  const { id: projectId } = params;

  const { page, projectContext } = useMemo(() => {
    if (loading || !appSettings.pages.length) {
      return { page: null, projectContext: null };
    }

    const foundPage = appSettings.pages.find(p => p.id === 'page-projects');
    if (!foundPage) {
        return { page: null, projectContext: null };
    }
    
    let foundProject: Project | null = null;

    if (projectId) {
        foundProject = projects.find(p => p.id === projectId) || null;
    }
    
    if (!hasAccess(viewAsUser!, foundPage)) {
        return { page: null, projectContext: null };
    }

    return { page: foundPage, projectContext: foundProject };
  }, [projectId, appSettings, viewAsUser, loading, projects]);


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <GoogleSymbol name="progress_activity" className="animate-spin text-4xl text-primary" />
      </div>
    );
  }
  
  if (!page || !projectContext) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-headline text-2xl font-thin mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">The project you are looking for does not exist or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const pageTabs = page.associatedTabs
        .map(tabId => appSettings.tabs.find(t => t.id === tabId))
        .filter((t): t is AppTab => !!t);

    if (pageTabs.length === 0) {
       return (
          <div className="text-center text-muted-foreground">
            <p>This project page has no content tabs configured.</p>
          </div>
        );
    }
    
    return (
      <Tabs defaultValue={pageTabs[0].id} className="flex flex-col flex-1 gap-6">
        <TabsList>
            {pageTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    <GoogleSymbol name={tab.icon} />
                    {tab.name}
                </TabsTrigger>
            ))}
        </TabsList>
         <div className="flex-1 overflow-y-auto">
            {pageTabs.map(tab => {
                const Component = componentMap[tab.componentKey as keyof typeof componentMap];
                return Component ? (
                    <TabsContent key={tab.id} value={tab.id} className="h-full">
                        <Component project={projectContext} />
                    </TabsContent>
                ) : null;
            })}
        </div>
      </Tabs>
    )
  }
  
  return (
    <div className="flex flex-col h-full gap-6">
        <h1 className="font-headline text-2xl font-thin text-muted-foreground flex items-center gap-2">
            <GoogleSymbol name={page.icon} style={{color: page.color}} />
            {projectContext.name}
        </h1>
       {renderContent()}
    </div>
  )
}
