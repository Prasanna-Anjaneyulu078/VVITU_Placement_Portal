import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Edit2 } from 'lucide-react';
import { Card, Button } from '../../../components/common';
import './RecentJobs.css';

export default function RecentJobs({ jobs, onEdit }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Recent Jobs"
      headerAction={<Briefcase size={20} className="text-primary" />}
      className="admin-section-card"
      noPadding
    >
      <div className="job-list">
        {jobs.slice(0, 3).map(job => (
          <div key={job.id} className="admin-job-item">
            <div className="job-details">
              <h4 className="job-title">{job.title}</h4>
              <p className="job-company">{job.company} • {job.status}</p>
            </div>
            <div className="admin-action-icons">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(job)}
              >
                <Edit2 size={14} />
              </Button>
              <span 
                className="admin-review-link" 
                onClick={() => navigate('/admin/jobs')}
              >
                Review
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
