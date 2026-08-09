import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building, Calendar } from 'lucide-react';
import { Card, LoadingSpinner } from '../../../components/common';
import api from '../../../utils/axiosConfig';

export default function RecentApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications/my');
        // Sort by appliedAt descending if not already, and slice top 5
        const sorted = res.data.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 5);
        setApplications(sorted);
      } catch (err) {
        console.error('Failed to load recent applications', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApps();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SHORTLISTED': return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700';
      case 'SELECTED': return 'px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700';
      case 'APPLIED': return 'px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700';
      case 'REJECTED': return 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700';
      default: return 'px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card 
      title="Recent Applications"
      headerAction={
        <div className="flex items-center gap-2 cursor-pointer text-primary  " onClick={() => navigate('/student/applications')}>
          <FileText size={20} />
          <span className="text-sm font-medium">See All</span>
        </div>
      }
      className="h-full"
    >
      {isLoading ? (
        <div className="flex justify-center p-6"><LoadingSpinner size="medium" /></div>
      ) : applications.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          {applications.map(app => (
            <div key={app.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg border border-gray-100     transition-colors cursor-pointer" onClick={() => navigate('/student/applications')}>
              <div className="flex flex-col">
                <h4 className="font-bold text-gray-900 text-sm">{app.job?.title || 'Unknown Role'}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Building size={12} /> {app.job?.company || 'Unknown Company'}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className={getStatusBadge(app.status)}>{app.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
