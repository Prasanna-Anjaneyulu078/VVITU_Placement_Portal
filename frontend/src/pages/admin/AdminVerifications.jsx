import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Check, X, Eye, FileText, AlertTriangle, ShieldCheck, ShieldAlert, ClipboardList } from 'lucide-react';
import { PageHeader, Table, Button, LoadingSpinner, Modal, DocumentViewerModal } from '../../components/common';

import { getImageUrl } from '../../utils/imageUrl';
import Avatar from '../../components/common/Avatar';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { toTitleCase } from '../../utils/nameUtils';

const FILTER_ALL = 'all';
const FILTER_MANUAL = 'manual';

export default function AdminVerifications() {
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  // OCR Text Modal
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrDetails, setOcrDetails] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Reject Reason Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectAlumniId, setRejectAlumniId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Document Viewer Modal State
  const [viewingDocAlumni, setViewingDocAlumni] = useState(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);

  const itemsPerPage = 10;

  const fetchPendingAlumni = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/alumni/pending');
      setPendingAlumni(res.data);
    } catch (err) {
      console.error('Failed to fetch pending alumni', err);
      toast.error('Failed to load pending alumni');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAlumni();
  }, []);

  const handleVerify = async (id) => {
    setIsVerifying(true);
    try {
      await api.post(`/admin/alumni/verify/${id}`, { approved: true });
      toast.success('Alumni verified successfully!');
      fetchPendingAlumni();
    } catch (err) {
      toast.error('Failed to verify alumni');
    } finally {
      setIsVerifying(false);
    }
  };

  const openRejectModal = (id) => {
    setRejectAlumniId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setIsVerifying(true);
    try {
      await api.post(`/admin/alumni/verify/${rejectAlumniId}`, {
        approved: false,
        rejectionReason: rejectReason
      });
      toast.success('Alumni registration rejected.');
      setRejectModalOpen(false);
      fetchPendingAlumni();
    } catch (err) {
      toast.error('Failed to reject alumni');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewDoc = async (alum) => {
    if (!alum) return;
    setViewingDocAlumni(alum);
    setDocModalOpen(true);
    setDocError(null);
    setDocLoading(true);
    setDocBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });

    try {
      const docPath = `/admin/alumni/${alum.id}/document`;
      const res = await api.get(docPath, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${alum.rollNumber || 'Alumni'}_VerificationDocument.pdf`;
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDocBlobUrl(url);
      setViewingDocAlumni(prev => prev ? ({ ...prev, fileName: filename }) : prev);
    } catch (err) {
      console.error('Failed to view verification document:', err);
      let errMsg = 'Failed to load document';
      if (err.response?.data && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) errMsg = parsed.message;
        } catch (e) {
          errMsg = err.response?.status === 404 ? 'Verification document not found or missing from storage.' : err.message;
        }
      } else {
        errMsg = err.response?.status === 404 ? 'Verification document not found or missing from storage.' : (err.message || 'Failed to load document');
      }
      setDocError(errMsg);
    } finally {
      setDocLoading(false);
    }
  };

  const closeDocModal = () => {
    setDocModalOpen(false);
    setViewingDocAlumni(null);
    setDocLoading(false);
    setDocError(null);
    setDocBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  };

  const openOcrModal = async (alum) => {
    setOcrModalOpen(true);
    setOcrDetails(null);
    setOcrLoading(true);
    try {
      const res = await api.get(`/admin/alumni/${alum.id}/ocr-details`);
      setOcrDetails({ ...res.data, alumName: alum.user?.name, alumEmail: alum.user?.email });
    } catch {
      setOcrDetails({ error: 'Failed to load OCR details for this alumni.' });
    } finally {
      setOcrLoading(false);
    }
  };

  const getConfidenceBadge = (score) => {
    if (score == null) return <span className="text-xs text-gray-400">N/A</span>;
    const pct = Math.round(score * 100);
    let color = 'bg-green-100 text-green-700 border-green-200';
    if (pct < 60) color = 'bg-red-100 text-red-700 border-red-200';
    else if (pct < 80) color = 'bg-amber-100 text-amber-700 border-amber-200';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
        {pct}%
      </span>
    );
  };

  const displayedAlumni = pendingAlumni.filter(a =>
    activeFilter === FILTER_MANUAL ? a.manualReviewRequired : true
  );

  const filteredUsers = displayedAlumni.filter(u => {
    const matchesSearch = !searchTerm ||
      (u.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || u.department === filterDept;
    const matchesStatus = !filterStatus || (filterStatus === 'MANUAL' ? u.manualReviewRequired : !u.manualReviewRequired);
    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepts = [...new Set(pendingAlumni.map(a => a.department).filter(Boolean))];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const manualCount = pendingAlumni.filter(a => a.manualReviewRequired).length;

  const columns = [
    {
      header: 'Alumni',
      render: (alum) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={alum.profileImageUrl} 
            name={alum.user?.name || 'A'} 
            size="md" 
            className="w-10 h-10 border border-gray-200 shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{toTitleCase(alum.user?.name)}</span>
              {alum.manualReviewRequired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-700 rounded-full text-[10px] font-bold">
                  <AlertTriangle size={9} /> Manual Review
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{alum.user?.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Details',
      render: (alum) => (
        <div className="text-xs text-gray-600 space-y-0.5">
          <div><span className="font-semibold text-gray-800">Roll:</span> {alum.rollNumber || 'N/A'}</div>
          <div><span className="font-semibold text-gray-800">Dept:</span> {alum.department || 'N/A'}</div>
          <div><span className="font-semibold text-gray-800">Year:</span> {alum.passingYear || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'OCR Verification',
      render: (alum) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5">
            {alum.ocrVerified
              ? <ShieldCheck size={13} className="text-green-500" />
              : <ShieldAlert size={13} className="text-amber-500" />}
            <span className={`font-semibold ${alum.ocrVerified ? 'text-green-700' : 'text-amber-700'}`}>
              {alum.ocrVerified ? 'OCR Passed' : 'OCR Not Verified'}
            </span>
          </div>
          <div><span className="text-gray-500">College:</span> <span className="font-medium text-gray-800">{alum.ocrDetectedCollege || 'N/A'}</span></div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Confidence:</span>
            {getConfidenceBadge(alum.ocrConfidenceScore)}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (alum) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVerify(alum.id)}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600   text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Check size={13} /> Approve
            </button>
            <button
              onClick={() => openRejectModal(alum.id)}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-600   text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={13} /> Reject
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openOcrModal(alum)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600   text-xs font-bold rounded-lg transition-colors"
            >
              <ClipboardList size={13} /> OCR Text
            </button>
            {alum.verificationDocumentUrl && (
              <button
                onClick={() => handleViewDoc(alum)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                <FileText size={13} /> Document
              </button>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Alumni Verifications"
        subtitle="Review and verify identity documents submitted by alumni registrants."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => { setActiveFilter(FILTER_ALL); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeFilter === FILTER_ALL
              ? 'bg-[#0A4D8C] text-white shadow'
              : 'bg-white border border-slate-200 text-slate-600    '
          }`}
        >
          All Pending
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${activeFilter === FILTER_ALL ? 'bg-white text-[#0A4D8C]' : 'bg-slate-100 text-slate-600'}`}>
            {pendingAlumni.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveFilter(FILTER_MANUAL); setCurrentPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeFilter === FILTER_MANUAL
              ? 'bg-amber-500 text-white shadow'
              : 'bg-white border border-slate-200 text-slate-600    '
          }`}
        >
          <AlertTriangle size={14} />
          Manual Review Required
          {manualCount > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${activeFilter === FILTER_MANUAL ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'}`}>
              {manualCount}
            </span>
          )}
        </button>
      </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
          {filteredUsers.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No pending verifications found.</p>
            <p className="text-gray-400 text-sm mt-1">All alumni have been reviewed!</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={currentUsers}
            isLoading={isLoading}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
              totalItems: filteredUsers.length,
              pageSize: itemsPerPage,
              itemLabel: "alumni"
            }}
          />
        )}
      </div>

      {/* OCR Text Modal */}
      <Modal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        title="OCR Verification Details"
      >
        {ocrLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : ocrDetails?.error ? (
          <p className="text-red-500 text-sm">{ocrDetails.error}</p>
        ) : ocrDetails ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extracted Name</p>
                <p className="font-semibold text-slate-800">{ocrDetails.ocrExtractedName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extracted Roll</p>
                <p className="font-semibold text-slate-800">{ocrDetails.ocrExtractedRollNumber || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detected College</p>
                <p className="font-semibold text-slate-800">{ocrDetails.ocrDetectedCollege || 'Not Detected'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence Score</p>
                {getConfidenceBadge(ocrDetails.ocrConfidenceScore)}
              </div>
            </div>
            {ocrDetails.manualReviewRequired && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800 text-xs font-medium">
                  This record has been flagged for manual review due to low OCR confidence. Please examine the uploaded document carefully before approving.
                </p>
              </div>
            )}
            {ocrDetails.rawOcrText && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raw OCR Extracted Text</p>
                <pre className="bg-slate-900 text-green-400 text-xs rounded-xl p-4 overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                  {ocrDetails.rawOcrText}
                </pre>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Alumni Registration"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-xs font-medium">
              The alumni will be notified of this rejection. Please provide a clear reason.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rejection Reason *</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Uploaded document is not a valid VVIT-issued document..."
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#F47C20] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold   transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isVerifying}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold   transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <X size={15} /> {isVerifying ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={docModalOpen}
        onClose={closeDocModal}
        documentUrl={docBlobUrl}
        fileName={viewingDocAlumni ? `${viewingDocAlumni.rollNumber || 'Alumni'}_VerificationDocument.pdf` : 'Document.pdf'}
        alumniName={viewingDocAlumni?.user?.name}
        rollNumber={viewingDocAlumni?.rollNumber}
        isLoading={docLoading}
        error={docError}
        onRetry={() => handleViewDoc(viewingDocAlumni)}
      />
    </DashboardLayout>
  );
}
