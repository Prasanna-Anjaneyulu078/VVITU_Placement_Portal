import React from 'react';
import { Briefcase, FileText, CheckCircle } from 'lucide-react';
import { StatsCard } from '../../../components/common';

export default function StudentStats({ jobsCount, applicationsCount, shortlistedCount }) {
  return (
    <div className="stats-grid mb-8">
      <StatsCard 
        label="Available Jobs" 
        value={jobsCount} 
        icon={Briefcase} 
        variant="primary"
      />
      <StatsCard 
        label="My Applications" 
        value={applicationsCount} 
        icon={FileText} 
      />
      <StatsCard 
        label="Shortlisted" 
        value={shortlistedCount} 
        icon={CheckCircle} 
        variant="success"
      />
    </div>
  );
}
