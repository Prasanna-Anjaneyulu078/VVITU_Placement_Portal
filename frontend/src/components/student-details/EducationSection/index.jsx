import React from 'react';
import { BookOpen, GraduationCap, Building, Award, Calendar } from 'lucide-react';

export default function EducationSection({ details }) {
  if (!details) return null;

  const degree = details.degree || 'B.Tech';
  const college = details.college || 'Vasireddy Venkatadri Institute of Technology';
  const branch = (typeof details.department === 'object'
    ? (details.department.name || details.department.code)
    : details.department) || details.branch || 'N/A';
  const cgpa = details.cgpa ?? 'N/A';
  const graduationYear = details.graduationYear || details.academicYear || '2026';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <GraduationCap size={18} className="text-[#F47C20]" />
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Education</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Degree */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Degree</span>
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <GraduationCap size={15} className="text-[#F47C20]"/> {degree}
          </span>
        </div>

        {/* College */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">College / University</span>
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate" title={college}>
            <Building size={15} className="text-blue-500 shrink-0"/> {college}
          </span>
        </div>

        {/* Branch */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch / Department</span>
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <BookOpen size={15} className="text-purple-500"/> {branch}
          </span>
        </div>

        {/* CGPA */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CGPA</span>
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Award size={15} className="text-emerald-500"/> {cgpa}
          </span>
        </div>

        {/* Graduation Year */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Graduation Year</span>
          <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Calendar size={15} className="text-amber-500"/> {graduationYear}
          </span>
        </div>
      </div>
    </div>
  );
}
