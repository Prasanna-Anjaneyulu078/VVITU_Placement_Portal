import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner } from './index';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

export default function ResumeUploadModal({
  isOpen,
  onClose,
  hasExistingResume = false,
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [strategy, setStrategy] = useState('REPLACE'); // REPLACE, MERGE, KEEP
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFile(null);
    setStrategy('REPLACE');
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selected.type)) {
        toast.error('Invalid file type. Only PDF and DOCX documents are allowed.');
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a resume file to upload.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', strategy);

    try {
      const res = await api.post('/student/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data?.message || 'Resume uploaded successfully. Skills & Technologies have been updated automatically.');
      handleClose();
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to upload resume';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={hasExistingResume ? "Replace Resume & Auto Extract Skills" : "Upload Resume"}
      size="md"
    >
      <div className="space-y-6">
        
        {/* FILE DROPZONE */}
        <div className="border-2 border-dashed border-slate-200   transition-colors rounded-2xl p-6 text-center bg-slate-50/50">
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-file-input" className="cursor-pointer block space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F47C20] flex items-center justify-center mx-auto border border-orange-100 shadow-xs">
              <UploadCloud size={24} />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
                  <FileText size={16} className="text-[#F47C20]" /> {file.name}
                </p>
                <p className="text-xs text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-extrabold text-slate-800">Click or Drag PDF / DOCX resume here</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Supports PDF &amp; DOCX (Max 5MB)</p>
              </div>
            )}
          </label>
        </div>

        {/* STRATEGY SELECTION DIALOG */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Choose Skill Update Strategy
          </label>
          <p className="text-xs text-slate-500 font-medium">
            Select how newly extracted skills from this resume should update your profile.
          </p>

          <div className="space-y-2.5">

            {/* Strategy: REPLACE */}
            <label 
              onClick={() => setStrategy('REPLACE')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                strategy === 'REPLACE' 
                  ? 'bg-orange-50/60 border-[#F47C20] shadow-xs' 
                  : 'bg-white border-slate-200  '
              }`}
            >
              <input 
                type="radio" 
                name="strategy" 
                checked={strategy === 'REPLACE'} 
                onChange={() => setStrategy('REPLACE')}
                className="mt-1 text-[#F47C20] focus:ring-[#F47C20]" 
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-[#F47C20]" /> Replace resume skills (Recommended)
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Replace previous resume skills with new resume skills while preserving all manual skills.
                </p>
              </div>
            </label>

            {/* Strategy: MERGE */}
            <label 
              onClick={() => setStrategy('MERGE')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                strategy === 'MERGE' 
                  ? 'bg-orange-50/60 border-[#F47C20] shadow-xs' 
                  : 'bg-white border-slate-200  '
              }`}
            >
              <input 
                type="radio" 
                name="strategy" 
                checked={strategy === 'MERGE'} 
                onChange={() => setStrategy('MERGE')}
                className="mt-1 text-[#F47C20] focus:ring-[#F47C20]" 
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#F47C20]" /> Merge with existing skills
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Keep existing skills and append newly detected skills without creating duplicates.
                </p>
              </div>
            </label>

            {/* Strategy: KEEP */}
            <label 
              onClick={() => setStrategy('KEEP')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                strategy === 'KEEP' 
                  ? 'bg-orange-50/60 border-[#F47C20] shadow-xs' 
                  : 'bg-white border-slate-200  '
              }`}
            >
              <input 
                type="radio" 
                name="strategy" 
                checked={strategy === 'KEEP'} 
                onChange={() => setStrategy('KEEP')}
                className="mt-1 text-[#F47C20] focus:ring-[#F47C20]" 
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Lock size={14} className="text-[#F47C20]" /> Keep existing skills
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Only update the resume file document. Leave current profile skills intact.
                </p>
              </div>
            </label>

          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-white border border-[#F47C20] text-[#F47C20] font-extrabold px-6 rounded-xl shadow-xs"
          >
            {isUploading ? <span className="flex items-center gap-2"><LoadingSpinner size="sm"/> Extracting Skills...</span> : 'Upload & Process'}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
