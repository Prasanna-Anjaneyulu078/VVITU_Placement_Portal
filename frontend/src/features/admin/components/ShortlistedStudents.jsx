import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, Avatar, Badge, Button } from '../../../components/common';
import './ShortlistedStudents.css';

export default function ShortlistedStudents({ applications, users }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Shortlisted Students"
      headerAction={<Star size={20} className="admin-section-title-icon" />}
      className="admin-section-card"
      noPadding
    >
      <div className="job-list">
        {applications.length > 0 ? (
          applications.map((app) => {
            const student = users.find(u => u.id === app.userId);
            return (
              <div key={app.id} className="admin-job-item">
                <Avatar size="md" src={`https://i.pravatar.cc/150?u=${app.userId}`} alt={student?.name} />
                <div className="job-details admin-job-details-flex">
                  <h4 className="job-title">{student ? student.name : `Student ID: ${app.userId}`}</h4>
                  <p className="job-company">{app.role} at {app.company}</p>
                  {student && (
                    <div className="admin-shortlisted-details">
                      <p className="admin-shortlisted-meta">
                        {student.dept} • Class of {student.gradYear}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="admin-view-details-btn"
                        onClick={() => navigate('/admin/shortlisted')}
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
                <Badge variant={app.status}>{app.status}</Badge>
              </div>
            );
          })
        ) : (
          <p className="admin-empty-text">No students shortlisted yet.</p>
        )}
      </div>
    </Card>
  );
}
