import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  ArrowLeft, Check, Circle, X, Download, Eye, RotateCcw, AlertCircle
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import { getImageUrl } from '../../utils/imageUrl';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import './StudentApplicationDetails.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function getCompanyInitials(name) {
  if (!name || typeof name !== 'string') return 'MI';
  const clean = name.trim();
  if (!clean) return 'MI';
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

function StatusBadge({ status }) {
  const s = (status || 'APPLIED').toUpperCase();
  if (['SELECTED', 'ACCEPTED', 'OFFERED', 'OFFER_RELEASED'].includes(s)) {
    return <span className="sad-status-badge sad-status-green">● Selected</span>;
  }
  if (['INTERVIEW', 'INTERVIEW_SCHEDULED'].includes(s)) {
    return <span className="sad-status-badge sad-status-blue">● Interview Scheduled</span>;
  }
  if (s === 'SHORTLISTED') {
    return <span className="sad-status-badge sad-status-blue">● Shortlisted</span>;
  }
  if (s === 'UNDER_REVIEW') {
    return <span className="sad-status-badge sad-status-blue">● Under Review</span>;
  }
  if (s === 'REJECTED') {
    return <span className="sad-status-badge sad-status-red">● Rejected</span>;
  }
  return <span className="sad-status-badge sad-status-gray">● Applied</span>;
}

