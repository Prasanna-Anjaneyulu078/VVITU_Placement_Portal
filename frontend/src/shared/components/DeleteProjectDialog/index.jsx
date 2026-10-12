import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteProjectDialog({
  isOpen,
  onClose,
  onConfirm,
  projectTitle = '',
  isDeleting = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-center space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-2xs">
          <Trash2 size={26} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900">Delete Project</h3>
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Are you sure you want to delete this project? <br />
            This action cannot be undone.
          </p>

          {projectTitle && (
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl truncate max-w-xs">
                "{projectTitle}"
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:flex-1 py-2.5 px-4 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] hover:bg-orange-100 text-xs font-extrabold rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-[#F47C20] text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin text-[#F47C20]" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Project</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
