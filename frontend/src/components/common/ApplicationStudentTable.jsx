import React, { useState } from 'react';
import { Building2, Calendar, Search } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { toTitleCase } from '../../utils/nameUtils';
import { TableLoader } from './loading';

/**
 * Avatar Image Component with automatic error handling & initials fallback
 */
function StudentAvatar({ name, src }) {
  const [imageError, setImageError] = useState(false);
  const displayName = name || 'Student';
  const safeSrc = getImageUrl(src);
  const fallbackSvg = generateAvatarSVG(displayName, 'F47C20', 'fff');

  if (safeSrc && !imageError) {
    return (
      <img
        src={safeSrc}
        alt={displayName}
        loading="lazy"
        className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <img
      src={fallbackSvg}
      alt={displayName}
      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
    />
  );
}

/**
 * Helper to get status badge styling (Display Only)
 */
function getStatusBadgeClass(status) {
  switch (status?.toUpperCase()) {
    case 'SELECTED':
    case 'OFFERED':
    case 'OFFER_RELEASED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SHORTLISTED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'INTERVIEWING':
    case 'INTERVIEW_SCHEDULED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'APPLIED':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/**
 * Helper to format date string to "Aug 12, 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

/**
 * Unified Student Application Table Component
 * Used consistently across Admin -> Shortlisted and Alumni -> Applications
 */
export default function ApplicationStudentTable({
  data = [],
  isLoading = false,
  emptyMessage = "No students found.",
  onSelectStudent
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <TableLoader columns={5} rows={5} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Search size={32} className="text-slate-300" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 mb-1">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP & TABLET TABLE VIEW (Hidden on Mobile) */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest w-16">Profile</th>
                <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Applied Job</th>
                <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Shortlisted Date</th>
                <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => {
                const rawName = item.studentName || item.user?.name || item.student?.user?.name || item.student?.name || 'Student';
                const studentName = toTitleCase(rawName);
                const rollNumber = item.rollNumber || item.student?.rollNumber || item.user?.studentProfile?.rollNumber || '—';
                const email = item.email || item.student?.user?.email || item.user?.email || '';
                const profileImg = item.profileImageUrl || item.student?.profileImageUrl || item.user?.studentProfile?.profileImageUrl;
                
                const jobTitle = item.jobTitle || item.job?.title || '—';
                const company = item.companyName || item.company || item.job?.companyName || item.job?.company || '—';
                
                const dateVal = item.shortlistedDate || item.appliedAt || item.createdAt;
                const formattedDateStr = formatDate(dateVal);
                
                const status = item.status || 'APPLIED';
                const statusLabel = status.replace(/_/g, ' ');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* 1. Profile */}
                    <td className="py-4 px-5 align-middle">
                      <StudentAvatar name={studentName} src={profileImg} />
                    </td>

                    {/* 2. Student (Clickable Name, Roll Number, Email) */}
                    <td className="py-4 px-5 align-middle">
                      <div>
                        {onSelectStudent ? (
                          <button
                            type="button"
                            onClick={() => onSelectStudent(item)}
                            className="font-extrabold text-slate-900 text-sm leading-snug hover:text-[#F47C20] cursor-pointer text-left transition-colors focus:outline-none"
                            title={`View profile details of ${studentName}`}
                          >
                            {studentName}
                          </button>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-sm leading-snug">{studentName}</span>
                        )}
                        <p className="font-mono text-xs text-[#F47C20] font-bold mt-0.5">{rollNumber}</p>
                        {email && <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{email}</p>}
                      </div>
                    </td>

                    {/* 3. Applied Job */}
                    <td className="py-4 px-5 align-middle">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{jobTitle}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-500 text-xs">
                          <Building2 size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate max-w-[170px]">{company}</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Shortlisted Date */}
                    <td className="py-4 px-5 align-middle">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        {formattedDateStr}
                      </span>
                    </td>

                    {/* 5. Status (Display Only) */}
                    <td className="py-4 px-5 align-middle">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${getStatusBadgeClass(status)} whitespace-nowrap`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE STACKED CARDS VIEW (Visible only on Mobile) */}
      <div className="block sm:hidden space-y-4">
        {data.map((item) => {
          const rawName = item.studentName || item.user?.name || item.student?.user?.name || item.student?.name || 'Student';
          const studentName = toTitleCase(rawName);
          const rollNumber = item.rollNumber || item.student?.rollNumber || item.user?.studentProfile?.rollNumber || '—';
          const email = item.email || item.student?.user?.email || item.user?.email || '';
          const profileImg = item.profileImageUrl || item.student?.profileImageUrl || item.user?.studentProfile?.profileImageUrl;
          
          const jobTitle = item.jobTitle || item.job?.title || '—';
          const company = item.companyName || item.company || item.job?.companyName || item.job?.company || '—';
          
          const dateVal = item.shortlistedDate || item.appliedAt || item.createdAt;
          const formattedDateStr = formatDate(dateVal);
          
          const status = item.status || 'APPLIED';
          const statusLabel = status.replace(/_/g, ' ');

          return (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <StudentAvatar name={studentName} src={profileImg} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    {onSelectStudent ? (
                      <button
                        type="button"
                        onClick={() => onSelectStudent(item)}
                        className="font-extrabold text-slate-900 text-base leading-snug hover:text-[#F47C20] cursor-pointer text-left transition-colors truncate"
                      >
                        {studentName}
                      </button>
                    ) : (
                      <h4 className="font-extrabold text-slate-900 text-base truncate">{studentName}</h4>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${getStatusBadgeClass(status)}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#F47C20] mt-0.5">{rollNumber}</p>
                  {email && <p className="text-xs text-slate-500 truncate mt-0.5">{email}</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Applied Job:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{jobTitle} • {company}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Date:</span>
                  <span className="font-semibold text-slate-700">{formattedDateStr}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
