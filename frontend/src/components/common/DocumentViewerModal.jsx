import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Calendar, User, Hash, ExternalLink, AlertCircle, ShieldAlert, RefreshCw, FileQuestion, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, FileCode } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using reliable jsdelivr worker URL with version fallback
if (pdfjsLib?.GlobalWorkerOptions) {
  const version = pdfjsLib.version || '3.11.174';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

/* PDF Canvas Page Renderer Component */
const PdfPage = ({ pdf, pageNum, scale }) => {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!pdf || !canvasRef.current) return;
      setRendering(true);
      try {
        const page = await pdf.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // High DPI canvas support
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 
          ? [outputScale, 0, 0, outputScale, 0, 0] 
          : null;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform || undefined
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!isCancelled) setRendering(false);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNum, scale]);

  return (
    <div className="relative shadow-md rounded-lg overflow-hidden bg-white my-3 mx-auto transition-all border border-slate-200">
      {rendering && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 min-h-[300px]">
          <div className="w-8 h-8 border-3 border-orange-100 border-t-[#F47C20] rounded-full animate-spin" />
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto max-w-full" />
      <div className="text-[10px] font-bold text-slate-400 text-center py-1 bg-slate-50 border-t border-slate-100">
        Page {pageNum} of {pdf.numPages}
      </div>
    </div>
  );
};

/* PDF Canvas Viewer with Zoom and Page Controls */
const PdfViewer = ({ documentUrl, fileName }) => {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const containerRef = useRef(null);

  // Responsive scale calculation for mobile screens
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        if (containerWidth < 600) {
          // Standard A4 width is approx 595pt
          const fitScale = Math.max(0.6, containerWidth / 600);
          setScale(parseFloat(fitScale.toFixed(2)));
        } else {
          setScale(1.1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPdfError(null);

    const loadPdf = async () => {
      try {
        let loadingTask;
        if (typeof documentUrl === 'string' && documentUrl.startsWith('blob:')) {
          // Fetch arrayBuffer for reliable blob loading on mobile WebKit
          const res = await fetch(documentUrl);
          const buffer = await res.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        } else {
          loadingTask = pdfjsLib.getDocument(documentUrl);
        }

        const loadedPdf = await loadingTask.promise;
        if (active) {
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err) {
        console.error('PDF.js loading failed:', err);
        if (active) {
          setPdfError(err.message || 'Failed to render PDF preview.');
          setLoading(false);
        }
      }
    };

    if (documentUrl) {
      loadPdf();
    }

    return () => {
      active = false;
    };
  }, [documentUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-[#F47C20] animate-spin" />
        <p className="text-xs font-bold text-slate-700">Rendering PDF document...</p>
      </div>
    );
  }

  if (pdfError || !pdf) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-6 text-center">
        <object data={documentUrl} type="application/pdf" className="w-full h-full min-h-[300px]">
          <iframe src={documentUrl} title={fileName || 'PDF Document'} className="w-full h-full border-0 min-h-[300px]" />
        </object>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center overflow-hidden bg-slate-100">
      {/* Sticky PDF Toolbar */}
      <div className="w-full bg-white border-b border-slate-200 p-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-extrabold text-slate-700 whitespace-nowrap px-1">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale(s => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-bold text-slate-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => {
              if (containerRef.current) {
                const fitScale = Math.max(0.6, (containerRef.current.clientWidth - 32) / 600);
                setScale(parseFloat(fitScale.toFixed(2)));
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hidden sm:flex min-h-[36px] items-center gap-1 px-2.5 text-xs font-bold"
            title="Fit to Width"
          >
            <Maximize2 size={14} /> Fit Width
          </button>
        </div>
      </div>

      {/* Scrollable PDF Pages View */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 flex flex-col items-center">
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNo => (
          <div key={pageNo} id={`pdf-page-${pageNo}`} className={pageNo === currentPage ? 'ring-2 ring-[#F47C20] rounded-lg' : ''}>
            <PdfPage pdf={pdf} pageNum={pageNo} scale={scale} />
          </div>
        ))}
      </div>
    </div>
  );
};

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
      if (documentUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.setAttribute('download', fileName || 'Document.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName || 'Document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(documentUrl, '_blank');
    }
  };

  // Determine file format
  const fileExt = (fileName || '').split('.').pop()?.toLowerCase();
  const isImage = ['jpeg', 'jpg', 'gif', 'png', 'webp', 'svg'].includes(fileExt);
  const isWordDoc = ['doc', 'docx'].includes(fileExt);

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-pointer hidden sm:block" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative flex flex-col bg-white rounded-none sm:rounded-2xl w-full max-w-5xl h-full sm:h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
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
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : isWordDoc ? (
            /* Word Document (.docx) Preview Fallback Card */
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <FileCode size={48} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Microsoft Word Document (.docx)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inline preview for Word documents is not supported directly in web browsers. Please download the document to view its complete content.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F47C20] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#e06b12] active:scale-95 transition-all w-full"
              >
                <Download size={16} /> Download {fileName || 'Document.docx'}
              </button>
            </div>
          ) : (
            /* PDF Canvas Viewer with Canvas fallback */
            <PdfViewer documentUrl={documentUrl} fileName={fileName} />
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


