import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { X, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { PageHeader, Table, Modal, Button, LoadingSpinner } from '../../components/common';
import { TableLoader } from '../../components/common/loading';
import { getImageUrl } from '../../utils/imageUrl';
import api from '../../utils/axiosConfig';

export default function StudentApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter') || '';

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState(initialFilter);
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('');

  useEffect(() => {
    const filter = new URLSearchParams(location.search).get('filter');
    if (filter) {
      setAppStatusFilter(filter);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications/my');
        // Map backend response to match table requirements
        const mappedApps = res.data.map(app => {
          const comp = app.company || app.companyName || app.job?.company || app.job?.companyName || 'Company';
          const role = app.role || app.jobTitle || app.title || app.job?.title || app.job?.jobTitle || 'Job Role';
          return {
            id: app.id,
            company: comp,
            role: role,
            date: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
            status: app.status,
            interviewStatus: app.interviewStatus || 'N/A',
            jobDetails: app.job || {
              title: role,
              company: comp,
              companyName: comp,
              location: app.location,
              salary: app.salaryPackage
            }
          };
        });
        setApplications(mappedApps);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SHORTLISTED': return 'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold bg-green-100 text-green-700';
      case 'APPLIED': return 'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold bg-blue-100 text-blue-700';
      case 'REJECTED': return 'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold bg-red-100 text-red-700';
      case 'SELECTED': return 'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700';
      default: return 'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold bg-gray-100 text-gray-700';
    }
  };

  const handleViewDetails = (app) => {
    navigate(`/student/applications/${app.id}`);
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = !searchTerm || app.company.toLowerCase().includes(searchTerm.toLowerCase()) || app.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAppStatus = !appStatusFilter || appStatusFilter === 'ALL' || app.status === appStatusFilter;
    const matchesInterviewStatus = !interviewStatusFilter || app.interviewStatus === interviewStatusFilter;
    return matchesSearch && matchesAppStatus && matchesInterviewStatus;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setAppStatusFilter('');
    setInterviewStatusFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || appStatusFilter || interviewStatusFilter);

  const stats = {
    applied: applications.length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    selected: applications.filter(a => a.status === 'SELECTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length
  };

  const columns = [
    { header: 'Company', accessor: 'company', className: 'font-semibold text-gray-900' },
    { header: 'Role', accessor: 'role', className: 'text-gray-600' },
    { header: 'Date Applied', accessor: 'date', className: 'text-gray-500' },
    {
      header: 'Status',
      render: (app) => (
        <span className={getStatusBadge(app.status)}>{app.status}</span>
      )
    },
    {
      header: 'Actions',
      render: (app) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(app);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader 
        title="My Applications" 
        subtitle="Track the status of your job applications." 
      />

      <div className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${!appStatusFilter || appStatusFilter === 'ALL' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100    '}`} onClick={() => setAppStatusFilter('ALL')}>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Applied</p>
            <p className="text-2xl font-bold text-gray-900">{stats.applied}</p>
          </div>
          <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${appStatusFilter === 'SHORTLISTED' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100    '}`} onClick={() => setAppStatusFilter('SHORTLISTED')}>
            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Shortlisted</p>
            <p className="text-2xl font-bold text-green-700">{stats.shortlisted}</p>
          </div>
          <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${appStatusFilter === 'SELECTED' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100    '}`} onClick={() => setAppStatusFilter('SELECTED')}>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Selected</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.selected}</p>
          </div>
          <div className={`p-4 rounded-xl border cursor-pointer transition-colors ${appStatusFilter === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100    '}`} onClick={() => setAppStatusFilter('REJECTED')}>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        {isLoading ? (
          <TableLoader columns={4} rows={5} />
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Applications Found</h3>
            <p className="text-gray-500">You don't have any applications matching the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table 
              columns={columns}
              data={filteredApps}
              onRowClick={handleViewDetails}
            />
          </div>
        )}
      </div>
      </div>

      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
          </div>
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              {selectedApp.jobDetails?.logo ? (
                <img src={getImageUrl(selectedApp.jobDetails.logo)} alt={`${selectedApp.company} logo`} className="w-16 h-16 rounded-xl object-contain border border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedApp.company?.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedApp.role}</h2>
                    <p className="text-gray-500">{selectedApp.company}</p>
                  </div>
                  <span className={getStatusBadge(selectedApp.status)}>{selectedApp.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Applied On</p>
                <p className="font-bold text-gray-900">{selectedApp.date}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">App ID</p>
                <p className="font-bold text-gray-900">#{selectedApp.id.toString().padStart(6, '0')}</p>
              </div>
              {selectedApp.jobDetails && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" /> {selectedApp.jobDetails.location}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Salary</p>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-400" /> {selectedApp.jobDetails.salary}
                    </p>
                  </div>
                </>
              )}
            </div>

            {selectedApp.jobDetails && (
              <>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Job Description</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedApp.jobDetails.description}</p>
                </div>
                
                {selectedApp.jobDetails.tags && selectedApp.jobDetails.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.jobDetails.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
