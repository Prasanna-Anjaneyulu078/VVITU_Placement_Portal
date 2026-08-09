import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { Search, Filter, Eye, RefreshCw, Briefcase, FileText, User } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import ApplicationDetailsDrawer from '../../components/alumni/ApplicationDetailsDrawer';

export default function AlumniStudentApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Selected Application for Drawer
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/applications/alumni/my-posted-jobs');
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load student applications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (appId, newStatus) => {
    setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
  };

  const openViewDetails = (appId) => {
    setSelectedAppId(appId);
    setIsDrawerOpen(true);
  };

  const closeViewDetails = () => {
    setIsDrawerOpen(false);
    setSelectedAppId(null);
  };

  const getDeptValue = (dept) => {
    if (!dept) return '';
    if (typeof dept === 'object') return dept.code || dept.name || '';
    return String(dept);
  };

  const getDeptLabel = (dept) => {
    if (!dept) return '';
    if (typeof dept === 'object') return dept.name || dept.code || '';
    return String(dept);
  };

  // Derive unique departments
  const departments = useMemo(() => {
    const map = new Map();
    applications.forEach(app => {
      const d = app.department || app.student?.department;
      if (d) {
        const val = getDeptValue(d);
        const lbl = getDeptLabel(d);
        if (val && !map.has(val)) {
          map.set(val, lbl);
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const q = search.toLowerCase();
      const sName = (app.studentName || app.student?.name || '').toLowerCase();
      const rNum = (app.rollNumber || app.student?.rollNumber || '').toLowerCase();
      const jTitle = (app.jobTitle || app.job?.title || '').toLowerCase();

      const matchesSearch = !search || sName.includes(q) || rNum.includes(q) || jTitle.includes(q);
      const matchesDept = !filterDepartment || getDeptValue(app.department || app.student?.department) === filterDepartment;
      const matchesStatus = !filterStatus || app.status === filterStatus;
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [applications, search, filterDepartment, filterStatus]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SELECTED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHORTLISTED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INTERVIEW_SCHEDULED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UNDER_REVIEW': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'APPLIED': default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: 'N/A', time: '' };
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { date, time };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  return (
    <DashboardLayout role="alumni">
      <PageHeader 
        title="Student Applications" 
        subtitle="Review, screen, and evaluate students who applied to your posted jobs."
      />

      <div className="mt-6 pb-16 space-y-6">

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by student name, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-[#F47C20] focus:border-[#F47C20] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20]"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20]"
            >
              <option value="">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={fetchApplications}
              className="h-10 px-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Content Container */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex justify-center items-center">
            <LoadingSpinner size="large" />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-4 border border-orange-100">
              <FileText size={28} className="text-[#F47C20]" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">No Student Applications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {search || filterDepartment || filterStatus
                ? 'No applicants match your filter criteria. Try clearing search filters.'
                : 'Students who apply to your posted job opportunities will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP & TABLET TABLE VIEW (Hidden on Mobile) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Profile</th>
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Student Name</th>
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Roll Number</th>
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Applied Date</th>
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Application Status</th>
                      <th className="py-4 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map(app => {
                      const studentName = app.studentName || app.student?.name || 'Student';
                      const profileImg = app.profileImageUrl || app.student?.profileImageUrl || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=F47C20&color=fff&size=96`;
                      const dept = getDeptLabel(app.department || app.student?.department) || 'Department';
                      const semVal = app.semester || app.student?.semester;
                      const sem = semVal ? `Semester ${semVal}` : '';
                      const rollNo = app.rollNumber || app.student?.rollNumber || 'N/A';
                      const { date, time } = formatDateTime(app.appliedAt);

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* Column 1: Profile */}
                          <td className="py-4 px-5">
                            <img 
                              src={profileImg} 
                              alt={studentName}
                              loading="lazy"
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs shrink-0"
                            />
                          </td>

                          {/* Column 2: Student Name */}
                          <td className="py-4 px-5">
                            <p className="font-extrabold text-slate-900 text-sm leading-snug">{studentName}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{dept} {sem && `• ${sem}`}</p>
                          </td>

                          {/* Column 3: Roll Number */}
                          <td className="py-4 px-5 text-center">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
                              {rollNo}
                            </span>
                          </td>

                          {/* Column 4: Applied Date */}
                          <td className="py-4 px-5">
                            <p className="text-xs font-bold text-slate-800">{date}</p>
                            {time && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{time}</p>}
                          </td>

                          {/* Column 5: Application Status */}
                          <td className="py-4 px-5">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                              {app.status?.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Column 6: View Details */}
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => openViewDetails(app.id)}
                              className="px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] font-bold text-xs rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <Eye size={14} /> View
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE STACKED CARDS VIEW (Visible only on Mobile) */}
            <div className="block sm:hidden space-y-4">
              {filteredApps.map(app => {
                const studentName = app.studentName || app.student?.name || 'Student';
                const profileImg = app.profileImageUrl || app.student?.profileImageUrl || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=F47C20&color=fff&size=96`;
                const dept = getDeptLabel(app.department || app.student?.department) || 'Department';
                const semVal = app.semester || app.student?.semester;
                const sem = semVal ? `Semester ${semVal}` : '';
                const rollNo = app.rollNumber || app.student?.rollNumber || 'N/A';
                const { date, time } = formatDateTime(app.appliedAt);

                return (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={profileImg} 
                        alt={studentName}
                        loading="lazy"
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base truncate">{studentName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${getStatusColor(app.status)}`}>
                            {app.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{dept} {sem && `• ${sem}`}</p>
                        <p className="text-xs font-mono font-bold text-[#F47C20] mt-1">{rollNo}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Applied: <strong>{date}</strong> {time}</span>
                    </div>

                    <button
                      onClick={() => openViewDetails(app.id)}
                      className="w-full py-2.5 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* VIEW DETAILS DRAWER */}
      <ApplicationDetailsDrawer
        applicationId={selectedAppId}
        isOpen={isDrawerOpen}
        onClose={closeViewDetails}
        onStatusUpdate={handleStatusUpdate}
      />
    </DashboardLayout>
  );
}
