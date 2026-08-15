import React from 'react';
import { X, GraduationCap, Briefcase, ShieldCheck, CheckCircle2, AlertCircle, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import Avatar from '../common/Avatar';
import { toTitleCase } from '../../utils/nameUtils';
import './AlumniDetails.css';

/**
 * Dedicated Alumni Details / Profile Modal Component
 * Displays a clean, production-ready view of Alumni information with:
 * - Visually dominant Profile Header (Avatar + Initials fallback, Name, Email, Role & Dept badges)
 * - Academic Information section (Department, Passout Year)
 * - Professional Information section (Current Company, Designation)
 * - Verification section (Status badge, Document details)
 * - Responsive 2-column (Desktop/Tablet) and 1-column (Mobile) layout
 * - Skeleton Loading state & Error state handling
 */
export default function AlumniDetailsModal({
  alumni,
  isOpen = true,
  onClose,
  onViewDocument,
  isLoading = false,
  isError = false,
  onRetry
}) {
  if (!isOpen) return null;

  const rawName = alumni?.user?.name || alumni?.name || alumni?.fullName || 'Alumni';
  const name = toTitleCase(rawName);
  const email = alumni?.user?.email || alumni?.email || 'N/A';
  const profileImage = alumni?.profileImageUrl || alumni?.user?.profileImageUrl;
  const department = alumni?.department || alumni?.dept || 'N/A';
  const passoutYear = alumni?.passoutYear || alumni?.graduationYear || alumni?.passingYear || alumni?.graduation || 'N/A';
  const currentCompany = alumni?.companyName || alumni?.company || alumni?.currentCompany || 'N/A';
  const designation = alumni?.designation || alumni?.role || alumni?.jobTitle || 'N/A';
  const verificationStatus = alumni?.verificationStatus || alumni?.status || 'PENDING';

  const renderStatusBadge = () => {
    switch (String(verificationStatus).toUpperCase()) {
      case 'VERIFIED':
      case 'APPROVED':
        return (
          <span className="alumni-status-badge alumni-status-verified">
            <CheckCircle2 size={16} /> Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="alumni-status-badge alumni-status-rejected">
            <X size={16} /> Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="alumni-status-badge alumni-status-pending">
            <AlertCircle size={16} /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="alumni-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="alumni-modal-title">
      <div className="alumni-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div className="alumni-modal-header">
          <h2 id="alumni-modal-title" className="alumni-modal-title">Alumni Profile</h2>
          {onClose && (
            <button onClick={onClose} className="alumni-modal-close" aria-label="Close modal" title="Close">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="alumni-modal-body">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-6">
              <div className="alumni-header-card">
                <div className="w-20 h-20 alumni-skeleton-box rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 alumni-skeleton-box" />
                  <div className="h-4 w-1/2 alumni-skeleton-box" />
                  <div className="h-5 w-1/3 alumni-skeleton-box" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-5 w-1/3 alumni-skeleton-box" />
                <div className="alumni-grid">
                  <div className="h-16 alumni-skeleton-box" />
                  <div className="h-16 alumni-skeleton-box" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-5 w-1/3 alumni-skeleton-box" />
                <div className="alumni-grid">
                  <div className="h-16 alumni-skeleton-box" />
                  <div className="h-16 alumni-skeleton-box" />
                </div>
              </div>
            </div>
          ) : isError ? (
            /* Error State */
            <div className="alumni-error-container">
              <AlertCircle size={36} className="text-red-500" />
              <p className="alumni-error-title">Unable to load alumni details.</p>
              <p className="text-xs text-slate-500">Please try again or check your network connection.</p>
              {onRetry && (
                <button onClick={onRetry} className="alumni-btn-retry flex items-center gap-1.5">
                  <RefreshCw size={14} /> Retry
                </button>
              )}
            </div>
          ) : (
            /* Content Layout */
            <>
              {/* Profile Header */}
              <div className="alumni-header-card">
                <div className="alumni-avatar-wrapper">
                  <Avatar
                    src={profileImage}
                    name={name}
                    size="lg"
                    style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                  />
                </div>

                <div className="alumni-header-info">
                  <h3 className="alumni-header-name">{name}</h3>
                  <p className="alumni-header-email">{email}</p>
                  
                  <div className="alumni-badges-row">
                    <span className="alumni-role-badge">Alumni</span>
                    {department !== 'N/A' && (
                      <span className="alumni-dept-badge">{department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="alumni-section">
                <h4 className="alumni-section-header">
                  <GraduationCap size={16} /> Academic Information
                </h4>
                <div className="alumni-grid">
                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Department</span>
                    <span className={`alumni-field-value ${department === 'N/A' ? 'alumni-value-na' : ''}`}>
                      {department}
                    </span>
                  </div>

                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Passout Year</span>
                    <span className={`alumni-field-value ${passoutYear === 'N/A' ? 'alumni-value-na' : ''}`}>
                      {passoutYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="alumni-section">
                <h4 className="alumni-section-header">
                  <Briefcase size={16} /> Professional Information
                </h4>
                <div className="alumni-grid">
                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Current Company</span>
                    <span className={`alumni-field-value ${currentCompany === 'N/A' ? 'alumni-value-na' : ''}`}>
                      {currentCompany}
                    </span>
                  </div>

                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Designation</span>
                    <span className={`alumni-field-value ${designation === 'N/A' ? 'alumni-value-na' : ''}`}>
                      {designation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Section */}
              <div className="alumni-section">
                <h4 className="alumni-section-header">
                  <ShieldCheck size={16} /> Verification
                </h4>
                <div className="alumni-grid">
                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Verification Status</span>
                    <div className="mt-1">
                      {renderStatusBadge()}
                    </div>
                  </div>

                  <div className="alumni-field-card">
                    <span className="alumni-field-label">Verified Document</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="alumni-field-value">
                        Degree Certificate
                      </span>
                      {onViewDocument && (
                        <button
                          type="button"
                          onClick={() => onViewDocument(alumni)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#F47C20] hover:underline cursor-pointer"
                        >
                          <ExternalLink size={12} /> View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="alumni-modal-footer">
          {onClose && (
            <button type="button" onClick={onClose} className="alumni-btn-close">
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
