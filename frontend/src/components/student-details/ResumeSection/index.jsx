import React from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

export default function ResumeSection({ 
  resumeFileName, 
  onViewResume, 
  onDownloadResume 
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileText size={16} className="text-[#F47C20]" />
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Student Resume</h4>
      </div>

      {resumeFileName ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border border-red-100 shadow-2xs">
              PDF
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{resumeFileName}</p>
              <p className="text-[11px] text-slate-400 font-medium">Uploaded resume document</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onViewResume}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
            >
              <ExternalLink size={14} /> View Resume
            </button>
            <button
              onClick={onDownloadResume}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
              style={{ color: '#F47C20' }}
            >
              <Download size={14} /> Download Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 font-semibold text-center">
          No resume document uploaded by student.
        </div>
      )}
    </div>
  );
}
