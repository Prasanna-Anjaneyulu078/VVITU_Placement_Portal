import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, RefreshCw, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ImageUploadInput({
  label,
  sublabel = 'PNG, JPG, JPEG, WEBP • Max 5 MB',
  file,
  onFileSelect,
  onFileRemove,
  currentImageUrl = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [file, currentImageUrl]);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    const fileType = selectedFile.type?.toLowerCase();
    const fileName = selectedFile.name?.toLowerCase() || '';
    const isExtensionValid = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const isTypeValid = ALLOWED_TYPES.includes(fileType) || isExtensionValid;

    if (!isTypeValid) {
      setError('Invalid image format. Please upload PNG, JPG, JPEG, or WEBP.');
      return false;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError('Image size must be less than 5 MB.');
      return false;
    }

    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (validateFile(selected)) {
        onFileSelect(selected);
      } else if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      onFileSelect(droppedFile);
    }
  };

  const handleRemove = () => {
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    setPreviewUrl(null);
    onFileRemove();
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center h-36 w-36 mx-auto sm:mx-0">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-full object-contain p-2"
              onError={() => {
                setPreviewUrl(null);
                setError('Failed to load image preview');
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]" title={file?.name || 'Uploaded image'}>
              {file?.name || 'Existing Image'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#F47C20] text-slate-700 hover:text-[#F47C20] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X size={13} />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 py-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#F47C20] bg-[#F47C20]/5'
              : 'border-slate-200 hover:border-[#F47C20]/60 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 text-[#F47C20] flex items-center justify-center mb-1">
              <Upload size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Upload {label}
            </p>
            <p className="text-xs text-slate-400 font-medium">{sublabel}</p>
            <p className="text-[11px] text-[#F47C20] font-semibold tracking-wide pt-1">
              Drag & drop or click to browse
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 pt-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
