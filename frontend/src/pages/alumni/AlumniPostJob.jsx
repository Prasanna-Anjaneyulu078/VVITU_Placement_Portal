import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/common';
import ImageUploadInput from '../../components/common/ImageUploadInput';
import api from '../../utils/axiosConfig';
import { Briefcase, DollarSign, HelpCircle, CheckCircle2, X } from 'lucide-react';
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
    setIsSubmitting(true);
    
    try {
      const postData = new FormData();
      Object.keys(formData).forEach((key) => {
        postData.append(key, formData[key]);
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

          <div className="space-y-6 pt-6">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-4 border-b border-slate-100 uppercase tracking-wider">
              <DollarSign size={20} />
              Requirements & Eligibility
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Min CGPA</label>
                <input 
                  type="number"
                  step="0.01"
                  name="minCgpa"
                  placeholder="e.g. 7.5" 
                  value={formData.minCgpa}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eligible Semester</label>
                <input 
                  type="number"
                  name="eligibleSemester"
                  placeholder="e.g. 6" 
                  value={formData.eligibleSemester}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Max Backlogs</label>
                <input 
                  type="number"
                  name="maxBacklogs"
                  placeholder="e.g. 0" 
                  value={formData.maxBacklogs}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-1 focus:ring-[#F47C20] transition-all"
                />
              </div>
            </div>
          </div>

          {/* PRE-APPLICATION SCREENING SECTION */}
          <div className="space-y-6 pt-6">
            <h3 className="text-lg font-extrabold text-[#F47C20] flex items-center gap-2 pb-4 border-b border-slate-100 uppercase tracking-wider">
              <HelpCircle size={20} />
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

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white border border-slate-200 text-[#F47C20] rounded-xl text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </button>
          </div>
          
        </form>
      </div>
    </DashboardLayout>
  );
}
