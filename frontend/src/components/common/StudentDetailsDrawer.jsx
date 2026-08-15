import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import DocumentViewerModal from './DocumentViewerModal';

// Reusable Section Components
import StudentProfileCard from '../student-details/StudentProfileCard';
import SkillsSection from '../student-details/SkillsSection';
import ProjectsSection from '../student-details/ProjectsSection';
import ResumeSection from '../student-details/ResumeSection';
import EducationSection from '../student-details/EducationSection';
import ProfessionalLinksSection from '../student-details/ProfessionalLinksSection';
import ApplicationDetailsSection from '../student-details/ApplicationDetailsSection';

export default function StudentDetailsDrawer({
  applicationId,
  studentId,
  isOpen,
  onClose,
  showStatusActions = true,
  onStatusUpdate,
  role
}) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Resume Viewer Modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerMetadata, setViewerMetadata] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, applicationId, studentId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      let res;
      if (applicationId) {
        res = await api.get(`/applications/${applicationId}/details`);
      } else if (studentId) {
        res = await api.get(`/admin/users/students/${studentId}/details`);
      }
      setDetails(res ? res.data : null);
    } catch (err) {
      console.error('Failed to load student details', err);
      toast.error('Failed to load student details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!applicationId && !details?.id) return;
    const targetAppId = applicationId || details.id;
    setIsUpdating(true);
    try {
      await api.patch(`/applications/${targetAppId}/status`, { status: newStatus });
      toast.success(`Application status updated to ${newStatus.replace('_', ' ')}`);
      setDetails(prev => prev ? { ...prev, status: newStatus } : null);
      if (onStatusUpdate) onStatusUpdate(targetAppId, newStatus);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const cleanUrl = (url, fallback) => {
    if (!url || typeof url !== 'string') return fallback || null;
    const trimmed = url.trim();
    if (!trimmed) return fallback || null;
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed}`;
  };

  const handleViewResume = async () => {
    const targetAppId = applicationId;
    const targetStudentId = studentId || details?.id;
    const fallbackUrl = cleanUrl(details?.resumeUrl || details?.resumeFileUrl);

    setViewerOpen(true);
    setViewerLoading(true);
    setViewerError(null);
    setViewerMetadata({
      fileName: details?.resumeFileName || 'Student_Resume.pdf',
      studentName: details?.studentName || details?.name,
      rollNumber: details?.rollNumber
    });

    let endpoint = '';
    if (targetAppId) {
      endpoint = `/applications/${targetAppId}/resume/view`;
    } else if (targetStudentId) {
      endpoint = `/admin/students/${targetStudentId}/resume/view`;
    }

    if (endpoint) {
      try {
        const response = await api.get(endpoint, { responseType: 'blob' });
        const disposition = response.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match ? match[1] : (details?.resumeFileName || `${details?.rollNumber || 'Student'}_Resume.pdf`);
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setViewerUrl(blobUrl);
        setViewerMetadata(prev => ({ ...prev, fileName: filename }));
      } catch (err) {
        console.error('API resume view failed, attempting fallback', err);
        let errMsg = 'Failed to load resume';
        if (err.response?.data && err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed?.message) errMsg = parsed.message;
          } catch (e) {
            errMsg = err.response?.status === 404 ? 'Student resume not found or missing from storage.' : err.message;
          }
        } else {
          errMsg = err.response?.status === 404 ? 'Student resume not found or missing from storage.' : (err.message || 'Failed to load resume');
        }

        if (fallbackUrl) {
          setViewerUrl(fallbackUrl);
        } else {
          setViewerError(new Error(errMsg));
        }
      } finally {
        setViewerLoading(false);
      }
    } else if (fallbackUrl) {
      setViewerUrl(fallbackUrl);
      setViewerLoading(false);
    } else {
      setViewerError(new Error('No resume file URL available.'));
      setViewerLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    const targetAppId = applicationId;
    const targetStudentId = studentId || details?.id;
    const fallbackUrl = cleanUrl(details?.resumeUrl || details?.resumeFileUrl);
    const fileName = details?.resumeFileName || `${details?.rollNumber || 'Student'}_Resume.pdf`;

    let endpoint = '';
    if (targetAppId) {
      endpoint = `/applications/${targetAppId}/resume/download`;
    } else if (targetStudentId) {
      endpoint = `/admin/students/${targetStudentId}/resume/download`;
    }

    if (endpoint) {
      try {
        const response = await api.get(endpoint, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
        toast.success('Resume download started');
        return;
      } catch (err) {
        console.error('API resume download failed, attempting fallback link', err);
      }
    }

    if (fallbackUrl) {
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Resume download started');
    } else {
      toast.error('Resume document not available for download');
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    if (viewerUrl && viewerUrl.startsWith('blob:')) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setViewerError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex">
        <div className="w-full h-full sm:h-auto sm:w-screen sm:max-w-2xl bg-slate-50 shadow-2xl flex flex-col border-0 sm:border-l border-slate-200">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                onClick={onClose} 
                className="sm:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
                title="Back to list"
              >
                <ArrowLeft size={18} className="text-[#F47C20]" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-extrabold text-[#F47C20] uppercase tracking-wider truncate">
                  {role === 'admin' ? 'Admin Student Details' : 'Student Application Review'}
                </p>
                <h2 className="text-base sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                  {details?.jobTitle ? `${details.jobTitle} - Details` : (details?.studentName || 'Student Profile')}
                </h2>
                {details?.company && <p className="text-xs text-slate-500 font-semibold truncate">{details.company}</p>}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] shrink-0 ml-2 cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center p-12">
              <LoadingSpinner size="large" />
            </div>
          ) : !details ? (
            <div className="flex-1 p-12 text-center text-slate-500 font-semibold">
              Could not load student details.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 break-words min-w-0">

              {/* 1. Personal Information */}
              <StudentProfileCard details={details} />

              {/* 2. Skills */}
              <SkillsSection skills={details.skills} />

              {/* 3. Projects */}
              <ProjectsSection projects={details.projects} />

              {/* 4. Resume */}
              <ResumeSection 
                resumeFileName={details.resumeFileName}
                onViewResume={handleViewResume}
                onDownloadResume={handleDownloadResume}
              />

              {/* 5. Education */}
              <EducationSection details={details} />

              {/* 6. Professional Links */}
              <ProfessionalLinksSection details={details} />

              {/* 7. Application Details (Only if application info exists) */}
              <ApplicationDetailsSection details={details} />

            </div>
          )}

          {/* Footer Actions */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between sm:justify-end gap-2 sticky bottom-0 z-10 shadow-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>

            {/* Application Status Actions — hidden when showStatusActions is false (e.g. Admin > All Students) */}
            {showStatusActions && (applicationId || details?.id) && (
              <div className="flex flex-wrap items-center gap-2">
                {details?.status !== 'SHORTLISTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SHORTLISTED')}
                    className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? 'Updating...' : 'Shortlist'}
                  </button>
                )}
                {details?.status !== 'INTERVIEW_SCHEDULED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('INTERVIEW_SCHEDULED')}
                    className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-xl border border-purple-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? 'Updating...' : 'Schedule Interview'}
                  </button>
                )}
                {details?.status !== 'SELECTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SELECTED')}
                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl border border-emerald-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? 'Updating...' : 'Select Candidate'}
                  </button>
                )}
                {details?.status !== 'REJECTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('REJECTED')}
                    className="px-3.5 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl border border-red-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? 'Updating...' : 'Reject'}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={closeViewer}
        documentUrl={viewerUrl}
        fileName={viewerMetadata?.fileName || 'Document.pdf'}
        studentName={viewerMetadata?.studentName}
        rollNumber={viewerMetadata?.rollNumber}
        isLoading={viewerLoading}
        error={viewerError}
        onRetry={handleViewResume}
      />
    </div>
  );
}
