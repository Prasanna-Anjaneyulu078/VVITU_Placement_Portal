import React from 'react';
import { X, Download, FileText, Calendar, User, Hash, ExternalLink, AlertCircle, ShieldAlert, RefreshCw, FileQuestion } from 'lucide-react';

const DocumentViewerModal = ({
  isOpen,
  onClose,
  documentUrl,
  fileName,
  studentName,
  alumniName,
  rollNumber,
  uploadDate,
  isLoading = false,
  error = null,
  onRetry = null,
  children,
  customActions
}) => {
  if (!isOpen) return null;

  const displayName = studentName || alumniName;

  const handleDownload = async () => {
    if (!documentUrl || isLoading) return;
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName || 'Document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(documentUrl, '_blank');
    }
  };

  const isImage = fileName?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/);

  // Helper to resolve error message and details
  const getErrorInfo = () => {
    if (!error) return null;
    const errString = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
    
    if (errString.includes('404') || errString.toLowerCase().includes('not found') || errString.toLowerCase().includes('missing')) {
      return {
        title: 'No Document Available',
        message: 'The requested document could not be found or has not been uploaded yet.',
        icon: <FileQuestion size={44} className="text-amber-500" />
      };
    }
    if (errString.includes('403') || errString.toLowerCase().includes('unauthorized') || errString.toLowerCase().includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You are not authorized to view this document.',
        icon: <ShieldAlert size={44} className="text-red-500" />
      };
    }
    return {
      title: 'Unable to Load Document',
      message: errString.includes('Network') ? 'Network error. Please check your internet connection and try again.' : 'An error occurred while fetching the document. Please try again.',
      icon: <AlertCircle size={44} className="text-[#F47C20]" />
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative flex flex-col bg-white rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 id="doc-modal-title" className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 truncate mb-1 sm:mb-2">
              <FileText className="text-[#F47C20] shrink-0" size={20} />
              <span className="truncate" title={fileName}>{fileName || 'Document Preview'}</span>
            </h2>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
              {displayName && (
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                  <User size={13} className="text-slate-400" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]" title={displayName}>{displayName}</span>
                </div>
              )}
              {rollNumber && (
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                  <Hash size={13} className="text-slate-400" />
                  <span>{rollNumber}</span>
                </div>
              )}
              {uploadDate && (
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{uploadDate}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-end sm:justify-start">
            {customActions}
            <button 
              onClick={handleDownload}
              disabled={isLoading || !documentUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold text-xs sm:text-sm rounded-xl active:scale-95 transition-all shadow-sm focus:outline-none whitespace-nowrap min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Download size={15} />
              <span>Download</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close document modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4">
          {isLoading ? (
            /* Centered Responsive Brand Loader */
            <div 
              className="flex flex-col items-center justify-center gap-4 text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm"
              role="status"
              aria-label="Loading document"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-[#F47C20] animate-spin" />
                <FileText size={22} className="absolute text-[#F47C20] animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Fetching Document</p>
                <p className="text-xs text-slate-500 mt-1">Please wait while we retrieve the file...</p>
              </div>
            </div>
          ) : errorInfo ? (
            /* Friendly Error Card */
            <div className="flex flex-col items-center justify-center gap-3 text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md">
              <div className="p-3 bg-slate-50 rounded-full mb-1">
                {errorInfo.icon}
              </div>
              <h3 className="text-base font-bold text-slate-800">{errorInfo.title}</h3>
              <p className="text-xs text-slate-500 max-w-xs">{errorInfo.message}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              )}
            </div>
          ) : !documentUrl ? (
            /* No Document State */
            <div className="flex flex-col items-center justify-center gap-3 text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md">
              <FileQuestion size={44} className="text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No Document Available</h3>
              <p className="text-xs text-slate-400">The document URL is empty or unavailable.</p>
            </div>
          ) : isImage ? (
            /* Image Preview */
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-inner p-4">
              <img 
                src={documentUrl} 
                alt={fileName || 'Document'} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            /* PDF Object / Iframe Viewer */
            <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
              <object
                data={documentUrl}
                type="application/pdf"
                className="w-full h-full min-h-[250px]"
              >
                <iframe
                  src={documentUrl}
                  title={fileName || 'Document Viewer'}
                  className="w-full h-full border-0"
                />
              </object>
              {/* Fallback open button for mobile WebKit browsers */}
              <div className="sm:hidden p-2.5 bg-slate-50 border-t border-slate-200 w-full text-center shrink-0">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-xl shadow-xs w-full"
                >
                  <ExternalLink size={14} /> Open PDF in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Content (like OCR results or forms) */}
        {children && (
          <div className="p-4 sm:p-6 bg-white border-t border-slate-200 overflow-y-auto max-h-[30vh]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;

