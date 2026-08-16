import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  User, Mail, Phone, MapPin, Linkedin, Edit2, 
  Briefcase, GraduationCap, ShieldCheck, CheckCircle, Save, X, BookOpen, Star, Camera, ExternalLink, Lock, Shield, FileText, Download, Eye, EyeOff
} from 'lucide-react';
import { getImageUrl, withCacheBust } from '../../utils/imageUrl';
import Avatar from '../../components/common/Avatar';
import { Modal, LoadingSpinner, DocumentViewerModal, ChangePasswordCard, SecurityAccountCard } from '../../components/common';
import { SectionLoader } from '../../components/common/loading';
import StatusBadge from '../../components/common/StatusBadge';

import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import useDepartments from '../../hooks/useDepartments';
import { useData } from '../../context/DataContext';
import { toTitleCase } from '../../utils/nameUtils';

export default function AlumniProfile() {
  const { departments } = useDepartments();
  const { profileImage, updateProfileImage } = useData();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings states
  const [documentUrl, setDocumentUrl] = useState('');
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [documentMeta, setDocumentMeta] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Modals
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // Forms
  const [personalForm, setPersonalForm] = useState({});
  const [professionalForm, setProfessionalForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchDocumentUrl();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/alumni/profile');
      const data = res.data;
      setProfile(data);
      if (data.profileImageUrl) {
        updateProfileImage(data.profileImageUrl);
      }
      setPersonalForm({
        mobileNumber: data.mobileNumber || '',
        gender: data.gender || '',
        linkedinUrl: data.linkedinUrl || ''
      });
      setProfessionalForm({
        company: data.company || '',
        designation: data.designation || '',
        passingYear: data.passingYear || '',
        department: data.department || '',
        degree: data.degree || ''
      });
    } catch (err) {
      toast.error('Failed to load profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentUrl = async () => {
    try {
      setDocLoading(true);
      const res = await api.get('/alumni/documents/my-document');
      if (res.data && res.data.url) {
        setDocumentUrl(res.data.url);
        setDocumentMeta({
          documentName: res.data.documentName,
          uploadDate: res.data.uploadDate,
          documentType: res.data.documentType
        });
        
        try {
          const endpoint = res.data.url.startsWith('/api/') ? res.data.url.substring(4) : res.data.url;
          const blobRes = await api.get(endpoint, { responseType: 'blob' });
          const disposition = blobRes.headers['content-disposition'] || '';
          const match = disposition.match(/filename="?([^"]+)"?/);
          const filename = match ? match[1] : (res.data.documentName || res.data.url.split('/').pop() || 'Verification_Document.pdf');
          const blobUrl = URL.createObjectURL(blobRes.data);
          setDocBlobUrl(blobUrl);
          setDocumentMeta(prev => ({ ...prev, documentName: filename }));
        } catch (blobErr) {
          console.error('Failed to fetch document blob', blobErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch document URL', err);
    } finally {
      setDocLoading(false);
    }
  };

  const handleSave = async (type) => {
    try {
      setIsSaving(true);
      
      let updatedData = { ...profile };
      
      if (type === 'personal') {
        updatedData = { ...updatedData, ...personalForm };
      } else if (type === 'professional') {
        updatedData = { ...updatedData, ...professionalForm };
      }

      await api.put('/alumni/profile', updatedData);
      setProfile(updatedData);
      toast.success('Profile updated successfully');
      
      setShowPersonalModal(false);
      setShowProfessionalModal(false);
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsChangingPwd(true);
    try {
      await api.post('/auth/change-password', {
        email: profile?.user?.email,
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleViewDocument = async () => {
    if (!documentUrl) {
      toast.error("No verification document uploaded");
      return;
    }
    setShowDocumentModal(true);
    setDocError(null);

    if (docBlobUrl) {
      setDocLoading(false);
      return;
    }

    setDocLoading(true);
    try {
      const endpoint = documentUrl.startsWith('/api/') ? documentUrl.substring(4) : documentUrl;
      const blobRes = await api.get(endpoint, { responseType: 'blob' });
      const fileType = blobRes.headers['content-type'] || 'application/pdf';
      const blob = new Blob([blobRes.data], { type: fileType });
      const bUrl = URL.createObjectURL(blob);
      setDocBlobUrl(bUrl);
    } catch (err) {
      console.error("Error fetching verification document:", err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Document Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to load document');
      setDocError(errMsg);
    } finally {
      setDocLoading(false);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setDocLoading(false);
    setDocError(null);
  };

  const handleDownloadDocument = async () => {
    if (!documentUrl) {
      toast.error("No verification document uploaded");
      return;
    }
    const downloadFileName = profile?.rollNumber 
      ? `${profile.rollNumber}_VerificationDocument.pdf` 
      : (documentMeta?.documentName || 'Verification_Document.pdf');

    try {
      const endpoint = documentUrl.startsWith('/api/') ? documentUrl.substring(4) : documentUrl;
      const blobRes = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([blobRes.data], { type: 'application/pdf' });
      const bUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = bUrl;
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(bUrl);
      toast.success("Document download started.");
    } catch (err) {
      const fullUrl = documentUrl.startsWith('http') 
        ? documentUrl 
        : `${api.defaults.baseURL || 'http://localhost:8082/api'}${documentUrl.startsWith('/') ? '' : '/'}${documentUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await api.post('/alumni/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const rawUrl = res.data.profileImageUrl || res.data.url;
      const freshUrl = withCacheBust(rawUrl, res.data.updatedAt);
      setProfile(prev => ({ ...prev, profileImageUrl: freshUrl }));
      updateProfileImage(rawUrl, { forceRefresh: true });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      toast.success('Profile picture updated successfully');
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      console.error('Failed to upload image', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };



  const actionBtnStyle = "py-2.5 px-4 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold     focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer";
  const smallActionBtnStyle = "px-4 py-2 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold     focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer";

  return (
    <DashboardLayout role="alumni">
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700 relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:16px_16px]"></div>
              </div>
              <div className="px-6 pb-6 relative text-center">
                <div className="flex justify-center -mt-16 mb-4 relative z-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                      {isLoading ? (
                        <div className="w-full h-full bg-slate-200 animate-pulse rounded-full" />
                      ) : (
                        <Avatar
                          src={imagePreview || profile?.profileImageUrl}
                          name={profile?.name || profile?.user?.name || 'Alumni'}
                          size="xl"
                          className={`w-full h-full ${isUploadingImage ? 'opacity-50' : ''}`}
                        />
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 w-9 h-9 bg-[#F47C20] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer     transition-all border-2 border-white" title="Change Profile Picture">
                      <Camera size={16} />
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="space-y-3 mt-4">
                     <div className="h-6 bg-slate-200 rounded animate-pulse w-3/4 mx-auto" />
                     <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mx-auto" />
                     <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3 mx-auto" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex justify-center items-center gap-2">
                      {toTitleCase(profile?.user?.name || 'Alumni')}
                      {profile?.verificationStatus === 'VERIFIED' && <ShieldCheck size={20} className="text-emerald-500"/>}
                    </h2>
                    <p className="text-sm font-semibold text-[#F47C20] mt-1">{profile?.rollNumber || 'N/A'}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{profile?.department || 'Department Not Specified'}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{profile?.passingYear ? `Class of ${profile.passingYear}` : 'Passing Year Not Specified'}</p>
                    
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        profile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        profile?.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          profile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' :
                          profile?.verificationStatus === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div> 
                        {profile?.verificationStatus || 'UNVERIFIED'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Mail size={14}/> Contact Details</h3>
                <button onClick={() => setShowPersonalModal(true)} className="px-2 py-1 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-md text-[10px] font-bold uppercase tracking-wider     focus:outline-none focus:ring-2 focus:ring-[#F47C20] transition-all flex items-center gap-1 shadow-sm">
                  <Edit2 size={10} /> Edit
                </button>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <SectionLoader rows={2} />
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><Mail size={16} className="text-slate-400 shrink-0"/> <span className="truncate break-all">{profile?.user?.email || 'N/A'}</span></div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><Phone size={16} className="text-slate-400 shrink-0"/> <span>{profile?.mobileNumber || 'Not Specified'}</span></div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><User size={16} className="text-slate-400 shrink-0"/> <span>{profile?.gender || 'Not Specified'}</span></div>
                    {profile?.linkedinUrl && (
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <Linkedin size={16} className="text-slate-400 shrink-0"/> 
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500   truncate">LinkedIn Profile</a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Verification Document */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2"><Shield size={16}/> Verification Document</h4>
                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    profile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    profile?.verificationStatus === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      profile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' :
                      profile?.verificationStatus === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div> 
                    {profile?.verificationStatus || 'UNVERIFIED'}
                  </span>
              </div>
              <div className="p-6">
                {docLoading ? (
                  <p className="text-sm text-slate-500">Loading document data...</p>
                ) : documentUrl ? (
                  <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex justify-center items-center shrink-0 shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 break-words">{documentMeta?.documentName || 'Verification_Document.pdf'}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Uploaded: {documentMeta?.uploadDate ? new Date(documentMeta.uploadDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'}</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Type: {documentMeta?.documentType || 'Verification Document'}</p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-3 w-full mt-2">
                      <button 
                        onClick={handleViewDocument}
                        className={`${smallActionBtnStyle} flex-1`}
                      >
                        <ExternalLink size={14} /> View
                      </button>
                      <button 
                        onClick={handleDownloadDocument}
                        className={`${smallActionBtnStyle} flex-1`}
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500 italic">No document available.</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Professional Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2"><Briefcase size={16}/> Professional Profile</h4>
                 <button onClick={() => setShowProfessionalModal(true)} className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-lg text-[11px] font-bold uppercase tracking-wider     focus:outline-none focus:ring-2 focus:ring-[#F47C20] transition-all flex items-center gap-1.5 shadow-sm">
                   <Edit2 size={12} /> Edit Details
                 </button>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <SectionLoader rows={3} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.company || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.designation || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.department || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passing Year</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.passingYear || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Degree</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.degree || 'Not Specified'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>





            {/* Security & Account Information */}
            <SecurityAccountCard
              accountData={profile}
              role="ALUMNI"
              onRefresh={() => fetchProfile()}
            />


          </div>
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={showPersonalModal} onClose={() => setShowPersonalModal(false)} title="Edit Contact Details">
        <form onSubmit={(e) => { e.preventDefault(); handleSave('personal'); }}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <input type="text" value={personalForm.mobileNumber} onChange={e => setPersonalForm({...personalForm, mobileNumber: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
              <select value={personalForm.gender} onChange={e => setPersonalForm({...personalForm, gender: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all cursor-pointer">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">LinkedIn Profile URL</label>
              <input type="url" value={personalForm.linkedinUrl} onChange={e => setPersonalForm({...personalForm, linkedinUrl: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowPersonalModal(false)} className={actionBtnStyle}>Cancel</button>
            <button type="submit" disabled={isSaving} className={actionBtnStyle}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showProfessionalModal} onClose={() => setShowProfessionalModal(false)} title="Edit Professional Profile">
        <form onSubmit={(e) => { e.preventDefault(); handleSave('professional'); }}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Company</label>
              <input type="text" value={professionalForm.company} onChange={e => setProfessionalForm({...professionalForm, company: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
              <input type="text" value={professionalForm.designation} onChange={e => setProfessionalForm({...professionalForm, designation: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
              <select value={professionalForm.department} onChange={e => setProfessionalForm({...professionalForm, department: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all cursor-pointer">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.code || d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Degree</label>
                <input type="text" value={professionalForm.degree} onChange={e => setProfessionalForm({...professionalForm, degree: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Passing Year</label>
                <input type="number" value={professionalForm.passingYear} onChange={e => setProfessionalForm({...professionalForm, passingYear: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowProfessionalModal(false)} className={actionBtnStyle}>Cancel</button>
            <button type="submit" disabled={isSaving} className={actionBtnStyle}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <DocumentViewerModal 
        isOpen={showDocumentModal}
        onClose={closeDocumentModal}
        documentUrl={docBlobUrl}
        fileName={documentMeta?.documentName || 'Verification_Document.pdf'}
        alumniName={profile?.user?.name}
        rollNumber={profile?.rollNumber}
        uploadDate={documentMeta?.uploadDate ? new Date(documentMeta.uploadDate).toLocaleDateString() : undefined}
        isLoading={docLoading}
        error={docError}
        onRetry={handleViewDocument}
      />

    </DashboardLayout>
  );
}
