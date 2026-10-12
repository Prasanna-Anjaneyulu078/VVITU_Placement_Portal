import React, { useState } from 'react';
import { 
  Edit2, Trash2, Github, ExternalLink, Calendar, 
  ChevronDown, ChevronUp, Eye, Tag, Clock
} from 'lucide-react';

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!project) return null;

  const cleanUrl = (str) => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;

    const httpMatches = trimmed.match(/https?:\/\/[^\s]+/gi);
    if (httpMatches && httpMatches.length > 0) {
      return httpMatches[0].trim();
    }

    if (trimmed.includes('.') || trimmed.includes('/')) {
      return `https://${trimmed.replace(/^https?:\/\//i, '')}`;
    }

    return trimmed;
  };

  const isUrl = (str) => {
    const url = cleanUrl(str);
    return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
  };

  const formatUrl = (str) => {
    return cleanUrl(str) || '#';
  };

  const getTechList = (techStr) => {
    if (!techStr) return [];
    const rawList = Array.isArray(techStr) ? techStr : techStr.split(/[,•|]+/).map(t => t.trim()).filter(Boolean);
    return rawList.filter(t => !t.startsWith('http://') && !t.startsWith('https://') && !t.includes('github.com'));
  };

  const getBadgeColor = (type) => {
    switch ((type || '').toUpperCase()) {
      case 'INTERNSHIP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FREELANCE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PERSONAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACADEMIC':
      default:
        return 'bg-orange-50 text-[#F47C20] border-orange-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN PROGRESS':
      case 'IN_PROGRESS':
      case 'ONGOING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const techList = getTechList(project.technologies || project.tech || project.techStack);
  const githubLink = cleanUrl(project.githubUrl || project.sourceUrl || project.gitUrl || project.githubURL || project.githubLink);
  const demoLink = cleanUrl(project.liveDemoUrl || project.demoUrl || project.liveLink || project.liveDemoURL);

  return (
    <div className="bg-white border border-slate-200/90 hover:border-orange-200 rounded-2xl p-5 shadow-2xs space-y-3.5 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3">
        <div className="space-y-1 min-w-0 w-full sm:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-base font-extrabold text-slate-900 leading-snug break-words">{project.title}</h5>
            
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${getBadgeColor(project.projectType)}`}>
              {project.projectType || 'Academic'}
            </span>

            {project.status && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${getStatusBadgeClass(project.status)}`}>
                {project.status}
              </span>
            )}
          </div>

          {project.role && (
            <p className="text-xs font-bold text-[#F47C20]">{project.role}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 mt-1 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="px-2.5 py-1 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
            title={isExpanded ? "Collapse Details" : "View Details"}
          >
            <Eye size={13} className="text-[#F47C20]" />
            <span>{isExpanded ? 'Collapse' : 'View'}</span>
            {isExpanded ? <ChevronUp size={13} className="text-[#F47C20]" /> : <ChevronDown size={13} className="text-[#F47C20]" />}
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="px-2.5 py-1 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
              title="Edit Project"
            >
              <Edit2 size={13} className="text-[#F47C20]" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-[#F47C20] text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
              title="Delete Project"
            >
              <Trash2 size={13} className="text-[#F47C20]" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Description Snippet */}
      <p className={`text-xs text-slate-600 leading-relaxed font-medium break-words ${!isExpanded ? 'line-clamp-2' : ''}`}>
        {project.description}
      </p>

      {/* Technologies Chips */}
      {techList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {techList.map((tech, idx) => (
            <span 
              key={idx} 
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-extrabold rounded-lg"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Details Content */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap justify-between items-center gap-3 text-xs pt-1">
            {project.duration ? (
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar size={13} className="text-[#F47C20]" /> {project.duration}
              </span>
            ) : (
              <span />
            )}

            <div className="flex flex-wrap items-center gap-2">
              {isUrl(githubLink) && (
                <a
                  href={formatUrl(githubLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  <Github size={14} className="text-[#F47C20]" /> GitHub Repository
                </a>
              )}

              {isUrl(demoLink) && (
                <a
                  href={formatUrl(demoLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#FFF4EB] hover:bg-orange-100 border border-[#F47C20] text-[#F47C20] text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={14} className="text-[#F47C20]" /> Live Demo
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
