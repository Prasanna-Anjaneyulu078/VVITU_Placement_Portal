import React, { useState } from 'react';
import { X, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle, Sparkles, ArrowRight, Upload } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

// ─────────────────────────────────────────────
// Pill chip helper
// ─────────────────────────────────────────────
function Chip({ label, variant = 'new' }) {
  const styles = {
    new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    removed: 'bg-red-50 text-red-600 border-red-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${styles[variant]}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Phase 1 — Loading skeleton while extracting
// ─────────────────────────────────────────────
function ExtractionLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F47C20] to-orange-400 flex items-center justify-center shadow-lg shadow-orange-200">
          <Sparkles size={28} className="text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-[#F47C20] flex items-center justify-center">
          <Loader2 size={11} className="text-[#F47C20] animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-extrabold text-slate-800">Analysing Your Resume…</p>
        <p className="text-[11px] font-medium text-slate-400">Extracting & categorizing skills from your uploaded file.</p>
      </div>
      {/* Animated progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#F47C20] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Phase 2 — Preview: new/removed skills diff
// ─────────────────────────────────────────────
function ExtractionPreview({ data, onApply, onCancel, applying }) {
  const { newSkills = [], removedSkills = [], totalExtracted = 0 } = data;
  const hasChanges = newSkills.length > 0 || removedSkills.length > 0;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#FFF4EB] to-orange-50 rounded-xl border border-[#F47C20]/20">
        <Sparkles size={16} className="text-[#F47C20] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-[#F47C20]">Extraction Complete</p>
          <p className="text-[11px] font-medium text-slate-600 mt-0.5">
            Found <span className="font-extrabold text-slate-800">{totalExtracted}</span> skills in your resume.
            {!hasChanges && ' No changes detected vs your current profile.'}
          </p>
        </div>
        {!hasChanges && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
      </div>

      {/* No changes state */}
      {!hasChanges && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle size={36} className="text-emerald-500" />
          <div>
            <p className="text-sm font-extrabold text-slate-700">Your profile is up to date!</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              All skills in your resume are already in your profile.
            </p>
          </div>
        </div>
      )}

      {/* New skills */}
      {newSkills.length > 0 && (
        <div className="rounded-xl border border-emerald-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
            <CheckCircle size={14} className="text-emerald-600" />
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
              New Skills Found ({newSkills.length})
            </span>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-white">
            {newSkills.map(s => <Chip key={s} label={s} variant="new" />)}
          </div>
        </div>
      )}

      {/* Removed skills */}
      {removedSkills.length > 0 && (
        <div className="rounded-xl border border-red-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
            <XCircle size={14} className="text-red-500" />
            <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider">
              No Longer Detected ({removedSkills.length})
            </span>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-white">
            {removedSkills.map(s => <Chip key={s} label={s} variant="removed" />)}
          </div>
          <p className="px-4 pb-3 text-[10px] font-medium text-slate-400">
            These were resume-extracted skills not found in your latest resume.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {hasChanges ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Merge */}
          <button
            type="button"
            disabled={applying}
            onClick={() => onApply('MERGE')}
            className="flex flex-col items-start gap-1.5 p-4 bg-white border-2 border-blue-200   rounded-xl text-left transition-all group disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50   flex items-center justify-center transition-colors">
                {applying === 'MERGE' ? <Loader2 size={14} className="text-blue-600 animate-spin" /> : <ArrowRight size={14} className="text-blue-600" />}
              </div>
              <span className="text-xs font-extrabold text-blue-700">Merge Skills</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
              Keep existing skills. Add only newly detected ones. Remove duplicates.
            </p>
          </button>

          {/* Replace */}
          <button
            type="button"
            disabled={applying}
            onClick={() => onApply('REPLACE')}
            className="flex flex-col items-start gap-1.5 p-4 bg-white border-2 border-[#F47C20]/30   rounded-xl text-left transition-all group disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50   flex items-center justify-center transition-colors">
                {applying === 'REPLACE' ? <Loader2 size={14} className="text-[#F47C20] animate-spin" /> : <RefreshCw size={14} className="text-[#F47C20]" />}
              </div>
              <span className="text-xs font-extrabold text-[#F47C20]">Replace Skills</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
              Remove existing resume-extracted skills. Save only newly detected ones.
            </p>
          </button>
        </div>
      ) : null}

      {/* Cancel */}
      <button
        type="button"
        disabled={applying}
        onClick={onCancel}
        className="w-full py-2.5 text-[11px] font-bold text-slate-500   transition-colors disabled:opacity-60"
      >
        Cancel — Do not modify skills
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main exported modal
// ─────────────────────────────────────────────
export default function ReExtractSkillsModal({ isOpen, onClose, hasResume, onSuccess }) {
  const [phase, setPhase] = useState('idle'); // idle | loading | preview | applying | done | error
  const [previewData, setPreviewData] = useState(null);
  const [applying, setApplying] = useState(null); // null | 'MERGE' | 'REPLACE'
  const [errorMsg, setErrorMsg] = useState('');

  // ── Start extraction (dry-run preview)
  const startExtraction = async () => {
    if (!hasResume) {
      setErrorMsg('No resume found. Please upload your resume first before extracting skills.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setErrorMsg('');
    try {
      const res = await api.post('/student/skills/re-extract');
      setPreviewData(res.data);
      setPhase('preview');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to extract skills from your resume.';
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  // ── Apply chosen strategy
  const handleApply = async (strategy) => {
    setApplying(strategy);
    try {
      const res = await api.post(`/student/skills/apply-extraction?strategy=${strategy}`);
      toast.success(
        strategy === 'REPLACE'
          ? 'Skills replaced from your latest resume!'
          : 'New skills merged into your profile!',
        { icon: '🧠' }
      );
      await onSuccess?.(res.data.categorizedSkills);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply skill changes.';
      toast.error(msg);
      setApplying(null);
    }
  };

  // ── Reset + close
  const handleClose = () => {
    setPhase('idle');
    setPreviewData(null);
    setApplying(null);
    setErrorMsg('');
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F47C20] to-orange-400 flex items-center justify-center shadow-sm">
              <RefreshCw size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Re-Extract Skills</h2>
              <p className="text-[10px] font-medium text-slate-400">Using your uploaded resume</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400     transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Idle — initial state */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF4EB] to-orange-100 flex items-center justify-center border border-[#F47C20]/20">
                <Sparkles size={28} className="text-[#F47C20]" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Smart Re-Extraction</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  {hasResume
                    ? 'We\'ll re-parse your latest uploaded resume and show you what changed before updating your profile.'
                    : 'No resume found. Please upload your resume first.'}
                </p>
              </div>
              {hasResume ? (
                <button
                  type="button"
                  onClick={startExtraction}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#F47C20] to-orange-400 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-200     transition-all active:scale-[0.98]"
                >
                  <RefreshCw size={14} />
                  Start Re-Extraction
                </button>
              ) : (
                <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <Upload size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-amber-800">
                    Please upload your resume first using the resume section above, then try re-extracting.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {phase === 'loading' && <ExtractionLoader />}

          {/* Preview */}
          {phase === 'preview' && previewData && (
            <ExtractionPreview
              data={previewData}
              onApply={handleApply}
              onCancel={handleClose}
              applying={applying}
            />
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Extraction Failed</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  {errorMsg}
                </p>
              </div>
              <div className="flex gap-3">
                {hasResume && errorMsg.includes('Please upload') !== true && (
                  <button
                    type="button"
                    onClick={startExtraction}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F47C20] text-white text-[11px] font-bold rounded-lg   transition-all"
                  >
                    <RefreshCw size={12} /> Try Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg   transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
