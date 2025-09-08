
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useUser } from '@/context/user-context';
import { type Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GoogleSymbol } from '../../icons/google-symbol';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { getDb } from '@/lib/firebase';
import { collection, doc, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

async function fetchProjects(workspaceId: string): Promise<Project[]> {
    const db = getDb();
    const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

async function addProjectMutationFn(variables: { projectData: Partial<Project>, ownerId: string, workspaceId: string }) {
    const { projectData, ownerId, workspaceId } = variables;
    const db = getDb();
    await addDoc(collection(db, 'projects'), { ...projectData, owner: { type: 'user', id: ownerId }, workspaceId, icon: 'folder', color: '#888' });
}

async function updateProjectMutationFn(variables: { projectId: string, projectData: Partial<Project> }) {
    const { projectId, projectData } = variables;
    const db = getDb();
    await updateDoc(doc(db, 'projects', projectId), projectData);
}

async function deleteProjectMutationFn(projectId: string) {
    const db = getDb();
    await deleteDoc(doc(db, 'projects', projectId));
}

function ProjectForm({ onSave, onClose, project }: { onSave: (projectData: Partial<Project>) => void, onClose: () => void, project?: Project | null }) {
  const [name, setName] = useState(project?.name || '');

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave({ ...project, name });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project Name"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </>
  );
}

export function ProjectsContent() {
  const { viewAsUser } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', viewAsUser.workspaceId],
    queryFn: () => fetchProjects(viewAsUser.workspaceId),
    enabled: !!viewAsUser.workspaceId,
  });
  
  const mutationOptions = {
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects', viewAsUser.workspaceId] });
        toast({ title: 'Success' });
    },
    onError: (error: Error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  };

  const addMutation = useMutation({ mutationFn: addProjectMutationFn, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateProjectMutationFn, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteProjectMutationFn, ...mutationOptions });

  const ownedProjects = useMemo(() => {
    if (!viewAsUser) return [];
    return projects.filter(p => p.owner.id === viewAsUser.userId);
  }, [projects, viewAsUser]);

  const handleSaveProject = useCallback((projectData: Partial<Project>) => {
    if (editingProject) {
      updateMutation.mutate({ projectId: editingProject.id, projectData });
    } else {
      addMutation.mutate({ projectData, ownerId: viewAsUser.userId, workspaceId: viewAsUser.workspaceId });
    }
    setEditingProject(null);
    setIsFormOpen(false);
  }, [addMutation, updateMutation, editingProject, viewAsUser]);
  
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/project/${projectId}`);
  };
  
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl">Projects</h2>
        <Button onClick={handleAddNew}>
            <GoogleSymbol name="add" className="mr-2" />
            New Project
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Projects you own and manage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ownedProjects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleProjectClick(project.id)}>
                <div className="flex items-center gap-2">
                    <GoogleSymbol name={project.icon} style={{color: project.color}} />
                    <span className="font-medium">{project.name}</span>
                </div>
                <div className="flex items-center gap-2">
                   <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ projectId: project.id, projectData: { isShared: !project.isShared } }); }}>
                                  <GoogleSymbol name={project.isShared ? 'share' : 'share_off'} />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{project.isShared ? 'Unshare' : 'Share'}</p>
                          </TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
                  <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(project);}}><GoogleSymbol name="edit" /></Button>
                  <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(project.id);}}><GoogleSymbol name="delete" className="text-destructive" /></Button>
                </div>
              </div>
            ))}
             {ownedProjects.length === 0 && <p className="text-sm text-center p-4">No projects yet.</p>}
          </div>
        </CardContent>
      </Card>
      {/* TODO: Add section for linked projects */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <ProjectForm 
                onSave={handleSaveProject} 
                onClose={() => setIsFormOpen(false)} 
                project={editingProject} 
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
