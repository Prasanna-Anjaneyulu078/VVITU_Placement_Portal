import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, ApplicationStudentTable } from '../../components/common';
import { Search, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import ApplicationDetailsDrawer from '../../components/alumni/ApplicationDetailsDrawer';

export default function AlumniStudentApplications() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeJobId = searchParams.get('jobId') || params.jobId || params.id || '';

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterJobId, setFilterJobId] = useState(routeJobId);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Selected Application for Drawer
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const currentQueryId = searchParams.get('jobId') || params.jobId || params.id || '';
    setFilterJobId(currentQueryId);
  }, [searchParams, params]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [appsRes, jobsRes] = await Promise.all([
        api.get('/applications/alumni/my-posted-jobs').catch(() => ({ data: [] })),
        api.get('/alumni/my-jobs').catch(() => ({ data: [] }))
      ]);

      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
    } catch (err) {
      toast.error('Failed to load student applications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJobChange = (e) => {
    const selectedId = e.target.value;
    setFilterJobId(selectedId);
    if (selectedId) {
      setSearchParams({ jobId: selectedId });
    } else {
      setSearchParams({});
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
      const sName = (app.studentName || app.student?.name || app.user?.name || '').toLowerCase();
      const rNum = (app.rollNumber || app.student?.rollNumber || '').toLowerCase();
      const jTitle = (app.jobTitle || app.job?.title || '').toLowerCase();

      const appIdJobId = app.jobId || app.job?.id;
      const matchesJob = !filterJobId || String(appIdJobId) === String(filterJobId);
      const matchesSearch = !search || sName.includes(q) || rNum.includes(q) || jTitle.includes(q);
      const matchesDept = !filterDepartment || getDeptValue(app.department || app.student?.department) === filterDepartment;
      const matchesStatus = !filterStatus || app.status === filterStatus;

      return matchesJob && matchesSearch && matchesDept && matchesStatus;
    });
  }, [applications, search, filterJobId, filterDepartment, filterStatus]);

  return (
    <DashboardLayout role="alumni">
      {/* Navigation Button */}
      <div className="mb-2">
        <button
          onClick={() => navigate('/alumni/my-jobs')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#F47C20] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to My Jobs
        </button>
      </div>

      <PageHeader 
        title="Student Applications" 
        subtitle="Review, screen, and evaluate students who applied to your posted jobs."
      />

      <div className="mt-6 pb-16 space-y-6">


        {/* Content Container */}
        <ApplicationStudentTable
          data={filteredApps}
          isLoading={isLoading}
          emptyMessage="No applications found."
          onSelectStudent={(item) => openViewDetails(item.id)}
        />

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
