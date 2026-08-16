import React, { useState, useMemo, memo } from 'react';
import {
  MapPin, DollarSign, Calendar, Users, Briefcase, ChevronRight,
  User, Hourglass, CheckCircle, XCircle, Award, TrendingUp,
  Eye, Edit2, Trash2, ExternalLink, Clock, Building2, BadgeCheck,
  BarChart2, GraduationCap, FileText, Image as ImageIcon
} from 'lucide-react';
import Button from './Button';
import Avatar from './Avatar';
import CompanyLogo from './CompanyLogo';
import { toTitleCase } from '../../utils/nameUtils';
import { getImageUrl } from '../../utils/imageUrl';
import { getPosterInfo } from '../../utils/roleUtils';

/* ── Fade-in animation injected once ───────────────────────────────── */
const CARD_ANIMATION_CSS = `
  @keyframes jc-fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jc-fade-in { animation: jc-fadeIn 0.3s ease-out both; }
`;
let _cssInjected = false;
function ensureAnimationCSS() {
  if (_cssInjected) return;
  const tag = document.createElement('style');
  tag.textContent = CARD_ANIMATION_CSS;
  document.head.appendChild(tag);
  _cssInjected = true;
}

// ─── Helpers ────────────────────────────────────────────────────────

const STATUS_MAP = {
  APPLIED:     { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500',   label: 'Applied' },
  OPEN:        { bg: 'bg-green-50',   text: 'text-green-600',   dot: 'bg-green-500',   label: 'Open' },
  ACTIVE:      { bg: 'bg-green-50',   text: 'text-green-600',   dot: 'bg-green-500',   label: 'Open' },
  APPROVED:    { bg: 'bg-green-50',   text: 'text-green-600',   dot: 'bg-green-500',   label: 'Open' },
  SHORTLISTED: { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500',    label: 'Shortlisted' },
  SELECTED:    { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Selected' },
  REJECTED:    { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Rejected' },
  CLOSED:      { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Closed' },
  EXPIRED:     { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Expired' },
  PENDING:     { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500',   label: 'Pending Review' },
};

function getStatusCfg(status) {
  return STATUS_MAP[(status || '').toUpperCase()] || { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: status || 'Unknown' };
}

function fmt(date) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return null; }
}

function StatusBadge({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} text-[10px] font-bold tracking-wide uppercase`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, value, iconClass = 'text-slate-400', className = '' }) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-1.5 text-xs text-slate-700 ${className}`}>
      <Icon size={14} className={`${iconClass} shrink-0`} />
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-slate-600', bg = 'bg-slate-50' }) {
  return (
    <div className={`${bg} rounded-xl p-2 flex flex-col gap-0.5 border border-slate-100 min-w-0`}>
      <div className="flex items-center gap-1 min-w-0">
        <Icon size={12} className={`${color} shrink-0`} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate" title={label}>{label}</span>
      </div>
      <span className={`text-xs font-extrabold ${color}`}>{value ?? 0}</span>
    </div>
  );
}

const BTN_CLASS_ORANGE = "flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl cursor-pointer select-none bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] focus:outline-none disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors";
const BTN_CLASS_EDIT = "flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl cursor-pointer select-none bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] focus:outline-none disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors";
const BTN_CLASS_DANGER = "h-9 w-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl cursor-pointer select-none bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 focus:outline-none shrink-0 transition-colors";

function SkillChips({ skills }) {
  if (!skills || skills.length === 0) return null;
  const visible = skills.slice(0, 5);
  const extra = skills.length - 5;
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Required Skills</p>
      <div className="flex flex-wrap gap-1">
        {visible.map((s, i) => (
          <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-md border border-slate-200">
            {s}
          </span>
        ))}
        {extra > 0 && (
          <span className="px-2 py-0.5 bg-[#FFF4EB] text-[#F47C20] text-[11px] font-semibold rounded-md border border-orange-100">
            +{extra} More
          </span>
        )}
      </div>
    </div>
  );
}

function JobCard({
  job,
  // Student props
  onSelect,
  onApply,
  isApplied,
  isClosed,
  onViewApplication,
  // Alumni props
  isAlumni = false,
  onEdit,
  onDelete,
  onViewApplications,
  // Admin props
  isAdmin = false,
  onApprove,
  onReject,
  // Misc
  customStatusBadge,
  statusOverride,
}) {
  useMemo(() => ensureAnimationCSS(), []);

  const skillsList = useMemo(() => {
    if (job.requiredSkillsList && Array.isArray(job.requiredSkillsList) && job.requiredSkillsList.length > 0) {
      return [...new Set(job.requiredSkillsList)];
    }
    if (job.requiredSkills && typeof job.requiredSkills === 'string') {
      const parsed = job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      return [...new Set(parsed)];
    }
    return [];
  }, [job.requiredSkillsList, job.requiredSkills]);

  const currentStatus = statusOverride || (isApplied ? 'APPLIED' : (isClosed || job.status === 'CLOSED' ? 'CLOSED' : job.status));
  const isJobExpired = currentStatus === 'EXPIRED';
  const eligibility = job.eligibilityDetails;
  const isEligible = eligibility ? eligibility.eligible : (job.eligible !== false);
  const isStudentView = !isAdmin && !isAlumni;

  // Stats for Alumni / Admin views
  const appCount = job.statistics?.totalApplications ?? job.totalApplications ?? job.applicationCount ?? 0;
  const eligCount = job.statistics?.eligibleStudents ?? job.eligibleStudents ?? job.eligibleStudentCount ?? 0;
  const shortCount = job.statistics?.shortlisted ?? job.statistics?.shortlistedStudents ?? job.shortlistedStudents ?? job.shortlistedCount ?? 0;
  const selCount = job.statistics?.selected ?? job.statistics?.selectedStudents ?? job.selectedStudents ?? job.selectedCount ?? 0;

  const poster = getPosterInfo(job);

  return (
    <article
      className="jc-fade-in group relative bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#F47C20]/40 transition-all duration-200 flex flex-col justify-between h-full overflow-hidden"
      aria-label={`${job.title} at ${job.company || job.companyName}`}
    >
      <div className="p-5 pb-0 flex-1 flex flex-col">
        {/* Header: Logo, Company & Verified/Status */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo url={job.companyLogoUrl || job.imageUrl} name={job.company || job.companyName} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#F47C20] truncate">{job.company || job.companyName}</p>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 mt-0.5">{job.title}</h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {(job.status === 'ACTIVE' || job.status === 'APPROVED' || job.status === 'OPEN') && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                <BadgeCheck size={11} /> Verified
              </span>
            )}
            {customStatusBadge || <StatusBadge status={currentStatus} />}
          </div>
        </div>

        {/* Location */}
        {job.location && (
          <div className="mb-3">
            <InfoRow icon={MapPin} value={job.location} iconClass="text-red-500" />
          </div>
        )}

        {/* Compact Metadata Chips Row */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4 pt-1">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2">
            <Briefcase size={14} className="text-[#F47C20] shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{job.jobType || job.type || 'Full-time'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{job.packageDetails || 'Competitive'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2">
            <Users size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{job.openings ? `${job.openings} Openings` : 'Openings N/A'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2">
            <GraduationCap size={14} className="text-purple-500 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{job.experienceRequired || '0–1 Years'}</span>
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-4 pb-2 border-b border-slate-100">
          {job.createdAt && (
            <span className="font-medium text-slate-500">Posted {fmt(job.createdAt)}</span>
          )}
          {job.expiryDate && (
            <span className={`font-semibold ${isJobExpired ? 'text-red-600' : 'text-amber-700'}`}>
              Deadline: {fmt(job.expiryDate)}
            </span>
          )}
        </div>

        {/* Required Skills */}
        <SkillChips skills={skillsList} />
      </div>

      {/* Admin / Alumni Stats Overview (If Admin or Alumni View) */}
      {isAlumni && (
        <div className="px-5 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Apps</span>
              <span className="font-extrabold text-slate-800">{appCount}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Shortlisted</span>
              <span className="font-extrabold text-slate-800">{shortCount}</span>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="px-5 mb-3 grid grid-cols-4 gap-1.5">
          <StatCard label="Total" value={appCount} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Eligible" value={eligCount} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Shortlisted" value={shortCount} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
          <StatCard label="Selected" value={selCount} icon={Award} color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      {/* Posted By Footer Bar */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={poster.profileImageUrl}
            name={poster.name}
            size="sm"
            className="w-5 h-5 border border-slate-200 shrink-0 text-[9px]"
          />
          <span className="text-slate-600 font-medium truncate text-[11px]">
            Posted by: <strong className="font-semibold text-slate-800">{poster.name}</strong> • <span className="font-medium text-slate-500">{poster.formattedRole}</span>
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 bg-white">
        {isStudentView && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
              className={BTN_CLASS_ORANGE}
              aria-label="View job details"
            >
              View Details <ChevronRight size={14} />
            </button>
            {isApplied && onViewApplication && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewApplication(job); }}
                className={BTN_CLASS_ORANGE}
                aria-label="View application"
              >
                <FileText size={14} /> Application
              </button>
            )}
            {isApplied ? (
              <button
                disabled
                className={BTN_CLASS_ORANGE}
                aria-label="Already applied"
              >
                <CheckCircle size={14} /> Applied ✓
              </button>
            ) : (
              !isClosed && currentStatus !== 'CLOSED' && currentStatus !== 'EXPIRED' && (
                <button
                  disabled={!isEligible}
                  onClick={(e) => { e.stopPropagation(); if (isEligible && onApply) onApply(job); }}
                  className={BTN_CLASS_ORANGE}
                  aria-label="Apply to this job"
                >
                  Apply Now
                </button>
              )
            )}
          </>
        )}

        {isAlumni && (
          <>
            {onViewApplications && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewApplications(job); }}
                className={BTN_CLASS_ORANGE}
                aria-label="View applications"
              >
                <Users size={14} /> Applications
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(job); }}
              className={BTN_CLASS_EDIT}
              aria-label={isJobExpired ? "Repost job" : "Edit job"}
            >
              {isJobExpired ? <><Clock size={14} /> Repost</> : <><Edit2 size={14} /> Edit</>}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
              className={BTN_CLASS_ORANGE}
              aria-label="View details"
            >
              <ExternalLink size={14} /> Details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(job); }}
              className={BTN_CLASS_DANGER}
              aria-label="Delete job"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
              className={BTN_CLASS_ORANGE}
              aria-label="View details"
            >
              <ExternalLink size={14} /> Details
            </button>
            {job.status === 'PENDING' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove && onApprove(job); }}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 select-none cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject && onReject(job); }}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-red-50 text-red-700 border border-red-300 select-none cursor-pointer"
                >
                  Reject
                </button>
              </>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default memo(JobCard);
