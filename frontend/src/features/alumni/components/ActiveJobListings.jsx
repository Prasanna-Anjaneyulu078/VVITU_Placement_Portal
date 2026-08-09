import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Eye } from 'lucide-react';
import { Card, Badge } from '../../../components/common';
import './ActiveJobListings.css';

export default function ActiveJobListings({ jobs, applications }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Active Job Listings"
      headerAction={
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-primary" />
          <span className="alumni-view-all" onClick={() => navigate('/alumni/my-jobs')}>View All</span>
        </div>
      }
      className="alumni-section-card"
      noPadding
    >
      <div className="alumni-job-list">
        {jobs.length > 0 ? (
          jobs.slice(0, 3).map((job) => (
            <div key={job.id} className="alumni-job-item">
              <div className="alumni-job-logo">
                <Briefcase size={20} />
              </div>
              <div className="alumni-job-details">
                <div className="alumni-job-header">
                  <h4 className="alumni-job-title">{job.title}</h4>
                  <Badge variant={job.status}>{job.status}</Badge>
                </div>
                <p className="alumni-job-company">{job.company} • {job.location}</p>
                <div className="alumni-job-meta">
                  <span className="alumni-meta-item">
                    <Users size={14} /> 
                    {applications.filter(app => app.jobId === job.id).length} Applicants
                  </span>
                  <span className="alumni-meta-item">
                    <Eye size={14} /> 
                    {job.views || 0} Views
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="alumni-empty-state">
            No active job listings found.
          </div>
        )}
      </div>
    </Card>
  );
}
