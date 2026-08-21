import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../components/common/Avatar';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Camera, Edit2, Shield, Lock, MapPin, Mail, Phone, Briefcase, 
  User, Calendar, CheckCircle, ShieldCheck, Save, X, Users, 
  GraduationCap, Briefcase as BriefcaseIcon, Clock, Settings, KeyRound, Check
} from 'lucide-react';
import { getImageUrl, withCacheBust } from '../../utils/imageUrl';
import { LoadingSpinner, Modal, ChangePasswordCard } from '../../components/common';
import { ProfileLoader } from '../../components/common/loading';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useDepartments from '../../hooks/useDepartments';
import { canCreateAdmin } from '../../utils/permissionUtils';
import { Plus } from 'lucide-react';

import { useData } from '../../context/DataContext';

export default function AdminProfile() {
  const navigate = useNavigate();
  const { updateProfileImage } = useData();
  const { departments } = useDepartments();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  
  const [personalForm, setPersonalForm] = useState({});
  const [professionalForm, setProfessionalForm] = useState({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [newEmail, setNewEmail] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Add Admin state for SUPER_ADMIN
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({
    name: '',
    email: '',
    department: 'Placement Cell',
    designation: 'System Administrator',
    mobileNumber: '',
    password: ''
  });

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!addAdminForm.name || !addAdminForm.email || !addAdminForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    try {
      setIsSubmittingAdmin(true);
      const res = await api.post('/admin/users/admins', addAdminForm);
      toast.success(res.data?.message || 'Admin account created successfully!');
      setShowAddAdminModal(false);
      setAddAdminForm({
        name: '',
        email: '',
        department: 'Placement Cell',
        designation: 'System Administrator',
        mobileNumber: '',
        password: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        api.get('/admin/profile'),
        api.get('/admin/stats').catch(() => ({ data: null }))
      ]);
      
      setProfile(profileRes.data);
      if (statsRes.data) setStats(statsRes.data);
      
      setPersonalForm({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        mobileNumber: profileRes.data.mobileNumber || '',
        gender: profileRes.data.gender || ''
      });
      setProfessionalForm({
        department: profileRes.data.department || '',
        designation: profileRes.data.designation || '',
        employeeId: profileRes.data.employeeId || ''
      });
      setNewEmail(profileRes.data.email || '');
    } catch (err) {
      toast.error('Failed to load profile data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid image format. Supported: JPG, PNG, WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/admin/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const rawUrl = res.data.imageUrl || res.data.profileImageUrl || res.data.url;
      const freshUrl = withCacheBust(rawUrl, res.data.updatedAt);
      setProfile(prev => ({ ...prev, profileImageUrl: freshUrl }));
      updateProfileImage(rawUrl, { forceRefresh: true });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      toast.success('Profile image uploaded successfully');
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
      toast.error('Failed to upload image');
      console.error(err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveProfile = async (formType) => {
    try {
      setIsSaving(true);
      const updatedData = { ...profile, ...personalForm, ...professionalForm };
      
      await api.put('/admin/profile', updatedData);
      setProfile(updatedData);
      
      toast.success('Profile updated successfully');
      setIsEditingPersonal(false);
      setIsEditingProfessional(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelfEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail.trim() === profile?.email) {
      setShowEmailModal(false);
      return;
    }
    try {
      setIsSaving(true);
      await api.put('/admin/change-email', { newEmail: newEmail.trim() });
      toast.success('Email address updated successfully! Confirmation email sent.');
      setProfile(prev => ({ ...prev, email: newEmail.trim() }));
      setShowEmailModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelfPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    try {
      setIsSaving(true);
      await api.put('/admin/change-password', passwordForm);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  // Password rules checks
  const pass = passwordForm.newPassword;
  const hasMinLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[@$!%*?&^#\-_+=<>]/.test(pass);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && (passwordForm.newPassword === passwordForm.confirmPassword);

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 mt-6">
          <ProfileLoader />
        </div>
      </DashboardLayout>
    );
  }

  const hasPersonalChanges = JSON.stringify(personalForm) !== JSON.stringify({
    name: profile?.name || '',
    email: profile?.email || '',
    mobileNumber: profile?.mobileNumber || '',
    gender: profile?.gender || ''
  });

  const hasProfessionalChanges = JSON.stringify(professionalForm) !== JSON.stringify({
    department: profile?.department || '',
    designation: profile?.designation || '',
    employeeId: profile?.employeeId || ''
  });

  const actionBtnStyle = "py-2.5 px-4 bg-white border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold   focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer w-full";

  return (
    <DashboardLayout role="admin">
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700 relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              </div>
              <div className="px-6 pb-6 relative text-center">
                <div className="flex justify-center -mt-16 mb-4 relative z-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                      <Avatar
                        src={imagePreview || profile?.profileImageUrl}
                        name={profile?.name || 'Admin'}
                        size="xl"
                        className={`w-full h-full ${isUploadingImage ? 'opacity-50' : ''}`}
                      />
                    </div>
                    <label className="absolute bottom-1 right-1 w-9 h-9 bg-[#F47C20] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer     transition-all border-2 border-white" title="Change Profile Picture (Max 5MB)">
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
                
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex justify-center items-center gap-2">
                  {profile?.name || 'Administrator'}
                  <ShieldCheck size={20} className="text-[#F47C20]"/>
                </h2>
                <p className="text-sm font-semibold text-[#F47C20] mt-1">{profile?.designation || 'System Administrator'}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{profile?.department || 'Placement Cell'}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{profile?.email || 'admin@vvit.edu.in'}</p>
                
                <div className="mt-5 flex items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active Account
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#F47C20] uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck size={16}/> Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center   transition-colors">
                  <Users size={18} className="text-[#F47C20] mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students Managed</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{stats?.totalStudents || 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center   transition-colors">
                  <CheckCircle size={18} className="text-emerald-500 mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Students</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{stats?.totalVerifiedStudents || 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center   transition-colors">
                  <GraduationCap size={18} className="text-[#F47C20] mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alumni Verified</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{stats?.totalVerifiedAlumni || 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center   transition-colors">
                  <BriefcaseIcon size={18} className="text-blue-500 mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Jobs</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{stats?.activeJobs || stats?.totalJobs || 0}</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Mail size={14}/> Contact Details</h3>
                <button onClick={() => setShowPersonalModal(true)} className="px-2 py-1 bg-white border border-[#F47C20] text-[#F47C20] rounded-md text-[10px] font-bold uppercase tracking-wider   focus:ring-2 focus:ring-[#F47C20] transition-all flex items-center gap-1 shadow-sm">
                  <Edit2 size={10} /> Edit
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><Mail size={16} className="text-slate-400 shrink-0"/> <span className="truncate break-all">{profile?.email || 'N/A'}</span></div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><Phone size={16} className="text-slate-400 shrink-0"/> <span>{profile?.mobileNumber || 'Not Specified'}</span></div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600"><User size={16} className="text-slate-400 shrink-0"/> <span>{profile?.gender || 'Not Specified'}</span></div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Professional Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2"><BriefcaseIcon size={16}/> Professional Information</h4>
                 {!isEditingProfessional && (
                   <button onClick={() => setIsEditingProfessional(true)} className="px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] rounded-lg text-[11px] font-bold uppercase tracking-wider   focus:ring-2 focus:ring-[#F47C20] transition-all flex items-center gap-1.5 shadow-sm">
                     <Edit2 size={12} /> Edit Details
                   </button>
                 )}
              </div>
              <div className="p-6">
                {isEditingProfessional ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveProfile('professional'); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                        <select value={professionalForm.department} onChange={e => setProfessionalForm({...professionalForm, department: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all cursor-pointer">
                          <option value="">Select Department</option>
                          <option value="Placement Cell">Placement Cell</option>
                          {departments.map(d => <option key={d.code || d.name} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
                        <input type="text" value={professionalForm.designation} onChange={e => setProfessionalForm({...professionalForm, designation: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee ID</label>
                        <input
                          type="text"
                          placeholder="Enter employee ID"
                          value={professionalForm.employeeId || ''}
                          onChange={e => setProfessionalForm({...professionalForm, employeeId: e.target.value})}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => setIsEditingProfessional(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><X size={16}/> Cancel</button>
                      <button type="submit" disabled={!hasProfessionalChanges || isSaving} className={actionBtnStyle + " w-auto px-6"}>
                        <Save size={16}/> {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.department || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.designation || 'Not Specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</p>
                      <p className="text-sm font-extrabold text-slate-800">{profile?.employeeId || 'Not Specified'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information & Security Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                 <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2"><Shield size={16}/> Security & Account Information</h4>
                 <div className="flex flex-row flex-wrap sm:flex-nowrap gap-2.5 w-full lg:w-auto">
                   <button onClick={() => setShowEmailModal(true)} className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap">
                     <Mail size={13}/> Change Email
                   </button>
                   <button onClick={() => setShowPasswordModal(true)} className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap">
                     <KeyRound size={13}/> Change Password
                   </button>
                 </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Status</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle size={12}/> Active</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created Date</p>
                  <span className="text-sm font-extrabold text-slate-800 mt-auto">{profile?.accountCreatedDate ? new Date(profile.accountCreatedDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
                  <div className="text-sm font-extrabold text-slate-800 flex items-start gap-1.5 mt-auto">
                    <Clock size={14} className="text-slate-400 shrink-0 mt-0.5"/>
                    <div className="flex flex-col leading-tight">
                      <span>{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Role</p>
                  <span className="text-sm font-extrabold text-slate-800 uppercase mt-auto">{profile?.role || 'ADMIN'}</span>
                </div>
              </div>
            </div>

            {/* Administrative Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2"><Settings size={16}/> Administrative Operations</h4>
                 {canCreateAdmin(profile?.role) && (
                   <button onClick={() => setShowAddAdminModal(true)} className="px-4 py-2 bg-transparent text-[#F47C20] border border-[#F47C20] rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors focus:outline-none">
                     <Plus size={14} /> Add Admin
                   </button>
                 )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canCreateAdmin(profile?.role) && (
                    <button onClick={() => setShowAddAdminModal(true)} className="flex items-center justify-center gap-2 p-3 bg-[#FFF4EB] border border-[#F47C20]/30 text-[#F47C20] rounded-xl text-xs font-extrabold shadow-xs">
                      <Plus size={16} /> Add New Admin
                    </button>
                  )}
                  <button onClick={() => navigate('/admin/users/students')} className={actionBtnStyle}>
                    <Users size={16}/> Manage Students
                  </button>
                  <button onClick={() => navigate('/admin/alumni')} className={actionBtnStyle}>
                    <GraduationCap size={16}/> Manage Alumni
                  </button>
                  <button onClick={() => navigate('/admin/jobs')} className={actionBtnStyle}>
                    <BriefcaseIcon size={16}/> Manage Jobs
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Personal Info Modal */}
      <Modal isOpen={showPersonalModal} onClose={() => setShowPersonalModal(false)} title="Edit Personal Information">
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          saveProfile('personal').then(() => setShowPersonalModal(false)); 
        }}>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={personalForm.name || ''} onChange={e => setPersonalForm({...personalForm, name: e.target.value})} required className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <input type="text" value={personalForm.mobileNumber || ''} onChange={e => setPersonalForm({...personalForm, mobileNumber: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
              <select value={personalForm.gender || ''} onChange={e => setPersonalForm({...personalForm, gender: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all cursor-pointer">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowPersonalModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold   transition-colors">Cancel</button>
            <button type="submit" disabled={!hasPersonalChanges || isSaving} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold   transition-all shadow-sm flex items-center justify-center gap-2">
              <Save size={16}/> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Email Modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Change Email Address">
        <form onSubmit={handleSelfEmailChange}>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Email Address</label>
              <input disabled type="email" value={profile?.email || ''} className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Email Address</label>
              <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newemail@vvit.net" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowEmailModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold   transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold   transition-all shadow-sm">
              {isSaving ? 'Updating...' : 'Update Email Address'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal with Strength Meter */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Admin Password">
        <ChangePasswordCard 
          isModal={true} 
          apiEndpoint="/admin/change-password" 
          onSuccess={() => setShowPasswordModal(false)} 
        />
      </Modal>
      {/* Add Admin Modal for SUPER_ADMIN */}
      {canCreateAdmin(profile?.role) && (
        <Modal isOpen={showAddAdminModal} onClose={() => setShowAddAdminModal(false)} title="Create Administrator Account">
          <form onSubmit={handleAddAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input type="text" value={addAdminForm.name} onChange={e => setAddAdminForm({...addAdminForm, name: e.target.value})} required placeholder="e.g. Satish Kumar" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
              <input type="email" value={addAdminForm.email} onChange={e => setAddAdminForm({...addAdminForm, email: e.target.value})} required placeholder="e.g. satish.admin@vvit.edu.in" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <select value={addAdminForm.department} onChange={e => setAddAdminForm({...addAdminForm, department: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all cursor-pointer">
                  <option value="Placement Cell">Placement Cell</option>
                  {departments.map(d => <option key={d.code || d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
                <input type="text" value={addAdminForm.designation} onChange={e => setAddAdminForm({...addAdminForm, designation: e.target.value})} placeholder="e.g. Assistant Placement Officer" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                <input type="text" value={addAdminForm.mobileNumber} onChange={e => setAddAdminForm({...addAdminForm, mobileNumber: e.target.value})} placeholder="e.g. 9876543210" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Password *</label>
                <input type="password" value={addAdminForm.password} onChange={e => setAddAdminForm({...addAdminForm, password: e.target.value})} required placeholder="••••••••" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddAdminModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmittingAdmin} className="px-6 py-2.5 bg-transparent border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors flex items-center gap-2 focus:outline-none">
                {isSubmittingAdmin ? 'Creating Admin...' : 'Create Admin Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

