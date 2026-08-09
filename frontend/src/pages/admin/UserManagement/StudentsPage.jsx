import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import StudentManagement from './StudentManagement';
import AdminShortlisted from '../AdminShortlisted';
import { Plus, Download, Upload } from 'lucide-react';

export default function StudentsPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'shortlisted' ? 'shortlisted' : 'manage';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [counts, setCounts] = useState({ all: 0, shortlisted: 0 });
  const studentTableRef = useRef();

  const handleAllCountsUpdate = useCallback((count) => {
    setCounts(prev => prev.all === count ? prev : { ...prev, all: count });
  }, []);

  const handleShortlistedCountsUpdate = useCallback((count) => {
    setCounts(prev => prev.shortlisted === count ? prev : { ...prev, shortlisted: count });
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="w-full max-w-[1600px] mx-auto pb-8">
        <div className="flex flex-col gap-6">
          
          {/* Tabs & Top Actions Bar (No duplicate "Students" heading) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            
            {/* Segmented Underline Tabs (Active text: VVIT Orange #F47C20) */}
            <div className="flex items-center gap-2 border-b border-slate-200 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none ${
                  activeTab === 'manage'
                    ? 'border-b-2 border-[#F47C20] text-[#F47C20] bg-[#FFF4EB]/60 rounded-t-xl'
                    : 'border-b-2 border-transparent text-slate-500     rounded-t-xl'
                }`}
              >
                All Students 
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'manage' ? 'bg-[#F47C20]/15 text-[#F47C20]' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.all}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('shortlisted')}
                className={`flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap focus:outline-none ${
                  activeTab === 'shortlisted'
                    ? 'border-b-2 border-[#F47C20] text-[#F47C20] bg-[#FFF4EB]/60 rounded-t-xl'
                    : 'border-b-2 border-transparent text-slate-500     rounded-t-xl'
                }`}
              >
                Shortlisted
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'shortlisted' ? 'bg-[#F47C20]/15 text-[#F47C20]' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.shortlisted}
                </span>
              </button>
            </div>

            {/* Top Actions: Add Student, Import, Export */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {activeTab === 'manage' && (
                <>
                  <button 
                    onClick={() => studentTableRef.current?.openAddModal()} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] text-xs sm:text-sm font-extrabold rounded-xl   transition-all shadow-2xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
                  >
                    <Plus size={16} className="text-[#F47C20]" /> Add Student
                  </button>
                  <button 
                    onClick={() => studentTableRef.current?.openImportModal()} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] text-xs sm:text-sm font-extrabold rounded-xl   transition-all shadow-2xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
                  >
                    <Upload size={16} className="text-[#F47C20]" /> Import
                  </button>
                  <button 
                    onClick={() => studentTableRef.current?.openExportModal()} 
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] text-xs sm:text-sm font-extrabold rounded-xl   transition-all shadow-2xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
                  >
                    <Download size={16} className="text-[#F47C20]" /> Export
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Tab Content area */}
          <div className="w-full">
            <div className={activeTab === 'manage' ? 'block' : 'hidden'}>
              <StudentManagement 
                isTab={true} 
                ref={studentTableRef} 
                onCountsUpdate={handleAllCountsUpdate} 
              />
            </div>
            <div className={activeTab === 'shortlisted' ? 'block' : 'hidden'}>
              <AdminShortlisted 
                isTab={true} 
                onCountsUpdate={handleShortlistedCountsUpdate} 
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
