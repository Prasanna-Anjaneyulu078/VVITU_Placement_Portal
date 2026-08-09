import React, { useState, useEffect, useCallback } from 'react';
import { FolderGit2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import { SectionLoader } from './loading';
import ProjectDrawer from './ProjectDrawer';
import DeleteProjectDialog from './DeleteProjectDialog';
import ProjectEmptyState from './ProjectEmptyState';
import ProjectCard from './ProjectCard';

export default function StudentProjectsSection({ refreshTrigger = 0 }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state (Add & Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Delete dialog state
  const [deletingProject, setDeletingProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get('/student/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to fetch student projects", err);
      toast.error("Failed to load projects.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(false);
  }, [fetchProjects, refreshTrigger]);

  const handleOpenAddDrawer = () => {
    setEditingProject(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (project) => {
    setEditingProject(project);
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      await api.delete(`/student/projects/${deletingProject.id}`);
      setProjects(prev => prev.filter(p => p.id !== deletingProject.id));
      toast.success(`Project "${deletingProject.title}" deleted successfully.`);
      setDeletingProject(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to delete project.';
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2">
      {/* SECTION HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-[#F47C20] text-xs uppercase tracking-wider flex items-center gap-2">
            <FolderGit2 size={18}/> Projects
          </h4>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100/70 text-[#F47C20]">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddDrawer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-black transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
      </div>

      {/* SECTION CONTENT */}
      <div className="p-6">
        {isLoading ? (
          <SectionLoader rows={3} />
        ) : projects.length === 0 ? (
          <ProjectEmptyState onAddProject={handleOpenAddDrawer} />
        ) : (
          <div className="space-y-4">
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                onEdit={handleOpenEditDrawer}
                onDelete={(p) => setDeletingProject(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT RIGHT-SIDE SLIDE DRAWER */}
      <ProjectDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={() => fetchProjects(true)}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteProjectDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        projectTitle={deletingProject?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}
