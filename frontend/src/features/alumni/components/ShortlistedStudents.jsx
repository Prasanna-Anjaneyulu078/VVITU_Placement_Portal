import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Mail, Briefcase } from 'lucide-react';
import { Card, Avatar, Badge } from '../../../components/common';
import './ShortlistedStudents.css';

export default function ShortlistedStudents({ applicants = [], users = [], jobs = [] }) {
  const navigate = useNavigate();

  // Safely derive applicants if jobs is passed instead
  const displayApplicants = applicants.length > 0 
    ? applicants 
    : jobs.flatMap(j => (j.applications || []).map(a => ({...a, role: j.title || a.role}))).filter(a => a.status === 'SHORTLISTED' || a.status === 'SELECTED');

  return (
    <Card 
      title="Shortlisted Students"
      headerAction={<Star size={20} style={{ color: '#f59e0b' }} />}
      className="alumni-section-card"
      noPadding
    >
      <div className="alumni-job-list">
        {displayApplicants.length > 0 ? (
          displayApplicants.slice(0, 5).map((app) => {
            const student = users.find(u => u.id === app.userId) || app.student || null;
            return (
              <div key={app.id} className="alumni-shortlisted-item">
                <Avatar size="md" src={`https://i.pravatar.cc/150?u=${app.userId}`} alt={student?.name} />
                <div className="alumni-job-details">
                  <div className="alumni-student-header">
                    <h4 className="alumni-student-name">{student ? student.name : `Student ID: ${app.userId}`}</h4>
                    <Badge variant={app.status}>{app.status}</Badge>
                  </div>
                  <p className="alumni-student-details">
                    {student ? `${student.dept} • Class of ${student.gradYear}` : app.role}
                  </p>
                  <div className="alumni-student-meta">
                    <span className="alumni-student-meta-item">
                      <Mail size={12} /> {student?.email?.split('@')[0] || 'Unknown'}...
                    </span>
                    <span className="alumni-student-meta-item">
                      <Briefcase size={12} /> {(app.role || '').split(' ')[0]}...
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="alumni-empty-state">No students shortlisted yet.</p>
        )}
      </div>
      {displayApplicants.length > 0 && (
        <div className="alumni-footer-link">
          <span 
            className="alumni-manage-link"
            onClick={() => navigate('/alumni/my-jobs')}
          >
            Manage Applicants
          </span>
        </div>
      )}
    </Card>
  );
}
