import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, JobCard, JobFilterBar } from '../../components/common';
import { JobCardLoader } from '../../components/common/loading';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useDebounce from '../../hooks/useDebounce';

/* ─── Shared CSS ────────────────────────────────────────────────────── */
const GRID_CSS = `
  .job-grid { display: grid; gap: 24px; align-items: start; }
  @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr; gap: 16px; } }
  @media (min-width: 768px) and (max-width: 1199px) { .job-grid { grid-template-columns: 1fr; gap: 20px; } }
  @media (min-width: 1200px) { .job-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;



const ITEMS_PER_PAGE = 10;

export default function AdminJobs() {
  const [jobs, setJobs]               = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isError, setIsError]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /* filters */
  const [searchTerm,    setSearchTerm]    = useState('');
  const debouncedSearch                    = useDebounce(searchTerm, 300);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');

  const navigate = useNavigate();

  /* ── Data fetching ── */
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.get('/jobs/all');
      // Deduplicate by ID
      const map = new Map();
      (res.data || []).forEach(j => map.set(j.id, j));
      setJobs(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load jobs', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* ── Handlers ── */
  const updateJobStatus = useCallback(async (job, status) => {
    try {
      await api.post(`/admin/jobs/moderate/${job.id}`, {
        approved: status === 'ACTIVE',
        rejectionReason: status === 'REJECTED' ? 'Does not meet posting criteria' : '',
      });
      toast.success(`Job marked as ${status}`);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status } : j));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update job status');
    }
  }, []);

  const handleDelete = useCallback(async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success('Job deleted');
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (err) {
      toast.error('Failed to delete job');
    }
  }, []);

  /* ── Derived ── */
  const uniqueCompanies = useMemo(() => [...new Set(jobs.map(j => j.company).filter(Boolean))], [jobs]);

  const filteredJobs = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const filtered = jobs.filter(job => {
      if (q && !job.title?.toLowerCase().includes(q) && !job.company?.toLowerCase().includes(q)) return false;
      if (filterCompany && job.company !== filterCompany) return false;
      if (filterType && job.jobType !== filterType && job.type !== filterType) return false;
      if (filterStatus && job.status !== filterStatus) return false;
      return true;
    });
    // PENDING first
    return [...filtered].sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return 0;
    });
  }, [jobs, debouncedSearch, filterCompany, filterType, filterStatus]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const currentJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const hasActiveFilters = Boolean(searchTerm || filterCompany || filterType || filterStatus);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
    setFilterType('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  // Reset page when filters change
  const handleSearchChange  = (v) => { setSearchTerm(v);    setCurrentPage(1); };
  const handleCompanyChange = (v) => { setFilterCompany(v); setCurrentPage(1); };
  const handleTypeChange    = (v) => { setFilterType(v);    setCurrentPage(1); };
  const handleStatusChange  = (v) => { setFilterStatus(v);  setCurrentPage(1); };

  /* ── Pagination ── */
  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
              p === currentPage
                ? 'bg-[#F47C20] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600  '
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  /* ── Render ── */
  return (
    <DashboardLayout role="admin">
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      <PageHeader
        title="Job Moderation"
        subtitle="Review, approve, and manage job postings from alumni."
      />

      <div className="mt-6 pb-16">
        {/* Filter Bar */}
        <JobFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filterCompany={filterCompany}
          onCompanyChange={handleCompanyChange}
          companies={uniqueCompanies}
          filterType={filterType}
          onTypeChange={handleTypeChange}
          filterStatus={filterStatus}
          onStatusChange={handleStatusChange}
          showStatus
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
          placeholder="Search jobs, companies…"
        />

        {/* Summary Badges */}
        {!isLoading && !isError && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'Total', count: jobs.length, color: 'bg-slate-100 text-slate-700' },
              { label: 'Pending', count: jobs.filter(j => j.status === 'PENDING').length, color: 'bg-amber-50 text-amber-700 border border-amber-100' },
              { label: 'Active',  count: jobs.filter(j => j.status === 'ACTIVE').length,  color: 'bg-green-50 text-green-700 border border-green-100' },
              { label: 'Rejected',count: jobs.filter(j => j.status === 'REJECTED').length,color: 'bg-red-50 text-red-700 border border-red-100' },
            ].map(({ label, count, color }) => (
              <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                {label}: {count}
              </span>
            ))}
          </div>
        )}

        {/* States */}
        {isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-12 flex flex-col items-center text-center">
            <Briefcase size={48} className="text-red-300 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load jobs</h3>
            <p className="text-red-500 mb-6">Please try again.</p>
            <button onClick={fetchJobs} className="px-6 py-2.5 bg-red-600   text-white font-bold rounded-xl transition-colors">
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="job-grid">
            <JobCardLoader count={4} />
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-200">
              <Briefcase size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {hasActiveFilters ? 'No matching jobs' : 'No jobs available'}
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : 'No jobs are available in the system at this time.'}
            </p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl   transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 font-medium mb-4">
              Showing <strong className="text-slate-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length)}</strong> of <strong className="text-slate-700">{filteredJobs.length}</strong> jobs
            </p>
            <div className="job-grid">
              {currentJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  isAdmin
                  onSelect={(j) => navigate(`/admin/jobs/${j.id}`)}
                  onApprove={(j) => updateJobStatus(j, 'ACTIVE')}
                  onReject={(j) => updateJobStatus(j, 'REJECTED')}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <PaginationBar />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
