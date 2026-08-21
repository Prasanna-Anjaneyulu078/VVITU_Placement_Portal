import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, DollarSign, Award, Calendar, Link as LinkIcon, CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react';
import { Modal, Button, Badge, CompanyLogo } from './index';
import Avatar from './Avatar';
import { getPosterInfo } from '../../utils/roleUtils';
import api from '../../utils/axiosConfig';

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  role = 'student', // student, alumni, admin
  onApply,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  eligibility,
  hasApplied,
  applicationStatus
}) {
  const [skillMatch, setSkillMatch] = useState(null);

  useEffect(() => {
    if (!isOpen || role !== 'student' || !job?.id) {
      setSkillMatch(null);
      return;
    }
    api.get(`/student/skills/job-match/${job.id}`)
      .then(res => setSkillMatch(res.data))
      .catch(() => setSkillMatch(null));
  }, [isOpen, job?.id, role]);

  if (!job) return null;

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'REJECTED': return 'bg-red-50 text-red-600 border border-red-100';
      case 'EXPIRED': return 'bg-gray-50 text-gray-600 border border-gray-200';
      default: return 'bg-blue-50 text-blue-600 border border-blue-100';
    }
  };

  const getJobLevelClass = (level) => {
    if (!level) return 'text-slate-800';
    if (level.toLowerCase().includes('senior') || level.includes('5+')) return 'text-purple-700';
    if (level.toLowerCase().includes('mid') || level.includes('3-5')) return 'text-blue-700';
    return 'text-green-700';
  };

  const tags = job.requiredSkills ? job.requiredSkills.split(',').map(s => s.trim()) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Details"
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full pt-4 border-t border-slate-100">
          <div>
            {role === 'student' && eligibility && (
              <div className={`text-sm font-bold flex items-center gap-1.5 ${eligibility.eligible ? 'text-green-600' : 'text-red-600'}`}>
                {eligibility.eligible ? <><CheckCircle size={16}/> You are eligible</> : <><XCircle size={16}/> {eligibility.message || 'Not eligible'}</>}
              </div>
            )}
            {role === 'student' && hasApplied && applicationStatus && (
              <div className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
                <CheckCircle size={16}/> Application Status: {applicationStatus}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            
            {role === 'student' && !hasApplied && eligibility?.eligible && (
              <Button onClick={() => onApply && onApply(job)}>
                {job.applicationLink ? 'Apply via External Link' : 'Apply Now'}
              </Button>
            )}

            {role === 'alumni' && (
              <>
                {onEdit && <Button variant="outline" onClick={() => onEdit(job)}>Edit</Button>}
                {onDelete && <Button variant="danger" onClick={() => onDelete(job)}>Delete</Button>}
              </>
            )}

            {role === 'admin' && job.status === 'PENDING' && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200  "
                  onClick={() => onReject && onReject(job)}
                >
                  Reject
                </Button>
                <Button 
                  className="bg-green-600   text-white"
                  onClick={() => onApprove && onApprove(job)}
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <CompanyLogo 
              url={job.companyLogoUrl || job.imageUrl} 
              name={job.company || job.companyName} 
              size="xl" 
              className="shadow-sm border-[#F47C20]/20 bg-gradient-to-br from-[#FFF4EB] to-[#FFE8D6]" 
            />
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">{job.title}</h2>
              <p className="text-slate-500 font-bold mt-1 text-sm">{job.company} • {job.location || 'Remote'}</p>
              {(() => {
                const poster = getPosterInfo(job);
                return (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                    <Avatar src={poster.profileImageUrl} name={poster.name} size="sm" className="w-4 h-4 border border-slate-200 shrink-0 text-[8px]" />
                    <span>Posted by: <strong className="font-semibold text-slate-700">{poster.name}</strong> • {poster.formattedRole}</span>
                  </div>
                );
              })()}
            </div>
          </div>
          {(role === 'alumni' || role === 'admin') && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getStatusBadge(job.status)}`}>
              {job.status}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex items-center gap-1"><Briefcase size={12}/> Type</span>
            <span className="font-extrabold text-slate-800 text-sm">{job.jobType || 'Full-time'}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex items-center gap-1"><Award size={12}/> Experience</span>
            <span className={`font-extrabold text-sm ${getJobLevelClass(job.experienceRequired)}`}>{job.experienceRequired || 'Entry Level'}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> Package</span>
            <span className="font-extrabold text-slate-800 text-sm">{job.packageDetails || 'Not specified'}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> Deadline</span>
            <span className="font-extrabold text-slate-800 text-sm">{job.expiryDate ? new Date(job.expiryDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        {/* Academic Requirements */}
        {(job.minCgpa != null || job.eligibleSemester != null || job.maxBacklogs != null) && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Eligibility</h3>
            <div className="flex gap-4">
              {job.minCgpa != null && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
                  Min CGPA: {job.minCgpa}
                </div>
              )}
              {job.eligibleSemester != null && (
                <div className="bg-purple-50 text-purple-800 px-4 py-2 rounded-lg text-sm font-bold border border-purple-100">
                  Sem: {job.eligibleSemester}+
                </div>
              )}
              {job.maxBacklogs != null && (
                <div className="bg-rose-50 text-rose-800 px-4 py-2 rounded-lg text-sm font-bold border border-rose-100">
                  Max Backlogs: {job.maxBacklogs}
                </div>
              )}
            </div>
          </div>
        )}

          {role === 'student' && skillMatch && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-[#F47C20]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Skill Match</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${
                    skillMatch.matchPercentage >= 80 ? 'text-emerald-600' :
                    skillMatch.matchPercentage >= 60 ? 'text-blue-600' :
                    skillMatch.matchPercentage >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>{skillMatch.matchPercentage}%</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    skillMatch.matchPercentage >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    skillMatch.matchPercentage >= 60 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    skillMatch.matchPercentage >= 40 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                  }`}>{skillMatch.matchLabel}</span>
                </div>
              </div>
              <div className="px-5 py-3 space-y-3">
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      skillMatch.matchPercentage >= 80 ? 'bg-emerald-500' :
                      skillMatch.matchPercentage >= 60 ? 'bg-blue-500' :
                      skillMatch.matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${skillMatch.matchPercentage}%` }}
                  />
                </div>

                {/* Matched skills */}
                {skillMatch.matchedSkills?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle size={10} /> Matched ({skillMatch.matchedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillMatch.matchedSkills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing skills */}
                {skillMatch.missingSkills?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <XCircle size={10} /> Missing ({skillMatch.missingSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillMatch.missingSkills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap">{job.description}</p>
          </div>
          
          {tags && tags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.applicationLink && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">External Link</h3>
              <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#F47C20] font-bold text-sm   p-3 bg-[#FFF4EB] rounded-xl border border-[#F47C20]/20 w-max">
                <LinkIcon size={16}/> {job.applicationLink}
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
