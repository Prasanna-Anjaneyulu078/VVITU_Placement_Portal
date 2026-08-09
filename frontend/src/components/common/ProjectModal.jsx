import React, { useState, useEffect } from 'react';
import { Modal, Button, LoadingSpinner } from './index';
import { FolderGit2, Code, Calendar, Link as LinkIcon, Github, ExternalLink, Award, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

export default function ProjectModal({
  isOpen,
  onClose,
  project = null, // null for Add, project object for Edit
  onSuccess
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    role: '',
    projectType: 'Academic',
    githubUrl: '',
    liveDemoUrl: '',
    duration: '',
    status: 'Completed'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        technologies: project.technologies || '',
        role: project.role || '',
        projectType: project.projectType || 'Academic',
        githubUrl: project.githubUrl || '',
        liveDemoUrl: project.liveDemoUrl || '',
        duration: project.duration || '',
        status: project.status || 'Completed'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        technologies: '',
        role: '',
        projectType: 'Academic',
        githubUrl: '',
        liveDemoUrl: '',
        duration: '',
        status: 'Completed'
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Project Title is required.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Project Description is required.');
      return;
    }
    if (!formData.technologies.trim()) {
      toast.error('At least one technology is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (project && project.id) {
        await api.put(`/student/projects/${project.id}`, formData);
        toast.success(`Project "${formData.title}" updated successfully.`);
      } else {
        await api.post('/student/projects', formData);
        toast.success(`Project "${formData.title}" added successfully.`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to save project.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? "Edit Project Details" : "Add New Project"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Placement Management System"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Your Role / Contribution
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Full Stack Developer, Team Lead"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Project Type
            </label>
            <select
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            >
              <option value="Academic">Academic</option>
              <option value="Personal">Personal</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* Technologies Used */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Technologies Used <span className="text-red-500">*</span> (comma-separated)
            </label>
            <input
              type="text"
              required
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              placeholder="e.g. Java, Spring Boot, React, MySQL, Docker"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Duration / Dates
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. Jan 2026 – Apr 2026"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Ongoing">Ongoing</option>
            </select>
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              placeholder="https://github.com/username/repository"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Live Demo URL */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Live Demo / Hosted URL
            </label>
            <input
              type="url"
              value={formData.liveDemoUrl}
              onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
              placeholder="https://project-demo.com"
              className="w-full h-10 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the key features, architecture, and impact of the project..."
              className="w-full p-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-[#F47C20] hover:bg-[#d96916] text-white font-extrabold px-6 rounded-xl shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" /> Saving...
              </span>
            ) : project ? 'Update Project' : 'Add Project'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
