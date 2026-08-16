import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Briefcase, Building2, Filter, X, ArrowUpDown, SlidersHorizontal, Check } from 'lucide-react';

/**
 * JobFilterBar – Unified, production-ready responsive search & filter toolbar.
 *
 * Responsive Layout Strategy:
 * - Desktop (>= 1024px): Single compact row [ Search (flex-1) | Company | Type | Status | Location | Sort ]
 * - Tablet (768px - 1023px): Search bar full-width, followed by compact horizontal row of filter controls.
 * - Mobile (< 768px): Search bar top row, Primary filters share a row (flex: 1 1 0),
 *   Secondary filters collapse cleanly into a "More Filters" popover button.
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close "More Filters" popover on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectBase =
    'w-full min-h-[44px] h-11 pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs sm:text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] focus:bg-white transition-all cursor-pointer truncate max-w-full';

  const iconBase =
    'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10';

  // Count active secondary filters for "More Filters" pill badge
  const secondaryActiveCount = [
    Boolean(filterCompany),
    Boolean(showLocation && filterLocation),
    Boolean(showSort && sortBy !== 'recent'),
  ].filter(Boolean).length;

  const totalActiveCount = [
    Boolean(searchTerm),
    Boolean(filterType),
    Boolean(showStatus && filterStatus),
    ...[
      Boolean(filterCompany),
      Boolean(showLocation && filterLocation),
      Boolean(showSort && sortBy !== 'recent'),
    ]
  ].filter(Boolean).length;

  const computedHasActiveFilters = hasActiveFilters || totalActiveCount > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-6 filter-toolbar-container w-full max-w-full">
      {/* Container - flex-col on mobile/tablet, flex-row on desktop */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between w-full">
        
        {/* Search Field (Takes majority width on desktop, full width on mobile) */}
        <div className="relative flex-1 w-full min-w-0 filter-search-input">
          <Search className={iconBase} size={17} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full min-h-[44px] h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20] focus:bg-white transition-all shadow-2xs"
            aria-label="Search jobs input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F47C20]"
              title="Clear search"
              aria-label="Clear search text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Controls Group - Responsive Flex Row */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto filter-controls-group">
          
          {/* PRIMARY FILTER 1: Job Type (Always visible in compact row) */}
          <div className="relative flex-1 sm:flex-none min-w-[120px] sm:min-w-[135px]">
            <Briefcase className={iconBase} size={15} />
            <select
              value={filterType}
              onChange={(e) => onTypeChange && onTypeChange(e.target.value)}
              className={selectBase}
              aria-label="Filter by job type"
            >
              <option value="">All Job Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          {/* PRIMARY FILTER 2: Status (Admin/Alumni) */}
          {showStatus && (
            <div className="relative flex-1 sm:flex-none min-w-[120px] sm:min-w-[135px]">
              <Filter className={iconBase} size={15} />
              <select
                value={filterStatus}
                onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
                className={selectBase}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
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

          {/* DESKTOP VISIBLE FILTERS (Companies, Location, Sort) - Shown side-by-side on desktop */}
          {/* Company */}
          {companies.length > 0 && (
            <div className="hidden md:block relative min-w-[135px]">
              <Building2 className={iconBase} size={15} />
              <select
                value={filterCompany}
                onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
                className={selectBase}
                aria-label="Filter by company"
              >
                <option value="">All Companies</option>
                {companies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Location (Student) */}
          {showLocation && locations.length > 0 && (
            <div className="hidden md:block relative min-w-[135px]">
              <MapPin className={iconBase} size={15} />
              <select
                value={filterLocation}
                onChange={(e) => onLocationChange && onLocationChange(e.target.value)}
                className={selectBase}
                aria-label="Filter by location"
              >
                <option value="">All Locations</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Sort By (Student) */}
          {showSort && (
            <div className="hidden md:block relative min-w-[145px]">
              <ArrowUpDown className={iconBase} size={15} />
              <select
                value={sortBy}
                onChange={(e) => onSortChange && onSortChange(e.target.value)}
                className={selectBase}
                aria-label="Sort listings"
              >
                <option value="recent">Most Recent</option>
                <option value="deadline">Deadline (Soonest)</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          )}

          {/* MOBILE/TABLET: "More Filters" Popover Drawer when secondary filters exist */}
          {(companies.length > 0 || (showLocation && locations.length > 0) || showSort) && (
            <div className="relative md:hidden shrink-0" ref={moreRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`min-h-[44px] h-11 px-3.5 flex items-center gap-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                  secondaryActiveCount > 0
                    ? 'bg-[#FFF4EB] border-[#F47C20] text-[#F47C20]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Toggle secondary filters popover"
              >
                <SlidersHorizontal size={14} />
                <span>More</span>
                {secondaryActiveCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#F47C20] text-white text-[10px] font-bold flex items-center justify-center">
                    {secondaryActiveCount}
                  </span>
                )}
              </button>

              {/* Viewport-Safe Popover Panel */}
              {isMoreOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Secondary Filters</h4>
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Company in Popover */}
                  {companies.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Company</label>
                      <div className="relative">
                        <Building2 className={iconBase} size={14} />
                        <select
                          value={filterCompany}
                          onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
                          className={selectBase}
                        >
                          <option value="">All Companies</option>
                          {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Location in Popover */}
                  {showLocation && locations.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Location</label>
                      <div className="relative">
                        <MapPin className={iconBase} size={14} />
                        <select
                          value={filterLocation}
                          onChange={(e) => onLocationChange && onLocationChange(e.target.value)}
                          className={selectBase}
                        >
                          <option value="">All Locations</option>
                          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Sort in Popover */}
                  {showSort && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Sort By</label>
                      <div className="relative">
                        <ArrowUpDown className={iconBase} size={14} />
                        <select
                          value={sortBy}
                          onChange={(e) => onSortChange && onSortChange(e.target.value)}
                          className={selectBase}
                        >
                          <option value="recent">Most Recent</option>
                          <option value="deadline">Deadline (Soonest)</option>
                          <option value="title">Title A–Z</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Popover Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onClearFilters && onClearFilters();
                        setIsMoreOpen(false);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 py-1"
                    >
                      Reset All
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen(false)}
                      className="px-3 py-1.5 bg-[#F47C20] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                    >
                      <Check size={13} /> Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLEAR ALL FILTERS BUTTON */}
          {computedHasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-[44px] h-11 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer shrink-0"
              aria-label="Clear all active filters"
            >
              <X size={14} /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* OPTIONAL SLOT (e.g. Post Job button) */}
          {rightSlot && <div className="sm:ml-auto flex items-center justify-end shrink-0">{rightSlot}</div>}
        </div>
      </div>
    </div>
  );
}
