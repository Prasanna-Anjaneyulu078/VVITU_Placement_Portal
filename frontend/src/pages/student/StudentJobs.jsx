import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Briefcase, AlertCircle, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { JobCard, JobFilterBar, PreApplicationScreeningModal, ScreeningAnswersViewModal } from '../../components/common';
import { JobCardLoader } from '../../components/common/loading';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useDebounce from '../../hooks/useDebounce';

/* ─── Shared responsive grid CSS ─────────────────── */
const GRID_CSS = `
  .job-grid { display: grid; gap: 24px; align-items: start; }
  @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr; gap: 16px; } }
  @media (min-width: 768px) and (max-width: 1199px) { .job-grid { grid-template-columns: 1fr; gap: 20px; } }
  @media (min-width: 1200px) { .job-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;


/* ─── Component ──────────────────────────────────────────────────── */
export default function StudentJobs() {
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'applied', 'closed'

  // Job lists states
  const [openJobs, setOpenJobs]       = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [closedJobs, setClosedJobs]   = useState([]);

  // Filters
  const [searchTerm, setSearchTerm]         = useState('');
  const debouncedSearch                      = useDebounce(searchTerm, 300);
  const [filterCompany, setFilterCompany]   = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy]                 = useState('recent');

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError]     = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Modal states
  const [screeningJob, setScreeningJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const navigate = useNavigate();

  /* ── Data fetching ── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [openRes, appliedRes, closedRes] = await Promise.all([
        api.get('/student/jobs/open'),
        api.get('/applications/my').catch(() => ({ data: [] })),
        api.get('/student/jobs/closed').catch(() => ({ data: [] })),
      ]);

      // Deduplicate/normalize open jobs
      const uniqueOpen = new Map();
      (openRes.data || []).forEach(job => uniqueOpen.set(job.id, job));
      setOpenJobs(Array.from(uniqueOpen.values()));

      // Store applications
      setAppliedJobs(appliedRes.data || []);

      // Deduplicate closed jobs
      const uniqueClosed = new Map();
      (closedRes.data || []).forEach(job => uniqueClosed.set(job.id, job));
      setClosedJobs(Array.from(uniqueClosed.values()));

      setVisibleCount(10);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Applied Job IDs set for quick lookup
  const appliedJobIds = useMemo(() => {
    return new Set(appliedJobs.map(app => app.job?.id || app.jobId));
  }, [appliedJobs]);

  /* ── Filtering Logic ── */
  const filteredJobs = useMemo(() => {
    let list = [];
    if (activeTab === 'open') {
      list = openJobs;
    } else if (activeTab === 'applied') {
      // Map applications to a structure compatible with JobCard
      list = appliedJobs.map(app => ({
        ...(app.job || {}),
        id: app.job?.id || app.jobId,
        title: app.job?.title || app.jobTitle,
        company: app.job?.company || app.company,
        companyLogoUrl: app.job?.companyLogoUrl,
        location: app.job?.location,
        jobType: app.job?.jobType,
        packageDetails: app.job?.packageDetails,
        requiredSkills: app.job?.requiredSkills,
        appliedAt: app.appliedAt,
        applicationStatus: app.status,
        applicationObject: app
      }));
    } else if (activeTab === 'closed') {
      list = closedJobs;
    }

    if (!Array.isArray(list)) return [];

    let result = list.filter(job => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = job.title?.toLowerCase().includes(q)
          || job.company?.toLowerCase().includes(q)
          || job.description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCompany && job.company !== filterCompany) return false;
      if (filterType && job.jobType !== filterType && job.type !== filterType) return false;
      if (filterLocation && job.location !== filterLocation) return false;
      return true;
    });

    if (sortBy === 'recent') {
      result = [...result].sort((a, b) => b.id - a.id);
    } else if (sortBy === 'deadline') {
      result = [...result].sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
    } else if (sortBy === 'title') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [activeTab, openJobs, appliedJobs, closedJobs, debouncedSearch, filterCompany, filterType, filterLocation, sortBy]);

  // Compute filters dynamically based on active tab's list
  const uniqueCompanies = useMemo(() => {
    let list = [];
    if (activeTab === 'open') list = openJobs;
    else if (activeTab === 'applied') list = appliedJobs.map(app => app.job).filter(Boolean);
    else if (activeTab === 'closed') list = closedJobs;
    return [...new Set(list.map(j => j.company).filter(Boolean))];
  }, [activeTab, openJobs, appliedJobs, closedJobs]);

  const uniqueLocations = useMemo(() => {
    let list = [];
    if (activeTab === 'open') list = openJobs;
    else if (activeTab === 'applied') list = appliedJobs.map(app => app.job).filter(Boolean);
    else if (activeTab === 'closed') list = closedJobs;
    return [...new Set(list.map(j => j.location).filter(Boolean))];
  }, [activeTab, openJobs, appliedJobs, closedJobs]);

  const hasActiveFilters = Boolean(debouncedSearch || filterCompany || filterType || filterLocation || sortBy !== 'recent');

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
    setFilterType('');
    setFilterLocation('');
    setSortBy('recent');
  };

  /* ── Handlers ── */
  const handleApplyClick = useCallback((job) => {
    setScreeningJob(job);
  }, []);

  const handleApplySuccess = useCallback(async () => {
    if (!screeningJob) return;
    toast.success('Application submitted successfully!');
    setScreeningJob(null);
    await fetchData();
  }, [screeningJob, fetchData]);

  const openJobDetails = useCallback((job) => {
    navigate(`/student/jobs/${job.id}`);
  }, [navigate]);

  const handleViewApplicationClick = useCallback((job) => {
    if (job.applicationObject) {
      setSelectedApplication(job.applicationObject);
    }
  }, []);

  /* ── Empty States Render ── */
  const renderEmptyState = () => {
    if (activeTab === 'open') {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-6 border border-orange-100">
            <Briefcase size={32} className="text-[#F47C20]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No open jobs available.</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Check back later for new opportunities matching your profile.
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }
    if (activeTab === 'applied') {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100">
            <FileText size={32} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">You haven't applied to any jobs yet.</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Browse Open Jobs to find and apply to opportunities matching your profile.
          </p>
          <button
            onClick={() => setActiveTab('open')}
            className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl shadow-sm transition-colors"
          >
            Browse Open Jobs
          </button>
        </div>
      );
    }
    if (activeTab === 'closed') {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-200">
            <AlertCircle size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No closed jobs available.</h3>
          <p className="text-slate-500 max-w-xs">
            There are currently no closed or expired job postings.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Job Board</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Discover, track, and apply to opportunities tailored for your academic profile.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-8 min-w-max">
            <button
              onClick={() => { setActiveTab('open'); setVisibleCount(10); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'open'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500    '
              }`}
            >
              Open Jobs
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all ${
                activeTab === 'open' ? 'bg-[#FFF4EB] text-[#F47C20]' : 'bg-slate-100 text-slate-600'
              }`}>
                {openJobs.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('applied'); setVisibleCount(10); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'applied'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500    '
              }`}
            >
              Applied Jobs
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all ${
                activeTab === 'applied' ? 'bg-[#FFF4EB] text-[#F47C20]' : 'bg-slate-100 text-slate-600'
              }`}>
                {appliedJobs.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('closed'); setVisibleCount(10); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'closed'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500    '
              }`}
            >
              Closed Jobs
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all ${
                activeTab === 'closed' ? 'bg-[#FFF4EB] text-[#F47C20]' : 'bg-slate-100 text-slate-600'
              }`}>
                {closedJobs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <JobFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterCompany={filterCompany}
          onCompanyChange={setFilterCompany}
          companies={uniqueCompanies}
          filterType={filterType}
          onTypeChange={setFilterType}
          filterLocation={filterLocation}
          onLocationChange={setFilterLocation}
          locations={uniqueLocations}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
          showLocation
          showSort
          placeholder="Search jobs, companies…"
        />

        {/* States & Lists */}
        {isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Unable to load job postings.</h3>
            <p className="text-red-600 mb-6">Please check your connection and try again.</p>
            <button
              onClick={fetchData}
              className="bg-red-600   text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="job-grid">
            {Array.from({ length: 4 }).map((_, i) => <JobCardLoader key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          hasActiveFilters ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-6 border border-orange-100">
                <Briefcase size={32} className="text-[#F47C20]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No matching jobs found.</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Try changing your filters or search keywords.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl     transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47C20]/40"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            renderEmptyState()
          )
        ) : (
          <>
            <p className="text-sm text-slate-400 font-medium mb-4">
              Showing <strong className="text-slate-700">{Math.min(visibleCount, filteredJobs.length)}</strong> of{' '}
              <strong className="text-slate-700">{filteredJobs.length}</strong> job{filteredJobs.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' matching your filters'}
            </p>
            <div className="job-grid">
              {filteredJobs.slice(0, visibleCount).map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={openJobDetails}
                  onApply={() => handleApplyClick(job)}
                  isApplied={activeTab === 'applied' || appliedJobIds.has(job.id)}
                  isClosed={activeTab === 'closed'}
                  statusOverride={activeTab === 'applied' ? job.applicationStatus : undefined}
                  onViewApplication={activeTab === 'applied' ? () => handleViewApplicationClick(job) : undefined}
                />
              ))}
            </div>

            {filteredJobs.length > visibleCount && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="rounded-xl px-8 py-3 bg-white border border-slate-300 font-bold text-slate-700   shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Load More Jobs
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pre-Application Screening Modal */}
      {screeningJob && (
        <PreApplicationScreeningModal
          isOpen={Boolean(screeningJob)}
          onClose={() => setScreeningJob(null)}
          job={screeningJob}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* View Screening Responses Modal */}
      {selectedApplication && (
        <ScreeningAnswersViewModal
          isOpen={Boolean(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          application={selectedApplication}
        />
      )}
    </DashboardLayout>
  );
}
