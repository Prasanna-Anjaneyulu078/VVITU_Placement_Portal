import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  onStatusUpdate,
  role = 'alumni', // 'alumni' or 'admin'
  showStatusActions = true // set false to hide Shortlist/Mark Selected/Reject (e.g. Admin All Students view)
}) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Document Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerMetadata, setViewerMetadata] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  useEffect(() => {
    if (isOpen && (applicationId || studentId)) {
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
    if (!url) return fallback;
    return url.startsWith('/api/') ? url.substring(4) : url;
  };

  const handleViewResume = async () => {
    if (!details?.resumeFileName && !details?.resumeUrl) {
      toast.error('Resume Not Uploaded');
      return;
    }
    setViewerOpen(true);
    setViewerError(null);
    setViewerMetadata({
      fileName: details.resumeFileName || `${details.rollNumber || 'Student'}_Resume.pdf`,
      studentName: details.studentName || 'Student',
      rollNumber: details.rollNumber
    });

    if (viewerUrl) {
      setViewerLoading(false);
      return;
    }

    setViewerLoading(true);
    const viewUrl = cleanUrl(
      details.resumeUrl, 
      applicationId 
        ? `/applications/${applicationId}/resume/view` 
        : `/admin/students/${studentId || details.studentId}/resume/view`
    );

    try {
      const response = await api.get(viewUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setViewerUrl(url);
    } catch (err) {
      console.error('Error viewing resume:', err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Resume Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to view resume');
      setViewerError(errMsg);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerLoading(false);
    setViewerError(null);
    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
      setViewerUrl(null);
    }
    setViewerMetadata(null);
  };

  const handleDownloadResume = async () => {
    if (!details?.resumeFileName && !details?.resumeUrl) {
      toast.error('Resume Not Uploaded');
      return;
    }
    const downloadUrl = cleanUrl(
      details.resumeDownloadUrl, 
      applicationId 
        ? `/applications/${applicationId}/resume/download` 
        : `/admin/students/${studentId || details.studentId}/resume/download`
    );

    try {
      const response = await api.get(downloadUrl, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fallbackName = `${details.rollNumber || 'Student'}_Resume.pdf`;
      link.download = details.resumeFileName || fallbackName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      toast.error('Resume file is unavailable. Please contact the student or administrator.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-50 shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 shadow-2xs">
            <div>
              <p className="text-xs font-extrabold text-[#F47C20] uppercase tracking-wider">
                {role === 'admin' ? 'Admin Student Details' : 'Student Application Review'}
              </p>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {details?.jobTitle ? `${details.jobTitle} - Details` : (details?.studentName || 'Student Profile')}
              </h2>
              {details?.company && <p className="text-xs text-slate-500 font-semibold">{details.company}</p>}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 sticky bottom-0 z-10">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>

            {/* Application Status Actions — hidden when showStatusActions is false (e.g. Admin > All Students) */}
            {showStatusActions && (applicationId || details?.id) && (
              <>
                {details?.status !== 'SHORTLISTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SHORTLISTED')}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 transition-all disabled:opacity-50"
                  >
                    Shortlist
                  </button>
                )}
                {details?.status !== 'INTERVIEW_SCHEDULED' && role === 'alumni' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('INTERVIEW_SCHEDULED')}
                    className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-xl border border-purple-200 transition-all disabled:opacity-50"
                  >
                    Schedule Interview
                  </button>
                )}
                {details?.status !== 'SELECTED' && role === 'admin' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SELECTED')}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl border border-emerald-200 transition-all disabled:opacity-50"
                  >
                    Mark Selected
                  </button>
                )}
                {details?.status !== 'REJECTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('REJECTED')}
                    className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl border border-red-200 transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </>
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
