import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { PageHeader, Button, LoadingSpinner, Badge, EligibilityBadge, PreApplicationScreeningModal } from '../components/common';
import { MapPin, DollarSign, Users, Briefcase, Calendar, Award, ExternalLink, MessageSquare, Building2, Globe, Linkedin, CheckCircle, ChevronRight, XCircle, ChevronLeft, Info, Hourglass, CheckCircle2, Circle, X, AlertCircle, Lock } from 'lucide-react';
import api from '../utils/axiosConfig';
import { getImageUrl } from '../utils/imageUrl';
import { toast } from 'react-toastify';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null); // 'NOT_FOUND', 'ACCESS_DENIED', 'SERVER_ERROR'
  const [activeTab, setActiveTab] = useState('details'); // details, eligibility, skills, company, messages
  
  const role = localStorage.getItem('role')?.toLowerCase() || 'student';
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [profile, setProfile] = useState(null);

  // Screening State
  const [showScreening, setShowScreening] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState({
    JOINING_AVAILABILITY: '',
    RELOCATION: '',
    PREFERRED_LOCATION: '',
    SERVICE_BOND: '',
    DECLARATION: ''
  });
  const [isApplying, setIsApplying] = useState(false);



  useEffect(() => {
    fetchJobDetails();
    if (role === 'student') {
      fetchStudentData();
    }
  }, [id, role]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let endpoint = `/jobs/${id}`;
      if (role === 'student') {
        endpoint = `/student/jobs/${id}`;
      }

      const res = await api.get(endpoint);
      const data = res.data;
      setJob(data);

      if (data.hasApplied || data.applicationStatus) {
        setHasApplied(true);
        if (data.applicationStatus) {
          setApplicationStatus(data.applicationStatus);
        }
      }
    } catch (err) {
      console.error('Error loading job details:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : '');

      if (status === 404 || msg.toLowerCase().includes('not found')) {
        setFetchError('NOT_FOUND');
      } else if (status === 403 || msg.toLowerCase().includes('not eligible') || msg.toLowerCase().includes('permission')) {
        setFetchError('ACCESS_DENIED');
      } else {
        setFetchError('SERVER_ERROR');
        toast.error(msg || 'Failed to load job details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      const [profileRes, appliedRes] = await Promise.all([
        api.get('/student/profile').catch(() => ({ data: null })),
        api.get('/student/jobs/applied').catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      
      const applied = appliedRes.data.find(app => app.jobId?.toString() === id || app.id?.toString() === id);
      if (applied) {
        setHasApplied(true);
        setApplicationStatus(applied.status);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const handleApplyClick = () => {
    if (job.applicationLink) {
      window.open(job.applicationLink, '_blank');
      return;
    }
    setShowScreening(true);
  };

  const handleApplySubmit = async (answers = []) => {
    setIsApplying(true);
    try {
      const payload = { screeningAnswers: answers };
      await api.post(`/student/jobs/${job.id}/apply`, payload);
      toast.success('Application submitted successfully');
      setHasApplied(true);
      setApplicationStatus('APPLIED');
      setShowScreening(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const submitScreening = (e) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(screeningAnswers).map(([key, value]) => ({
      questionKey: key,
      answer: value
    }));
    handleApplySubmit(formattedAnswers);
  };

  const updateJobStatus = async (status) => {
    try {
      await api.post(`/admin/jobs/moderate/${job.id}`, {
        approved: status === 'ACTIVE',
        rejectionReason: status === 'REJECTED' ? 'Not meeting criteria' : ''
      });
      toast.success(`Job marked as ${status}`);
      setJob({ ...job, status });
    } catch (err) {
      console.error('Failed to update job status', err);
      toast.error('Failed to update job status');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError === 'NOT_FOUND') {
    return (
      <DashboardLayout role={role}>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            The job posting you are looking for does not exist or may have been removed.
          </p>
          <button
            onClick={() => navigate(`/${role}/jobs`)}
            className="px-6 py-2.5 bg-[#F47C20] text-white font-bold rounded-xl transition-colors"
          >
            Back to Job Board
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError === 'ACCESS_DENIED') {
    return (
      <DashboardLayout role={role}>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="w-20 h-20 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            You do not have permission or meet the eligibility criteria to view this job posting.
          </p>
          <button
            onClick={() => navigate(`/${role}/jobs`)}
            className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Back to Job Board
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError === 'SERVER_ERROR') {
    return (
      <DashboardLayout role={role}>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw size={36} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Job Details</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Something went wrong while fetching the job information. Please try again.
          </p>
          <button
            onClick={fetchJobDetails}
            className="px-6 py-2.5 bg-[#F47C20] text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout role={role}>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  // Backend now guarantees job is eligible (filtered at source). Just use job data.
  const skillMatchPercentage = job?.skillMatchPercentage ?? 100;
  const matchedSkills = Array.isArray(job?.matchedSkills) ? job.matchedSkills : [];
  const missingSkills = Array.isArray(job?.missingSkills) ? job.missingSkills : [];
  const logoInitial = job.company ? job.company.charAt(0).toUpperCase() : 'C';
  const isClosedOrExpired = job && (job.status === 'CLOSED' || job.status === 'EXPIRED');
  const isOpenJob = job && (job.status === 'APPROVED' || job.status === 'ACTIVE' || job.status === 'OPEN') && !isClosedOrExpired;
  const tabs = [
    { id: 'details', label: 'Job Details' },
    { id: 'eligibility', label: 'Eligibility' },
    { id: 'skills', label: 'Skills Required' },
    { id: 'company', label: 'Company Information' },
    { id: 'messages', label: 'Messages' }
  ];

  return (
    <DashboardLayout role={role}>
      <div className="max-w-6xl mx-auto pb-12 bg-white min-h-screen px-4 md:px-8 pt-6">
        
        {/* Closed / Expired Info Banner */}
        {(job.status === 'CLOSED' || job.status === 'EXPIRED') && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                This job is closed for new applications.
              </p>
              {hasApplied ? (
                <p className="text-xs text-amber-700 mt-0.5 font-medium">
                  You have already applied and can still view its details.
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-0.5">
                  The application deadline has passed for this opportunity.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <button 
              onClick={() => navigate(`/${role}/jobs`)} 
              className="mb-6 text-gray-800   transition-colors flex items-center"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <p className="text-[14px] font-medium text-gray-600 mb-1.5">{job.company}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-[22px] font-semibold text-gray-900 leading-tight">{job.title}</h1>
              {hasApplied && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9C4] text-[#F57F17] text-[11px] font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F57F17]"></div>
                  Applied
                  <Info size={14} className="text-gray-400 cursor-pointer ml-0.5" />
                </span>
              )}
            </div>
          </div>
          <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl p-1 flex items-center justify-center shrink-0 ml-4 overflow-hidden">
            {getImageUrl(job.companyLogoUrl || job.imageUrl) ? (
              <img
                src={getImageUrl(job.companyLogoUrl || job.imageUrl)}
                alt={job.company || job.companyName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <span
              className="text-2xl font-bold text-[#F47C20]"
              style={{ display: getImageUrl(job.companyLogoUrl || job.imageUrl) ? 'none' : 'block' }}
            >
              {logoInitial}
            </span>
          </div>
        </div>

        {/* Metrics Box */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#F47C20]">
              <DollarSign size={14} />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Stipend</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{job.packageDetails || 'Not Disclosed'}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#F47C20]">
              <Users size={14} />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Openings</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{job.openings || 'Multiple'}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#F47C20]">
              <Briefcase size={14} />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Job Type</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{job.jobType || 'Full-time'}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#F47C20]">
              <Hourglass size={14} />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Apply By</span>
            </div>
            <p className="text-sm font-medium text-gray-800">
              {job.expiryDate ? new Date(job.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) + ', 04:00 PM' : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('details')} 
            className={`pb-3 font-semibold text-[15px] transition-colors relative ${activeTab === 'details' ? 'text-[#F47C20]' : 'text-gray-500  '}`}
          >
            Job Details
            {activeTab === 'details' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#F47C20]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('messages')} 
            className={`pb-3 font-semibold text-[15px] transition-colors relative ${activeTab === 'messages' ? 'text-[#F47C20]' : 'text-gray-500  '}`}
          >
            Messages
            {activeTab === 'messages' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#F47C20]"></div>}
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Content Area (Job Details) */}
          <div className="lg:col-span-2">
            {activeTab === 'details' && (
              <>
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col mb-8">
                <div className="p-6 md:p-8 flex flex-col gap-10">
                  
                  {/* Eligibility Criteria */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4 text-gray-800">
                      <CheckCircle2 size={20} className="text-gray-400" />
                      <h3 className="text-base font-semibold">Eligibility Criteria</h3>
                    </div>
                    <ul className="list-disc pl-9 space-y-2 text-[14px] text-gray-600">
                      <li><span className="font-medium text-gray-700">Minimum CGPA:</span> {job.minCgpa ? `${job.minCgpa}` : 'Not strictly specified. Standard requirements apply.'}</li>
                      <li><span className="font-medium text-gray-700">Year of graduation:</span> {job.eligibleSemester ? `Semester ${job.eligibleSemester} and above` : 'Final year students preferred.'}</li>
                      <li><span className="font-medium text-gray-700">Backlogs:</span> {job.maxBacklogs != null ? `Maximum ${job.maxBacklogs} active backlogs allowed.` : 'No active backlogs preferred.'}</li>
                      <li><span className="font-medium text-gray-700">Experience:</span> {job.experienceRequired || 'Entry Level / Fresher'}</li>
                    </ul>
                  </div>

                  {/* Location */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4 text-gray-800">
                      <MapPin size={20} className="text-gray-400" />
                      <h3 className="text-base font-semibold">Job Location</h3>
                    </div>
                    <ul className="list-disc pl-9 text-[14px] text-gray-600">
                      <li>{job.location || 'Remote'}</li>
                    </ul>
                  </div>

                  {/* Skills Required with Match Summary */}
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3 mb-4 text-gray-800">
                      <div className="flex items-center gap-3">
                        <Award size={20} className="text-gray-400" />
                        <h3 className="text-base font-semibold">Skills Required</h3>
                      </div>
                      {job.requiredSkills && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          skillMatchPercentage >= 75 ? 'bg-green-100 text-green-700' :
                          skillMatchPercentage >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {skillMatchPercentage}% Skill Match
                        </span>
                      )}
                    </div>

                    {job.requiredSkills ? (
                      <div className="space-y-3">
                        {matchedSkills.length > 0 && (
                          <div>
                            <p className="text-[12px] font-semibold text-green-600 uppercase tracking-wide mb-2">✓ Matched Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {matchedSkills.map((skill, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md text-[12px] font-medium">
                                  <CheckCircle size={12} />{skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {missingSkills.length > 0 && (
                          <div>
                            <p className="text-[12px] font-semibold text-rose-500 uppercase tracking-wide mb-2">✕ Missing Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {missingSkills.map((skill, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-md text-[12px] font-medium">
                                  <XCircle size={12} />{skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {matchedSkills.length === 0 && missingSkills.length === 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(job.requiredSkillsList && job.requiredSkillsList.length > 0
                              ? job.requiredSkillsList
                              : (job.requiredSkills ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [])
                            ).map((skill, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 border border-[#F47C20]/40 text-[#F47C20] rounded-full text-xs font-semibold bg-[#F47C20]/5 uppercase tracking-wide"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul className="list-disc pl-9 space-y-2 text-[14px] text-gray-600">
                        <li>Basic programming and communication skills.</li>
                      </ul>
                    )}
                  </div>

                  {/* Full Description */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4 text-gray-800">
                      <Briefcase size={20} className="text-gray-400" />
                      <h3 className="text-base font-semibold">Detailed Description</h3>
                    </div>
                    <div className="pl-9 text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {job.description || 'No detailed description provided by the recruiter.'}
                    </div>
                  </div>

                </div>
                
                {/* Left decorative border running down */}
                <div className="absolute left-8 top-8 bottom-8 w-px bg-gray-100 -z-10 hidden md:block"></div>
              </div>


              </>
          )}

            {activeTab === 'messages' && (
              <div className="py-12 text-center border border-gray-200 rounded-xl">
                 <MessageSquare size={32} className="text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
                 <p className="text-gray-500 text-sm">Any direct communication with the recruiter will appear here.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar Area */}
          <div className="lg:col-span-1">
            {role === 'student' && hasApplied && (
              <div className="flex flex-col gap-6">
                
                {/* Info Banner */}
                <div className="flex items-center gap-2 text-[13px] text-gray-700 font-medium">
                  <Info size={16} className="text-gray-400" />
                  You have applied for this job
                </div>

                {/* Job Updates Section */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase size={18} className="text-gray-500" />
                    <h3 className="text-base font-semibold text-gray-900">Job Updates</h3>
                  </div>

                  <div className="relative pl-6 space-y-8">
                    {/* Vertical line connecting steps */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200"></div>

                    {/* Step 1: Applied */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#F47C20] flex items-center justify-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#F47C20]"></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">Applied</p>
                        <p className="text-[12px] text-gray-500 mt-1">Application submitted successfully</p>
                      </div>
                    </div>

                    {/* Step 2: Next Update */}
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1">
                         <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-300"></div>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">Expected Date for the Next Update</p>
                        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                          Waiting for the company's response on your job application and will update you soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin / Alumni Actions */}
            {(role === 'admin' || role === 'alumni') && (
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                 <h3 className="text-base font-semibold text-gray-900 mb-4">Management Actions</h3>
                 
                 <div className="flex flex-col gap-3">
                   {role === 'alumni' && (
                     <Button className="w-full justify-center bg-[#F47C20]   text-white rounded-lg h-11" onClick={() => navigate(`/alumni/edit-job/${job.id}`)}>
                       Edit Job Listing
                     </Button>
                   )}
                   
                   {role === 'admin' && job.status === 'PENDING' && (
                     <>
                        <Button className="w-full justify-center bg-green-600   text-white rounded-lg h-11" onClick={() => updateJobStatus('ACTIVE')}>
                          Approve Job
                        </Button>
                        <Button variant="outline" className="w-full justify-center text-red-600 border-red-200   rounded-lg h-11" onClick={() => updateJobStatus('REJECTED')}>
                          Reject Job
                        </Button>
                     </>
                   )}
                   
                   {role === 'student' && !hasApplied && (
                      <Button className="w-full justify-center bg-[#F47C20]   text-white rounded-lg h-11 font-semibold shadow-sm" onClick={handleApplyClick}>
                        Apply Now
                      </Button>
                    )}
                 </div>
              </div>
            )}

            {role === 'student' && !hasApplied && (
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-base font-semibold text-gray-900">Interested in this role?</h3>
                   {job.requiredSkills && (
                     <EligibilityBadge status="ELIGIBLE" matchScore={skillMatchPercentage} />
                   )}
                 </div>

                 {/* Skill match summary */}
                 {(matchedSkills.length > 0 || missingSkills.length > 0) && (
                   <div className="mb-4 space-y-2">
                     {matchedSkills.map((skill, i) => (
                       <div key={i} className="flex items-center gap-2 text-[13px]">
                         <CheckCircle size={14} className="text-green-500 shrink-0" />
                         <span className="text-gray-600">{skill}</span>
                       </div>
                     ))}
                     {missingSkills.map((skill, i) => (
                       <div key={i} className="flex items-center gap-2 text-[13px]">
                         <XCircle size={14} className="text-red-500 shrink-0" />
                         <span className="text-red-600 font-medium">{skill} (missing)</span>
                       </div>
                     ))}
                   </div>
                 )}

                 <Button className="w-full justify-center bg-[#F47C20]   text-white rounded-lg h-11 font-semibold shadow-sm" onClick={handleApplyClick}>
                   Apply Now
                 </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pre-Application Screening Modal */}
        {showScreening && (
          <PreApplicationScreeningModal
            isOpen={showScreening}
            onClose={() => setShowScreening(false)}
            job={job}
            onSuccess={() => {
              setHasApplied(true);
              setApplicationStatus('APPLIED');
              setShowScreening(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
