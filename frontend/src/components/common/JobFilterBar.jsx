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
    'w-full min-h-[44px] pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs sm:text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] focus:bg-white transition-all cursor-pointer truncate max-w-full';

  const iconBase =
    'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-6 filter-toolbar-container">
      {/* Main Container - Full-width stacked on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between w-full">
        
        {/* Search Field */}
        <div className="relative flex-1 w-full filter-search-input">
          <Search className={iconBase} size={17} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs sm:text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Controls Group - Grid on mobile/tablet, flex on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex flex-wrap items-center gap-2.5 w-full md:w-auto filter-controls-group">
          {/* Company */}
          {companies.length > 0 && (
            <div className="relative w-full sm:w-auto min-w-[130px] flex-1 md:flex-none">
              <Building2 className={iconBase} size={15} />
              <select value={filterCompany} onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)} className={selectBase}>
                <option value="">Company</option>
                {companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Job Type */}
          <div className="relative w-full sm:w-auto min-w-[130px] flex-1 md:flex-none">
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
            <div className="relative w-full sm:w-auto min-w-[130px] flex-1 md:flex-none">
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
            <div className="relative w-full sm:w-auto min-w-[130px] flex-1 md:flex-none">
              <MapPin className={iconBase} size={15} />
              <select value={filterLocation} onChange={(e) => onLocationChange && onLocationChange(e.target.value)} className={selectBase}>
                <option value="">Location</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Sort By (student) */}
          {showSort && (
            <div className="relative w-full sm:w-auto min-w-[140px] flex-1 md:flex-none">
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
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
              aria-label="Clear all filters"
            >
              <X size={13} /> Clear Filters
            </button>
          )}

          {/* Optional slot (e.g. Post Job button) */}
          {rightSlot && <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end">{rightSlot}</div>}
        </div>
      </div>
    </div>
  );
}
