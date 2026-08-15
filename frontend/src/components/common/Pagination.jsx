import React from 'react';
import './Pagination.css';

/**
 * Shared Compact Enterprise Pagination Component
 * Spec:
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                                                                              │
 * │  21–30 of 47 alumni                                      ‹    3    ›         │
 * │                                                                              │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  totalItems,
  pageSize = 10,
  itemLabel = 'items'
}) {
  const page = Number(currentPage) || 1;
  const total = Number(totalPages) || 1;

  const items = (totalItems !== undefined && totalItems !== null)
    ? Number(totalItems)
    : (total * pageSize);

  if (items <= 0 && total <= 0) {
    return null;
  }

  const canGoPrevious = hasPreviousPage !== undefined ? hasPreviousPage : page > 1;
  const canGoNext = hasNextPage !== undefined ? hasNextPage : page < total;

  const startItem = items === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, items);

  return (
    <div className="pagination-footer">
      <span className="pagination-range">
        {startItem}–{endItem} of {items} {itemLabel}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          disabled={!canGoPrevious}
          onClick={() => canGoPrevious && onPageChange && onPageChange(page - 1)}
          aria-label="Previous Page"
          title="Previous Page"
        >
          ‹
        </button>

        <span className="pagination-button pagination-current" aria-current="page">
          {page}
        </span>

        <button
          type="button"
          className="pagination-button"
          disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange && onPageChange(page + 1)}
          aria-label="Next Page"
          title="Next Page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

