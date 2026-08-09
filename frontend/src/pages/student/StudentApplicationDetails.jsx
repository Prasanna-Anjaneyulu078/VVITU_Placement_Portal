import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  ChevronLeft, MapPin, DollarSign, Briefcase, Calendar, Award, 
  Building2, Globe, FileText, CheckCircle2, Clock, XCircle, Circle,
  Sparkles, Star, Download, Eye, ArrowLeft, AlertCircle, ShieldAlert,
  HelpCircle, UserCheck, Layers, FileCheck, Layers3
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { CardLoader } from '../../components/common/loading';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import './StudentApplicationDetails.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function ApplicationStatusBadge({ status }) {
  const s = (status || 'APPLIED').toUpperCase();
  if (['SELECTED', 'ACCEPTED', 'OFFERED', 'OFFER_RELEASED'].includes(s))
    return <span className="sad-badge sad-badge-success"><CheckCircle2 size={13} /> Selected</span>;
  if (['INTERVIEW', 'INTERVIEW_SCHEDULED'].includes(s))
    return <span className="sad-badge sad-badge-purple"><Clock size={13} /> Interview Scheduled</span>;
  if (s === 'SHORTLISTED')
    return <span className="sad-badge sad-badge-green"><Sparkles size={13} /> Shortlisted</span>;
  if (s === 'ASSESSMENT')
    return <span className="sad-badge sad-badge-warning"><Star size={13} /> Assessment</span>;
  if (s === 'REJECTED')
    return <span className="sad-badge sad-badge-danger"><XCircle size={13} /> Rejected</span>;
  if (s === 'UNDER_REVIEW')
    return <span className="sad-badge sad-badge-info"><Clock size={13} /> Under Review</span>;
  return <span className="sad-badge sad-badge-neutral"><FileText size={13} /> Applied</span>;
}

function JobStatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  if (s === 'CLOSED') {
    return <span className="sad-badge sad-badge-neutral">Closed</span>;
  }
  if (s === 'EXPIRED') {
    return <span className="sad-badge sad-badge-danger">Expired</span>;
  }
  return <span className="sad-badge sad-badge-info">Active Opportunity</span>;
}

