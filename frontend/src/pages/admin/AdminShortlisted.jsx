import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, CheckCircle, Calendar, CheckSquare, Users } from 'lucide-react';
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
      } catch (e) {
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
    const sName  = (item.studentName || item.user?.name || '').toLowerCase();
    const rNum   = (item.rollNumber || item.user?.studentProfile?.rollNumber || '').toLowerCase();
    const jComp  = (item.company || item.job?.company || '').toLowerCase();
    const jTitle = (item.jobTitle || item.job?.title || '').toLowerCase();
    const q      = searchTerm.toLowerCase();

    const matchesSearch  = !searchTerm || sName.includes(q) || rNum.includes(q) || jComp.includes(q) || jTitle.includes(q);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* TABLE */}
      <ApplicationStudentTable
        data={filteredShortlisted}
        isLoading={isLoading}
        emptyMessage="No shortlisted students available."
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