export default function StudentApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'NOT_FOUND', 'SERVER_ERROR'
  const [errorMsg, setErrorMsg] = useState('');

  // Document Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerMetadata, setViewerMetadata] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorMsg('');
    try {
      let res;
      try {
        res = await api.get(`/applications/${id}/details`);
      } catch (e1) {
        res = await api.get(`/applications/student/${id}`);
      }
      setDetails(res.data);
    } catch (err) {
      console.error('Error fetching application details:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : '');

      if (status === 404 || (msg && msg.toLowerCase().includes('not found'))) {
        setErrorType('NOT_FOUND');
        setErrorMsg("The application you're looking for doesn't exist or is no longer available.");
      } else {
        setErrorType('SERVER_ERROR');
        setErrorMsg(msg || "We couldn't retrieve this application right now.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResume = async () => {
    setViewerOpen(true);
    setViewerError(null);
    setViewerMetadata({
      fileName: details?.resumeFileName || `Application_${id}_Resume.pdf`,
      studentName: details?.studentName || 'Student',
      rollNumber: details?.rollNumber
    });

    if (viewerUrl) {
      setViewerLoading(false);
      return;
    }

    setViewerLoading(true);
    try {
      const endpoint = details?.resumeUrl && !details.resumeUrl.startsWith('http')
        ? (details.resumeUrl.startsWith('/api/') ? details.resumeUrl.substring(4) : details.resumeUrl)
        : `/applications/${id}/resume/view`;

      const res = await api.get(endpoint, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : (details?.resumeFileName || `Application_${id}_Resume.pdf`);
      const file = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      setViewerUrl(fileURL);
      setViewerMetadata(prev => ({ ...prev, fileName: filename }));
    } catch (err) {
      console.error('Error viewing application resume:', err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Resume Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to view resume');
      setViewerError(errMsg);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeDocumentViewer = () => {
    setViewerOpen(false);
    setViewerLoading(false);
    setViewerError(null);
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
      setViewerUrl(null);
    }
  };

  const handleDownloadResume = () => {
    if (details?.resumeDownloadUrl) {
      window.location.href = details.resumeDownloadUrl;
    } else {
      window.location.href = `/api/applications/${id}/resume/download`;
    }
  };

  // Skeleton Loading State
  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="sad-container">
          <div className="sad-back-skel"></div>
          <div className="sad-card sad-skel-card">
            <div className="sad-skel-line sad-skel-title"></div>
            <div className="sad-skel-line sad-skel-sub"></div>
          </div>
          <div className="sad-card sad-skel-card">
            <div className="sad-skel-line sad-skel-head"></div>
            <div className="sad-skel-boxes">
              <div className="sad-skel-box"></div>
              <div className="sad-skel-box"></div>
              <div className="sad-skel-box"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not Found State
  if (errorType === 'NOT_FOUND') {
    return (
      <DashboardLayout role="student">
        <div className="sad-container">
          <div className="sad-state-card">
            <div className="sad-state-icon">
              <AlertCircle size={32} color="#64748B" />
            </div>
            <h2 className="sad-state-title">Application Not Found</h2>
            <p className="sad-state-desc">The application you're looking for doesn't exist or is no longer available.</p>
            <button className="sad-btn-back-nav" onClick={() => navigate('/student/applications')} type="button">
              <ArrowLeft size={16} /> Back to Applications
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Server Error State
  if (errorType) {
    return (
      <DashboardLayout role="student">
        <div className="sad-container">
          <div className="sad-state-card">
            <div className="sad-state-icon">
              <AlertCircle size={32} color="#DC2626" />
            </div>
            <h2 className="sad-state-title">Unable to load application details.</h2>
            <p className="sad-state-desc">{errorMsg || "We couldn't retrieve this application right now."}</p>
            <div className="sad-state-actions">
              <button className="sad-btn-primary" onClick={fetchApplicationDetails} type="button">
                <RotateCcw size={15} /> Try Again
              </button>
              <button className="sad-btn-secondary" onClick={() => navigate('/student/applications')} type="button">
                <ArrowLeft size={15} /> Back to Applications
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout role="student">
        <div className="sad-container">
          <div className="sad-back-skel"></div>
          <div className="sad-card sad-skel-card">
            <div className="sad-skel-line sad-skel-title"></div>
            <div className="sad-skel-line sad-skel-sub"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatus = (details.status || 'APPLIED').toUpperCase();
  const companyName = details.companyName || details.company || 'Company';
  const companyInitials = getCompanyInitials(companyName);
  const jobRoleTitle = details.jobTitle || details.role || details.job?.title || 'Job Role';
  const appIdFormatted = `Application #${details.id ? details.id.toString().padStart(6, '0') : '000001'}`;

  // Timeline stages setup
  const timelineStages = [
    { key: 'APPLIED', label: 'Applied', desc: 'Application submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'Recruiter reviewing profile' },
    { key: 'SHORTLISTED', label: 'Shortlisted', desc: 'Shortlisted for candidate round' },
    { key: 'INTERVIEW', label: 'Interview Scheduled', desc: 'Interview round in progress' },
    { 
      key: 'FINAL', 
      label: 'Final Status', 
      desc: ['SELECTED','ACCEPTED','OFFERED','OFFER_RELEASED'].includes(currentStatus) 
        ? 'Offer released!' 
        : currentStatus === 'REJECTED' 
        ? 'Application closed' 
        : 'Awaiting final decision' 
    }
  ];

  const getStageState = (stageKey) => {
    if (currentStatus === 'REJECTED') {
      if (stageKey === 'FINAL') return 'rejected';
      return 'completed';
    }
    if (['SELECTED','ACCEPTED','OFFERED','OFFER_RELEASED'].includes(currentStatus)) {
      return 'completed';
    }
    if (stageKey === 'APPLIED') {
      return currentStatus === 'APPLIED' ? 'current' : 'completed';
    }
    if (stageKey === 'UNDER_REVIEW') {
      if (currentStatus === 'UNDER_REVIEW') return 'current';
      if (['SHORTLISTED','INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'completed';
      return 'upcoming';
    }
    if (stageKey === 'SHORTLISTED') {
      if (currentStatus === 'SHORTLISTED') return 'current';
      if (['INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'completed';
      return 'upcoming';
    }
    if (stageKey === 'INTERVIEW') {
      if (['INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'current';
      return 'upcoming';
    }
    return 'upcoming';
  };

  // Extract skills array cleanly
  const rawSkills = typeof details.requiredSkills === 'string'
    ? details.requiredSkills.split(',')
    : Array.isArray(details.requiredSkills)
    ? details.requiredSkills
    : Array.isArray(details.skills)
    ? details.skills
    : typeof details.skills === 'string'
    ? details.skills.split(',')
    : [];

  const skillsList = rawSkills
    .map(s => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object') {
        return s.skillName || s.name || s.skill || s.title || '';
      }
      return '';
    })
    .filter(Boolean);

  return (
    <DashboardLayout role="student">
      <div className="sad-container">
        
        {/* 1. BACK TO APPLICATIONS */}
        <div className="sad-back-wrapper">
          <button 
            className="sad-back-button" 
            onClick={() => navigate('/student/applications')} 
            type="button" 
            aria-label="Back to Applications"
          >
            <ArrowLeft size={16} /> Back to Applications
          </button>
        </div>

        {/* 2. JOB HEADER */}
        <div className="sad-card sad-header-card">
          <div className="sad-header-top">
            <div className="sad-avatar-box">
              {details.companyLogoUrl ? (
                <img 
                  src={getImageUrl(details.companyLogoUrl)} 
                  alt={companyName} 
                  className="sad-avatar-img" 
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
                />
              ) : (
                <span className="sad-avatar-fallback">{companyInitials}</span>
              )}
            </div>

            <div className="sad-header-meta">
              <h1 className="sad-job-title">{jobRoleTitle}</h1>
              <p className="sad-company-name">{companyName}</p>
              <div className="sad-header-subrow">
                <span className="sad-app-id">{appIdFormatted}</span>
                <StatusBadge status={details.status} />
              </div>
            </div>
          </div>

          {/* Action buttons for viewing/downloading resume */}
          <div className="sad-header-actions">
            <button className="sad-btn-action text-[#F47C20]" onClick={handleViewResume} type="button" style={{ color: '#F47C20' }}>
              <Eye size={15} /> View Submitted Resume
            </button>
            <button className="sad-btn-action-outline" onClick={handleDownloadResume} type="button">
              <Download size={15} /> Download
            </button>
          </div>
        </div>

        {/* 3. APPLICATION SELECTION TIMELINE */}
        <div className="sad-card">
          <h2 className="sad-section-heading">Application Selection Timeline</h2>
          
          <div className="sad-timeline">
            {timelineStages.map((stage, idx) => {
              const state = getStageState(stage.key);
              return (
                <div key={idx} className={`sad-timeline-step sad-step-${state}`}>
                  <div className="sad-step-indicator">
                    {state === 'completed' && <Check size={14} className="sad-icon-check" />}
                    {state === 'current' && <span className="sad-dot-current" />}
                    {state === 'upcoming' && <Circle size={10} className="sad-icon-upcoming" />}
                    {state === 'rejected' && <X size={14} className="sad-icon-rejected" />}
                  </div>
                  <div className="sad-step-content">
                    <span className="sad-step-label">{stage.label}</span>
                    <span className="sad-step-desc">{stage.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. JOB OVERVIEW & KEY DETAILS */}
        <div className="sad-card">
          <h2 className="sad-section-heading">Job Overview &amp; Key Details</h2>
          <div className="sad-grid-overview">
            <div className="sad-grid-item">
              <span className="sad-grid-label">Salary / Package</span>
              <span className="sad-grid-val">{details.packageDetails || details.salaryPackage || details.job?.salaryPackage || '—'}</span>
            </div>

            <div className="sad-grid-item">
              <span className="sad-grid-label">Work Location</span>
              <span className="sad-grid-val">{details.jobLocation || details.location || details.job?.location || '—'}</span>
            </div>

            <div className="sad-grid-item">
              <span className="sad-grid-label">Job Type</span>
              <span className="sad-grid-val">{details.jobType || details.job?.jobType || '—'}</span>
            </div>

            <div className="sad-grid-item">
              <span className="sad-grid-label">Experience Required</span>
              <span className="sad-grid-val">{details.experienceRequired || details.job?.experienceRequired || '—'}</span>
            </div>

            <div className="sad-grid-item">
              <span className="sad-grid-label">Number of Openings</span>
              <span className="sad-grid-val">{(details.openings || details.job?.openings) ? `${details.openings || details.job?.openings} Openings` : '—'}</span>
            </div>

            <div className="sad-grid-item">
              <span className="sad-grid-label">Application Deadline</span>
              <span className="sad-grid-val">{fmtDate(details.expiryDate || details.deadline || details.job?.applicationDeadline)}</span>
            </div>
          </div>
        </div>

        {/* 5. BRANCH & ELIGIBILITY CRITERIA */}
        <div className="sad-card">
          <h2 className="sad-section-heading">Branch &amp; Eligibility Criteria</h2>
          <div className="sad-eligibility-grid">
            <div className="sad-eligibility-item">
              <span className="sad-eligibility-label">Eligible Departments / Branches</span>
              <span className="sad-eligibility-val">{details.eligibleDepartments || details.eligibleBranches || details.job?.eligibleDepartments || details.job?.eligibleBranches || '—'}</span>
            </div>

            <div className="sad-eligibility-item">
              <span className="sad-eligibility-label">Minimum CGPA Required</span>
              <span className="sad-eligibility-val">{(() => {
                const cgpa = details.minCgpa ?? details.minimumCgpa ?? details.requiredCgpa ?? details.job?.minCgpa ?? details.job?.requiredCgpa;
                return cgpa != null ? `${cgpa} CGPA & above` : '—';
              })()}</span>
            </div>

            <div className="sad-eligibility-item">
              <span className="sad-eligibility-label">Eligible Semester / Batch</span>
              <span className="sad-eligibility-val">{(() => {
                const sem = details.eligibleSemester ?? details.eligibleSemesterBatch ?? details.job?.eligibleSemester;
                if (!sem) return '—';
                if (typeof sem === 'string' && (sem.includes('Semester') || sem.includes('Batch') || sem.includes('Year'))) return sem;
                return `Semester ${sem} and above`;
              })()}</span>
            </div>

            <div className="sad-eligibility-item">
              <span className="sad-eligibility-label">Active Backlogs Allowed</span>
              <span className="sad-eligibility-val">{(() => {
                const backlogs = details.maxBacklogs ?? details.activeBacklogsAllowed ?? details.activeBacklogs ?? details.job?.maxBacklogs;
                return backlogs != null ? `Max ${backlogs} Backlogs Allowed` : '—';
              })()}</span>
            </div>
          </div>
        </div>

        {/* 6. JOB DESCRIPTION */}
        <div className="sad-card">
          <h2 className="sad-section-heading">Job Description</h2>
          {details.jobDescription || details.description ? (
            <div className="sad-prose-text">{details.jobDescription || details.description}</div>
          ) : (
            <p className="sad-empty-text">No detailed description provided for this position.</p>
          )}
        </div>

        {/* 7. REQUIRED SKILLS & TECHNOLOGIES */}
        <div className="sad-card">
          <h2 className="sad-section-heading">Required Skills &amp; Technologies</h2>
          {skillsList.length > 0 ? (
            <div className="sad-skills-wrap">
              {skillsList.map((skill, i) => {
                const label = typeof skill === 'object' ? (skill?.skillName || skill?.name || skill?.skill || '') : String(skill || '');
                if (!label) return null;
                return (
                  <span key={i} className="sad-skill-pill">{label}</span>
                );
              })}
            </div>
          ) : (
            <p className="sad-empty-text">No specific required skills listed.</p>
          )}
        </div>

        {/* 8. ABOUT COMPANY */}
        <div className="sad-card">
          <h2 className="sad-section-heading">About {companyName}</h2>
          <div className="sad-company-box">
            <div className="sad-company-header">
              <div className="sad-company-avatar">{companyInitials}</div>
              <div>
                <h3 className="sad-company-name-lg">{companyName}</h3>
                <p className="sad-company-sub">{details.companyIndustry || details.industry || 'Technology & Services'} · {details.companySizeInfo || details.companySize || 'Corporate'}</p>
              </div>
            </div>
            <p className="sad-company-desc">
              {details.companyDescription || `${companyName} is an esteemed recruiter partner conducting campus placement drives.`}
            </p>
          </div>
        </div>

      </div>

      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={closeDocumentViewer}
        documentUrl={viewerUrl}
        fileName={viewerMetadata?.fileName || 'Resume.pdf'}
        studentName={viewerMetadata?.studentName || details?.studentName}
        rollNumber={viewerMetadata?.rollNumber || details?.rollNumber}
        isLoading={viewerLoading}
        error={viewerError}
        onRetry={handleViewResume}
      />
    </DashboardLayout>
  );
}
