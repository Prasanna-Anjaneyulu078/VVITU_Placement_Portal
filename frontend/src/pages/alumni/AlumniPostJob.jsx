import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/common';
import ImageUploadInput from '../../components/common/ImageUploadInput';
import api from '../../utils/axiosConfig';
import { Briefcase, DollarSign, HelpCircle, CheckCircle2, X, Check, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const SkillsTagInput = ({ tags, setTags, error, setError }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setError('Duplicate skills are not allowed.');
      return;
    }
    
    setTags([...tags, trimmed]);
    setInput('');
    setError('');
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span>Required Skills <span className="text-red-500">*</span></span>
        {tags.length > 0 && <span className="text-slate-500 font-medium normal-case">{tags.length} added</span>}
      </label>
      <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-[#F47C20] focus-within:ring-1 focus-within:ring-[#F47C20] transition-all min-h-[50px]">
        {tags.map((tag, index) => (
          <span 
            key={index} 
            className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-[#F47C20]/10 border border-[#F47C20]/30 text-[#F47C20] rounded-full text-xs font-bold uppercase tracking-wider"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(index)}
              className="text-[#F47C20] hover:text-[#d46510] focus:outline-none rounded-full"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input 
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
          className="flex-1 bg-transparent min-w-[120px] text-sm font-semibold text-slate-800 focus:outline-none h-7"
        />
      </div>
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
};

const AVAILABLE_DEPARTMENTS = [
  { code: 'CSE',   name: 'Computer Science and Engineering (CSE)' },
  { code: 'IT',    name: 'Information Technology (IT)' },
  { code: 'AIML',  name: 'Artificial Intelligence and Machine Learning (AIML)' },
  { code: 'CSM',   name: 'Computer Science and Engineering (Artificial Intelligence & Machine Learning) (CSM)' },
  { code: 'AIDS',  name: 'Artificial Intelligence and Data Science (AIDS)' },
  { code: 'CSO',   name: 'Computer Science and Engineering (Internet of Things) (CSO)' },
  { code: 'CIC',   name: 'Computer Science and Information Technology (CIC)' },
  { code: 'ECE',   name: 'Electronics and Communication Engineering (ECE)' },
  { code: 'EEE',   name: 'Electrical and Electronics Engineering (EEE)' },
  { code: 'CIVIL', name: 'Civil Engineering (CIVIL)' },
  { code: 'MECH',  name: 'Mechanical Engineering (MECH)' }
];

const DEPT_COLOR_MAP = {
  CSE:   { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     dot: 'bg-blue-500' },
  IT:    { bg: 'bg-purple-50',   text: 'text-purple-700',   border: 'border-purple-200',   dot: 'bg-purple-500' },
  AIML:  { bg: 'bg-fuchsia-50',  text: 'text-fuchsia-700',  border: 'border-fuchsia-200',  dot: 'bg-fuchsia-500' },
  CSM:   { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-200',     dot: 'bg-teal-500' },
  AIDS:  { bg: 'bg-indigo-50',   text: 'text-indigo-700',   border: 'border-indigo-200',   dot: 'bg-indigo-500' },
  CSO:   { bg: 'bg-cyan-50',     text: 'text-cyan-700',     border: 'border-cyan-200',     dot: 'bg-cyan-500' },
  CIC:   { bg: 'bg-pink-50',     text: 'text-pink-700',     border: 'border-pink-200',     dot: 'bg-pink-500' },
  ECE:   { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  dot: 'bg-emerald-500' },
  EEE:   { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    dot: 'bg-amber-500' },
  CIVIL: { bg: 'bg-stone-50',    text: 'text-stone-700',    border: 'border-stone-200',    dot: 'bg-stone-500' },
  MECH:  { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200',     dot: 'bg-rose-500' }
};

export default function AlumniPostJob({ role = 'alumni' }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiredSkillsList, setRequiredSkillsList] = useState([]);
  const [skillsError, setSkillsError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    packageDetails: '',
    experienceRequired: '',
    applicationLink: '',
    description: '',
    requiredSkills: '',
    expiryDate: '',
    minCgpa: '',
    eligibleSemester: '',
    maxBacklogs: '',
    eligibleDepartments: [],
    industry: '',
    companySize: '',
    openings: '',
    enableScreening: false,
    useDefaultScreening: true
  });
  const [logoFile, setLogoFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiredSkillsList.length === 0) {
      setSkillsError('Please add at least one required skill.');
      toast.error('Please add at least one required skill.');
      return;
    }

    const depts = Array.isArray(formData.eligibleDepartments)
      ? formData.eligibleDepartments
      : (formData.eligibleDepartments || '').split(',').map(s => s.trim()).filter(Boolean);

    if (depts.length === 0) {
      toast.error('Please select at least one eligible department.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'eligibleDepartments') {
          postData.append('eligibleDepartments', depts.join(', '));
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          postData.append(key, formData[key]);
        }
      });
      postData.append('requiredSkillsList', JSON.stringify(requiredSkillsList));
      postData.append('requiredSkills', requiredSkillsList.join(', '));
      if (logoFile) {
        postData.append('companyLogo', logoFile);
      }

      await api.post('/jobs/post', postData);
      
      const isAlumni = role === 'alumni';
      toast.success(isAlumni ? 'Job posted successfully! Pending admin approval.' : 'Job posted successfully!');
      setTimeout(() => {
        navigate(isAlumni ? '/alumni/my-jobs' : '/admin/jobs');
      }, 1500);
      
    } catch (err) {
      console.error('Failed to post job', err);
      toast.error('Failed to post job: ' + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader 
        title="Post a New Job" 
        subtitle={role === 'alumni' ? "Share opportunities with students from your alma mater." : "Publish new job opportunities for students."} 
      />

      <div className="max-w-5xl mx-auto mt-8 pb-16">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          {/* Section 1: Job Details */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 lg:p-10 transition-all hover:shadow-sm">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-5 border-b border-slate-100 uppercase tracking-wider mb-6">
              <Briefcase size={22} />
              Job Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Title <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="title"
                  placeholder="e.g. Software Engineer" 
                  value={formData.title}
                  required
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="company"
                  placeholder="e.g. Google / Microsoft" 
                  value={formData.company}
                  required
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Work Location <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="location"
                  placeholder="e.g. Bengaluru, India / Remote" 
                  value={formData.location}
                  required
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Type <span className="text-red-500">*</span></label>
                <select 
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Industry</label>
                <input 
                  type="text"
                  name="industry"
                  placeholder="e.g. Information Technology" 
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company Size</label>
                <input 
                  type="text"
                  name="companySize"
                  placeholder="e.g. 500-1000 employees" 
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Openings</label>
                <input 
                  type="number"
                  name="openings"
                  placeholder="e.g. 5" 
                  value={formData.openings}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Description <span className="text-red-500">*</span></label>
              <textarea 
                name="description"
                rows={5}
                placeholder="Detailed job description, responsibilities, and requirements..." 
                value={formData.description}
                required
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <ImageUploadInput
                label="Company Logo"
                sublabel="PNG, JPG, JPEG, WEBP • Max 5 MB"
                file={logoFile}
                onFileSelect={(f) => setLogoFile(f)}
                onFileRemove={() => setLogoFile(null)}
              />
            </div>
          </div>
          {/* Section 2: Requirements & Eligibility */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 lg:p-10 transition-all hover:shadow-sm">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-5 border-b border-slate-100 uppercase tracking-wider mb-6">
              <DollarSign size={22} />
              Requirements & Eligibility Criteria
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Package / Salary <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="packageDetails"
                  placeholder="e.g. 10 LPA" 
                  value={formData.packageDetails}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Experience Required <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="experienceRequired"
                  placeholder="e.g. 0-2 Years" 
                  value={formData.experienceRequired}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Application Deadline <span className="text-red-500">*</span></label>
                <input 
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <SkillsTagInput 
                tags={requiredSkillsList} 
                setTags={setRequiredSkillsList} 
                error={skillsError} 
                setError={setSkillsError} 
              />
            </div>

            {/* BRANCH & ELIGIBILITY CRITERIA SECTION */}
            <div className="space-y-5 pt-8 mt-8 border-t border-slate-100">
              <div className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  Branch &amp; Eligibility Criteria
                </h4>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, eligibleDepartments: AVAILABLE_DEPARTMENTS.map(d => d.code) }))}
                    className="text-[#F47C20] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, eligibleDepartments: [] }))}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Eligible Departments / Branches <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-slate-500">
                    {(Array.isArray(formData.eligibleDepartments) ? formData.eligibleDepartments : (formData.eligibleDepartments || '').split(',').map(s => s.trim()).filter(Boolean)).length} Selected
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Select the engineering branches eligible to apply for this job position.
                </p>

                {/* SELECTED DEPARTMENTS CHIPS SUMMARY BOX */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[54px] flex flex-wrap items-center gap-2 transition-all">
                  {(() => {
                    const selectedDepts = Array.isArray(formData.eligibleDepartments)
                      ? formData.eligibleDepartments
                      : (formData.eligibleDepartments || '').split(',').map(s => s.trim()).filter(Boolean);

                    if (selectedDepts.length === 0) {
                      return (
                        <span className="text-xs text-slate-400 font-medium italic">
                          No departments selected. Click on the options below to add eligible branches.
                        </span>
                      );
                    }

                    return selectedDepts.map(code => {
                      const color = DEPT_COLOR_MAP[code] || { bg: 'bg-orange-50', text: 'text-[#F47C20]', border: 'border-orange-200', dot: 'bg-[#F47C20]' };
                      const deptObj = AVAILABLE_DEPARTMENTS.find(d => d.code === code);
                      return (
                        <span
                          key={code}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${color.bg} ${color.text} ${color.border}`}
                          title={deptObj ? deptObj.name : code}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedDepts.filter(c => c !== code);
                              setFormData(prev => ({ ...prev, eligibleDepartments: updated }));
                            }}
                            className="p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
                            aria-label={`Remove ${code}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    });
                  })()}
                </div>

                {/* DEPARTMENTS SELECTION PILLS */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_DEPARTMENTS.map(dept => {
                    const selectedDepts = Array.isArray(formData.eligibleDepartments)
                      ? formData.eligibleDepartments
                      : (formData.eligibleDepartments || '').split(',').map(s => s.trim()).filter(Boolean);
                    const isSelected = selectedDepts.includes(dept.code);
                    const color = DEPT_COLOR_MAP[dept.code] || { bg: 'bg-orange-50', text: 'text-[#F47C20]', border: 'border-orange-200' };

                    return (
                      <button
                        key={dept.code}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? selectedDepts.filter(c => c !== dept.code)
                            : [...selectedDepts, dept.code];
                          setFormData(prev => ({ ...prev, eligibleDepartments: updated }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? `${color.bg} ${color.text} ${color.border} border ring-1 ring-[#F47C20]/20`
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? <Check size={14} className="text-[#F47C20]" /> : <Plus size={14} className="text-slate-400" />}
                        <span>{dept.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Minimum CGPA Required</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="minCgpa"
                    placeholder="e.g. 7.5" 
                    value={formData.minCgpa}
                    onChange={handleChange}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eligible Semester / Batch</label>
                  <input 
                    type="text"
                    name="eligibleSemester"
                    placeholder="e.g. Semester 7 and above" 
                    value={formData.eligibleSemester}
                    onChange={handleChange}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Backlogs Allowed</label>
                  <input 
                    type="number"
                    min="0"
                    name="maxBacklogs"
                    placeholder="e.g. 0" 
                    value={formData.maxBacklogs}
                    onChange={handleChange}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pre-Application Screening */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 lg:p-10 transition-all hover:shadow-sm">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-5 border-b border-slate-100 uppercase tracking-wider mb-6">
              <HelpCircle size={22} />
              Pre-Application Screening
            </h3>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">Enable Screening Questions</p>
                  <p className="text-xs text-slate-500 font-medium">Require applicants to answer 5 mandatory screening questions before applying.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    name="enableScreening"
                    checked={formData.enableScreening}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F47C20]"></div>
                </label>
              </div>

              {formData.enableScreening && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 size={16} className="text-[#F47C20]" />
                    <span>Default Screening Questionnaire Active (5 Mandatory Questions)</span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs text-slate-500 font-medium">
                    <p>1. Joining Availability (Immediate after graduation)</p>
                    <p>2. Willingness to Relocate based on business requirements</p>
                    <p>3. Preferred Work Location (Bengaluru, Hyderabad, Chennai, Pune, Remote, Any)</p>
                    <p>4. Service Agreement / Bond Acceptance</p>
                    <p>5. Applicant Accuracy & Authenticity Declaration</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8 pt-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-extrabold transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-10 py-3.5 bg-transparent border-2 border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#F47C20]/50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </button>
          </div>
          
        </form>
      </div>
    </DashboardLayout>
  );
}
