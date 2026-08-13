import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Briefcase, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, JobCard, JobFilterBar, JobDetailsModal } from '../../components/common';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import useDebounce from '../../hooks/useDebounce';

/* ─── Shared CSS injected once ─────────────────────────────────────── */
const GRID_CSS = `
  .job-grid { display: grid; gap: 24px; align-items: start; }
  @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr; gap: 16px; } }
  @media (min-width: 768px) and (max-width: 1199px) { .job-grid { grid-template-columns: 1fr; gap: 20px; } }
  @media (min-width: 1200px) { .job-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

/* ─── Skeleton Card ─────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
          </div>
          <div className="h-5 w-16 bg-slate-200 rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-3 bg-slate-200 rounded" />)}
        </div>
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="h-8 bg-slate-200 rounded-xl mb-4" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex-1 h-10 bg-slate-200 rounded-xl" />)}
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function AlumniMyJobs() {
  const [jobs, setJobs]               = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isError, setIsError]         = useState(false);
  const [viewingJob, setViewingJob]   = useState(null);

  /* filters */
  const [searchTerm,    setSearchTerm]    = useState('');
  const debouncedSearch                    = useDebounce(searchTerm, 300);
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  const navigate = useNavigate();

  /* ── Data fetching ── */
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.get('/alumni/my-jobs');
      // Deduplicate by ID
      const map = new Map();
      (res.data || []).forEach(j => map.set(j.id, j));
      setJobs(Array.from(map.values()));
    } catch (err) {
      toast.error('Failed to load your jobs');
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshJobStats = useCallback(async (jobId) => {
    try {
      const res = await api.get(`/alumni/jobs/${jobId}/statistics`);
      setJobs(prevJobs => prevJobs.map(j => {
        if (j.id === jobId) {
          return { ...j, statistics: res.data };
        }
        return j;
      }));
    } catch (err) {
      console.error(`Failed to refresh statistics for job ${jobId}:`, err);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* ── Handlers ── */
  const handleDelete = useCallback(async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success('Job deleted successfully');
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (err) {
      toast.error('Failed to delete job');
      console.error(err);
    }
  }, []);

  const handleEdit = useCallback((job) => {
    navigate(`/alumni/edit-job/${job.id}`);
  }, [navigate]);

  const handleViewApplications = useCallback((job) => {
    navigate(`/alumni/applications?jobId=${job.id}`);
  }, [navigate]);

  /* ── Derived ── */
  const uniqueCompanies = useMemo(() => [...new Set(jobs.map(j => j.company).filter(Boolean))], [jobs]);

  const filteredJobs = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return jobs.filter(job => {
      if (q && !job.title?.toLowerCase().includes(q) && !job.company?.toLowerCase().includes(q)) return false;
      if (filterStatus && job.status !== filterStatus) return false;
      if (filterType && job.jobType !== filterType && job.type !== filterType) return false;
      if (filterCompany && job.company !== filterCompany) return false;
      return true;
    });
  }, [jobs, debouncedSearch, filterStatus, filterType, filterCompany]);

  const hasActiveFilters = Boolean(searchTerm || filterStatus || filterType || filterCompany);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterType('');
    setFilterCompany('');
  };

  /* ── Render ── */
  return (
    <DashboardLayout role="alumni">
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      <PageHeader
        title="My Posted Jobs"
        subtitle="Manage your job listings and track applicants."
      />

      <div className="mt-6 pb-16">
        {/* Filter Bar */}
        <JobFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterCompany={filterCompany}
          onCompanyChange={setFilterCompany}
          companies={uniqueCompanies}
          filterType={filterType}
          onTypeChange={setFilterType}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          showStatus
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
          placeholder="Search your jobs…"
          rightSlot={
            <button
              onClick={() => navigate('/alumni/post-job')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] text-sm font-bold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F47C20]/50 whitespace-nowrap hover:bg-[#ffe8d6]"
            >
              <Plus size={16} className="text-[#F47C20]" /> Post New Job
            </button>
          }
        />

        {/* States */}
        {isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-12 flex flex-col items-center text-center">
            <Briefcase size={48} className="text-red-300 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load your jobs</h3>
            <p className="text-red-500 mb-6">Please check your connection and try again.</p>
            <button onClick={fetchJobs} className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl transition-colors">
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="job-grid">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-6 border border-orange-100">
              <Briefcase size={32} className="text-[#F47C20]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {hasActiveFilters ? 'No matching jobs found' : "You haven't posted any jobs yet"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by posting your first job opportunity to connect with talented students.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={resetFilters} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors">
                Clear Filters
              </button>
            ) : (
              <button onClick={() => navigate('/alumni/post-job')} className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl transition-all shadow-sm hover:bg-[#ffe8d6]">
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 font-medium mb-4">
              Showing <strong className="text-slate-700">{filteredJobs.length}</strong> job{filteredJobs.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' matching your filters'}
            </p>
            <div className="job-grid">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  isAlumni
                  onSelect={setViewingJob}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewApplications={handleViewApplications}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Job Details Modal */}
      {viewingJob && (
        <JobDetailsModal
          isOpen
          onClose={() => setViewingJob(null)}
          job={viewingJob}
          role="alumni"
        />
      )}
    </DashboardLayout>
  );
}
