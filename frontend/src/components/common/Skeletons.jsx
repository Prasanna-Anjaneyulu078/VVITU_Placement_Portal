import React from 'react';
import './Skeletons.css';

/**
 * Reusable Card Skeleton with Shimmer
 */
export const CardSkeleton = ({ height = '160px', className = '' }) => (
  <div className={`skeleton-card aria-busy="true" ${className}`}>
    <div className="skeleton-shimmer" style={{ width: '40%', height: '20px' }} />
    <div className="skeleton-shimmer" style={{ width: '80%', height: '16px' }} />
    <div className="skeleton-shimmer" style={{ width: '60%', height: '16px' }} />
    <div className="skeleton-shimmer" style={{ width: '30%', height: '24px', marginTop: 'auto' }} />
  </div>
);

/**
 * Reusable Table Skeleton maintaining column width & row density
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden" aria-busy="true">
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="skeleton-table-row">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <div
            key={cIdx}
            className="skeleton-shimmer"
            style={{
              flex: cIdx === 0 ? 2 : 1,
              height: '18px',
              borderRadius: '6px'
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Dashboard Stats Card Skeleton
 */
export const StatsCardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4" aria-busy="true">
    <div className="skeleton-shimmer w-12 h-12 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton-shimmer w-20 h-4" />
      <div className="skeleton-shimmer w-12 h-6" />
    </div>
  </div>
);

/**
 * Profile Placeholder Skeleton
 */
export const ProfileSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6" aria-busy="true">
    <div className="flex items-center gap-4">
      <div className="skeleton-shimmer w-20 h-20 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="skeleton-shimmer w-48 h-6" />
        <div className="skeleton-shimmer w-32 h-4" />
      </div>
    </div>
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="skeleton-shimmer w-full h-4" />
      <div className="skeleton-shimmer w-3/4 h-4" />
      <div className="skeleton-shimmer w-1/2 h-4" />
    </div>
  </div>
);

/**
 * Branded Page Loader for Route Suspense Fallbacks
 */
export const PageLoader = () => (
  <div className="page-loader-container" aria-busy="true" aria-label="Loading page">
    <div className="page-loader-spinner" />
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading...</p>
  </div>
);

export default {
  CardSkeleton,
  TableSkeleton,
  StatsCardSkeleton,
  ProfileSkeleton,
  PageLoader
};
