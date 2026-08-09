import React, { useState, useMemo, memo } from 'react';
import {
  MapPin, DollarSign, Calendar, Users, Briefcase, ChevronRight,
  User, Hourglass, CheckCircle, XCircle, Award, TrendingUp,
  Eye, Edit2, Trash2, ExternalLink, Clock, Building2, BadgeCheck,
  BarChart2, GraduationCap, FileText, Image as ImageIcon
} from 'lucide-react';
import Button from './Button';
import { toTitleCase } from '../../utils/nameUtils';
import { getImageUrl } from '../../utils/imageUrl';

/* ── Fade-in animation injected once ───────────────────────────────── */
const CARD_ANIMATION_CSS = `
  @keyframes jc-fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .jc-fade-in { animation: jc-fadeIn 0.35s ease-out both; }
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

// ─── Sub-components ────────────────────────────────────────────────────────

function CompanyLogo({ url, name }) {
  const initial = (name || 'C').charAt(0).toUpperCase();
  const resolvedUrl = getImageUrl(url);
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span className="text-xl font-bold text-[#F47C20]">{initial}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} text-[11px] font-bold tracking-wide uppercase`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, value, iconClass = 'text-slate-400', className = '' }) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-2 text-sm text-slate-700 ${className}`}>
      <Icon size={15} className={`${iconClass} shrink-0`} />
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-slate-600', bg = 'bg-slate-50' }) {
  return (
    <div className={`${bg} rounded-xl p-2 sm:p-2.5 flex flex-col gap-0.5 border border-slate-100 min-w-0`}>
      <div className="flex items-center gap-1 min-w-0">
        <Icon size={12} className={`${color} shrink-0`} />
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={label}>{label}</span>
      </div>
      <span className={`text-sm sm:text-base font-extrabold ${color}`}>{value ?? 0}</span>
    </div>
  );
}

const BTN_CLASS_ORANGE = "flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer select-none bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] hover:text-[#F47C20] hover:border-[#F47C20] active:bg-[#FFF4EB] active:text-[#F47C20] active:border-[#F47C20] focus:outline-none focus:ring-2 focus:ring-[#F47C20]/40 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors";
const BTN_CLASS_EDIT = "flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer select-none bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] hover:text-[#F47C20] hover:border-[#F47C20] active:bg-[#FFF4EB] active:text-[#F47C20] active:border-[#F47C20] focus:outline-none focus:ring-2 focus:ring-[#F47C20]/40 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors";
const BTN_CLASS_DANGER = "h-10 w-10 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer select-none bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-[#F47C20] hover:border-[#F47C20] active:bg-red-100 active:text-[#F47C20] active:border-[#F47C20] focus:outline-none focus:ring-2 focus:ring-red-400 shrink-0 transition-colors";
const BTN_CLASS_DANGER_FLEX = "flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer select-none bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-[#F47C20] hover:border-[#F47C20] active:bg-red-100 active:text-[#F47C20] active:border-[#F47C20] focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors";

function SkillChips({ skills }) {
  if (!skills || skills.length === 0) return null;
  const visible = skills.slice(0, 6);
  const extra = skills.length - 6;
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((s, i) => (
          <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
            {s}
          </span>
        ))}
        {extra > 0 && (
          <span className="px-2.5 py-1 bg-[#FFF4EB] text-[#F47C20] text-xs font-semibold rounded-full border border-orange-100">
            +{extra} More
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

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
  // Inject fade-in CSS once
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

  // stats — use backend job.statistics DTO with fallbacks
  const appCount   = job.statistics?.totalApplications ?? job.totalApplications ?? job.applicationCount ?? 0;
  const eligCount  = job.statistics?.eligibleStudents ?? job.eligibleStudents ?? job.eligibleStudentCount ?? 0;
  const pendCount  = job.statistics?.pendingReview ?? job.pendingReview ?? 0;
  const shortCount = job.statistics?.shortlisted ?? job.statistics?.shortlistedStudents ?? job.shortlistedStudents ?? job.shortlistedCount ?? 0;
  const selCount   = job.statistics?.selected ?? job.statistics?.selectedStudents ?? job.selectedStudents ?? job.selectedCount ?? 0;
  const rejCount   = job.statistics?.rejected ?? job.rejected ?? 0;
  const totalOpenings = job.statistics?.totalOpenings ?? job.openings ?? 0;
  const remainingOpenings = job.statistics?.remainingOpenings ?? (totalOpenings > 0 ? Math.max(0, totalOpenings - selCount) : 0);

  return (
    <article
      className={`
        jc-fade-in
        group relative bg-white rounded-2xl border border-slate-200 shadow-sm
        overflow-hidden
        transition-all duration-200 ease-out
        flex flex-col
      `}
      aria-label={`${job.title} at ${job.company || job.companyName}`}
    >
      {/* ── Card Header ── */}
      <div className="p-5 pb-0">
        <div className="flex justify-between items-start gap-3">
          {/* Left: Logo + Company + Title */}
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo url={job.companyLogoUrl || job.imageUrl} name={job.company || job.companyName} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F47C20] truncate">{job.company || job.companyName}</p>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5 line-clamp-2">{job.title}</h3>
              {(isAdmin || isAlumni) && job.postedBy?.name && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User size={11} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-medium truncate">{toTitleCase(job.postedBy.name)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Verified + Status */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {(job.status === 'ACTIVE' || job.status === 'APPROVED' || job.status === 'OPEN') && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <BadgeCheck size={11} /> Verified
              </span>
            )}
            {customStatusBadge || <StatusBadge status={currentStatus} />}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-100 mt-4" />
      </div>

      {/* ── Details Grid ── */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <InfoRow icon={MapPin}     value={job.location}                                        />
        <InfoRow icon={Briefcase}  value={job.jobType || job.type || 'Full-time'}              />
        <InfoRow icon={DollarSign} value={job.packageDetails || 'Competitive'}                 />
        <InfoRow icon={Users}      value={job.openings ? `${job.openings} Opening${job.openings !== 1 ? 's' : ''}` : null} />
        {job.experienceRequired && (
          <InfoRow icon={GraduationCap} value={job.experienceRequired} className="col-span-1" />
        )}
        {job.industry && (
          <InfoRow icon={Building2} value={job.industry} className="col-span-2" />
        )}
        {job.createdAt && (
          <InfoRow icon={Calendar} value={`Posted ${fmt(job.createdAt)}`} className="col-span-1" />
        )}
        {job.expiryDate && (
          <div className="col-span-1 flex items-center gap-2 text-sm">
            <Hourglass size={15} className={isJobExpired ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'} />
            <span className={`font-medium text-xs truncate ${isJobExpired ? 'text-red-600' : 'text-amber-700'}`}>
              {isJobExpired ? 'Expired ' : 'Deadline: '}{fmt(job.expiryDate)}
            </span>
          </div>
        )}
        {job.appliedAt && (
          <div className="col-span-2 flex items-center gap-2 text-sm text-[#F47C20]">
            <CheckCircle size={15} className="text-[#F47C20] shrink-0" />
            <span className="font-semibold text-xs truncate">
              Applied on {new Date(job.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* — Skills — */}
      <div className="px-5">
        <SkillChips skills={skillsList} />
      </div>


      {/* — Statistics (Alumni View) ── */}
      {isAlumni && (
        <div className="px-5 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Applications */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-[#F47C20]">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Applications</p>
                <p className="text-base font-extrabold text-slate-800">{appCount}</p>
              </div>
            </div>

            {/* Shortlisted */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-[#F47C20]">
                <TrendingUp size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Shortlisted</p>
                <p className="text-base font-extrabold text-slate-800">{shortCount}</p>
              </div>
            </div>

            {/* Selected */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-[#F47C20]">
                <Award size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Selected</p>
                <p className="text-base font-extrabold text-slate-800">{selCount}</p>
              </div>
            </div>

            {/* Job Status */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-[#F47C20]">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">Status</p>
                {(() => {
                  const s = (currentStatus || 'OPEN').toUpperCase();
                  if (s === 'OPEN' || s === 'ACTIVE') {
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 w-fit">
                        Open
                      </span>
                    );
                  } else if (s === 'CLOSED') {
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 w-fit">
                        Closed
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 w-fit">
                        Expired
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="px-5 mb-4 grid grid-cols-4 gap-2">
          <StatCard label="Total"       value={appCount}   icon={Users}       color="text-blue-600"    bg="bg-blue-50" />
          <StatCard label="Eligible"    value={eligCount}  icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Shortlisted" value={shortCount} icon={TrendingUp}  color="text-purple-600"  bg="bg-purple-50" />
          <StatCard label="Selected"    value={selCount}   icon={Award}       color="text-amber-600"   bg="bg-amber-50" />
        </div>
      )}

      {/* â”€â”€ Footer Actions â”€â”€ */}
      <div className="mt-auto px-5 py-4 border-t border-slate-100 flex items-center gap-2">

        {/* STUDENT */}
        {isStudentView && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
              className={BTN_CLASS_ORANGE}
              aria-label="View job details"
            >
              View Details <ChevronRight size={15} />
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
                <CheckCircle size={15} /> Applied ✓
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

        {/* ALUMNI */}
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
              <Trash2 size={15} />
            </button>
          </>
        )}

        {/* ADMIN */}
        {isAdmin && (
          <>
            {job.status === 'PENDING' ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove && onApprove(job); }}
                  className={BTN_CLASS_ORANGE}
                  aria-label="Approve job"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject && onReject(job); }}
                  className={BTN_CLASS_DANGER_FLEX}
                  aria-label="Reject job"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
                  className={BTN_CLASS_ORANGE}
                  aria-label="View job details"
                >
                  <Eye size={14} /> View
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect && onSelect(job); }}
                  className={BTN_CLASS_ORANGE}
                  aria-label="View job details"
                >
                  <Eye size={14} /> Details
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete && onDelete(job); }}
                  className={BTN_CLASS_DANGER}
                  aria-label="Delete job"
                >
                  <Trash2 size={15} />
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

