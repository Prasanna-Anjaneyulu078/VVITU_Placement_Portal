import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, KeyRound, Eye, EyeOff, Check, AlertCircle, Calendar, User, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import Modal from './Modal';
import ChangePasswordCard from './ChangePasswordCard';

export default function SecurityAccountCard({
  accountData = null,
  role = 'STUDENT',
  onRefresh
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });
  const [showEmailPwd, setShowEmailPwd] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const userEmail = accountData?.email || accountData?.user?.email || accountData?.account?.email || '';
  const userRole = (accountData?.role || accountData?.user?.role || accountData?.account?.role || role || 'STUDENT').toUpperCase();
  const accountStatus = accountData?.accountStatus || accountData?.user?.accountStatus || accountData?.account?.status || 'ACTIVE';
  const createdAt = accountData?.createdAt || accountData?.user?.createdAt || accountData?.account?.createdAt;
  const lastLogin = accountData?.lastLogin || accountData?.user?.lastLogin || accountData?.account?.lastLogin;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Not available';
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Not available';
    }
  };

  const renderStatusBadge = (statusStr) => {
    const status = (statusStr || 'ACTIVE').toUpperCase();
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    }
    if (status === 'INACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-red-500"></span>
        {status}
      </span>
    );
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const cleanNewEmail = emailForm.newEmail.trim().toLowerCase();
    
    if (!cleanNewEmail) {
      toast.error('New email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (cleanNewEmail === userEmail.toLowerCase()) {
      toast.error('New email address must be different from current email');
      return;
    }
    if (!emailForm.currentPassword) {
      toast.error('Current password is required to verify email change');
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const res = await api.post('/auth/change-email', {
        newEmail: cleanNewEmail,
        currentPassword: emailForm.currentPassword
      });

      toast.success(res.data?.message || 'Email address updated successfully');
      setShowEmailModal(false);
      setEmailForm({ newEmail: '', currentPassword: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to update email address.';
      toast.error(typeof errMsg === 'string' ? errMsg : 'Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-2">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#F47C20]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                Security &amp; Account
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Manage your account security and view account information.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEmailForm({ newEmail: '', currentPassword: '' });
                setShowEmailModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Mail size={14} /> Change Email
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} /> Change Password
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Account Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#F47C20]" /> Account Status
            </span>
            <div className="mt-1">{renderStatusBadge(accountStatus)}</div>
          </div>

          {/* System Role */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-[#F47C20]" /> System Role
            </span>
            <span className="text-sm font-extrabold text-slate-800 tracking-wide mt-1">
              {userRole}
            </span>
          </div>

          {/* Password */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-[#F47C20]" /> Password
            </span>
            <span className="text-sm font-extrabold text-slate-800 tracking-widest mt-1">
              ••••••••••••
            </span>
          </div>

          {/* Email Address */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={14} className="text-[#F47C20]" /> Email Address
            </span>
            <span className="text-sm font-extrabold text-slate-800 break-all mt-1">
              {userEmail || 'Not available'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <ChangePasswordCard
          apiEndpoint="/auth/change-password"
          isModal={true}
          onSuccess={() => setShowPasswordModal(false)}
        />
      </Modal>

      {/* Change Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Change Email Address"
        size="md"
      >
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              New Email Address *
            </label>
            <input
              type="email"
              required
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              placeholder="e.g. new.email@example.com"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Password * (to confirm change)
            </label>
            <div className="relative">
              <input
                type={showEmailPwd ? 'text' : 'password'}
                required
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#F47C20] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowEmailPwd(!showEmailPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
              >
                {showEmailPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingEmail}
              className="px-5 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUpdatingEmail ? 'Updating Email...' : 'Update Email Address'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
