import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, LoadingSpinner } from '../../components/common';
import api from '../../utils/axiosConfig';
import ImageUploadInput from '../../components/common/ImageUploadInput';
import { getImageUrl } from '../../utils/imageUrl';
import { Briefcase, DollarSign, HelpCircle, CheckCircle2, X, Check, ArrowLeft, Plus } from 'lucide-react';
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
  { code: 'AIDS', name: 'Artificial Intelligence & Data Science' },
  { code: 'CSE',  name: 'Computer Science & Engineering' },
  { code: 'ECE',  name: 'Electronics & Communication Engineering' },
  { code: 'EEE',  name: 'Electrical & Electronics Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'IT',   name: 'Information Technology' },
  { code: 'CSM',  name: 'CSE (AI & Machine Learning)' },
  { code: 'CSD',  name: 'CSE (Data Science)' }
];

const DEPT_COLOR_MAP = {
  AIDS: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500' },
  CSE:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  ECE:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  EEE:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  MECH: { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  CIVIL:{ bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    dot: 'bg-cyan-500' },
  IT:   { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-500' },
  CSM:  { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-500' },
  CSD:  { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500' }
};

export default function AlumniEditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    openings: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get('/alumni/my-jobs');
        const job = res.data.find(j => j.id.toString() === id);
        if (job) {
          const depts = job.eligibleDepartments || job.eligibleBranches || '';
          const parsedDepts = typeof depts === 'string'
            ? depts.split(',').map(s => s.trim()).filter(Boolean)
            : (Array.isArray(depts) ? depts : []);

          setFormData({
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
            jobType: job.jobType || 'Full-time',
            packageDetails: job.packageDetails || job.salaryPackage || '',
            experienceRequired: job.experienceRequired || '',
            applicationLink: job.applicationLink || '',
            description: job.description || '',
            requiredSkills: job.requiredSkills || '',
            expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().split('T')[0] : (job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : ''),
            minCgpa: job.minCgpa ?? job.requiredCgpa ?? '',
            eligibleSemester: job.eligibleSemester ?? '',
            maxBacklogs: job.maxBacklogs ?? '',
            eligibleDepartments: parsedDepts,
            industry: job.industry || '',
            companySize: job.companySize || '',
            openings: job.openings || ''
          });
          setRequiredSkillsList(job.requiredSkillsList || (job.requiredSkills ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []));
          setCurrentLogo(job.companyLogoUrl);
        } else {
          toast.error('Job not found');
          navigate('/alumni/my-jobs');
        }
      } catch (err) {
        toast.error('Failed to load job');
        navigate('/alumni/my-jobs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const payload = {
        ...formData,
        eligibleDepartments: depts.join(', '),
        requiredSkillsList: requiredSkillsList,
        requiredSkills: requiredSkillsList.join(', ')
      };

      await api.put(`/jobs/${id}`, payload);

      if (logoFile) {
        const logoData = new FormData();
        logoData.append('file', logoFile);
        await api.post(`/jobs/${id}/logo`, logoData, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      
      toast.success('Job updated successfully!');
      setTimeout(() => {
        navigate('/alumni/my-jobs');
      }, 1500);
      
    } catch (err) {
      console.error('Failed to update job', err);
      toast.error('Failed to update job: ' + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="alumni">
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="alumni">
      <PageHeader 
        title="Edit Job Posting" 
        subtitle="Update the details of your job listing." 
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-6 pb-12 max-w-4xl mx-auto">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-4 border-b border-slate-100 uppercase tracking-wider">
              <Briefcase size={20} />
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
                  placeholder="e.g. Google" 
                  value={formData.company}
                  required
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  name="location"
                  placeholder="e.g. Remote, New York" 
                  value={formData.location}
                  required
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employment Type <span className="text-red-500">*</span></label>
                <select 
                  name="jobType" 
                  value={formData.jobType} 
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all cursor-pointer"
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
                  placeholder="e.g. 1000-5000 employees" 
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Openings</label>
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
                rows={6} 
                placeholder="Describe the role responsibilities and requirements..."
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all resize-y"
              ></textarea>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-4 border-b border-slate-100 uppercase tracking-wider">
              <ImageIcon size={20} />
              Branding
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <ImageUploadInput
                label="Company Logo"
                sublabel="PNG, JPG, JPEG, WEBP • Max 5 MB"
                file={logoFile}
                onFileSelect={(f) => setLogoFile(f)}
                onFileRemove={() => { setLogoFile(null); setCurrentLogo(null); }}
                currentImageUrl={getImageUrl(currentLogo)}
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-4 border-b border-slate-100 uppercase tracking-wider">
              <DollarSign size={20} />
              Requirements & Details
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

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Application Link</label>
              <input 
                type="url"
                name="applicationLink"
                placeholder="https://example.com/apply" 
                value={formData.applicationLink}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
              />
            </div>

            {/* BRANCH & ELIGIBILITY CRITERIA SECTION */}
            <div className="space-y-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#F47C20] text-white rounded-xl text-sm font-bold hover:bg-[#d46510] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating Job...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
