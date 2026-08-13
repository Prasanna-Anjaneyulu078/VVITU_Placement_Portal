import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

import { resolveImageUrl, withCacheBust } from '../utils/imageUrl';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Clear legacy base64 data from localStorage to prevent payload bloat
  const initialStorageImage = localStorage.getItem('profileImage') || '';
  let initialImage = resolveImageUrl(initialStorageImage) || '';

  const [profileImage, setProfileImage] = useState(initialImage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userRole = localStorage.getItem('role');
        const token = localStorage.getItem('token');
        if (userRole && token) {
          const jobsRes = await api.get('/jobs/approved').catch(() => ({ data: [] }));
          setJobs(jobsRes.data || []);
          
          if (userRole.toUpperCase() === 'STUDENT') {
            const appsRes = await api.get('/applications/my').catch(() => ({ data: [] }));
            setApplications(appsRes.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const updateProfileImage = (url) => {
    const resolved = resolveImageUrl(url);
    if (!resolved) {
      if (profileImage !== '') {
        setProfileImage('');
        localStorage.removeItem('profileImage');
      }
      return;
    }

    const freshUrl = withCacheBust(resolved);
    if (profileImage === freshUrl) return;

    setProfileImage(freshUrl);
    localStorage.setItem('profileImage', freshUrl);
  };

  const addJob = (job) => {
    const newJob = {
      ...job,
      id: jobs.length + 1,
      posted: new Date().toISOString().split('T')[0],
      status: 'Pending',
      applicants: 0,
      views: 0
    };
    setJobs([newJob, ...jobs]);
  };

  const updateJobStatus = (id, status) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
  };

  const updateJob = (id, updatedJob) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, ...updatedJob } : j));
  };

  const deleteJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const updateApplicationStatus = (id, status) => {
    setApplications(applications.map(a => a.id === id ? { ...a, status } : a));
  };

  const applyToJob = (job) => {
    const exists = applications.find(app => app.jobId === job.id);
    if (exists) return;
    
    const newApp = {
      id: applications.length + 1,
      jobId: job.id,
      company: job.company,
      role: job.title,
      date: new Date().toISOString().split('T')[0],
      status: 'Applied'
    };
    setApplications([newApp, ...applications]);
    setJobs(jobs.map(j => j.id === job.id ? { ...j, applicants: (j.applicants || 0) + 1 } : j));
  };

  const verifyUser = (id, status) => {
    setUsers(users.map(u => u.id === id ? { ...u, status } : u));
  };

  return (
    <DataContext.Provider value={{
      jobs,
      applications,
      users,
      profileImage,
      isLoading,
      addJob,
      updateJobStatus,
      updateJob,
      deleteJob,
      updateApplicationStatus,
      applyToJob,
      verifyUser,
      updateProfileImage
    }}>
      {children}
    </DataContext.Provider>
  );
};
