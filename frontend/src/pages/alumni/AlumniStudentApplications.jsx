import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, ApplicationStudentTable } from '../../components/common';
import { Search, RefreshCw } from 'lucide-react';
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
