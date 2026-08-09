import React from 'react';
import { FolderGit2, Plus } from 'lucide-react';

export default function ProjectEmptyState({ onAddProject }) {
  return (
    <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center space-y-4">
      <div className="w-16 h-16 bg-[#FFF4EB] text-[#F47C20] border border-orange-200 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
        <FolderGit2 size={32} />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-base font-extrabold text-slate-900">No Projects Yet</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Add your academic, personal, or internship projects to showcase your experience.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] hover:bg-orange-100/90 text-xs font-black rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
        >
          <Plus size={16} /> Add Project
        </button>
      </div>
    </div>
  );
}
