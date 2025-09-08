

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { collection, doc, query, where, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!viewAsUser?.workspaceId) return;
    const db = getDb();
    const q = query(collection(db, 'projects'), where('workspaceId', '==', viewAsUser.workspaceId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(projectsData);
    });
    return () => unsubscribe();
  }, [viewAsUser?.workspaceId]);
  
  const addProject = async (projectData: Partial<Project>) => {
    if (!viewAsUser) return;
    const db = getDb();
    await addDoc(collection(db, 'projects'), { ...projectData, owner: { type: 'user', id: viewAsUser.userId }, workspaceId: viewAsUser.workspaceId, icon: 'folder', color: '#888' });
  };
  
  const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    const db = getDb();
    await updateDoc(doc(db, 'projects', projectId), projectData);
  };
  
  const deleteProject = async (projectId: string) => {
    const db = getDb();
    await deleteDoc(doc(db, 'projects', projectId));
  };

  const ownedProjects = useMemo(() => {
    if (!viewAsUser) return [];
    return projects.filter(p => p.owner.id === viewAsUser.userId);
  }, [projects, viewAsUser]);

  const handleSaveProject = useCallback(async (projectData: Partial<Project>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
    setEditingProject(null);
    setIsFormOpen(false);
  }, [addProject, updateProject, editingProject]);
  
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
                              <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); updateProject(project.id, { isShared: !project.isShared }); }}>
                                  <GoogleSymbol name={project.isShared ? 'share' : 'share_off'} />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{project.isShared ? 'Unshare' : 'Share'}</p>
                          </TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
                  <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(project);}}><GoogleSymbol name="edit" /></Button>
                  <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); deleteProject(project.id);}}><GoogleSymbol name="delete" className="text-destructive" /></Button>
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
