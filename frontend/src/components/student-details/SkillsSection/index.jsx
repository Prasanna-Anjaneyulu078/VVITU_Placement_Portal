import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SkillsSection({ skills = [] }) {
  // Flatten / normalize skill strings
  const skillList = Array.isArray(skills) 
    ? skills.map(s => (typeof s === 'string' ? s : s?.skillName || s?.name || '')).filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Sparkles size={16} className="text-[#F47C20]" />
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Skills &amp; Technologies</h4>
      </div>

      {skillList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skillList.map((skill, idx) => (
            <span 
              key={idx} 
              className="px-3.5 py-1.5 bg-[#FFF4EB] border border-orange-200 text-[#F47C20] text-xs font-bold rounded-xl shadow-2xs transition-all hover:bg-orange-100"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 font-medium italic">No skills added or extracted yet.</p>
      )}
    </div>
  );
}
