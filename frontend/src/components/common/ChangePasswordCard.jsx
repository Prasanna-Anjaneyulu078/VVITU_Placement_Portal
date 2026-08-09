import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

export default function ChangePasswordCard({ 
  apiEndpoint = '/auth/change-password',
  onSuccess,
  isModal = false,
  cardTitle = 'Security & Password'
}) {
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

  const [isSaving, setIsSaving] = useState(false);

  // Validation rules
  const pass = passwordForm.newPassword;
  const hasMinLength = pass.length >= 8;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[@$!%*?&^#\-_+=<>]/.test(pass);

  const passwordsMatch = passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch && passwordForm.currentPassword.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!passwordsMatch) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        currentPassword: passwordForm.currentPassword,
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      };

      const res = apiEndpoint.includes('/admin/')
        ? await api.put(apiEndpoint, payload)
        : await api.post(apiEndpoint, payload);


      toast.success(res.data?.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwd({ current: false, new: false, confirm: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to change password. Please check your current password.';
      toast.error(typeof errMsg === 'string' ? errMsg : 'Current password is incorrect.');
    } finally {
      setIsSaving(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Password */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Current Password *
        </label>
        <div className="relative">
          <input 
            type={showPwd.current ? "text" : "password"}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
            placeholder="Enter current password"
            className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" 
          />
          <button 
            type="button" 
            onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })} 
            title={showPwd.current ? "Hide password" : "Show password"}
            aria-label={showPwd.current ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
          >
            {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          New Password *
        </label>
        <div className="relative">
          <input 
            type={showPwd.new ? "text" : "password"}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            placeholder="Enter new password"
            className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" 
          />
          <button 
            type="button" 
            onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })} 
            title={showPwd.new ? "Hide password" : "Show password"}
            aria-label={showPwd.new ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
          >
            {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Password Requirements Checklist */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
        <p className="font-bold text-slate-600 mb-1">Password Requirements:</p>
        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
          <Check size={14} /> At least 8 characters
        </div>
        <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
          <Check size={14} /> At least one uppercase letter (A-Z)
        </div>
        <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
          <Check size={14} /> At least one lowercase letter (a-z)
        </div>
        <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
          <Check size={14} /> At least one numeric digit (0-9)
        </div>
        <div className={`flex items-center gap-2 ${hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
          <Check size={14} /> At least one special character (@, $, !, %, *, etc.)
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Confirm New Password *
        </label>
        <div className="relative">
          <input 
            type={showPwd.confirm ? "text" : "password"}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            placeholder="Re-enter new password"
            className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all" 
          />
          <button 
            type="button" 
            onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} 
            title={showPwd.confirm ? "Hide password" : "Show password"}
            aria-label={showPwd.confirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
          >
            {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {passwordForm.confirmPassword && !passwordsMatch && (
          <p className="text-xs font-bold text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={!isPasswordValid || isSaving}
        className="w-full py-2.5 px-4 bg-white border border-[#F47C20] text-[#F47C20] hover:bg-[#F47C20] hover:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer mt-2"
      >
        <KeyRound size={16} />
        {isSaving ? 'Updating Password...' : 'Change Password'}
      </button>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h4 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider flex items-center gap-2">
          <Lock size={16} /> {cardTitle}
        </h4>
      </div>
      <div className="p-6">
        <div className="max-w-md">
          {formContent}
        </div>
      </div>
    </div>
  );
}
