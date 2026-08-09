import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Card, Avatar, Badge } from '../../../components/common';
import './RecentJobs.css';

export default function RecentJobs({ jobs }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Latest Eligible Jobs"
      headerAction={
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-primary" />
          <span className="view-all-link" onClick={() => navigate('/student/jobs')}>See All</span>
        </div>
      }
      className="section-card"
      noPadding
    >
      <div className="job-list">
        {jobs.map(job => (
          <div key={job.id} className="job-item" onClick={() => navigate('/student/jobs')}>
            <Avatar size="sm" src={job.logo} alt={job.company} />
            <div className="job-details">
              <h4 className="job-title">{job.title}</h4>
              <p className="job-company">{job.company}</p>
              <div className="job-meta">
                <Badge variant="interviewing">{job.type}</Badge>
                <span className="job-time">Posted {job.posted}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
