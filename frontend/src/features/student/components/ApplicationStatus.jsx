import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../../components/common';

export default function ApplicationStatus({ applications }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Application Status" 
      headerAction={<Button variant="ghost" size="sm" onClick={() => navigate('/student/applications')}>History</Button>}
      noPadding
    >
      <div className="job-list">
        {applications.slice(0, 3).map((app) => (
          <div key={app.id} className="job-item">
            <div className="job-details">
              <h4 className="job-title">{app.role}</h4>
              <p className="job-company">{app.company}</p>
            </div>
            <Badge variant={app.status}>{app.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
