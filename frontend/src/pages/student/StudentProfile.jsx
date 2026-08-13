import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  User, Mail, Phone, MapPin, Linkedin, Github, 
  Plus, Edit2, Trash2, FileText, Download, X, BadgeCheck, AlertCircle, Link as LinkIcon, CheckCircle, Save, BookOpen, Wrench, FolderGit2, Code, ExternalLink, RefreshCw, UploadCloud, Loader2
} from 'lucide-react';
import { getImageUrl, withCacheBust } from '../../utils/imageUrl';
import { Modal, Input, Button, DocumentViewerModal, LoadingSpinner, CategorizedSkillsSection, StudentProjectsSection, ResumeUploadModal, ProfileIconCard, ChangePasswordCard, SecurityAccountCard } from '../../components/common';
import { SectionLoader } from '../../components/common/loading';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { useData } from '../../context/DataContext';
import useDepartments from '../../hooks/useDepartments';
import './StudentProfile.css';



const validateProfileUrl = (url, platform) => {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;

  switch (platform) {
    case 'github':
      return hostname.includes('github.com') && pathname.length > 1;
    case 'linkedin':
      return hostname.includes('linkedin.com') && pathname.length > 1;
    case 'leetcode':
      return hostname.includes('leetcode.com') && pathname.length > 1;
    case 'codechef':
      return hostname.includes('codechef.com') && pathname.length > 1;
    case 'gfg':
      return hostname.includes('geeksforgeeks.org') && pathname.length > 1;
    default:
      return true;
  }
};

