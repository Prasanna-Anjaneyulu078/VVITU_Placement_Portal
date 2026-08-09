import React from 'react';
import { FolderGit2, ExternalLink, Github, Code2, Clock, Tag } from 'lucide-react';

export default function ProjectsSection({ projects = [] }) {
  const isUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    const clean = str.trim();
    return clean.startsWith('http://') || clean.startsWith('https://');
  };

  const formatUrl = (str) => {
    if (!str) return '#';
    const clean = str.trim();
    return clean.startsWith('http') ? clean : `https://${clean}`;
  };

  const getTechChips = (techStr) => {
    if (!techStr) return [];
    if (Array.isArray(techStr)) return techStr;
    return techStr.split(/[,•|]+/).map(t => t.trim()).filter(Boolean);
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FolderGit2 size={16} className="text-[#F47C20]" />
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Projects</h4>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <p className="text-xs font-bold text-slate-500">No projects have been added by this student.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj, idx) => {
            const githubLink = proj.githubUrl || proj.sourceUrl;
            const demoLink = proj.liveDemoUrl || proj.demoUrl;
            const techList = getTechChips(proj.technologies || proj.tech);
            const projectType = proj.projectType || 'Academic';
            const status = proj.status || 'Completed';

            return (
              <div 
                key={proj.id || idx} 
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-orange-200 transition-all"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-base font-extrabold text-slate-900 leading-snug">{proj.title}</h5>
                      {proj.role && (
                        <p className="text-xs font-semibold text-[#F47C20] mt-0.5">{proj.role}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${getStatusBadgeClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                      <Tag size={11} className="text-slate-400"/> {projectType}
                    </span>
                    {proj.duration && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                        <Clock size={11} className="text-slate-400"/> {proj.duration}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {proj.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                      {proj.description}
                    </p>
                  )}

                  {/* Technologies Chips */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techList.map((tech, ti) => (
                        <span 
                          key={ti} 
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Action Links */}
                <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
                  {isUrl(githubLink) && (
                    <a
                      href={formatUrl(githubLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-2 px-3 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] hover:bg-orange-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Github size={14} className="text-[#F47C20]" /> GitHub Repository
                    </a>
                  )}

                  {isUrl(demoLink) && (
                    <a
                      href={formatUrl(demoLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-2 px-3 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] hover:bg-orange-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink size={14} className="text-[#F47C20]" /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
