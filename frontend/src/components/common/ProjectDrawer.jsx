import React, { useState, useEffect, useRef } from 'react';
import { X, FolderGit2, Loader2, Plus, Edit2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

export default function ProjectDrawer({
  isOpen,
  onClose,
  project = null, // null for Add, project object for Edit
  onSuccess
}) {
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    projectType: 'Academic',
    status: 'Completed',
    duration: '',
    technologies: '',
    githubUrl: '',
    liveDemoUrl: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const firstInputRef = useRef(null);

  // Populate form on edit or reset on add
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        role: project.role || '',
        projectType: project.projectType || 'Academic',
        status: project.status || 'Completed',
        duration: project.duration || '',
        technologies: Array.isArray(project.technologies) 
          ? project.technologies.join(', ') 
          : (project.technologies || project.tech || ''),
        githubUrl: project.githubUrl || project.sourceUrl || '',
        liveDemoUrl: project.liveDemoUrl || project.demoUrl || '',
        description: project.description || ''
      });
    } else {
      setFormData({
        title: '',
        role: '',
        projectType: 'Academic',
        status: 'Completed',
        duration: '',
        technologies: '',
        githubUrl: '',
        liveDemoUrl: '',
        description: ''
      });
    }
    setIsFormDirty(false);
  }, [project, isOpen]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFormDirty]);

  const handleSafeClose = () => {
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (project && project.id) {
        // Update existing project
        await api.put(`/student/projects/${project.id}`, formData);
        toast.success('Project updated successfully');
      } else {
        // Create new project
        await api.post('/student/projects', formData);
        toast.success('Project added successfully');
      }
      setIsFormDirty(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click Backdrop */}
      <div className="absolute inset-0" onClick={handleSafeClose} aria-hidden="true" />

      <div className="absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex">
        <div className="w-full h-full sm:h-auto sm:w-screen sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-white shadow-2xl flex flex-col border-0 sm:border-l border-slate-200 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleSafeClose}
                className="sm:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={18} className="text-[#F47C20]" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FFF4EB] border border-orange-200 text-[#F47C20] flex items-center justify-center shrink-0">
                <FolderGit2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#F47C20] uppercase tracking-wider truncate">
                  {project ? 'Edit Project' : 'Add New Project'}
                </p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {project ? project.title : 'Project Details'}
                </h3>
              </div>
            </div>

            <button
              onClick={handleSafeClose}
              className="p-2 text-[#F47C20] hover:text-[#d96916] bg-[#FFF4EB] hover:bg-orange-100 rounded-xl border border-[#F47C20]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] shrink-0 ml-2 cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X size={20} className="text-[#F47C20]" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5" onChange={() => setIsFormDirty(true)}>
            
            {/* Project Title */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Placement Management System"
                className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
              />
            </div>

            {/* Role & Project Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Your Role / Contribution
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Full Stack Developer, Team Lead"
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Project Type
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all cursor-pointer"
                >
                  <option value="Academic">Academic</option>
                  <option value="Personal">Personal</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Technologies Used <span className="text-red-500">*</span> (comma-separated)
              </label>
              <input
                type="text"
                required
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                placeholder="e.g. Java, Spring Boot, React, MySQL, Docker, Git"
                className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
              />
            </div>

            {/* Duration & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Duration / Timeline
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. Jan 2026 – Apr 2026"
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all cursor-pointer"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </div>
            </div>

            {/* URLs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username/repo"
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={formData.liveDemoUrl}
                  onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
                  placeholder="https://demo-app.com"
                  className="w-full h-11 px-3.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe key features, architecture, tools, and technical impact..."
                className="w-full p-3.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all leading-relaxed"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
              <button
                type="button"
                onClick={handleSafeClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#F47C20]" />
                    <span>{project ? 'Updating...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{project ? 'Update Project' : 'Save Project'}</span>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
