import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, Mail, CheckCircle, RefreshCw, Calendar, Download, Building2, CheckSquare, Users, Eye, FileText } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { TableLoader } from '../../components/common/loading';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import StudentDetailsDrawer from '../../components/common/StudentDetailsDrawer';
import { toTitleCase } from '../../utils/nameUtils';
import { getInitials } from '../../utils/avatarUtils';

const Avatar = ({ name, src, size = "md" }) => {
  const sz = size === "lg" ? "w-20 h-20 text-3xl rounded-2xl" : "w-10 h-10 text-sm rounded-full";
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const initials = getInitials(name);
  const colors = ["from-blue-400 to-blue-600","from-violet-400 to-violet-600","from-emerald-400 to-emerald-600","from-orange-400 to-orange-500","from-pink-400 to-pink-600"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];

  return (src && !imageError) ? (
    <img 
      src={src} 
      alt={name || 'Student'} 
      className={`${sz} object-cover border-2 border-white shadow flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  ) : (
    <div className={`${sz} bg-gradient-to-br ${color} text-white flex items-center justify-center font-bold flex-shrink-0 shadow`}>
      {initials}
    </div>
  );
};

export default function AdminShortlisted({ isTab = false, onCountsUpdate }) {
  const [shortlisted, setShortlisted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ job: "", status: "", company: "" });

  // Document viewer modal states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);

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

  const updateApplicationStatus = async (appId, status) => {
    try {
      await api.post(`/admin/applications/${appId}/status`, { status });
      fetchShortlisted();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleViewResume = async (studentItem) => {
    const sId = studentItem.studentId || studentItem.student?.id || studentItem.id;
    const name = studentItem.studentName || studentItem.user?.name || 'Student';
    setViewerTitle(`${name}'s Resume`);
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerUrl('');

    let foundResume = false;
    if (sId) {
      try {
        const response = await api.get(`/admin/students/${sId}/resume`, { responseType: 'blob' });
        if (response.data && response.data.size > 0) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          setViewerUrl(URL.createObjectURL(blob));
          foundResume = true;
        }
      } catch (err) {
        // Quietly fallback if 404
      }
    }

    if (!foundResume) {
      if (studentItem.resumeUrl) {
        setViewerUrl(studentItem.resumeUrl);
      } else {
        toast.info(`No resume uploaded for ${name}.`);
        setViewerOpen(false);
      }
    }
    setViewerLoading(false);
  };

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
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <TableLoader columns={6} rows={5} />
        </div>
      ) : filteredShortlisted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Search size={32} className="text-slate-300"/></div>
          <h3 className="text-lg font-bold text-slate-700 mb-3">No shortlisted students available.</h3>
          {hasFilters && <button onClick={resetFilters} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-sm shadow-sm transition-colors min-h-[44px]">Clear Filters</button>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Branch & CGPA</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Applied Job</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Shortlisted Date</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShortlisted.map(s => {
                const studentName = toTitleCase(s.studentName || s.user?.name || (s.studentId ? `Student #${s.studentId}` : '—'));
                const rollNumber = s.rollNumber || s.user?.studentProfile?.rollNumber || '—';
                const profileImg = s.profileImageUrl || s.user?.studentProfile?.profileImageUrl;
                const dept = s.department || s.user?.studentProfile?.department || '—';
                const sec = s.section || s.user?.studentProfile?.section;
                const cgpaVal = s.cgpa != null ? s.cgpa.toFixed(2) : '—';
                const gradYear = s.academicYear || s.user?.studentProfile?.academicYear || '—';
                const emailAddr = s.email || s.user?.email || '';
                const jobRole = s.jobTitle || s.job?.title || 'Unknown Role';
                const compName = s.company || s.job?.company || 'Unknown Company';
                const shortDate = (s.shortlistedDate || s.appliedAt) ? new Date(s.shortlistedDate || s.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Student Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={studentName} src={profileImg} size="md" />
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-snug">{studentName}</p>
                          <p className="font-mono text-xs text-[#F47C20] font-bold">{rollNumber}</p>
                          {emailAddr && <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{emailAddr}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Branch & CGPA */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">
                          {dept} {sec ? `• Sec ${sec}` : ''}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          CGPA: <strong className="text-slate-700">{cgpaVal}</strong> {gradYear !== '—' ? `• Grad: ${gradYear}` : ''}
                        </p>
                      </div>
                    </td>

                    {/* Job & Company */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{jobRole}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-500 text-xs">
                        <Building2 size={12}/> <span className="truncate max-w-[150px]">{compName}</span>
                      </div>
                    </td>

                    {/* Shortlisted Date */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        {shortDate}
                      </span>
                    </td>

                    {/* Status Select */}
                    <td className="px-4 py-4">
                      <select
                        className="px-2.5 py-1.5 bg-white border border-[#F47C20] rounded-lg text-xs font-bold text-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none transition-all cursor-pointer shadow-sm"
                        value={s.status || 'SHORTLISTED'}
                        onChange={(e) => updateApplicationStatus(s.id, e.target.value)}
                      >
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW_SCHEDULED">Interviewing</option>
                        <option value="OFFER_RELEASED">Offered</option>
                        <option value="SELECTED">Selected</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedAppId(s.id); setIsDrawerOpen(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF4EB] text-[#F47C20] hover:bg-[#FFE8D6] transition-colors border border-[#F47C20]/40 text-xs font-bold shadow-2xs min-h-[32px]"
                          title={`View Details of ${studentName}`}
                        >
                          <Eye size={13} className="text-[#F47C20]" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleViewResume(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 text-xs font-bold shadow-2xs min-h-[32px]"
                          title={`View Resume of ${studentName}`}
                        >
                          <FileText size={13} className="text-blue-600" />
                          <span>Resume</span>
                        </button>

                        {emailAddr && (
                          <button
                            onClick={() => window.location.href = `mailto:${emailAddr}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF4EB] text-[#F47C20] hover:bg-[#FFE8D6] transition-colors border border-[#F47C20]/40 text-xs font-bold shadow-2xs min-h-[32px]"
                            title={`Email ${studentName}`}
                          >
                            <Mail size={13} className="text-[#F47C20]" />
                            <span>Email</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentUrl={viewerUrl}
        title={viewerTitle}
        isLoading={viewerLoading}
        studentName={viewerTitle.replace("'s Resume", "")}
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
