import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  BadgeCheck, Briefcase, FileText, CheckCircle2, XCircle,
  ChevronRight, Award, BookOpen, Clock, ArrowUpRight,
  Bookmark, Search, MapPin, ShieldCheck, Sparkles, Trophy, Star
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import { useData } from '../../context/DataContext';
import { toast } from 'react-toastify';
import { CardLoader, JobCardLoader, SectionLoader } from '../../components/common/loading';
import { toTitleCase } from '../../utils/nameUtils';

import { getImageUrl } from '../../utils/imageUrl';
import Avatar from '../../components/common/Avatar';
import { getPosterInfo } from '../../utils/roleUtils';
import './StudentDashboard.css';

const DEPT_MAP = {
  AIDS:  'Artificial Intelligence & Data Science',
  AIML:  'AI & Machine Learning',
  CSE:   'Computer Science & Engineering',
  CS:    'Computer Science',
  IT:    'Information Technology',
  ECE:   'Electronics & Communication Engineering',
  EEE:   'Electrical & Electronics Engineering',
  MECH:  'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  VLSI:  'VLSI Design',
};

const getDeptName = (code) => DEPT_MAP[code] || code || 'Department Not Set';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtShortDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Soon';

export function getCompanyInitials(name) {
  if (!name || typeof name !== 'string') return 'CO';
  const clean = name.trim();
  if (!clean || clean.toLowerCase() === 'company') return 'CO';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

function StatusBadge({ status }) {
  const s = (status || 'APPLIED').toUpperCase();
  if (['SELECTED','ACCEPTED','OFFERED'].includes(s))
    return <span className="sd-badge sd-badge-success"><CheckCircle2 size={11} /> Selected</span>;
  if (s === 'INTERVIEW')
    return <span className="sd-badge sd-badge-purple"><Clock size={11} /> Interview</span>;
  if (s === 'SHORTLISTED')
    return <span className="sd-badge sd-badge-warning"><Sparkles size={11} /> Shortlisted</span>;
  if (s === 'ASSESSMENT')
    return <span className="sd-badge sd-badge-warning"><Star size={11} /> Assessment</span>;
  if (s === 'REJECTED')
    return <span className="sd-badge sd-badge-danger"><XCircle size={11} /> Rejected</span>;
  if (s === 'UNDER_REVIEW')
    return <span className="sd-badge sd-badge-info"><Clock size={11} /> Under Review</span>;
  return <span className="sd-badge sd-badge-neutral"><FileText size={11} /> Applied</span>;
}


export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profileImage, updateProfileImage } = useData();
  const [profile,       setProfile]       = useState(null);
  const [recentJobs,    setRecentJobs]    = useState([]);
  const [recentApps,    setRecentApps]    = useState([]);
  const [savedJobs,     setSavedJobs]     = useState(new Set());
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingJobs,    setIsLoadingJobs]    = useState(true);
  const [isLoadingApps,    setIsLoadingApps]    = useState(true);

  useEffect(() => {
    // Fetch Profile
    api.get('/student/profile').then(profileRes => {
      if (profileRes.data) {
        setProfile(profileRes.data);
        if (profileRes.data.profileImageUrl) updateProfileImage(profileRes.data.profileImageUrl);
      }
    }).catch(err => {
      console.error('Profile:', err);
    }).finally(() => setIsLoadingProfile(false));

    // Fetch Jobs
    api.get('/student/jobs/open').then(jobsRes => {
      const now = new Date();
      const rawJobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
      const activeJobs = rawJobs
        .filter(j => { if (j.status && j.status !== 'ACTIVE') return false; if (j.deadline && new Date(j.deadline) < now) return false; return true; })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4);
      setRecentJobs(activeJobs);
    }).catch(err => {
      console.error('Jobs:', err);
    }).finally(() => setIsLoadingJobs(false));

    // Fetch Apps
    api.get('/applications/my').then(appsRes => {
      const rawApps = Array.isArray(appsRes.data) ? appsRes.data : [];
      const sortedApps = rawApps.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
      setRecentApps(sortedApps);
    }).catch(err => {
      console.error('Apps:', err);
    }).finally(() => setIsLoadingApps(false));
  }, [updateProfileImage]);

  const appliedCount     = recentApps.length;
  const shortlistedCount = recentApps.filter(a => ['SHORTLISTED','INTERVIEW','ASSESSMENT'].includes((a.status||'').toUpperCase())).length;
  const interviewCount   = recentApps.filter(a => (a.status||'').toUpperCase() === 'INTERVIEW').length;
  const offerCount       = recentApps.filter(a => ['SELECTED','ACCEPTED','OFFERED'].includes((a.status||'').toUpperCase())).length;


  const toggleSaveJob = useCallback((e, jobId) => {
    e.stopPropagation();
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) { next.delete(jobId); toast.info('Job removed from saved list'); }
      else { next.add(jobId); toast.success('Job saved!'); }
      return next;
    });
  }, []);

  const pName = toTitleCase(profile && profile.user && profile.user.name ? profile.user.name : 'Student');

  return (
    <DashboardLayout role="student">
      <div className="sd-page">
        <div className="sd-header">
          <div className="sd-header-content">
            <h1 className="sd-header-title">Student Dashboard <Sparkles size={20} style={{ color: '#F47C20' }} /></h1>
            <p className="sd-header-sub">Welcome back, <strong style={{ color: '#0F172A' }}>{isLoadingProfile ? '...' : pName}</strong>! Your placement overview, jobs &amp; applications.</p>
          </div>
          <button className="sd-btn-primary" onClick={() => navigate('/student/jobs')} type="button" aria-label="Browse Opportunities">
            <Search size={16} /> Browse Opportunities
          </button>
        </div>

        <div className="sd-layout">
          {/* LEFT COLUMN */}
          <div className="sd-col-left">
            {/* Profile Card */}
            <div className="sd-card sd-profile-card">
              {isLoadingProfile ? <CardLoader lines={4} /> : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div className="sd-avatar-wrap">
                      <Avatar
                        src={profileImage || profile?.profileImageUrl}
                        name={pName || 'Student'}
                        size="lg"
                        className="sd-avatar"
                      />
                      {profile && profile.verificationStatus === 'VERIFIED' && (
                        <div className="sd-avatar-badge" title="Verified"><BadgeCheck size={18} style={{ color: '#F47C20' }} /></div>
                      )}
                    </div>
                    {profile && profile.verificationStatus === 'VERIFIED' && (
                      <span className="sd-verified-badge"><ShieldCheck size={13} /> Verified</span>
                    )}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <h2 className="sd-profile-name">{pName}</h2>
                    <p className="sd-profile-roll">Roll No: {(profile && profile.rollNumber) ? profile.rollNumber : 'N/A'}</p>
                    <p className="sd-profile-dept">{getDeptName(profile && profile.department)}</p>
                  </div>
                  <div className="sd-profile-chips">
                    <div className="sd-chip">
                      <div className="sd-chip-icon"><Award size={15} /></div>
                      <div><div className="sd-chip-label">CGPA</div><div className="sd-chip-value">{(profile && profile.cgpa != null) ? profile.cgpa : 'N/A'}</div></div>
                    </div>
                    <div className="sd-chip">
                      <div className="sd-chip-icon"><BookOpen size={15} /></div>
                      <div><div className="sd-chip-label">Semester</div><div className="sd-chip-value">{(profile && profile.semester) ? 'Sem ' + profile.semester : 'N/A'}</div></div>
                    </div>
                  </div>
                  {offerCount > 0 && (
                    <div style={{ marginTop: 12, padding: '9px 13px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}><Trophy size={14} /> Placement Secured!</span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16A34A' }}>{offerCount} Offer{offerCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <Link to="/student/profile" className="sd-view-profile-btn" aria-label="View Full Profile">View Full Profile <ChevronRight size={15} /></Link>
                </>
              )}
            </div>

            {/* Placement Progress */}
            <div className="sd-card sd-placement-progress-card">
              <div className="sd-card-header">
                <div><h3 className="sd-card-title"><Trophy size={17} style={{ color: '#F47C20' }} /> Placement Progress</h3><p className="sd-card-subtitle">Your placement journey at a glance</p></div>
                <Link to="/student/applications" className="sd-card-link" aria-label="View all applications">View All <ChevronRight size={13} /></Link>
              </div>
              {isLoadingApps ? <CardLoader lines={4} /> : (
                <div className="sd-progress-grid">
                  <div className="sd-progress-stat"><div className="sd-progress-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><FileText size={18} /></div><div><div className="sd-progress-label">Jobs Applied</div><div className="sd-progress-value">{appliedCount}</div></div></div>
                  <div className="sd-progress-stat"><div className="sd-progress-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><Sparkles size={18} /></div><div><div className="sd-progress-label">Shortlisted</div><div className="sd-progress-value">{shortlistedCount}</div></div></div>
                  <div className="sd-progress-stat"><div className="sd-progress-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}><Clock size={18} /></div><div><div className="sd-progress-label">Interviews</div><div className="sd-progress-value">{interviewCount}</div></div></div>
                  <div className="sd-progress-stat"><div className="sd-progress-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}><Trophy size={18} /></div><div><div className="sd-progress-label">Offers Received</div><div className="sd-progress-value">{offerCount}</div></div></div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="sd-col-right">
            {/* Latest Jobs */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div><h3 className="sd-card-title"><Briefcase size={17} style={{ color: '#F47C20' }} /> Latest Opportunities</h3><p className="sd-card-subtitle">Active openings — expired jobs hidden automatically</p></div>
                <Link to="/student/jobs" className="sd-card-link" aria-label="View all job opportunities">View All <ChevronRight size={13} /></Link>
              </div>
              {isLoadingJobs ? (
                <div className="sd-jobs-grid">
                  {[...Array(4)].map((_, i) => <JobCardLoader key={i} />)}
                </div>
              ) : recentJobs.length > 0 ? (
                <div className="sd-jobs-grid">
                  {recentJobs.map(job => {
                    const isSaved = savedJobs.has(job.id);
                    return (
                      <div 
                        key={job.id} 
                        className="sd-job-card" 
                        onClick={() => navigate('/student/jobs/' + job.id)} 
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/student/jobs/' + job.id); } }}
                        tabIndex={0} 
                        role="button"
                        aria-label={`View details for ${job.title} at ${job.company}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div className="sd-job-logo">{logoLetters(job.company)}</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="sd-job-company">{job.company}</div>
                              <div className="sd-job-role">{job.title}</div>
                            </div>
                          </div>
                          <button 
                            className="sd-job-bookmark" 
                            onClick={e => toggleSaveJob(e, job.id)} 
                            title={isSaved ? 'Unsave' : 'Save'} 
                            aria-label={isSaved ? 'Unsave job' : 'Save job'}
                            type="button"
                          >
                            <Bookmark size={15} color={isSaved ? '#F47C20' : '#CBD5E1'} fill={isSaved ? '#F47C20' : 'none'} />
                          </button>
                        </div>
                        <div className="sd-job-meta">
                          <span className="sd-job-tag sd-job-tag-location"><MapPin size={11} /> {job.location || 'Remote'}</span>
                          <span className="sd-job-tag sd-job-tag-pkg">{job.packageCtc || job.salary || 'Competitive'}</span>
                        </div>
                        {(() => {
                          const poster = getPosterInfo(job);
                          return (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Avatar src={poster.profileImageUrl} name={poster.name} size="sm" className="w-4 h-4 text-[8px] border border-slate-200 shrink-0" />
                              <span className="truncate">Posted by: <strong className="font-semibold text-slate-700">{poster.name}</strong> • {poster.formattedRole}</span>
                            </div>
                          );
                        })()}
                        <div className="sd-job-footer">
                          <span className="sd-job-deadline"><Clock size={11} /> {fmtShortDate(job.deadline)}</span>
                          <span className="sd-job-apply">Apply <ArrowUpRight size={13} /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd-empty">
                  <Briefcase size={32} style={{ color: '#CBD5E1' }} />
                  <p>No active job listings right now.</p>
                  <Link to="/student/jobs" style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 700, color: '#F47C20' }}>Browse all jobs</Link>
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div><h3 className="sd-card-title"><FileText size={17} style={{ color: '#F47C20' }} /> Recent Applications</h3><p className="sd-card-subtitle">Your latest application activity</p></div>
                <Link to="/student/applications" className="sd-card-link" aria-label={`View all ${appliedCount} applications`}>All ({appliedCount}) <ChevronRight size={13} /></Link>
              </div>
              {isLoadingApps ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {[...Array(3)].map((_, i) => <SectionLoader key={i} rows={2} />)}
                </div>
              ) : recentApps.length > 0 ? (
                <div className="sd-app-list">
                  {recentApps.slice(0, 6).map(app => {
                    const compName = app.companyName || app.company || app.job?.companyName || app.job?.company || 'Company';
                    const roleTitle = app.jobTitle || app.role || app.title || app.job?.title || app.job?.jobTitle || 'Position';
                    const logoUrl = app.companyLogoUrl || app.imageUrl || app.job?.companyLogoUrl || app.job?.imageUrl;
                    const initials = getCompanyInitials(compName);

                    return (
                      <div 
                        key={app.id} 
                        className="sd-app-item" 
                        onClick={() => navigate('/student/applications/' + app.id)} 
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/student/applications/' + app.id); } }}
                        tabIndex={0} 
                        role="button"
                        aria-label={`View application status for ${roleTitle} at ${compName}`}
                      >
                        <div className="sd-app-logo">
                          {logoUrl ? (
                            <img 
                              src={getImageUrl(logoUrl)} 
                              alt={compName} 
                              className="sd-avatar-img" 
                              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="sd-app-meta">
                          <div className="sd-app-company">{compName}</div>
                          <div className="sd-app-role">{roleTitle}</div>
                        </div>
                        <div className="sd-app-right">
                          <StatusBadge status={app.status} />
                          <span className="sd-app-date">{fmtShortDate(app.appliedAt || app.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd-empty">
                  <FileText size={32} style={{ color: '#CBD5E1' }} />
                  <p>No applications yet. Start applying today!</p>
                  <button className="sd-btn-primary" style={{ marginTop: 12, width: 'auto', fontSize: '0.75rem', padding: '8px 16px', minHeight: '38px' }} onClick={() => navigate('/student/jobs')} type="button">Browse Jobs</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
