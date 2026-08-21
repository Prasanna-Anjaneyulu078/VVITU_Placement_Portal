import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Briefcase, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { JobCard, PreApplicationScreeningModal, ScreeningAnswersViewModal, Pagination } from '../../components/common';
import { JobCardLoader } from '../../components/common/loading';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useDebounce from '../../hooks/useDebounce';

/* ─── Shared responsive grid CSS ─────────────────── */
const GRID_CSS = `
  .job-grid { display: grid; gap: 24px; align-items: start; }
  @media (max-width: 767px) { .job-grid { grid-template-columns: 1fr; gap: 16px; } }
  @media (min-width: 768px) and (max-width: 1199px) { .job-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; } }
  @media (min-width: 1200px) { .job-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; } }
`;

const JOBS_PER_PAGE = 6;

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
  const [currentPage, setCurrentPage] = useState(1);

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
        api.get('/student/jobs/open').catch(err => {
          console.error('Error fetching open jobs:', err);
          return { data: [] };
        }),
        api.get('/applications/my').catch(err => {
          console.error('Error fetching applied jobs:', err);
          return { data: [] };
        }),
        api.get('/student/jobs/closed').catch(err => {
          console.error('Error fetching closed jobs:', err);
          return { data: [] };
        }),
      ]);

      // Unpack response arrays (handles direct arrays or paginated response objects)
      const openData = Array.isArray(openRes.data) ? openRes.data : (openRes.data?.data || []);
      const appliedData = Array.isArray(appliedRes.data) ? appliedRes.data : (appliedRes.data?.data || []);
      const closedData = Array.isArray(closedRes.data) ? closedRes.data : (closedRes.data?.data || []);

      // Deduplicate/normalize open jobs
      const uniqueOpen = new Map();
      openData.forEach(job => job?.id && uniqueOpen.set(job.id, job));
      setOpenJobs(Array.from(uniqueOpen.values()));

      // Store applications
      setAppliedJobs(appliedData);

      // Deduplicate closed jobs
      const uniqueClosed = new Map();
      closedData.forEach(job => job?.id && uniqueClosed.set(job.id, job));
      setClosedJobs(Array.from(uniqueClosed.values()));

      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load student jobs:', err);
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
    return new Set(appliedJobs.map(app => app.job?.id || app.jobId).filter(Boolean));
  }, [appliedJobs]);

  /* ── Filtering Logic ── */
  const filteredJobs = useMemo(() => {
    let list = [];
    if (activeTab === 'open') {
      list = openJobs;
    } else if (activeTab === 'applied') {
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
      result = [...result].sort((a, b) => (b.id || 0) - (a.id || 0));
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

  // Compute total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  }, [filteredJobs.length]);

  // Slice current page jobs
  const currentJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, filterCompany, filterType, filterLocation, sortBy]);

  // Ensure valid page number range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Compute dynamic filter options
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
    setCurrentPage(1);
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
            className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl flex items-center gap-2 select-none"
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
            className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl shadow-xs select-none"
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
              onClick={() => { setActiveTab('open'); setCurrentPage(1); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'open'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500'
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
              onClick={() => { setActiveTab('applied'); setCurrentPage(1); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'applied'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500'
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
              onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}
              className={`pb-4 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 focus:outline-none ${
                activeTab === 'closed'
                  ? 'border-[#F47C20] text-[#F47C20]'
                  : 'border-transparent text-slate-500'
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



        {/* States & Lists */}
        {isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Unable to load job postings.</h3>
            <p className="text-red-600 mb-6">Please check your connection and try again.</p>
            <button
              onClick={fetchData}
              className="bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 select-none"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="job-grid">
            {Array.from({ length: 6 }).map((_, i) => <JobCardLoader key={i} />)}
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
                className="px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl select-none"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            renderEmptyState()
          )
        ) : (
          <div className="space-y-6">
            <div className="job-grid">
              {currentJobs.map(job => (
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

            {/* Pagination Footer */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={filteredJobs.length}
              pageSize={JOBS_PER_PAGE}
              itemLabel="jobs"
            />
          </div>
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
