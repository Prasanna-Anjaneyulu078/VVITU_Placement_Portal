import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, X } from 'lucide-react';
import { Card, Avatar, Button } from '../../../components/common';
import './PendingVerifications.css';

export default function PendingVerifications({ pendingAlumni, onVerify }) {
  const navigate = useNavigate();

  return (
    <Card 
      title="Pending Alumni Verifications"
      headerAction={
        <div className="flex items-center gap-2">
          <AlertCircle size={20} className="admin-section-title-icon" />
          <span 
            className="admin-view-all" 
            onClick={() => navigate('/admin/verifications')}
          >
            View All
          </span>
        </div>
      }
      className="admin-section-card"
      noPadding
    >
      <div className="job-list">
        {pendingAlumni.length > 0 ? (
          pendingAlumni.slice(0, 3).map((user) => (
            <div key={user.id} className="admin-job-item">
              <Avatar size="md" src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
              <div className="job-details">
                <h4 className="job-title">{user.name}</h4>
                <p className="job-company">Class of {user.gradYear} • {user.dept}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  icon={Check}
                  onClick={() => onVerify(user.id, 'Verified')}
                >
                  Verify
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  icon={X}
                  className="admin-reject-btn-custom"
                  onClick={() => onVerify(user.id, 'Rejected')}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty-text">No pending verifications.</p>
        )}
      </div>
    </Card>
  );
}
