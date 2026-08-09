import React from 'react';
import { StatsCard } from '../../../components/common';
import './AlumniStats.css';

export default function AlumniStats({ totalPosted, activeCount, applicantsCount, shortlistedCount }) {
  return (
    <div className="alumni-stats-grid mb-8">
      <StatsCard 
        label="Total Jobs Posted" 
        value={totalPosted} 
      />
      <StatsCard 
        label="Active Listings" 
        value={activeCount} 
        variant="primary"
      />
      <StatsCard 
        label="Total Applicants" 
        value={applicantsCount} 
      />
      <StatsCard 
        label="Shortlisted" 
        value={shortlistedCount} 
        variant="success"
      />
    </div>
  );
}
