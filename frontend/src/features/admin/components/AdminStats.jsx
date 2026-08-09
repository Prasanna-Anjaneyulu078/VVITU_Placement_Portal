import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, AlertCircle, Briefcase } from 'lucide-react';
import { StatsCard } from '../../../components/common';
import './AdminStats.css';

export default function AdminStats({ studentCount, alumniCount, pendingCount, activeJobsCount }) {
  const navigate = useNavigate();

  return (
    <div className="admin-stats-grid mb-8">
      <div onClick={() => {}}>
        <StatsCard 
          label="Total Students" 
          value={studentCount} 
          icon={Users}
        />
      </div>
      <div onClick={() => navigate('/admin/alumni')} className="cursor-pointer">
        <StatsCard 
          label="Total Alumni" 
          value={alumniCount} 
          icon={GraduationCap}
        />
      </div>
      <div onClick={() => navigate('/admin/verifications')} className="cursor-pointer">
        <StatsCard 
          label="Pending Verifications" 
          value={pendingCount} 
          variant="warning"
          icon={AlertCircle}
        />
      </div>
      <div onClick={() => navigate('/admin/jobs')} className="cursor-pointer">
        <StatsCard 
          label="Active Jobs" 
          value={activeJobsCount} 
          variant="primary"
          icon={Briefcase}
        />
      </div>
    </div>
  );
}
