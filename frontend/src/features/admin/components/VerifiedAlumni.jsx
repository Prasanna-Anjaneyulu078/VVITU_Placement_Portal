import React from 'react';
import { GraduationCap } from 'lucide-react';
import { Card, Avatar } from '../../../components/common';
import './VerifiedAlumni.css';

export default function VerifiedAlumni({ alumni }) {
  return (
    <Card 
      title="Verified Alumni"
      headerAction={<GraduationCap size={20} className="text-primary" />}
      className="admin-section-card"
      noPadding
    >
      <div className="job-list">
        {alumni.slice(0, 5).map(person => (
          <div key={person.id} className="admin-job-item admin-job-item-padded">
            <Avatar size="md" src={`https://i.pravatar.cc/150?u=${person.id}`} alt={person.name} />
            <div className="job-details">
              <h4 className="admin-job-title-sm">{person.name}</h4>
              <p className="admin-job-company-sm">{person.dept} • {person.gradYear}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
