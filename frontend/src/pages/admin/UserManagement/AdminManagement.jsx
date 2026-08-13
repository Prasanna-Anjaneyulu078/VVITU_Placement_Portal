import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../utils/axiosConfig';
import { 
  Search, Plus, ShieldAlert, Copy, Check, Eye, KeyRound, 
  Ban, CheckCircle, X, MoreVertical, Users, Shield, 
  UserX, Edit, User, Briefcase, TrendingUp, Mail, Phone,
  Grid, Table as TableIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../../../hooks/useAuth';
import useDepartments from '../../../hooks/useDepartments';
import { getImageUrl } from "../../../utils/imageUrl";
import { toTitleCase } from '../../../utils/nameUtils';
import { TableLoader, CardLoader } from '../../../components/common/loading';

export default function AdminManagement() {
  const { userEmail } = useAuth();
  const { departments } = useDepartments();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    accountStatus: ''
  });
  
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '', employeeId: '', email: '', mobileNumber: '', designation: '', department: '', gender: 'Male', role: 'ROLE_ADMIN'
  });

  const [editFormData, setEditFormData] = useState({
    name: '', mobileNumber: '', designation: '', department: '', gender: '', role: ''
  });

  const [emailFormData, setEmailFormData] = useState({
    newEmail: ''
  });

  // Action Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/super-admin/admins');
      setAdmins(response.data);
    } catch (err) {
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

  // --- Filtering Logic ---
  const filteredAdmins = useMemo(() => {
    return admins.filter(a => {
      const nameMatch = (a.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = (a.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const empIdMatch = (a.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const desigMatch = (a.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSearch = nameMatch || emailMatch || empIdMatch || desigMatch;
      const matchesRole = filters.role ? (a.role === filters.role || a.role === `ROLE_${filters.role}`) : true;
      const matchesAcc = filters.accountStatus ? a.accountStatus === filters.accountStatus : true;
      
      return matchesSearch && matchesRole && matchesAcc;
    });
  }, [admins, searchTerm, filters]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

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
    } catch (err) {
      toast.error('Failed to update admin account status');
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
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmailModal = (admin) => {
    setSelectedAdmin(admin);
    setEmailFormData({ newEmail: admin.email || '' });
    setShowEmailModal(true);
    setOpenDropdownId(null);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      await api.put(`/super-admin/admins/${selectedAdmin.id}/email`, emailFormData);
      toast.success('Admin email updated successfully');
      setShowEmailModal(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ role: '', accountStatus: '' });
  };

  // --- Components ---
  const StatCard = ({ title, count, subtitle, icon: Icon, colorClass, borderClass, onClick, active }) => (
    <div 
      onClick={onClick}
      className={`bg-white min-w-[200px] flex-shrink-0 flex-1 p-5 rounded-2xl shadow-sm border-2 cursor-pointer transition-all     ${active ? borderClass + ' ' + colorClass.replace('bg-', 'bg-opacity-10 bg-') : 'border-transparent'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-gray-900 tracking-tight">{count}</h4>
          {subtitle && <p className="text-xs font-medium text-gray-400 mt-2 flex items-center gap-1"><TrendingUp size={12}/> {subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="SUPER_ADMIN">
      {/* OVERVIEW HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-[#F47C20] hidden sm:block" size={36} /> Admin Management
          </h2>
          <p className="text-gray-500 font-medium">Manage Placement Portal Administrator Accounts, Access Roles, & Security Settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'table' ? 'bg-white text-[#0A4D8C] shadow-sm' : 'text-gray-500  '}`}
              title="Table View"
            >
              <TableIcon size={16} /> Table
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'grid' ? 'bg-white text-[#0A4D8C] shadow-sm' : 'text-gray-500  '}`}
              title="Grid Cards View"
            >
              <Grid size={16} /> Grid
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#F47C20]   text-white font-bold rounded-xl transition-all shadow-md">
            <Plus size={18} />
            <span>Create New Admin</span>
          </button>
        </div>
      </div>

      {/* INSIGHTS STATS DASHBOARD */}
      <div className="flex overflow-x-auto pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 hide-scrollbar snap-x">
        <div className="snap-start"><StatCard 
          title="Total Admins" count={stats.total} subtitle="Across all roles" icon={Users} 
          colorClass="bg-blue-50 text-[#0A4D8C]" borderClass="border-[#0A4D8C]"
          active={filters.role === '' && filters.accountStatus === ''}
          onClick={() => resetFilters()}
        /></div>
        <div className="snap-start"><StatCard 
          title="Active Accounts" count={stats.active} subtitle="Authorized" icon={CheckCircle} 
          colorClass="bg-emerald-50 text-emerald-600" borderClass="border-emerald-500"
          active={filters.accountStatus === 'ACTIVE'}
          onClick={() => setFilters(prev => ({...prev, accountStatus: 'ACTIVE'}))}
        /></div>
        <div className="snap-start"><StatCard 
          title="Super Admins" count={stats.superAdmins} subtitle="Full access" icon={Shield} 
          colorClass="bg-purple-50 text-purple-600" borderClass="border-purple-500"
          active={filters.role === 'SUPER_ADMIN'}
          onClick={() => setFilters(prev => ({...prev, role: 'SUPER_ADMIN'}))}
        /></div>
        <div className="snap-start"><StatCard 
          title="Inactive / Suspended" count={stats.suspended} subtitle="Access restricted" icon={UserX} 
          colorClass="bg-red-50 text-red-600" borderClass="border-red-500"
          active={filters.accountStatus === 'INACTIVE' || filters.accountStatus === 'SUSPENDED'}
          onClick={() => setFilters(prev => ({...prev, accountStatus: 'INACTIVE'}))}
        /></div>
      </div>

      {/* SMART SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md pb-4 pt-2 -mt-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, email, employee ID, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0A4D8C]/20 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 overflow-x-auto hide-scrollbar">
              <select className="px-4 py-3 bg-gray-50 border-none rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-[#0A4D8C]/20 focus:outline-none cursor-pointer" value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}>
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              
              <select className="px-4 py-3 bg-gray-50 border-none rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-[#0A4D8C]/20 focus:outline-none cursor-pointer" value={filters.accountStatus} onChange={e => setFilters({...filters, accountStatus: e.target.value})}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive / Suspended</option>
              </select>
              
              <button onClick={resetFilters} className="px-5 py-3 text-sm text-gray-500     font-bold rounded-xl transition-all whitespace-nowrap">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT: TABLE OR GRID VIEW */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <TableLoader columns={7} rows={10} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-2">
            <CardLoader count={8} />
          </div>
        )
      ) : filteredAdmins.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No admin accounts found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Try adjusting your search terms or clearing the active filters.</p>
          <button onClick={resetFilters} className="px-6 py-3 bg-[#F47C20]   text-white font-bold rounded-xl transition-colors shadow-sm">
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (DESKTOP & TABLET) */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Admin Profile</th>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Contact & Dept</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                {paginatedAdmins.map(admin => (
                  <tr key={admin.id} className="  transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {admin.profileImageUrl ? (
                          <img src={getImageUrl(admin.profileImageUrl)} alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A4D8C] to-[#1e3a8a] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {admin.name ? admin.name.charAt(0) : 'A'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            {toTitleCase(admin.name)}
                            {(admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') && <Shield size={14} className="text-purple-600" />}
                          </p>
                          <p className="text-xs text-gray-500">{admin.designation || 'Administrator'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                        {admin.employeeId || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col text-xs">
                        <span className="text-gray-900 font-semibold">{admin.email}</span>
                        <span className="text-gray-500">{admin.department || 'General Administration'} • {admin.mobileNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                        (admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {(admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                        admin.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {admin.accountStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedAdmin(admin)} className="p-2 text-gray-500     rounded-lg transition-colors" title="View Profile">
                          <Eye size={16} />
                        </button>
                        {admin.email !== userEmail && (
                          <div className="relative">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === admin.id ? null : admin.id); }}
                              className="p-2 text-gray-400     rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openDropdownId === admin.id && (
                              <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-30 overflow-hidden py-1 text-left">
                                <button onClick={() => handleOpenEdit(admin)} className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2">
                                  <Edit size={14}/> Edit Profile
                                </button>
                                <button onClick={() => handleOpenEmailModal(admin)} className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2">
                                  <Mail size={14}/> Change Email
                                </button>
                                <button onClick={() => handleResetPassword(admin.id)} className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2">
                                  <KeyRound size={14}/> Reset Password
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button 
                                  onClick={() => handleToggleStatus(admin.id, admin.accountStatus)} 
                                  className={`w-full px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${admin.accountStatus === 'ACTIVE' ? 'text-red-600  ' : 'text-emerald-600  '}`}
                                >
                                  {admin.accountStatus === 'ACTIVE' ? <><Ban size={14}/> Deactivate Account</> : <><CheckCircle size={14}/> Activate Account</>}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW (MOBILE / TABLET) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-2">
          {paginatedAdmins.map(admin => (
            <div key={admin.id} className={`bg-white rounded-3xl p-6 border shadow-sm   transition-all duration-300 group relative ${admin.email === userEmail ? 'border-[#F47C20]/50 shadow-[#F47C20]/10' : 'border-gray-100'}`}>
              
              <div className="flex justify-between items-start mb-5">
                <div className="flex gap-4 items-center">
                  {admin.profileImageUrl ? (
                    <img src={getImageUrl(admin.profileImageUrl)} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-50 shadow-sm   transition-transform" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A4D8C] to-[#1e3a8a] text-white flex items-center justify-center font-bold text-2xl shadow-sm   transition-transform">
                      {admin.name ? admin.name.charAt(0) : 'A'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1 flex items-center gap-2">
                      {toTitleCase(admin.name)} 
                      {(admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') && <Shield size={14} className="text-purple-600" />}
                    </h4>
                    <p className="text-gray-500 font-medium text-sm mt-0.5 line-clamp-1">{admin.designation || 'Administrator'}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      ID: {admin.employeeId || 'N/A'}
                    </span>
                  </div>
                </div>

                {admin.email !== userEmail && (
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === admin.id ? null : admin.id); }}
                      className="p-2 text-gray-400     rounded-xl transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openDropdownId === admin.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                        <button onClick={() => { setSelectedAdmin(admin); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2"><Eye size={14}/> View Profile</button>
                        <button onClick={() => handleOpenEdit(admin)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2"><Edit size={14}/> Edit Profile</button>
                        <button onClick={() => handleOpenEmailModal(admin)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2"><Mail size={14}/> Change Email</button>
                        <button onClick={() => handleResetPassword(admin.id)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700   flex items-center gap-2"><KeyRound size={14}/> Reset Password</button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button 
                          onClick={() => handleToggleStatus(admin.id, admin.accountStatus)} 
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${admin.accountStatus === 'ACTIVE' ? 'text-red-600  ' : 'text-emerald-600  '}`}
                        >
                          {admin.accountStatus === 'ACTIVE' ? <><Ban size={14}/> Deactivate Account</> : <><CheckCircle size={14}/> Activate Account</>}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 text-xs font-medium bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-600 flex items-center gap-2"><Mail size={12} className="text-gray-400" /> {admin.email}</span>
                  <span className="text-gray-600 flex items-center gap-2"><Briefcase size={12} className="text-gray-400" /> {admin.department || 'General Administration'}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <span className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold ${
                    (admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {(admin.role === 'SUPER_ADMIN' || admin.role === 'ROLE_SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold ${
                    admin.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {admin.accountStatus}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => setSelectedAdmin(admin)} 
                  className="flex-1 bg-[#F47C20]   text-white font-bold py-2.5 rounded-xl transition-all duration-300 text-sm shadow-sm"
                >
                  View Profile
                </button>
              </div>
              
              {admin.email === userEmail && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-[#F47C20] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md border-2 border-white">
                  YOU
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!isLoading && filteredAdmins.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 pb-12">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl   disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors shadow-sm ${currentPage === i + 1 ? 'bg-[#0A4D8C] text-white' : 'bg-white border border-gray-200 text-gray-700  '}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl   disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* ADMIN PROFILE DRAWER */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAdmin(null)}></div>
          <div className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full bg-white shadow-2xl overflow-y-auto transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield size={20} className="text-[#F47C20]" /> Admin Profile Details</h3>
              <button onClick={() => setSelectedAdmin(null)} className="p-2 text-gray-500     rounded-xl transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 flex-1 space-y-6 bg-gray-50/50">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {selectedAdmin.profileImageUrl ? (
                  <img src={getImageUrl(selectedAdmin.profileImageUrl)} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-sm border-4 border-gray-50" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0A4D8C] to-[#1e3a8a] text-white flex items-center justify-center font-bold text-4xl shadow-sm flex-shrink-0 border-4 border-gray-50">
                    {selectedAdmin.name ? selectedAdmin.name.charAt(0) : 'A'}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-gray-900">{toTitleCase(selectedAdmin.name)}</h2>
                  <p className="text-[#F47C20] font-bold mt-1 text-lg">{selectedAdmin.designation || 'Administrator'}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      (selectedAdmin.role === 'SUPER_ADMIN' || selectedAdmin.role === 'ROLE_SUPER_ADMIN') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(selectedAdmin.role === 'SUPER_ADMIN' || selectedAdmin.role === 'ROLE_SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedAdmin.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedAdmin.accountStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5"><User size={20} className="text-[#0A4D8C]"/> Account & Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Employee ID</p>
                    <p className="font-mono font-bold text-gray-900">{selectedAdmin.employeeId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gender</p>
                    <p className="font-semibold text-gray-900">{selectedAdmin.gender || 'Not Specified'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900 break-all">{selectedAdmin.email}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Mobile Number</p>
                    <p className="font-semibold text-gray-900">{selectedAdmin.mobileNumber || 'Not Provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5"><Briefcase size={20} className="text-[#0A4D8C]"/> Department & Access</h4>
                <div className="grid grid-cols-1 gap-y-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Department</p>
                    <p className="font-semibold text-gray-900">{selectedAdmin.department || 'General Administration'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Account Created Date</p>
                    <p className="font-semibold text-gray-900">{selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-t border-gray-100 p-5 flex gap-3 sticky bottom-0 z-10">
              <button onClick={() => setSelectedAdmin(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl   transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Shield size={24} className="text-[#F47C20]" /> Create New Admin Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400   bg-white p-2 rounded-xl shadow-sm"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={handleInputChange} name="name" placeholder="e.g. Dr. K. Anjaneyulu" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employee ID *</label>
                  <input required type="text" value={formData.employeeId} onChange={handleInputChange} name="employeeId" placeholder="e.g. EMP-101" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input required type="text" value={formData.mobileNumber} onChange={handleInputChange} name="mobileNumber" placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input required type="email" value={formData.email} onChange={handleInputChange} name="email" placeholder="admin@vvit.net" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                  <select value={formData.department} onChange={handleInputChange} name="department" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all">
                    <option value="">Select Department</option>
                    <option value="Placement Cell">Placement Cell</option>
                    {departments.map(d => (
                      <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                  <select value={formData.gender} onChange={handleInputChange} name="gender" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={formData.designation} onChange={handleInputChange} name="designation" placeholder="e.g. Placement Officer" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assign Role</label>
                  <select value={formData.role} onChange={handleInputChange} name="role" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all font-bold text-purple-700">
                    <option value="ROLE_ADMIN">Admin (Standard)</option>
                    <option value="ROLE_SUPER_ADMIN">Super Admin (Full Control)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-600 font-bold   rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#F47C20]   text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN PROFILE MODAL */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Edit size={22} className="text-[#0A4D8C]" /> Edit Admin Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400   bg-white p-2 rounded-xl shadow-sm"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateAdminProfile} className="p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input required type="text" value={editFormData.name} onChange={handleEditInputChange} name="name" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mobile Number</label>
                  <input type="text" value={editFormData.mobileNumber} onChange={handleEditInputChange} name="mobileNumber" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                  <select value={editFormData.gender} onChange={handleEditInputChange} name="gender" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
                  <input type="text" value={editFormData.department} onChange={handleEditInputChange} name="department" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={editFormData.designation} onChange={handleEditInputChange} name="designation" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                  <select value={editFormData.role} onChange={handleEditInputChange} name="role" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4D8C]/20 outline-none font-medium text-sm transition-all">
                    <option value="ROLE_ADMIN">Admin</option>
                    <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-600 font-bold   rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#0A4D8C]   text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE EMAIL MODAL */}
      {showEmailModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><Mail size={20} className="text-[#F47C20]" /> Change Admin Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400   bg-white p-2 rounded-xl shadow-sm"><X size={18}/></button>
            </div>
            <form onSubmit={handleChangeEmail} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Email</label>
                <input disabled type="email" value={selectedAdmin.email} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">New Email Address *</label>
                <input required type="email" value={emailFormData.newEmail} onChange={e => setEmailFormData({ newEmail: e.target.value })} placeholder="newadmin@vvit.net" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F47C20]/20 outline-none font-medium text-sm transition-all" />
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEmailModal(false)} className="px-5 py-2.5 text-gray-600 font-bold   rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#F47C20]   text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Updating...' : 'Update Email Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCredsModal && credentials && (
        <div className="fixed inset-0 z-[60] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all text-center">
            <div className="bg-[#F47C20] p-8 pb-10 relative overflow-hidden">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-inner">
                <Shield size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">Admin Credentials Generated</h3>
              <p className="text-orange-100 mt-2 text-sm font-medium">Please copy or save these login details now.</p>
            </div>
            <div className="p-8 -mt-6">
              <div className="bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-gray-100 relative z-10 text-left">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Admin Name</span>
                  <p className="text-base font-bold text-gray-900">{credentials.name || credentials.identifier || 'Administrator'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Email Address</span>
                  <p className="text-base font-bold text-gray-900 break-all">{credentials.email}</p>
                </div>
                <div className="bg-[#0A4D8C]/10 p-4 rounded-xl border border-[#0A4D8C]/20 mt-4">
                  <span className="text-xs font-bold text-[#0A4D8C] uppercase">Temporary Password</span>
                  <p className="text-2xl font-mono font-bold text-[#F47C20] tracking-wider mt-1">
                    {credentials.temporaryPassword || credentials.password}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-8">
                <button onClick={() => {
                  navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary Password: ${credentials.temporaryPassword || credentials.password}`);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold rounded-xl   transition-colors">
                  {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  {copied ? 'Copied to clipboard!' : 'Copy Credentials'}
                </button>
                <button onClick={() => setShowCredsModal(false)} className="w-full py-3.5 bg-[#F47C20]   text-white font-bold rounded-xl transition-colors shadow-sm">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
