import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../utils/axiosConfig';
import { 
  Plus, ShieldAlert, Copy, Check, Eye, KeyRound, 
  Ban, CheckCircle, X, MoreVertical, Users, Shield, 
  UserX, Edit, User, Briefcase, Mail, Phone, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../../../hooks/useAuth';
import useDepartments from '../../../hooks/useDepartments';
import Avatar from '../../../components/common/Avatar';
import Pagination from '../../../components/common/Pagination';
import { toTitleCase } from '../../../utils/nameUtils';
import { TableLoader } from '../../../components/common/loading';

export default function AdminManagement() {
  const { userEmail } = useAuth();
  const { departments } = useDepartments();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminToDeactivate, setAdminToDeactivate] = useState(null);
  
  
  
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '', employeeId: '', email: '', mobileNumber: '', designation: '', department: '', gender: 'Male', role: 'ROLE_ADMIN'
  });

  const [editFormData, setEditFormData] = useState({
    name: '', employeeId: '', mobileNumber: '', designation: '', department: '', gender: '', role: ''
  });

  // Action Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openDropdownId !== null && !e.target.closest('.admin-action-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openDropdownId]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.get('/super-admin/admins');
      setAdmins(response.data || []);
    } catch (err) {
      console.error('Failed to fetch admins directory', err);
      setIsError(true);
      toast.error('Failed to fetch admins directory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Pagination Logic ---
  const totalPages = Math.max(1, Math.ceil(admins.length / itemsPerPage));
  
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return admins.slice(start, start + itemsPerPage);
  }, [admins, currentPage]);

  // --- Statistics ---
  const stats = useMemo(() => {
    const total = admins.length;
    const active = admins.filter(a => a.accountStatus === 'ACTIVE').length;
    const suspended = admins.filter(a => a.accountStatus === 'SUSPENDED' || a.accountStatus === 'INACTIVE').length;
    const superAdmins = admins.filter(a => a.role === 'SUPER_ADMIN' || a.role === 'ROLE_SUPER_ADMIN').length;
    return { total, active, suspended, superAdmins };
  }, [admins]);

  // --- Actions ---
  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      const newStatus = (currentStatus === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/super-admin/admins/${adminId}/status?status=${newStatus}`);
      toast.success(`Account ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      fetchAdmins();
      setOpenDropdownId(null);
      setShowDeactivateModal(false);
      setAdminToDeactivate(null);
    } catch (err) {
      toast.error('Failed to update admin account status');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDeactivate) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/super-admin/admins/${adminToDeactivate.id}`);
      toast.success('Admin deleted successfully');
      fetchAdmins();
      setShowDeactivateModal(false);
      setAdminToDeactivate(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (adminId) => {
    try {
      setIsSubmitting(true);
      const response = await api.post(`/super-admin/admins/${adminId}/reset-password`);
      setCredentials(response.data);
      toast.success('Admin password reset successfully');
      setShowCredsModal(true);
      setOpenDropdownId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await api.post('/super-admin/admins', formData);
      setCredentials(response.data);
      toast.success('Admin account created successfully!');
      setShowAddModal(false);
      setShowCredsModal(true);
      fetchAdmins();
      setFormData({
        name: '', employeeId: '', email: '', mobileNumber: '', designation: '', department: '', gender: 'Male', role: 'ROLE_ADMIN'
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name || '',
      employeeId: admin.employeeId || '',
      mobileNumber: admin.mobileNumber || '',
      designation: admin.designation || '',
      department: admin.department || '',
      gender: admin.gender || 'Male',
      role: admin.role || 'ROLE_ADMIN'
    });
    setShowEditModal(true);
    setOpenDropdownId(null);
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      await api.put(`/super-admin/admins/${selectedAdmin.id}`, editFormData);
      toast.success('Admin profile updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };



  return (
    <DashboardLayout role="super_admin">
      <div className="w-full max-w-[1600px] mx-auto pb-12 space-y-6">
        
        {/* 1. PAGE HEADER (Title & Description ONLY) */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="text-[#F47C20]" size={28} />
            Manage Administrators
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Create, manage, and monitor administrator accounts.
          </p>
        </div>

        {/* 2. STATISTICS CARDS (4 Equal-Width Cards in 1 Row on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Admins</p>
              <p className="text-3xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Admins</p>
              <p className="text-3xl font-extrabold text-emerald-600">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inactive Admins</p>
              <p className="text-3xl font-extrabold text-amber-600">{stats.suspended}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <UserX size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Super Admins</p>
              <p className="text-3xl font-extrabold text-purple-600">{stats.superAdmins}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>


        {/* 4. MANAGE ADMINISTRATORS SECTION HEADER */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Manage Administrators
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none transition-none focus:outline-none focus:ring-2 focus:ring-[#F47C20]/40"
          >
            <Plus size={18} className="text-[#F47C20]" />
            <span>Add Admin</span>
          </button>
        </div>

        {/* 5. ADMINISTRATOR TABLE & CARDS AREA */}
        {isError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <AlertCircle size={44} className="text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Unable to load administrators</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Please check your connection and try again.</p>
            <button
              onClick={fetchAdmins}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none"
            >
              <RefreshCw size={16} className="text-[#F47C20]" />
              <span>Retry</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <TableLoader rows={6} />
          </div>
        ) : admins.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mx-auto text-[#F47C20]">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No administrators found
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Create an administrator account to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none"
            >
              <Plus size={16} className="text-[#F47C20]" />
              <span>Add Admin</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* DESKTOP TABLE VIEW (sm and up) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-5">Administrator</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Department & Designation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {paginatedAdmins.map((admin) => {
                    const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN';
                    const isActive = admin.accountStatus === 'ACTIVE';

                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Administrator Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={admin.profileImageUrl}
                              name={admin.name || 'Admin'}
                              size="md"
                              className="w-10 h-10 shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                                {toTitleCase(admin.name || 'Unknown User')}
                                {admin.email === userEmail && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#FFF4EB] text-[#F47C20] rounded-md border border-[#F47C20]/30">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{admin.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isSuper
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {isSuper ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>

                        {/* Department & Designation Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{admin.designation || 'Administrator'}</p>
                          <p className="text-xs text-slate-400">{admin.department || 'Placement Cell'}</p>
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isActive ? <CheckCircle size={12} /> : <UserX size={12} />}
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Created Date Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">

                            <button
                              onClick={() => handleOpenEdit(admin)}
                              className="px-2.5 py-1.5 bg-white border border-[#F47C20]/40 text-[#F47C20] font-bold text-xs rounded-lg select-none"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (isActive) {
                                  setAdminToDeactivate(admin);
                                  setShowDeactivateModal(true);
                                } else {
                                  handleToggleStatus(admin.id, admin.accountStatus);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-white border border-[#F47C20]/40 text-[#F47C20] font-bold text-xs rounded-lg select-none"
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(admin.id)}
                              className="px-2.5 py-1.5 bg-white border border-[#F47C20]/40 text-[#F47C20] font-bold text-xs rounded-lg select-none"
                            >
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW (xs only) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {paginatedAdmins.map((admin) => {
                const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN';
                const isActive = admin.accountStatus === 'ACTIVE';

                return (
                  <div key={admin.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={admin.profileImageUrl}
                          name={admin.name || 'Admin'}
                          size="md"
                          className="w-12 h-12 shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                            {toTitleCase(admin.name || 'Unknown User')}
                            {admin.email === userEmail && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#FFF4EB] text-[#F47C20] rounded-md border border-[#F47C20]/30">
                                YOU
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{admin.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5">
                      <div>
                        <span className="text-slate-400 font-medium">Role: </span>
                        <span className={`font-bold ${isSuper ? 'text-purple-700' : 'text-blue-700'}`}>
                          {isSuper ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Status: </span>
                        <span className={`font-bold ${isActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-medium">Desig / Dept: </span>
                        <span className="font-semibold text-slate-800">{admin.designation || 'Administrator'} • {admin.department || 'Placement Cell'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">

                      <button
                        onClick={() => handleOpenEdit(admin)}
                        className="flex-1 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl text-center select-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (isActive) {
                            setAdminToDeactivate(admin);
                            setShowDeactivateModal(true);
                          } else {
                            handleToggleStatus(admin.id, admin.accountStatus);
                          }
                        }}
                        className="flex-1 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl text-center select-none"
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SHARED PAGINATION */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={admins.length}
              pageSize={itemsPerPage}
              itemLabel="administrators"
            />
          </div>
        )}

      </div>



      {/* CREATE NEW ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Shield size={22} className="text-[#F47C20]" /> Create Administrator Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={handleInputChange} name="name" placeholder="e.g. Dr. K. Anjaneyulu" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID *</label>
                  <input required type="text" value={formData.employeeId} onChange={handleInputChange} name="employeeId" placeholder="e.g. EMP-101" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input required type="text" value={formData.mobileNumber} onChange={handleInputChange} name="mobileNumber" placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input required type="email" value={formData.email} onChange={handleInputChange} name="email" placeholder="admin@vvit.net" autoComplete="username" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select value={formData.department} onChange={handleInputChange} name="department" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] outline-none font-medium text-sm">
                    <option value="">Select Department</option>
                    <option value="Placement Cell">Placement Cell</option>
                    {departments.map(d => (
                      <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                  <select value={formData.gender} onChange={handleInputChange} name="gender" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] outline-none font-medium text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={formData.designation} onChange={handleInputChange} name="designation" placeholder="e.g. Placement Officer" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Role</label>
                  <select value={formData.role} onChange={handleInputChange} name="role" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] outline-none font-extrabold text-sm text-purple-700">
                    <option value="ROLE_ADMIN">Admin (Standard)</option>
                    <option value="ROLE_SUPER_ADMIN">Super Admin (Full Control)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PROFILE MODAL */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Edit size={22} className="text-[#F47C20]" /> Edit Admin Profile
              </h3>
              <button onClick={() => { setShowEditModal(false); setSelectedAdmin(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateAdminProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input required type="text" value={editFormData.name} onChange={handleEditInputChange} name="name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                  <input type="text" value={editFormData.mobileNumber} onChange={handleEditInputChange} name="mobileNumber" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={editFormData.designation} onChange={handleEditInputChange} name="designation" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select value={editFormData.department} onChange={handleEditInputChange} name="department" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] outline-none font-medium text-sm">
                    <option value="">Select Department</option>
                    <option value="Placement Cell">Placement Cell</option>
                    {departments.map(d => (
                      <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
                  <input type="text" value={editFormData.employeeId} onChange={handleEditInputChange} name="employeeId" placeholder="e.g. EMP-101" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                  <select value={editFormData.role} onChange={handleEditInputChange} name="role" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#F47C20] outline-none font-extrabold text-sm text-purple-700">
                    <option value="ROLE_ADMIN">Admin (Standard)</option>
                    <option value="ROLE_SUPER_ADMIN">Super Admin (Full Control)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedAdmin(null); }} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS DISPLAY MODAL */}
      {showCredsModal && credentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <KeyRound size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Administrator Credentials</h3>
              <p className="text-xs text-slate-500">Copy these credentials before closing.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs font-mono">
              <div>
                <p className="text-slate-400 font-bold uppercase">Email</p>
                <p className="font-bold text-slate-900 break-all">{credentials.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Temporary Password</p>
                <p className="font-bold text-[#F47C20] text-sm break-all">{credentials.temporaryPassword || credentials.password}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => copyToClipboard(`Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword || credentials.password}`)}
                className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 select-none"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setShowCredsModal(false)}
                className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Delete Modal */}
      {showDeactivateModal && adminToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all">
            <div className="bg-red-50 p-5 flex flex-col items-center border-b border-red-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 text-center">Manage Admin Access</h3>
              <p className="text-sm text-slate-500 mt-1 text-center font-medium">
                Choose an action for <strong>{adminToDeactivate.name}</strong>.
              </p>
            </div>
            
            <div className="p-5 space-y-3">
              <button
                onClick={() => handleToggleStatus(adminToDeactivate.id, adminToDeactivate.accountStatus)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Ban size={18} />
                Deactivate Admin
              </button>
              
              <button
                onClick={handleDeleteAdmin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <UserX size={18} />
                Delete Admin
              </button>
              
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setAdminToDeactivate(null);
                }}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
