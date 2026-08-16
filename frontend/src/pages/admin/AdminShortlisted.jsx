import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, CheckCircle, Calendar, CheckSquare, Users, X, RotateCcw } from 'lucide-react';
import api from '../../utils/axiosConfig';
import StudentDetailsDrawer from '../../components/common/StudentDetailsDrawer';
import ApplicationStudentTable from '../../components/common/ApplicationStudentTable';

export default function AdminShortlisted({ isTab = false, onCountsUpdate }) {
  const [shortlisted, setShortlisted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ job: "", status: "", company: "" });

  // Student Details Drawer states
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchShortlisted = async () => {
    try {
      setIsLoading(true);
      let data = [];
      try {
        const res = await api.get('/admin/applications/shortlisted');
        data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } catch {
        const altRes = await api.get('/admin/students/shortlisted');
        data = Array.isArray(altRes.data) ? altRes.data : (altRes.data?.content || []);
      }
      setShortlisted(data);
      if (onCountsUpdate) onCountsUpdate(data.length);
    } catch (err) {
      console.error('Failed to load shortlisted applications', err);
      setShortlisted([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlisted();
  }, []);

  const filteredShortlisted = shortlisted.filter(item => {
    const sName  = (item.studentName || item.name || item.user?.name || item.student?.name || '').toLowerCase();
    const rNum   = (item.rollNumber || item.user?.studentProfile?.rollNumber || item.student?.rollNumber || '').toLowerCase();
    const sEmail = (item.email || item.studentEmail || item.user?.email || item.student?.email || '').toLowerCase();
    const jComp  = (item.company || item.companyName || item.job?.company || item.job?.companyName || '').toLowerCase();
    const jTitle = (item.jobTitle || item.job?.title || '').toLowerCase();
    const q      = searchTerm.trim().toLowerCase();

    const matchesSearch  = !q || sName.includes(q) || rNum.includes(q) || sEmail.includes(q) || jComp.includes(q) || jTitle.includes(q);
    const matchesJob     = filters.job ? (item.jobTitle || item.job?.title) === filters.job : true;
    const matchesStatus  = filters.status ? item.status === filters.status : true;
    const matchesCompany = filters.company ? (item.company || item.job?.company) === filters.company : true;
    return matchesSearch && matchesJob && matchesStatus && matchesCompany;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ job: "", status: "", company: "" });
  };

  const hasFilters = searchTerm || filters.job || filters.status || filters.company;

  const stats = {
    total: shortlisted.length,
    shortlisted: shortlisted.filter(s => s.status === 'SHORTLISTED').length,
    interviewing: shortlisted.filter(s => s.status === 'INTERVIEWING' || s.status === 'INTERVIEW_SCHEDULED').length,
    selected: shortlisted.filter(s => s.status === 'SELECTED' || s.status === 'OFFERED' || s.status === 'OFFER_RELEASED').length,
  };

  const StatCard = ({ title, count, icon: Icon, palette, active, onClick }) => (
    <button onClick={onClick} className={`group w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-sm focus:outline-none flex items-center gap-3 ${active ? `border-[#F47C20] ${palette.bg}` : "bg-white border-slate-200"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${palette.icon}`}><Icon size={18} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-xl font-extrabold ${palette.text}`}>{count}</p>
      </div>
    </button>
  );

  const content = (
    <div className="admin-shortlisted-content w-full">

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" count={stats.total} icon={Users}
          palette={{ bg:"bg-blue-50", icon:"bg-blue-100 text-blue-600", text:"text-blue-700" }}
          active={!filters.status} onClick={() => setFilters(p => ({...p, status: ""}))} />
        <StatCard title="Shortlisted" count={stats.shortlisted} icon={CheckSquare}
          palette={{ bg:"bg-orange-50", icon:"bg-orange-100 text-orange-500", text:"text-orange-600" }}
          active={filters.status === "SHORTLISTED"} onClick={() => setFilters(p => ({...p, status: "SHORTLISTED"}))} />
        <StatCard title="Interviewing" count={stats.interviewing} icon={Calendar}
          palette={{ bg:"bg-purple-50", icon:"bg-purple-100 text-purple-600", text:"text-purple-700" }}
          active={filters.status === "INTERVIEWING" || filters.status === "INTERVIEW_SCHEDULED"} onClick={() => setFilters(p => ({...p, status: "INTERVIEW_SCHEDULED"}))} />
        <StatCard title="Selected" count={stats.selected} icon={CheckCircle}
          palette={{ bg:"bg-emerald-50", icon:"bg-emerald-100 text-emerald-600", text:"text-emerald-700" }}
          active={filters.status === "OFFERED" || filters.status === "SELECTED" || filters.status === "OFFER_RELEASED"} onClick={() => setFilters(p => ({...p, status: "SELECTED"}))} />
      </div>

      {/* SEARCH & TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between filter-toolbar-container">
        <div className="relative w-full sm:w-80 md:w-96 filter-search-input">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll number, email, company, or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20] focus:bg-white transition-all shadow-2xs"
            aria-label="Search shortlisted students"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-bold text-slate-500">
            {filteredShortlisted.length} {filteredShortlisted.length === 1 ? 'student' : 'students'} {searchTerm ? 'found' : 'shortlisted'}
          </span>
          
          <button
            onClick={fetchShortlisted}
            className="min-h-[44px] h-11 px-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            title="Refresh shortlisted list"
          >
            <RotateCcw size={15} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <ApplicationStudentTable
        data={filteredShortlisted}
        isLoading={isLoading}
        emptyMessage={
          searchTerm || filters.status
            ? "No shortlisted students match your search criteria."
            : "No shortlisted students available."
        }
        onSelectStudent={(item) => {
          setSelectedAppId(item.id);
          setIsDrawerOpen(true);
        }}
      />

      {/* Student Details Drawer */}
      <StudentDetailsDrawer
        applicationId={selectedAppId}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedAppId(null); }}
        onStatusUpdate={() => fetchShortlisted()}
        role="admin"
      />
    </div>
  );

  return isTab ? content : <DashboardLayout role="admin">{content}</DashboardLayout>;
}
