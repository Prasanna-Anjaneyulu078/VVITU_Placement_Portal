import React from 'react';
import { Search, MapPin, Briefcase, Building2, Filter, X, ArrowUpDown } from 'lucide-react';

/**
 * JobFilterBar – unified search & filter toolbar used by all three job listing pages.
 *
 * Props:
 *  searchTerm, onSearchChange        – text search
 *  filterCompany, onCompanyChange, companies  – company dropdown
 *  filterType, onTypeChange          – job type dropdown
 *  filterStatus, onStatusChange, statuses     – status dropdown (admin/alumni)
 *  filterLocation, onLocationChange, locations – location dropdown (student)
 *  sortBy, onSortChange              – sort order dropdown (student only, when showSort=true)
 *  hasActiveFilters, onClearFilters  – clear-filters CTA
 *  rightSlot                         – optional JSX rendered on the far right (e.g. "Post Job" button)
 *  showStatus, showLocation, showSort – toggle individual filter visibility
 */
export default function JobFilterBar({
  searchTerm = '',
  onSearchChange,
  filterCompany = '',
  onCompanyChange,
  companies = [],
  filterType = '',
  onTypeChange,
  filterStatus = '',
  onStatusChange,
  statuses = [],
  filterLocation = '',
  onLocationChange,
  locations = [],
  sortBy = 'recent',
  onSortChange,
  hasActiveFilters = false,
  onClearFilters,
  rightSlot,
  showStatus = false,
  showLocation = false,
  showSort = false,
  placeholder = 'Search jobs, companies…',
}) {
  const selectBase =
    'w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm appearance-none text-slate-700 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] transition-all cursor-pointer';

  const iconBase =
    'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 mb-6">
      {/* Main row – wraps naturally on small screens */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className={iconBase} size={17} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] transition-all"
          />
        </div>

        {/* Company */}
        {companies.length > 0 && (
          <div className="relative min-w-[130px]">
            <Building2 className={iconBase} size={15} />
            <select value={filterCompany} onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)} className={selectBase}>
              <option value="">Company</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Job Type */}
        <div className="relative min-w-[130px]">
          <Briefcase className={iconBase} size={15} />
          <select value={filterType} onChange={(e) => onTypeChange && onTypeChange(e.target.value)} className={selectBase}>
            <option value="">Job Type</option>
            <option value="FULL_TIME">Full-Time</option>
            <option value="PART_TIME">Part-Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>

        {/* Status (alumni / admin) */}
        {showStatus && (
          <div className="relative min-w-[130px]">
            <Filter className={iconBase} size={15} />
            <select value={filterStatus} onChange={(e) => onStatusChange && onStatusChange(e.target.value)} className={selectBase}>
              <option value="">Status</option>
              {statuses.length > 0
                ? statuses.map((s) => <option key={s} value={s}>{s}</option>)
                : <>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CLOSED">Closed</option>
                  </>
              }
            </select>
          </div>
        )}

        {/* Location (student) */}
        {showLocation && locations.length > 0 && (
          <div className="relative min-w-[130px]">
            <MapPin className={iconBase} size={15} />
            <select value={filterLocation} onChange={(e) => onLocationChange && onLocationChange(e.target.value)} className={selectBase}>
              <option value="">Location</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        {/* Sort By (student) */}
        {showSort && (
          <div className="relative min-w-[140px]">
            <ArrowUpDown className={iconBase} size={15} />
            <select value={sortBy} onChange={(e) => onSortChange && onSortChange(e.target.value)} className={selectBase}>
              <option value="recent">Most Recent</option>
              <option value="deadline">Deadline (Soonest)</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-100   rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Clear all filters"
          >
            <X size={13} /> Clear Filters
          </button>
        )}

        {/* Optional slot (e.g. Post Job button) */}
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>
    </div>
  );
}