export default function StudentApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'NOT_FOUND', 'UNAUTHORIZED', 'SERVER_ERROR'
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
    try {
      // First attempt dedicated student endpoint, fallback to general endpoint
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

      if (status === 404 || msg.toLowerCase().includes('not found')) {
        setErrorType('NOT_FOUND');
        setErrorMsg('Application details not found or job listing removed.');
      } else if (status === 403 || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('unauthorized')) {
        setErrorType('UNAUTHORIZED');
        setErrorMsg('You are not authorized to view this application.');
      } else {
        setErrorType('SERVER_ERROR');
        setErrorMsg(msg || 'Failed to load application details.');
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
      console.error("Error viewing application resume:", err);
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

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="sad-page">
          <div className="sad-header">
            <button className="sad-btn-back" onClick={() => navigate('/student/applications')} type="button" aria-label="Back to Applications">
              <ChevronLeft size={18} /> Back to Applications
            </button>
          </div>
          <CardLoader lines={6} />
        </div>
      </DashboardLayout>
    );
  }

  if (errorType) {
    return (
      <DashboardLayout role="student">
        <div className="sad-page">
          <div className="sad-error-card">
            <div className="sad-error-icon-box">
              {errorType === 'UNAUTHORIZED' ? <ShieldAlert size={36} color="#DC2626" /> : <AlertCircle size={36} color="#F47C20" />}
            </div>
            <h2 className="sad-error-title">
              {errorType === 'NOT_FOUND' ? 'Application Details Unavailable' : errorType === 'UNAUTHORIZED' ? 'Access Denied' : 'Unable to Load Details'}
            </h2>
            <p className="sad-error-desc">{errorMsg || 'We could not fetch the details for this job application.'}</p>
            <button className="sad-btn-orange" onClick={() => navigate('/student/applications')} type="button">
              <ArrowLeft size={16} /> Back to Applications
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!details) return null;

  const currentStatus = (details.status || 'APPLIED').toUpperCase();

  // Map timeline stages
  const timelineStages = [
    { key: 'APPLIED', label: 'Applied', desc: 'Application submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'Recruiter reviewing profile' },
    { key: 'SHORTLISTED', label: 'Shortlisted', desc: 'Shortlisted for candidate round' },
    { key: 'INTERVIEW', label: 'Interview Scheduled', desc: 'Interview round in progress' },
    { key: 'FINAL', label: ['SELECTED','ACCEPTED','OFFERED','OFFER_RELEASED'].includes(currentStatus) ? 'Selected' : currentStatus === 'REJECTED' ? 'Rejected' : 'Final Status', desc: ['SELECTED','ACCEPTED','OFFERED','OFFER_RELEASED'].includes(currentStatus) ? 'Offer released!' : currentStatus === 'REJECTED' ? 'Application closed' : 'Awaiting final decision' }
  ];

  const getStageState = (stageKey) => {
    if (currentStatus === 'REJECTED' && stageKey === 'FINAL') return 'rejected';
    if (['SELECTED','ACCEPTED','OFFERED','OFFER_RELEASED'].includes(currentStatus)) {
      return 'completed';
    }
    if (stageKey === 'APPLIED') return 'completed';
    if (stageKey === 'UNDER_REVIEW' && ['UNDER_REVIEW','SHORTLISTED','INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'completed';
    if (stageKey === 'SHORTLISTED' && ['SHORTLISTED','INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'completed';
    if (stageKey === 'INTERVIEW' && ['INTERVIEW','INTERVIEW_SCHEDULED'].includes(currentStatus)) return 'current';
    if (stageKey === currentStatus || (stageKey === 'INTERVIEW' && currentStatus === 'INTERVIEW_SCHEDULED')) return 'current';
    return 'pending';
  };

  const skillsList = details.requiredSkills ? details.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : (details.skills || []);

  return (
    <DashboardLayout role="student">
      <div className="sad-page">
        {/* TOP NAVIGATION HEADER */}
        <div className="sad-nav-bar">
          <button className="sad-btn-back" onClick={() => navigate('/student/applications')} type="button" aria-label="Back to Applications">
            <ChevronLeft size={18} /> Back to Applications
          </button>
        </div>

        {/* HERO HEADER CARD */}
        <div className="sad-card sad-hero-card">
          <div className="sad-hero-content">
            <div className="sad-logo-box">
              {details.companyLogoUrl ? (
                <img src={details.companyLogoUrl} alt={details.company || details.companyName} className="sad-logo-img" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              ) : (
                <span className="sad-logo-text">{(details.company || details.companyName || 'CO').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="sad-hero-info">
              <div className="sad-hero-badges">
                <JobStatusBadge status={details.jobStatus} />
                <ApplicationStatusBadge status={details.status} />
              </div>
              <h1 className="sad-hero-title">{details.jobTitle || 'Job Role'}</h1>
              <p className="sad-hero-company">
                <Building2 size={15} /> {details.company || details.companyName || 'Company'}
                {details.jobLocation && <span className="sad-hero-loc"><MapPin size={14} /> {details.jobLocation}</span>}
              </p>
            </div>
          </div>

          <div className="sad-hero-actions">
            <button className="sad-btn-orange" onClick={() => navigate('/student/applications')} type="button">
              <ArrowLeft size={16} /> Back to Applications
            </button>
          </div>
        </div>

        {/* SELECTION TIMELINE */}
        <div className="sad-card sad-timeline-card">
          <div className="sad-card-header">
            <h3 className="sad-card-title"><Layers size={18} style={{ color: '#F47C20' }} /> Application Selection Timeline</h3>
            <span className="sad-app-id-tag">App ID: #{details.id ? details.id.toString().padStart(6, '0') : '000000'}</span>
          </div>
          <div className="sad-timeline">
            {timelineStages.map((stage, idx) => {
              const state = getStageState(stage.key);
              return (
                <div key={idx} className={`sad-timeline-step sad-step-${state}`}>
                  <div className="sad-step-marker">
                    {state === 'completed' && <CheckCircle2 size={16} />}
                    {state === 'rejected' && <XCircle size={16} />}
                    {state === 'current' && <Clock size={16} />}
                    {state === 'pending' && <Circle size={12} />}
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

        {/* 2-COLUMN MAIN CONTENT (Desktop 2-col, Tablet/Mobile 1-col) */}
        <div className="sad-grid-layout">
          
          {/* LEFT COLUMN: JOB & COMPANY INFORMATION */}
          <div className="sad-col-main">
            
            {/* JOB OVERVIEW METRICS */}
            <div className="sad-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><Briefcase size={18} style={{ color: '#F47C20' }} /> Job Overview &amp; Key Details</h3>
              </div>
              <div className="sad-metrics-grid">
                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><DollarSign size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Salary / Package</div>
                    <div className="sad-metric-val">{details.packageDetails || 'Competitive CTC'}</div>
                  </div>
                </div>

                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><MapPin size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Work Location</div>
                    <div className="sad-metric-val">{details.jobLocation || 'On-Site / Hybrid'}</div>
                  </div>
                </div>

                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><Briefcase size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Job Type</div>
                    <div className="sad-metric-val">{details.jobType || 'Full-Time'}</div>
                  </div>
                </div>

                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><Award size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Experience Required</div>
                    <div className="sad-metric-val">{details.experienceRequired || 'Entry Level / Fresher'}</div>
                  </div>
                </div>

                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><Layers3 size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Number of Openings</div>
                    <div className="sad-metric-val">{details.openings ? `${details.openings} Openings` : 'Multiple Openings'}</div>
                  </div>
                </div>

                <div className="sad-metric-item">
                  <div className="sad-metric-icon"><Calendar size={18} /></div>
                  <div>
                    <div className="sad-metric-label">Application Deadline</div>
                    <div className="sad-metric-val">{fmtDate(details.expiryDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ELIGIBILITY CRITERIA */}
            <div className="sad-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><UserCheck size={18} style={{ color: '#F47C20' }} /> Branch &amp; Eligibility Criteria</h3>
              </div>
              <div className="sad-eligibility-list">
                <div className="sad-eligibility-row">
                  <span className="sad-eligibility-key">Eligible Departments / Branches:</span>
                  <span className="sad-eligibility-val">{details.eligibleDepartments || 'All Engineering & Technology Branches'}</span>
                </div>
                <div className="sad-eligibility-row">
                  <span className="sad-eligibility-key">Minimum CGPA Required:</span>
                  <span className="sad-eligibility-val">{details.minCgpa != null ? `${details.minCgpa} CGPA & above` : 'No Minimum Threshold'}</span>
                </div>
                <div className="sad-eligibility-row">
                  <span className="sad-eligibility-key">Eligible Semester / Batch:</span>
                  <span className="sad-eligibility-val">{details.eligibleSemester ? `Semester ${details.eligibleSemester} and above` : 'Final Year Students'}</span>
                </div>
                <div className="sad-eligibility-row">
                  <span className="sad-eligibility-key">Active Backlogs Allowed:</span>
                  <span className="sad-eligibility-val">{details.maxBacklogs != null ? `Max ${details.maxBacklogs} Backlogs Allowed` : 'Zero Active Backlogs Preferred'}</span>
                </div>
              </div>
            </div>

            {/* JOB DESCRIPTION & RESPONSIBILITIES */}
            <div className="sad-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><FileText size={18} style={{ color: '#F47C20' }} /> Complete Job Description &amp; Responsibilities</h3>
              </div>
              <div className="sad-description-box">
                {details.jobDescription ? (
                  <div className="sad-prose">{details.jobDescription}</div>
                ) : (
                  <p className="sad-empty-desc">No detailed description provided for this position.</p>
                )}
              </div>
            </div>

            {/* REQUIRED SKILLS & TECHNOLOGIES */}
            {skillsList.length > 0 && (
              <div className="sad-card">
                <div className="sad-card-header">
                  <h3 className="sad-card-title"><Award size={18} style={{ color: '#F47C20' }} /> Required Skills &amp; Technologies</h3>
                </div>
                <div className="sad-skills-flex">
                  {skillsList.map((skill, i) => (
                    <span key={i} className="sad-skill-chip">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* SCREENING QUESTIONS & ANSWERS */}
            {details.screeningAnswers && details.screeningAnswers.length > 0 && (
              <div className="sad-card">
                <div className="sad-card-header">
                  <h3 className="sad-card-title"><HelpCircle size={18} style={{ color: '#F47C20' }} /> Submitted Pre-Application Screening Answers</h3>
                </div>
                <div className="sad-screening-list">
                  {details.screeningAnswers.map((qa, index) => (
                    <div key={qa.id || index} className="sad-screening-item">
                      <div className="sad-screening-q"><span className="sad-q-num">Q{index + 1}.</span> {qa.questionText || qa.questionKey}</div>
                      <div className="sad-screening-a"><span className="sad-a-tag">Submitted Answer:</span> {qa.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPANY INFORMATION */}
            <div className="sad-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><Building2 size={18} style={{ color: '#F47C20' }} /> About {details.companyName || details.company || 'the Recruiter'}</h3>
              </div>
              <div className="sad-company-info">
                <div className="sad-company-meta-row">
                  <div><strong>Industry:</strong> {details.companyIndustry || details.industry || 'Technology & Services'}</div>
                  <div><strong>Company Size:</strong> {details.companySizeInfo || details.companySize || 'Corporate'}</div>
                  {details.companyWebsite && (
                    <div>
                      <strong>Website / Portal:</strong>{' '}
                      <a href={details.companyWebsite.startsWith('http') ? details.companyWebsite : `https://${details.companyWebsite}`} target="_blank" rel="noreferrer" className="sad-link">
                        {details.companyWebsite} <Globe size={13} />
                      </a>
                    </div>
                  )}
                </div>
                <p className="sad-company-desc">
                  {details.companyDescription || `${details.company || details.companyName || 'The company'} is an esteemed recruiter partner conducting campus placement drives.`}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: APPLICATION SUMMARY & RESUME ACTIONS */}
          <div className="sad-col-side">
            
            {/* APPLICATION SUMMARY CARD */}
            <div className="sad-card sad-side-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><FileCheck size={18} style={{ color: '#F47C20' }} /> Application Summary</h3>
              </div>

              <div className="sad-summary-rows">
                <div className="sad-summary-row">
                  <span className="sad-summary-label">Application ID</span>
                  <span className="sad-summary-val font-mono">#{details.id ? details.id.toString().padStart(6, '0') : 'N/A'}</span>
                </div>

                <div className="sad-summary-row">
                  <span className="sad-summary-label">Date Applied</span>
                  <span className="sad-summary-val">{fmtDateTime(details.appliedAt)}</span>
                </div>

                <div className="sad-summary-row">
                  <span className="sad-summary-label">Current Status</span>
                  <span className="sad-summary-val"><ApplicationStatusBadge status={details.status} /></span>
                </div>

                {details.jobCreatedAt && (
                  <div className="sad-summary-row">
                    <span className="sad-summary-label">Job Posted Date</span>
                    <span className="sad-summary-val">{fmtDate(details.jobCreatedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RESUME SUBMITTED & ACTIONS CARD */}
            <div className="sad-card sad-side-card">
              <div className="sad-card-header">
                <h3 className="sad-card-title"><FileText size={18} style={{ color: '#F47C20' }} /> Submitted Resume</h3>
              </div>

              <div className="sad-resume-info-box">
                <div className="sad-resume-file-row">
                  <FileText size={22} style={{ color: '#F47C20' }} />
                  <div className="sad-resume-file-meta">
                    <span className="sad-resume-name">{details.resumeFileName || 'Student_Resume.pdf'}</span>
                    <span className="sad-resume-status">Submitted with Application</span>
                  </div>
                </div>

                <div className="sad-resume-actions">
                  <button className="sad-btn-orange" onClick={handleViewResume} type="button">
                    <Eye size={16} /> View Resume
                  </button>
                  <button className="sad-btn-orange-outline" onClick={handleDownloadResume} type="button">
                    <Download size={16} /> Download Resume
                  </button>
                </div>
              </div>
            </div>

            {/* STUDENT CONTACT & NOTES */}
            {(details.coverLetter || details.notes) && (
              <div className="sad-card sad-side-card">
                <div className="sad-card-header">
                  <h3 className="sad-card-title"><FileText size={18} style={{ color: '#F47C20' }} /> Cover Letter &amp; Notes</h3>
                </div>
                {details.coverLetter && (
                  <div className="sad-note-block">
                    <div className="sad-note-label">Cover Letter:</div>
                    <div className="sad-note-text">{details.coverLetter}</div>
                  </div>
                )}
                {details.notes && (
                  <div className="sad-note-block">
                    <div className="sad-note-label">Notes:</div>
                    <div className="sad-note-text">{details.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* BACK TO APPLICATIONS BUTTON */}
            <button className="sad-btn-orange sad-btn-full" onClick={() => navigate('/student/applications')} type="button">
              <ArrowLeft size={16} /> Back to All Applications
            </button>

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
