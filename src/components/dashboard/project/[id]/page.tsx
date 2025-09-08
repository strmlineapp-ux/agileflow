
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
import { PageTitle } from '@/components/common/page-title';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


const componentMap = {
  events: EventsContent,
  tasks: TasksContent,
};

async function fetchProject(projectId: string): Promise<Project | null> {
    const db = getDb();
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
    }
    return null;
}

async function updateProjectMutationFn(variables: { projectId: string, data: Partial<Project> }) {
    const { projectId, data } = variables;
    const db = getDb();
    await updateDoc(doc(db, 'projects', projectId), data);
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const { appSettings, viewAsUser, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const { id: projectId } = params as { id: string };

  const { data: projectContext, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: updateProjectMutationFn,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects', viewAsUser.workspaceId] });
    },
  });

  const page = useMemo(() => {
    if (userLoading || !appSettings.pages.length) {
      return null;
    }
    const foundPage = appSettings.pages.find(p => p.id === 'page-projects');
    if (!foundPage || !hasAccess(viewAsUser!, foundPage)) {
        return null;
    }
    return foundPage;
  }, [appSettings, viewAsUser, userLoading]);

  const handleUpdateProject = (id: string, data: Partial<Project>) => {
    updateMutation.mutate({ projectId: id, data });
  };


  if (userLoading || projectLoading) {
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
          <h2 className="text-2xl mb-2">Project Not Found</h2>
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
      <Tabs defaultValue={pageTabs[0].id} className="flex flex-col flex-1 min-h-0">
        <div className="center-and-scroll no-scrollbar">
            <TabsList>
                {pageTabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                        <GoogleSymbol name={tab.icon} />
                        {tab.name}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
         <div className="flex-1 overflow-y-auto">
            {pageTabs.map(tab => {
                const Component = componentMap[tab.componentKey as keyof typeof componentMap];
                return Component ? (
                    <TabsContent key={tab.id} value={tab.id} className="h-full mt-0">
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
        <PageTitle 
            title={projectContext.name}
            icon={page.icon}
            iconColor={page.color}
            onSave={(newName) => handleUpdateProject(projectContext.id, { name: newName })}
            disabled={projectContext.owner.id !== viewAsUser.userId}
        />
       {renderContent()}
    </div>
  )
}
