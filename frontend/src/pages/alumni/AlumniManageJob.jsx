import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Clock,
  Users, CheckCircle2, XCircle, Award, Sparkles, Edit3,
  Search, RefreshCw, AlertTriangle, Building2, User, FileText, Eye
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
    label = 'Open';
  } else if (s === 'CLOSED') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    label = 'Closed';
  } else if (s === 'EXPIRED') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    label = 'Expired';
  } else if (s === 'PENDING') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Pending Review';
  } else if (s === 'REJECTED') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    label = 'Rejected';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ApplicationStatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  let bg = 'bg-slate-100 text-slate-600 border-slate-200';

  if (s === 'SHORTLISTED') bg = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (s === 'SELECTED' || s === 'ACCEPTED' || s === 'OFFERED') bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (s === 'REJECTED') bg = 'bg-red-50 text-red-700 border-red-200';
  else if (s === 'APPLIED') bg = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (s === 'UNDER_REVIEW') bg = 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${bg}`}>
      {s.replace('_', ' ')}
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

  const handleStatusChange = async (appId, newStatus) => {
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
      if (a.department) set.add(a.department);
    });
    return Array.from(set);
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(a => {
      const q = search.toLowerCase();
      const name = (a.studentName || '').toLowerCase();
      const roll = (a.rollNumber || '').toLowerCase();

      const matchesSearch = !search || name.includes(q) || roll.includes(q);
      const matchesStatus = !filterStatus || a.status === filterStatus;
      const matchesDept = !filterDepartment || a.department === filterDepartment;

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

  return (
    <DashboardLayout role="alumni">
      <div className="pb-16 space-y-6">
        
        {/* Navigation & Header */}
        <div>
          <button
            onClick={() => navigate('/alumni/my-jobs')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#F47C20] transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to My Jobs
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 animate-pulse space-y-6">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-12 flex flex-col items-center text-center">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Job Management Details</h3>
            <p className="text-sm text-red-600 mb-6 max-w-md">{errorMessage || 'Please verify your authorization and try again.'}</p>
            <button
              onClick={fetchJobData}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Job Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StatusBadge status={job?.status} />
                    <span className="text-xs font-bold text-slate-400">Job ID #{jobId}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{job?.title || 'Job Title'}</h1>
                  <p className="text-sm font-semibold text-[#F47C20] mt-1">{job?.companyName || job?.company || 'Company Name'}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-slate-600">
                    {job?.location && (
                      <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" /> {job.location}</span>
                    )}
                    {job?.jobType && (
                      <span className="flex items-center gap-1.5"><Briefcase size={15} className="text-slate-400" /> {job.jobType}</span>
                    )}
                    {(job?.salaryPackage || job?.packageDetails) && (
                      <span className="flex items-center gap-1.5"><DollarSign size={15} className="text-slate-400" /> {job.salaryPackage || job.packageDetails}</span>
                    )}
                    {job?.openings != null && (
                      <span className="flex items-center gap-1.5"><Users size={15} className="text-slate-400" /> {job.openings} Openings</span>
                    )}
                    <span className="flex items-center gap-1.5"><Calendar size={15} className="text-slate-400" /> Deadline: {formatDeadline(job?.applicationDeadline || job?.expiryDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/alumni/edit-job/${jobId}`)}
                    className="px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Edit3 size={14} /> Edit Job
                  </button>
                </div>
              </div>
            </div>

            {/* Application Overview Statistics */}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 mb-3">Application Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Stat 1: Total */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.total ?? stats?.totalApplications ?? applicants.length}</p>
                </div>

                {/* Stat 2: Eligible */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Eligible</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.eligible ?? stats?.eligibleStudents ?? applicants.length}</p>
                </div>

                {/* Stat 3: Shortlisted */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Shortlisted</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.shortlisted ?? stats?.shortlistedStudents ?? applicants.filter(a => a.status === 'SHORTLISTED').length}</p>
                </div>

                {/* Stat 4: Selected */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Selected</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Award size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats?.selected ?? stats?.selectedStudents ?? applicants.filter(a => ['SELECTED','ACCEPTED','OFFERED'].includes(a.status)).length}</p>
                </div>

              </div>
            </div>

            {/* Applications Table Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Applications</h2>
                  <p className="text-xs text-slate-500 font-medium">Review and evaluate student applications for this position.</p>
                </div>

                {/* Filter & Search Inputs */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20]"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20]"
                  >
                    <option value="">All Statuses</option>
                    <option value="APPLIED">Applied</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {departments.length > 0 && (
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20]"
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={fetchJobData}
                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    title="Refresh Applications"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* Applications List View */}
              {filteredApplicants.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-3 border border-orange-100">
                    <FileText size={24} className="text-[#F47C20]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">No Applications Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {search || filterStatus || filterDepartment
                      ? 'No applicants match your filter criteria. Try clearing search filters.'
                      : 'Applications submitted for this job will appear here.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Student</th>
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Roll Number</th>
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Department</th>
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">CGPA</th>
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredApplicants.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-extrabold text-slate-900">{app.studentName || 'Student Name'}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{app.studentEmail}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {app.rollNumber || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{app.department || 'N/A'}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">{app.cgpa != null ? app.cgpa : 'N/A'}</td>
                            <td className="py-3 px-4">
                              <ApplicationStatusBadge status={app.status} />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setSelectedAppId(app.id); setIsDrawerOpen(true); }}
                                  className="px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] font-bold text-xs rounded-xl transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={13} /> View
                                </button>
                                <select
                                  value={app.status || ''}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                  className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
                                >
                                  <option value="APPLIED">Applied</option>
                                  <option value="UNDER_REVIEW">Review</option>
                                  <option value="SHORTLISTED">Shortlist</option>
                                  <option value="SELECTED">Select</option>
                                  <option value="REJECTED">Reject</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="block sm:hidden space-y-3">
                    {filteredApplicants.map((app) => (
                      <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{app.studentName || 'Student Name'}</h4>
                            <p className="text-xs text-[#F47C20] font-mono font-bold mt-0.5">{app.rollNumber || 'N/A'}</p>
                          </div>
                          <ApplicationStatusBadge status={app.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div>Dept: <strong>{app.department || 'N/A'}</strong></div>
                          <div>CGPA: <strong>{app.cgpa != null ? app.cgpa : 'N/A'}</strong></div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => { setSelectedAppId(app.id); setIsDrawerOpen(true); }}
                            className="flex-1 py-2 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#FFF4EB] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                          >
                            <Eye size={14} /> View Details
                          </button>
                          <select
                            value={app.status || ''}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="UNDER_REVIEW">Review</option>
                            <option value="SHORTLISTED">Shortlist</option>
                            <option value="SELECTED">Select</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </>
        )}

      </div>

      {/* Application Details Drawer */}
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