export default function StudentProfile() {
  const location = useLocation();
  const { profileImage, updateProfileImage } = useData();
  const { departments } = useDepartments();

  const [isLoading, setIsLoading] = useState(true);
  
  const [basicInfo, setBasicInfo] = useState({
    name: '', email: '', department: '', mobileNumber: '', location: '', gender: '', dob: '', address: '', githubUrl: '', linkedinUrl: '', leetcodeUrl: '', codechefUrl: '', gfgUrl: '', profileImageUrl: ''
  });
  const [academicInfo, setAcademicInfo] = useState({
    cgpa: '', semester: '', backlogs: '', academicYear: '', rollNumber: '', section: 'A', verificationStatus: 'PENDING'
  });
  const [skills, setSkills] = useState([]);
  const [resumeDetails, setResumeDetails] = useState(null);
  
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(Date.now());
  const [latestUploadedSkills, setLatestUploadedSkills] = useState(null);

  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  
  const [basicForm, setBasicForm] = useState({});
  const [academicForm, setAcademicForm] = useState({});

  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showResumeUploadModal, setShowResumeUploadModal] = useState(false);
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerMetadata, setViewerMetadata] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  const fetchProfile = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [profileRes, resumeRes] = await Promise.all([
        api.get('/student/profile', { params: { t: Date.now() } }).catch(() => ({ data: null })),
        api.get('/student/resume/details').catch(() => ({ data: null }))
      ]);

      if (profileRes.data) {
        setSkills(profileRes.data.skills || []);
        
        const acad = {
          cgpa: profileRes.data.cgpa !== null && profileRes.data.cgpa !== undefined ? profileRes.data.cgpa : '',
          semester: profileRes.data.semester !== null && profileRes.data.semester !== undefined ? profileRes.data.semester : '',
          backlogs: profileRes.data.backlogs !== null && profileRes.data.backlogs !== undefined ? profileRes.data.backlogs : '',
          academicYear: profileRes.data.academicYear || '',
          rollNumber: profileRes.data.rollNumber || '',
          section: profileRes.data.section || 'A',
          verificationStatus: profileRes.data.verificationStatus || 'PENDING'
        };
        setAcademicInfo(acad);
        setAcademicForm(acad);

        if (profileRes.data.user) {
          const basic = {
            name: profileRes.data.user.name || '',
            email: profileRes.data.user.email || '',
            department: profileRes.data.department || '',
            mobileNumber: profileRes.data.mobileNumber || '',
            location: profileRes.data.location || '',
            gender: profileRes.data.gender || 'Not specified',
            dob: profileRes.data.dob || 'Not specified',
            address: profileRes.data.address || profileRes.data.location || 'Not specified',
            githubUrl: profileRes.data.githubUrl || '',
            linkedinUrl: profileRes.data.linkedinUrl || '',
            leetcodeUrl: profileRes.data.leetcodeUrl || '',
            codechefUrl: profileRes.data.codechefUrl || '',
            gfgUrl: profileRes.data.gfgUrl || '',
            profileImageUrl: profileRes.data.profileImageUrl || ''
          };
          setBasicInfo(basic);
          setBasicForm(basic);
          if (profileRes.data.profileImageUrl) {
            updateProfileImage(profileRes.data.profileImageUrl);
          }
        }

        if (profileRes.data.hasResume || profileRes.data.resumeFileName) {
          setResumeDetails({
            hasResume: true,
            fileName: profileRes.data.resumeFileName || 'Uploaded_Resume.pdf',
            fileType: profileRes.data.resumeFileType || 'application/pdf',
            uploadedAt: profileRes.data.resumeUploadedAt || new Date().toISOString()
          });
        }
      }
      if (resumeRes.data && resumeRes.data.hasResume) {
        setResumeDetails(resumeRes.data);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(false);
  }, []);

  const handleUpdateBasic = async (e) => {
    e.preventDefault();

    if (basicForm.githubUrl && !validateProfileUrl(basicForm.githubUrl, 'github')) {
      toast.error("Invalid GitHub URL format. Example: https://github.com/username");
      return;
    }
    if (basicForm.linkedinUrl && !validateProfileUrl(basicForm.linkedinUrl, 'linkedin')) {
      toast.error("Invalid LinkedIn URL format. Example: https://www.linkedin.com/in/username");
      return;
    }
    if (basicForm.leetcodeUrl && !validateProfileUrl(basicForm.leetcodeUrl, 'leetcode')) {
      toast.error("Invalid LeetCode URL format. Example: https://leetcode.com/u/username");
      return;
    }
    if (basicForm.codechefUrl && !validateProfileUrl(basicForm.codechefUrl, 'codechef')) {
      toast.error("Invalid CodeChef URL format. Example: https://www.codechef.com/users/username");
      return;
    }
    if (basicForm.gfgUrl && !validateProfileUrl(basicForm.gfgUrl, 'gfg')) {
      toast.error("Invalid GeeksforGeeks URL format. Example: https://www.geeksforgeeks.org/user/username");
      return;
    }

    setIsSavingPersonal(true);
    try {
      const res = await api.put('/student/profile', {
        department: basicForm.department,
        mobileNumber: basicForm.mobileNumber,
        location: basicForm.location,
        gender: basicForm.gender,
        dob: basicForm.dob,
        address: basicForm.address,
        githubUrl: basicForm.githubUrl,
        linkedinUrl: basicForm.linkedinUrl,
        leetcodeUrl: basicForm.leetcodeUrl,
        codechefUrl: basicForm.codechefUrl,
        gfgUrl: basicForm.gfgUrl
      });

      const updated = res.data;
      if (updated) {
        if (updated.skills) setSkills(updated.skills);
        const freshBasicInfo = {
          name: updated.user?.name || basicInfo.name,
          email: updated.user?.email || basicInfo.email,
          department: updated.department || basicForm.department || '',
          mobileNumber: updated.mobileNumber || '',
          location: updated.location || '',
          gender: updated.gender || 'Not specified',
          dob: updated.dob || 'Not specified',
          address: updated.address || updated.location || 'Not specified',
          githubUrl: updated.githubUrl || '',
          linkedinUrl: updated.linkedinUrl || '',
          leetcodeUrl: updated.leetcodeUrl || '',
          codechefUrl: updated.codechefUrl || '',
          gfgUrl: updated.gfgUrl || '',
          profileImageUrl: updated.profileImageUrl || basicInfo.profileImageUrl
        };
        setBasicInfo(freshBasicInfo);
        setBasicForm(freshBasicInfo);
      }

      toast.success("Personal & Coding Profile details updated successfully");
      setShowPersonalModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save personal details");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleUpdateAcademic = async (e) => {
    e.preventDefault();
    setIsSavingAcademic(true);
    try {
      const sectionVal = (academicForm.section || '').trim();
      if (!sectionVal) {
        toast.error("Section field cannot be empty.");
        setIsSavingAcademic(false);
        return;
      }

      const res = await api.put('/student/profile', {
        cgpa: academicForm.cgpa !== '' ? parseFloat(academicForm.cgpa) : null,
        semester: academicForm.semester !== '' ? parseInt(academicForm.semester) : null,
        backlogs: academicForm.backlogs !== '' ? parseInt(academicForm.backlogs) : null,
        academicYear: academicForm.academicYear,
        section: sectionVal
      });

      const updated = res.data;
      if (updated) {
        const freshAcad = {
          cgpa: updated.cgpa ?? academicForm.cgpa,
          semester: updated.semester ?? academicForm.semester,
          backlogs: updated.backlogs !== null ? updated.backlogs : academicForm.backlogs,
          academicYear: updated.academicYear || academicForm.academicYear,
          rollNumber: updated.rollNumber || academicInfo.rollNumber,
          section: updated.section || sectionVal,
          verificationStatus: updated.verificationStatus || 'PENDING'
        };
        setAcademicInfo(freshAcad);
        setAcademicForm(freshAcad);
      }

      toast.success("Academic information updated successfully.");
      setIsEditingAcademic(false);
    } catch (err) {
      toast.error("Failed to update academic profile.");
    } finally {
      setIsSavingAcademic(false);
    }
  };

  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must not exceed 5 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/student/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const rawUrl = res.data.profileImageUrl || res.data.url || basicInfo.profileImageUrl;
      const freshUrl = withCacheBust(rawUrl, res.data.updatedAt);
      
      setBasicInfo(prev => ({ ...prev, profileImageUrl: freshUrl }));
      updateProfileImage(rawUrl, { forceRefresh: true });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      toast.success(res.data.message || "Profile photo updated successfully");
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      toast.error(err.response?.data?.message || "Profile photo could not be updated. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleResumeUploadSuccess = useCallback((data) => {
    const updatedProf = data?.student;
    setResumeDetails({
      hasResume: true,
      fileName: data?.fileName || updatedProf?.resumeFileName || 'Uploaded_Resume.pdf',
      fileType: data?.fileType || updatedProf?.resumeFileType || 'application/pdf',
      uploadedAt: data?.uploadedAt || updatedProf?.resumeUploadedAt || new Date().toISOString()
    });
    if (data?.skills && Array.isArray(data.skills)) {
      setSkills(data.skills);
      setLatestUploadedSkills(data.skills);
    } else if (updatedProf?.skills && Array.isArray(updatedProf.skills)) {
      setSkills(updatedProf.skills);
      setLatestUploadedSkills(updatedProf.skills);
    }
    setSkillsRefreshKey(Date.now());
    fetchProfile(true);
  }, []);

  const handleResumeView = async () => {
    setViewerOpen(true);
    setViewerError(null);
    setViewerMetadata({
      fileName: resumeDetails?.fileName || `${academicInfo.rollNumber || 'Student'}_Resume.pdf`,
      studentName: basicInfo.name,
      rollNumber: academicInfo.rollNumber,
      uploadDate: resumeDetails?.uploadedAt ? new Date(resumeDetails.uploadedAt).toLocaleDateString() : undefined
    });

    if (viewerUrl) {
      setViewerLoading(false);
      return;
    }

    setViewerLoading(true);
    try {
      const res = await api.get('/student/resume/view', { 
        responseType: 'blob',
        params: { t: Date.now() }
      });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${academicInfo.rollNumber || 'Student'}_Resume.pdf`;
      const file = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      setViewerUrl(fileURL);
      setViewerMetadata(prev => ({ ...prev, fileName: filename }));
    } catch (err) {
      console.error("Error viewing resume:", err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Resume Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to view resume');
      setViewerError(errMsg);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeDocumentViewer = () => {
    setViewerOpen(false);
    setViewerLoading(false);
    setViewerError(null);
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
      setViewerUrl(null);
    }
  };

  const handleResumeDownload = async () => {
    try {
      const res = await api.get('/student/resume/download', { 
        responseType: 'blob',
        params: { t: Date.now() }
      });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${academicInfo.rollNumber || 'Student'}_Resume.pdf`;
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download resume.");
    }
  };

  const handleSkillsChange = useCallback((updatedSkills) => {
    setSkills(updatedSkills);
  }, []);

  const hasCodingProfiles = basicInfo.githubUrl || basicInfo.linkedinUrl || basicInfo.leetcodeUrl || basicInfo.codechefUrl || basicInfo.gfgUrl;

  return (
    <DashboardLayout role="student">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        
        {/* 2-Column Responsive CSS Grid (Row 1: Profile | Academic, Row 2: Personal | Resume, Row 3: Skills, Row 4: Coding Profiles) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Card 1 — Profile Card (Row 1 Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-24 bg-gradient-to-r from-[#F47C20] via-orange-400 to-amber-400 p-4 flex justify-between items-start">
              <span className="bg-white/25 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Student Profile
              </span>
            </div>

            <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1 shadow-md border-2 border-white overflow-hidden shrink-0 relative">
                  {isLoading ? (
                    <div className="w-full h-full bg-slate-200 animate-pulse rounded-full" />
                  ) : imagePreview || basicInfo.profileImageUrl || profileImage ? (
                    <img 
                      src={imagePreview || getImageUrl(basicInfo.profileImageUrl || profileImage)} 
                      alt={basicInfo.name || 'Profile'} 
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = generateAvatarSVG(basicInfo.name, 'F47C20', 'ffffff', 112);
                      }}
                    />
                  ) : (
                    <img 
                      src={generateAvatarSVG(basicInfo.name, 'F47C20', 'ffffff', 112)} 
                      alt={basicInfo.name || 'Student Avatar'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>

                <label 
                  htmlFor="profile-photo-input" 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F47C20]   text-white flex items-center justify-center shadow-md cursor-pointer transition-all   border-2 border-white z-10"
                  title="Edit Profile Photo"
                >
                  {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Edit2 size={14} />}
                  <input 
                    type="file" 
                    id="profile-photo-input" 
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="sr-only" 
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                </label>
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                {isLoading ? (
                  <div className="space-y-3">
                     <div className="h-6 bg-slate-200 rounded animate-pulse w-3/4 mx-auto sm:mx-0" />
                     <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mx-auto sm:mx-0" />
                     <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3 mx-auto sm:mx-0" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{basicInfo.name || 'Student Name'}</h2>
                      {academicInfo.verificationStatus === 'VERIFIED' ? (
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          <BadgeCheck size={13} /> Verified Student
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          <AlertCircle size={12} /> {academicInfo.verificationStatus || 'PENDING'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-500 space-y-1">
                      <p><span className="font-extrabold text-slate-700">Roll No:</span> {academicInfo.rollNumber || 'N/A'}</p>
                      <p><span className="font-extrabold text-slate-700">Email:</span> {basicInfo.email || 'N/A'}</p>
                      <p><span className="font-extrabold text-slate-700">Mobile:</span> {basicInfo.mobileNumber || 'Not specified'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card 2 — Academic Information Card (Row 1 Right) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-extrabold text-[#F47C20] text-xs uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16}/> Academic Information
              </h4>
              <button 
                onClick={() => {
                  setAcademicForm({
                    semester: academicInfo.semester || 7,
                    cgpa: academicInfo.cgpa || '',
                    section: academicInfo.section || 'A',
                    academicYear: academicInfo.academicYear || '2022-2026',
                    backlogs: academicInfo.backlogs || 0
                  });
                  setIsEditingAcademic(true);
                }} 
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Edit Academic Details"
              >
                <Edit2 size={13}/> Edit
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <SectionLoader rows={3} />
              ) : isEditingAcademic ? (
                <form onSubmit={handleUpdateAcademic} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                      <select 
                        value={academicForm.semester || '7'} 
                        onChange={(e) => setAcademicForm({...academicForm, semester: e.target.value})}
                        className="w-full h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]" 
                        required 
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CGPA</label>
                      <input 
                        type="number" step="0.01" min="0" max="10" 
                        value={academicForm.cgpa} 
                        onChange={(e) => setAcademicForm({...academicForm, cgpa: e.target.value})}
                        className="w-full h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                      <input 
                        type="text" 
                        value={academicForm.section || ''} 
                        onChange={(e) => setAcademicForm({...academicForm, section: e.target.value})}
                        placeholder="e.g. A, B, CSE-A, AI-1"
                        className="w-full h-9 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F47C20]" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditingAcademic(false)} className="px-3.5 py-1.5 text-slate-500   text-xs font-bold border border-slate-200 rounded-xl  ">Cancel</button>
                    <button type="submit" disabled={isSavingAcademic} className="px-4 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   text-xs font-bold rounded-xl transition-all">
                      {isSavingAcademic ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Roll Number</span>
                    <span className="text-sm font-extrabold text-slate-800">{academicInfo.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Department</span>
                    <span className="text-sm font-extrabold text-slate-800">{basicInfo.department || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Academic Year</span>
                    <span className="text-sm font-extrabold text-slate-800">{academicInfo.academicYear || '2022-2026'}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Semester</span>
                    <span className="text-sm font-extrabold text-slate-800">{academicInfo.semester ? `Sem ${academicInfo.semester}` : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">CGPA</span>
                    <span className="text-sm font-extrabold text-slate-800">{academicInfo.cgpa || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Section</span>
                    <span className="text-sm font-extrabold text-slate-800">{academicInfo.section || 'A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3 — Personal Information Card (Row 2 Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-extrabold text-[#F47C20] text-xs uppercase tracking-wider flex items-center gap-2">
                <User size={16}/> Personal Information
              </h4>
              <button 
                onClick={() => {
                  setBasicForm({
                    department: basicInfo.department || '',
                    mobileNumber: basicInfo.mobileNumber || '',
                    location: basicInfo.location || '',
                    gender: basicInfo.gender === 'Not specified' ? '' : basicInfo.gender,
                    dob: basicInfo.dob === 'Not specified' ? '' : basicInfo.dob,
                    address: (basicInfo.address === 'Not specified' ? '' : basicInfo.address) || basicInfo.location || '',
                    githubUrl: basicInfo.githubUrl || '',
                    linkedinUrl: basicInfo.linkedinUrl || '',
                    leetcodeUrl: basicInfo.leetcodeUrl || '',
                    codechefUrl: basicInfo.codechefUrl || '',
                    gfgUrl: basicInfo.gfgUrl || ''
                  });
                  setShowPersonalModal(true);
                }} 
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Edit Personal Details"
              >
                <Edit2 size={13}/> Edit
              </button>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <SectionLoader rows={3} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Full Name</span>
                    <span className="font-extrabold text-slate-800">{basicInfo.name || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Email Address</span>
                    <span className="font-extrabold text-slate-800 break-all">{basicInfo.email || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Mobile Number</span>
                    <span className="font-extrabold text-slate-800">{basicInfo.mobileNumber || 'Not specified'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Gender</span>
                    <span className="font-extrabold text-slate-800">{basicInfo.gender || 'Not specified'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Date of Birth</span>
                    <span className="font-extrabold text-slate-800">{basicInfo.dob || 'Not specified'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Address / Location</span>
                    <span className="font-extrabold text-slate-800">{basicInfo.address || basicInfo.location || 'Not specified'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4 — Resume Card (Row 2 Right) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h4 className="font-extrabold text-[#F47C20] text-xs uppercase tracking-wider flex items-center gap-2">
                 <FileText size={16}/> Resume / CV
               </h4>
               {resumeDetails?.hasResume && (
                 <button 
                   onClick={() => setShowResumeUploadModal(true)} 
                   className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all shadow-xs"
                 >
                   <UploadCloud size={13} /> Replace Resume
                 </button>
               )}
            </div>
            <div className="p-6">
              {resumeDetails?.hasResume ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F47C20] flex items-center justify-center font-bold shrink-0">
                      <FileText size={20}/>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{resumeDetails.fileName || 'Uploaded Resume'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {resumeDetails.uploadedAt ? `Uploaded on ${new Date(resumeDetails.uploadedAt).toLocaleDateString()}` : 'PDF Document'} 
                        {resumeDetails.fileSize ? ` • ${resumeDetails.fileSize}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button 
                      onClick={handleResumeView} 
                      className="px-3.5 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText size={14}/> View
                    </button>
                    <button 
                      onClick={handleResumeDownload} 
                      className="px-3.5 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold   transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Download size={14}/> Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                  <FileText size={32} className="mx-auto text-slate-300"/>
                  <div>
                    <p className="text-xs font-bold text-slate-600">No resume uploaded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload your resume to automatically generate your Skills &amp; Technologies list.</p>
                  </div>
                  <button 
                    onClick={() => setShowResumeUploadModal(true)} 
                    className="px-4 py-2 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20]   text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 5 — Skills & Technologies Card (Row 3 Full Width) */}
          <CategorizedSkillsSection
            hasResume={!!resumeDetails?.hasResume || (!!resumeDetails && resumeDetails.hasResume !== false)}
            onSkillsChange={handleSkillsChange}
            onResumeUploadSuccess={handleResumeUploadSuccess}
            refreshTrigger={skillsRefreshKey}
            latestSkills={latestUploadedSkills}
          />

          {/* Card 6 — Projects Section Card (Row 4 Full Width) */}
          <StudentProjectsSection refreshTrigger={skillsRefreshKey} />

          {/* Card 6 — Coding & Personal Profiles Card (Row 4 Full Width - Official SVG Logo Only Cards) */}
          {hasCodingProfiles && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h4 className="font-extrabold text-[#F47C20] text-xs uppercase tracking-wider flex items-center gap-2">
                  <Code size={16}/> Coding &amp; Personal Profiles
                </h4>
              </div>

              <div className="p-6 flex flex-wrap items-center gap-4">
                <ProfileIconCard platformKey="github" url={basicInfo.githubUrl} />
                <ProfileIconCard platformKey="linkedin" url={basicInfo.linkedinUrl} />
                <ProfileIconCard platformKey="leetcode" url={basicInfo.leetcodeUrl} />
                <ProfileIconCard platformKey="codechef" url={basicInfo.codechefUrl} />
                <ProfileIconCard platformKey="gfg" url={basicInfo.gfgUrl} />
              </div>
            </div>
          )}

          {/* Security & Account Information */}
          <div className="mt-6">
            <SecurityAccountCard
              accountData={basicInfo}
              role="STUDENT"
              onRefresh={() => fetchProfile(true)}
            />
          </div>

        </div>

      </div>


      {/* Modals */}
      <ResumeUploadModal
        isOpen={showResumeUploadModal}
        onClose={() => setShowResumeUploadModal(false)}
        hasExistingResume={!!resumeDetails?.hasResume}
        onSuccess={handleResumeUploadSuccess}
      />

      {/* Edit Personal Info Modal */}
      <Modal isOpen={showPersonalModal} onClose={() => setShowPersonalModal(false)} title="Edit Personal Information & Profile Links" size="lg">
        <form onSubmit={handleUpdateBasic} className="student-edit-form">
          
          {/* PERSONAL INFORMATION SECTION */}
          <div className="student-form-section">
            <h4 className="student-form-section-title">
              <User size={16} className="text-[#F47C20]" /> Personal Information
            </h4>

            <div className="student-form-grid">
              {/* Department / Branch */}
              <div className="student-form-group">
                <label className="student-form-label">Branch / Department</label>
                <select
                  value={basicForm.department || ''}
                  onChange={(e) => setBasicForm({ ...basicForm, department: e.target.value })}
                  className="student-form-input"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept.code} value={dept.code || dept.name}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div className="student-form-group">
                <label className="student-form-label">Mobile Number</label>
                <input 
                  type="text" 
                  value={basicForm.mobileNumber || ''} 
                  onChange={(e) => setBasicForm({ ...basicForm, mobileNumber: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="student-form-input" 
                />
              </div>

              {/* Gender */}
              <div className="student-form-group">
                <label className="student-form-label">Gender</label>
                <select
                  value={basicForm.gender || ''}
                  onChange={(e) => setBasicForm({ ...basicForm, gender: e.target.value })}
                  className="student-form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="student-form-group">
                <label className="student-form-label">Date of Birth</label>
                <input 
                  type="date" 
                  value={basicForm.dob || ''} 
                  onChange={(e) => setBasicForm({ ...basicForm, dob: e.target.value })}
                  className="student-form-input" 
                />
              </div>

              {/* Address / Location */}
              <div className="student-form-group student-form-group-full">
                <label className="student-form-label">Address / Location</label>
                <input 
                  type="text" 
                  value={basicForm.address || basicForm.location || ''} 
                  onChange={(e) => setBasicForm({ ...basicForm, address: e.target.value, location: e.target.value })}
                  placeholder="Address, City, State"
                  className="student-form-input" 
                />
              </div>
            </div>
          </div>

          {/* PROFILE & CODING LINKS SECTION */}
          <div className="student-form-section">
            <h4 className="student-form-section-title">
              <Code size={16} className="text-[#F47C20]" /> Profile &amp; Coding Links
            </h4>

            <div className="student-form-links-grid">
              {/* GitHub URL */}
              <div className="student-form-group">
                <label className="student-form-label">GitHub Profile URL</label>
                <div className="student-input-icon-wrap">
                  <span className="student-input-icon"><Github size={18} /></span>
                  <input 
                    type="url" 
                    value={basicForm.githubUrl || ''} 
                    onChange={(e) => setBasicForm({ ...basicForm, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="student-form-input student-input-has-icon" 
                  />
                </div>
              </div>

              {/* LinkedIn URL */}
              <div className="student-form-group">
                <label className="student-form-label">LinkedIn Profile URL</label>
                <div className="student-input-icon-wrap">
                  <span className="student-input-icon"><Linkedin size={18} /></span>
                  <input 
                    type="url" 
                    value={basicForm.linkedinUrl || ''} 
                    onChange={(e) => setBasicForm({ ...basicForm, linkedinUrl: e.target.value })}
                    placeholder="https://www.linkedin.com/in/username"
                    className="student-form-input student-input-has-icon" 
                  />
                </div>
              </div>

              {/* LeetCode URL */}
              <div className="student-form-group">
                <label className="student-form-label">LeetCode Profile URL</label>
                <div className="student-input-icon-wrap">
                  <span className="student-input-icon"><Code size={18} /></span>
                  <input 
                    type="url" 
                    value={basicForm.leetcodeUrl || ''} 
                    onChange={(e) => setBasicForm({ ...basicForm, leetcodeUrl: e.target.value })}
                    placeholder="https://leetcode.com/u/username"
                    className="student-form-input student-input-has-icon" 
                  />
                </div>
              </div>

              {/* CodeChef URL */}
              <div className="student-form-group">
                <label className="student-form-label">CodeChef Profile URL</label>
                <div className="student-input-icon-wrap">
                  <span className="student-input-icon"><ExternalLink size={18} /></span>
                  <input 
                    type="url" 
                    value={basicForm.codechefUrl || ''} 
                    onChange={(e) => setBasicForm({ ...basicForm, codechefUrl: e.target.value })}
                    placeholder="https://www.codechef.com/users/username"
                    className="student-form-input student-input-has-icon" 
                  />
                </div>
              </div>

              {/* GeeksforGeeks URL */}
              <div className="student-form-group student-form-group-full">
                <label className="student-form-label">GeeksforGeeks (GFG) Profile URL</label>
                <div className="student-input-icon-wrap">
                  <span className="student-input-icon"><LinkIcon size={18} /></span>
                  <input 
                    type="url" 
                    value={basicForm.gfgUrl || ''} 
                    onChange={(e) => setBasicForm({ ...basicForm, gfgUrl: e.target.value })}
                    placeholder="https://www.geeksforgeeks.org/user/username"
                    className="student-form-input student-input-has-icon" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="student-form-actions">
            <button type="button" onClick={() => setShowPersonalModal(false)} className="student-btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={isSavingPersonal} className="student-btn-save">
              {isSavingPersonal ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={closeDocumentViewer}
        documentUrl={viewerUrl}
        fileName={viewerMetadata?.fileName || 'Document'}
        studentName={viewerMetadata?.studentName || basicInfo.name}
        rollNumber={viewerMetadata?.rollNumber || academicInfo.rollNumber}
        uploadDate={viewerMetadata?.uploadDate}
        isLoading={viewerLoading}
        error={viewerError}
        onRetry={handleResumeView}
      />
    </DashboardLayout>
  );
}
