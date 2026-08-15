import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Calendar,
  Users, CheckCircle2, Award, Sparkles, Edit3,
  Search, RefreshCw, AlertTriangle, ChevronRight, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import ApplicationDetailsDrawer from '../../components/alumni/ApplicationDetailsDrawer';

function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  let bg = 'bg-slate-100 text-slate-600 border-slate-200';
  let label = status || 'Unknown';

  if (s === 'APPROVED' || s === 'ACTIVE' || s === 'OPEN') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'OPEN';
  } else if (s === 'CLOSED') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    label = 'CLOSED';
  } else if (s === 'EXPIRED') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    label = 'EXPIRED';
  } else if (s === 'PENDING' || s === 'PENDING_APPROVAL') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'PENDING';
  } else if (s === 'DRAFT') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    label = 'DRAFT';
  } else if (s === 'REJECTED') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    label = 'REJECTED';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider border ${bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ApplicationStatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status || 'Applied';

  if (s === 'SHORTLISTED') {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    label = '● Shortlisted';
  } else if (s === 'SELECTED' || s === 'ACCEPTED' || s === 'OFFERED') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = '✓ Selected';
  } else if (s === 'REJECTED') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    label = 'Rejected';
  } else if (s === 'APPLIED') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    label = '● Applied';
  } else if (s === 'UNDER_REVIEW') {
    bg = 'bg-purple-50 text-purple-700 border-purple-200';
    label = '● Under Review';
  } else if (s === 'INTERVIEW_SCHEDULED') {
    bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    label = '● Interview Scheduled';
  } else {
    label = s.replace(/_/g, ' ');
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border whitespace-nowrap ${bg}`}>
      {label}
    </span>
  );
}

export default function AlumniManageJob() {
  const params = useParams();
  const jobId = params.id || params.jobId;
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchJobData = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const [jobRes, appsRes, statsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`).catch(() => api.get(`/alumni/my-jobs`).then(res => {
          const found = (res.data || []).find(j => String(j.id) === String(jobId));
          return { data: found };
        })),
        api.get(`/applications/job/${jobId}`).catch(() => api.get(`/alumni/jobs/${jobId}/applications`).catch(() => ({ data: [] }))),
        api.get(`/alumni/jobs/${jobId}/statistics`).catch(() => ({ data: null }))
      ]);

      if (jobRes && jobRes.data) {
        setJob(jobRes.data);
      }
      setApplicants(Array.isArray(appsRes.data) ? appsRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load job management data:', err);
      setIsError(true);
      setErrorMessage(err.response?.data?.message || 'Failed to load job information');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  const refreshStats = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await api.get(`/alumni/jobs/${jobId}/statistics`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  }, [jobId]);

  const handleStatusChange = async (e, appId, newStatus) => {
    e.stopPropagation();
    try {
      await api.put(`/alumni/applications/${appId}/status`, { status: newStatus });
      toast.success(`Application status updated to ${newStatus.replace('_', ' ')}`);
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application status');
    }
  };

  const departments = useMemo(() => {
    const set = new Set();
    applicants.forEach(a => {
      const dept = a.department || a.student?.department || a.studentProfile?.department;
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(a => {
      const q = search.toLowerCase();
      const name = (a.studentName || a.student?.user?.name || a.name || '').toLowerCase();
      const roll = (a.rollNumber || a.student?.rollNumber || '').toLowerCase();
      const dept = a.department || a.student?.department || a.studentProfile?.department || '';

      const matchesSearch = !search || name.includes(q) || roll.includes(q);
      const matchesStatus = !filterStatus || a.status === filterStatus;
      const matchesDept = !filterDepartment || dept === filterDepartment;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [applicants, search, filterStatus, filterDepartment]);

  const formatDeadline = (dateStr) => {
    if (!dateStr) return 'No Deadline Set';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleRowClick = (appId) => {
    setSelectedAppId(appId);
    setIsDrawerOpen(true);
  };

  return (
    <DashboardLayout role="alumni">
      <div className="pb-16 space-y-6">
        
        {/* Navigation Button */}
        <div>
          <button
            onClick={() => navigate('/alumni/my-jobs')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#F47C20] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to My Jobs
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-6 shadow-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-3 w-1/2">
                <div className="h-5 bg-slate-200 rounded-full w-24" />
                <div className="h-7 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="h-10 bg-slate-200 rounded-xl w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-12 flex flex-col items-center text-center">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Applications</h3>
            <p className="text-sm text-red-600 mb-6 max-w-md">{errorMessage || 'Please verify your request and try again.'}</p>
            <button
              onClick={fetchJobData}
              className="px-6 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Job Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={job?.status} />
                    <span className="text-xs font-extrabold text-slate-400">Job ID #{jobId}</span>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      {job?.title || 'Job Title'}
                    </h1>
                    <p className="text-base font-bold text-[#F47C20] mt-1">
                      {job?.companyName || job?.company || 'Company Name'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-slate-600 pt-2">
                    {job?.location && (
                      <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" /> {job.location}</span>
                    )}
                    {(job?.jobType || job?.type) && (
                      <span className="flex items-center gap-1.5"><Briefcase size={15} className="text-slate-400" /> {job.jobType || job.type}</span>
                    )}
                    {(job?.salaryPackage || job?.packageDetails || job?.salary) && (
                      <span className="flex items-center gap-1.5"><DollarSign size={15} className="text-slate-400" /> {job.salaryPackage || job.packageDetails || job.salary}</span>
                    )}
                    {job?.openings != null && (
                      <span className="flex items-center gap-1.5"><Users size={15} className="text-slate-400" /> {job.openings} Openings</span>
                    )}
                    <span className="flex items-center gap-1.5"><Calendar size={15} className="text-slate-400" /> Deadline: {formatDeadline(job?.applicationDeadline || job?.expiryDate)}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => navigate(`/alumni/edit-job/${jobId}`)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                  >
                    <Edit3 size={15} /> Edit Job
                  </button>
                </div>
              </div>
            </div>

            {/* Application Overview Statistics */}
            <div className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Application Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.total ?? stats?.totalApplications ?? applicants.length}</p>
                </div>

                {/* Eligible */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Eligible</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.eligible ?? stats?.eligibleStudents ?? applicants.length}</p>
                </div>

                {/* Shortlisted */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Shortlisted</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.shortlisted ?? stats?.shortlistedStudents ?? applicants.filter(a => a.status === 'SHORTLISTED').length}</p>
                </div>

                {/* Selected */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Selected</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Award size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.selected ?? stats?.selectedStudents ?? applicants.filter(a => ['SELECTED','ACCEPTED','OFFERED'].includes(a.status)).length}</p>
                </div>

              </div>
            </div>

            {/* Student Applications Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Student Applications</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Review and evaluate student applications for this position.</p>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20] focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="APPLIED">Applied</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {departments.length > 0 && (
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={fetchJobData}
                    className="h-10 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Refresh Applications"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* Applications List / Table View */}
              {filteredApplicants.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-3 border border-orange-100">
                    <FileText size={24} className="text-[#F47C20]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">No Applications Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm font-medium">
                    {search || filterStatus || filterDepartment
                      ? 'No student applications match your search or filter criteria.'
                      : 'There are currently no student applications for this job.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (ONLY 5 COLUMNS: Student, Department, CGPA, Status, Action) */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-3.5 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Student</th>
                          <th className="py-3.5 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Department</th>
                          <th className="py-3.5 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">CGPA</th>
                          <th className="py-3.5 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="py-3.5 px-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredApplicants.map((app) => {
                          const studentName = app.studentName || app.student?.user?.name || app.name || 'Student Name';
                          const rollNumber = app.rollNumber || app.student?.rollNumber || 'N/A';
                          const profileImg = app.profileImageUrl || app.student?.profileImageUrl || app.studentProfile?.profileImageUrl;
                          const department = app.department || app.student?.department || app.studentProfile?.department || '—';
                          const cgpa = app.cgpa != null ? app.cgpa : (app.student?.cgpa != null ? app.student.cgpa : '—');

                          return (
                            <tr
                              key={app.id}
                              onClick={() => handleRowClick(app.id)}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              {/* 1. Student Column: Avatar + Full Name + Roll Number */}
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={profileImg}
                                    name={studentName}
                                    size="md"
                                  />
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 group-hover:text-[#F47C20] transition-colors leading-tight">
                                      {studentName}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                                      {rollNumber}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Department Column */}
                              <td className="py-3.5 px-5 font-bold text-slate-700">
                                {department}
                              </td>

                              {/* 3. CGPA Column */}
                              <td className="py-3.5 px-5 text-center font-extrabold text-slate-900">
                                {cgpa}
                              </td>

                              {/* 4. Status Column */}
                              <td className="py-3.5 px-5">
                                <ApplicationStatusBadge status={app.status} />
                              </td>

                              {/* 5. Action Column */}
                              <td className="py-3.5 px-5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(app.id);
                                  }}
                                  className="px-3.5 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-xl transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  View Profile <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (< 640px) */}
                  <div className="block sm:hidden space-y-3">
                    {filteredApplicants.map((app) => {
                      const studentName = app.studentName || app.student?.user?.name || app.name || 'Student Name';
                      const rollNumber = app.rollNumber || app.student?.rollNumber || 'N/A';
                      const profileImg = app.profileImageUrl || app.student?.profileImageUrl || app.studentProfile?.profileImageUrl;
                      const department = app.department || app.student?.department || app.studentProfile?.department || '—';
                      const cgpa = app.cgpa != null ? app.cgpa : (app.student?.cgpa != null ? app.student.cgpa : '—');

                      return (
                        <div
                          key={app.id}
                          onClick={() => handleRowClick(app.id)}
                          className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs cursor-pointer hover:border-orange-200 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={profileImg}
                                name={studentName}
                                size="md"
                              />
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{studentName}</h4>
                                <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">{rollNumber}</p>
                              </div>
                            </div>
                            <ApplicationStatusBadge status={app.status} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-extrabold">Department</span>
                              {department}
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-extrabold">CGPA</span>
                              {cgpa}
                            </div>
                          </div>

                          <div className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(app.id);
                              }}
                              className="w-full py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              View Profile <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>
          </>
        )}

      </div>

      {/* Application Details Drawer (Detailed Candidate Review Page) */}
      <ApplicationDetailsDrawer
        applicationId={selectedAppId}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedAppId(null); }}
        onStatusUpdate={(appId, newStatus) => {
          setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
          refreshStats();
        }}
      />
    </DashboardLayout>
  );
}
