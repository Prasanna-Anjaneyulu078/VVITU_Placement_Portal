import React from 'react';
import { Briefcase, Calendar, Clock, HelpCircle, CheckCircle2, Building2 } from 'lucide-react';

export default function ApplicationDetailsSection({ details }) {
  if (!details) return null;

  // Only render if application details are available
  const hasJobInfo = Boolean(details.jobTitle || details.company);
  const hasAppliedDate = Boolean(details.appliedAt);
  const hasAnswers = details.screeningAnswers && details.screeningAnswers.length > 0;

  if (!hasJobInfo && !hasAppliedDate && !hasAnswers) {
    return null;
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: 'N/A', time: '' };
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { date, time };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';
    if (s === 'SELECTED') bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (s === 'SHORTLISTED') bg = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (s === 'INTERVIEW_SCHEDULED') bg = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (s === 'UNDER_REVIEW') bg = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (s === 'REJECTED') bg = 'bg-red-50 text-red-700 border-red-200';

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${bg}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const { date, time } = formatDateTime(details.appliedAt);

  return (
    <div className="space-y-4">
      {/* Application Overview Card */}
      {hasJobInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Briefcase size={16} className="text-[#F47C20]" />
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Application Details</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            {/* Applied Job */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applied Job</span>
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Briefcase size={14} className="text-[#F47C20]"/> {details.jobTitle || 'N/A'}
              </span>
              {details.company && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Building2 size={12} className="text-slate-400"/> {details.company}
                </p>
              )}
            </div>

            {/* Applied Date & Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                {getStatusBadge(details.status)}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applied Date</span>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-blue-500"/> {date} {time && `at ${time}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screening Questions Responses */}
      {hasAnswers && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <HelpCircle size={16} className="text-[#F47C20]" />
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Screening Question Responses</h4>
          </div>

          <div className="space-y-3">
            {details.screeningAnswers.map((item, index) => (
              <div key={item.id || index} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-xs font-extrabold text-slate-800 flex items-start gap-2">
                  <span className="w-5 h-5 bg-orange-100 text-[#F47C20] rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-black">
                    {index + 1}
                  </span>
                  <span>{item.questionText || item.questionKey}</span>
                </p>
                <div className="pl-7">
                  <p className="text-xs font-bold text-[#F47C20] bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
