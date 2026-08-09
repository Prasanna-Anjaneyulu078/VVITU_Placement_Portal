import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, Table } from '../../components/common';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        // Sort descending by timestamp
        const sortedLogs = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sortedLogs);
      } catch (err) {
        console.error('Failed to load audit logs', err);
        toast.error('Failed to load audit logs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'Timestamp',
      render: (log) => (
        <span className="text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
      )
    },
    {
      header: 'Action',
      render: (log) => (
        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs tracking-wider">
          {log.action}
        </span>
      )
    },
    {
      header: 'User (Admin)',
      render: (log) => (
        <span className="text-gray-700">{log.performedBy ? log.performedBy.name : 'System'}</span>
      )
    },
    { header: 'Remarks / Details', accessor: 'details', className: 'text-gray-600' }
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Audit Logs" 
        subtitle="Track administrative actions and system events." 
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        {logs.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <Table 
              columns={columns}
              data={currentLogs}
              isLoading={isLoading}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: setCurrentPage
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
