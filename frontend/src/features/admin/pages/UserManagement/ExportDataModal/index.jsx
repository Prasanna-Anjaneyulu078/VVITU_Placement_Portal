import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, X, Loader2 } from 'lucide-react';

const EXPORT_FIELDS = [
  "Roll Number",
  "Name",
  "Email",
  "Mobile Number",
  "Department",
  "Section",
  "Batch",
  "CGPA",
  "Placement Status"
];

export default function ExportDataModal({ 
  isOpen, 
  onClose, 
  onExport, 
  isExporting, 
  filteredCount, 
  totalCount, 
  selectedCount, 
  currentPageCount 
}) {
  const [format, setFormat] = useState('EXCEL');
  const [scope, setScope] = useState('filtered');
  const [selectedFields, setSelectedFields] = useState(EXPORT_FIELDS);

  if (!isOpen) return null;

  const handleToggleField = (field) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleToggleAllFields = () => {
    if (selectedFields.length === EXPORT_FIELDS.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(EXPORT_FIELDS);
    }
  };

  const handleSubmit = () => {
    onExport(format, scope, selectedFields);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={!isExporting ? onClose : undefined} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-[#F47C20] flex items-center gap-2">
            <Download size={20} className="text-[#F47C20]" />
            Export Student Data
          </h2>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 flex items-center justify-center rounded-xl   text-slate-400   transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setFormat('EXCEL')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'EXCEL' ? 'border-[#F47C20] bg-[#FFF4EB]' : 'border-slate-200  '}`}
              >
                <FileSpreadsheet size={24} className={format === 'EXCEL' ? 'text-[#F47C20]' : 'text-slate-400'} />
                <span className={`mt-2 font-bold ${format === 'EXCEL' ? 'text-[#F47C20]' : 'text-slate-600'}`}>Excel</span>
              </button>
              <button 
                onClick={() => setFormat('CSV')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'CSV' ? 'border-[#F47C20] bg-[#FFF4EB]' : 'border-slate-200  '}`}
              >
                <FileText size={24} className={format === 'CSV' ? 'text-[#F47C20]' : 'text-slate-400'} />
                <span className={`mt-2 font-bold ${format === 'CSV' ? 'text-[#F47C20]' : 'text-slate-600'}`}>CSV</span>
              </button>
              <button 
                onClick={() => setFormat('PDF')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'PDF' ? 'border-[#F47C20] bg-[#FFF4EB]' : 'border-slate-200  '}`}
              >
                <File size={24} className={format === 'PDF' ? 'text-[#F47C20]' : 'text-slate-400'} />
                <span className={`mt-2 font-bold ${format === 'PDF' ? 'text-[#F47C20]' : 'text-slate-600'}`}>PDF</span>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Export Scope</h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer   transition-colors">
                <input 
                  type="radio" 
                  name="scope" 
                  value="all" 
                  checked={scope === 'all'} 
                  onChange={() => setScope('all')} 
                  className="w-4 h-4 text-[#F47C20] focus:ring-[#F47C20]"
                />
                <span className="ml-3 font-semibold text-slate-700 flex-1">All Students</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{totalCount} records</span>
              </label>
              
              <label className="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer   transition-colors">
                <input 
                  type="radio" 
                  name="scope" 
                  value="filtered" 
                  checked={scope === 'filtered'} 
                  onChange={() => setScope('filtered')} 
                  className="w-4 h-4 text-[#F47C20] focus:ring-[#F47C20]"
                />
                <span className="ml-3 font-semibold text-slate-700 flex-1">Filtered Results</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{filteredCount} records</span>
              </label>

              <label className="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer   transition-colors">
                <input 
                  type="radio" 
                  name="scope" 
                  value="current_page" 
                  checked={scope === 'current_page'} 
                  onChange={() => setScope('current_page')} 
                  className="w-4 h-4 text-[#F47C20] focus:ring-[#F47C20]"
                />
                <span className="ml-3 font-semibold text-slate-700 flex-1">Current Page Only</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{currentPageCount} records</span>
              </label>
              
              <label className={`flex items-center p-3 border border-slate-200 rounded-xl transition-colors ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer  '}`}>
                <input 
                  type="radio" 
                  name="scope" 
                  value="selected" 
                  disabled={selectedCount === 0}
                  checked={scope === 'selected'} 
                  onChange={() => setScope('selected')} 
                  className="w-4 h-4 text-[#F47C20] focus:ring-[#F47C20]"
                />
                <span className="ml-3 font-semibold text-slate-700 flex-1">Selected Students</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{selectedCount} records</span>
              </label>
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Fields to Include</h3>
              <button 
                onClick={handleToggleAllFields}
                className="text-xs font-bold text-[#F47C20]  "
              >
                {selectedFields.length === EXPORT_FIELDS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPORT_FIELDS.map(field => (
                <label key={field} className="flex items-center p-2 rounded-lg   cursor-pointer border border-transparent  ">
                  <input 
                    type="checkbox" 
                    checked={selectedFields.includes(field)} 
                    onChange={() => handleToggleField(field)}
                    className="w-4 h-4 text-[#F47C20] rounded focus:ring-[#F47C20]"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-600 truncate">{field}</span>
                </label>
              ))}
            </div>
            {selectedFields.length === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                Please select at least one field to export.
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl font-bold text-[#F47C20] bg-white border border-[#F47C20]   transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isExporting || selectedFields.length === 0}
            className="px-6 py-2.5 rounded-xl font-bold text-[#F47C20] bg-white border border-[#F47C20]   transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
