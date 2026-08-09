import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { JobCard, LoadingSpinner } from '../../../components/common';
import { getRecommendedJobs } from '../../../utils/eligibilityApi';

/**
 * RecommendedJobs
 * Shows jobs recommended for the student, ranked by match score from the
 * backend Eligibility Engine (/api/eligibility/recommendations).
 *
 * Props:
 *  - limit: number of recommendations to fetch (default 6)
 *  - onSelect: callback(job) when a card is opened
 */
export default function RecommendedJobs({ limit = 6, onSelect }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await getRecommendedJobs(limit);
        if (mounted) setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError('Could not load recommendations');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error || jobs.length === 0) {
    return null; // Silently hide the section when nothing to recommend
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-[#F47C20]" />
        <h2 className="text-[17px] font-semibold text-gray-900">Recommended For You</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onSelect={onSelect} role="student" />
        ))}
      </div>
    </div>
  );
}