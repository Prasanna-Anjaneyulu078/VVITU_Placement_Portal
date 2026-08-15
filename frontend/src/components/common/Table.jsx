import React from 'react';
import './Table.css';
import Pagination from './Pagination';
import { TableLoader } from './loading';

export default function Table({ 
  headers, 
  columns, 
  data = [], 
  renderRow, 
  onRowClick,
  emptyMessage = "No data available",
  pagination,
  isLoading = false
}) {
  const tableHeaders = columns ? columns.map(col => col.header) : headers || [];

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {tableHeaders.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={tableHeaders.length || 1} style={{ padding: 0 }}>
                <TableLoader columns={tableHeaders.length || 4} />
              </td>
            </tr>
          ) : data && data.length > 0 ? (
            data.map((item, rowIndex) => {
              if (renderRow) {
                return renderRow(item, rowIndex);
              }
              
              if (columns) {
                return (
                  <tr 
                    key={item.id || rowIndex} 
                    onClick={() => onRowClick && onRowClick(item)}
                    className={onRowClick ? 'clickable-row' : ''}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={col.className || ''}>
                        {col.render ? col.render(item) : item[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              }
              
              return null;
            })
          ) : (
            <tr>
              <td colSpan={tableHeaders.length || 1} className="table-empty-cell">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {pagination && !isLoading && (
        <div className="table-pagination-wrapper">
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel={pagination.itemLabel}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
          />
        </div>
      )}
    </div>
  );
}
