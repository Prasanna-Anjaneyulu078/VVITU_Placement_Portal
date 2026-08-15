import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { DocumentViewerModal } from '../../components/common';
import { AlumniDetailsModal } from '../../components/alumni';
import Pagination from '../../components/common/Pagination';
import { TableLoader } from '../../components/common/loading';

import { toTitleCase } from '../../utils/nameUtils';
import Avatar from '../../components/common/Avatar';
import {
  Search, ShieldCheck, CheckCircle, X,
  Users, AlertCircle, FileText,
  Target, ChevronLeft, ChevronRight, RefreshCw, Trash2,
  ScanSearch, GraduationCap, Building2, CheckCircle2,
  Ban, Shield, UserX, Eye
} from "lucide-react";

export default function AdminAlumni() {
  const [alumniUsers, setAlumniUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    verificationStatus: '',
    department: '',
    graduationYear: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [rejectingAlum, setRejectingAlum] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [viewingDocs, setViewingDocs] = useState(null);
  const [docMetadata, setDocMetadata] = useState(null);
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);
  
  const [deletingAlum, setDeletingAlum] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleViewDocs = async (alum) => {
    if (!alum) return;
    setViewingDocs(alum);
    setIsDocLoading(true);
    setDocError(null);
    setDocMetadata(null);
    setDocBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    try {
      const blobRes = await api.get(`/admin/alumni/${alum.id}/document`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(blobRes.data);
      setDocBlobUrl(blobUrl);
      
      let fileName = 'Document.pdf';
      const disposition = blobRes.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) { 
          fileName = matches[1].replace(/['"]/g, '');
        }
      }
      setDocMetadata({ documentName: fileName });
    } catch (err) {
      console.error('Failed to load document:', err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Document Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to load document');
      setDocError(errMsg);
    } finally {
      setIsDocLoading(false);
    }
  };

  const handleCloseDocModal = () => {
    setViewingDocs(null);
    setIsDocLoading(false);
    setDocError(null);
    setDocBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  };

  const fetchAlumni = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await api.get('/admin/alumni');
      setAlumniUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load alumni', err);
      setIsError(true);
      toast.error('Failed to load alumni directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const verifyUser = async (id, status, reason = null) => {
    try {
      const backendStatus = status === 'Verified' ? 'APPROVE' : 'REJECT';
      await api.post(`/admin/alumni/verify/${id}`, { 
        status: backendStatus,
        reason: reason
      });
      toast.success(status === 'Verified' ? 'Alumni Approved Successfully' : 'Alumni Rejected');
      if (rejectingAlum) setRejectingAlum(null);
      if (selectedAlumni && selectedAlumni.id === id) {
        setSelectedAlumni(prev => ({...prev, verificationStatus: status === 'Verified' ? 'VERIFIED' : 'REJECTED'}));
      }
      setRejectionReason('');
      fetchAlumni();
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Verification Failed');
    }
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    verifyUser(rejectingAlum.id, 'Rejected', rejectionReason);
  };

  const handleDeleteAlumni = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    try {
      await api.delete(`/admin/alumni/${deletingAlum.id}`);
      toast.success('Alumni account deleted successfully.');
      setDeletingAlum(null);
      setDeleteConfirmText('');
      if (selectedAlumni && selectedAlumni.id === deletingAlum.id) {
        setSelectedAlumni(null);
      }
      setAlumniUsers(prev => prev.filter(alum => alum.id !== deletingAlum.id));
    } catch (err) {
      console.error('Failed to delete alumni', err);
      toast.error('Unable to delete alumni account.');
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = alumniUsers.length;
    const verified = alumniUsers.filter(a => a.verificationStatus === 'VERIFIED').length;
    const pending = alumniUsers.filter(a => a.verificationStatus === 'PENDING').length;
    const rejected = alumniUsers.filter(a => a.verificationStatus === 'REJECTED').length;
    return { total, verified, pending, rejected };
  }, [alumniUsers]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return alumniUsers.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const name = (u.user?.name || u.name || '').toLowerCase();
      const email = (u.user?.email || u.email || '').toLowerCase();
      const rollNumber = (u.rollNumber || u.rollNo || u.user?.rollNumber || '').toLowerCase();
      const company = (u.companyName || u.company || u.currentCompany || '').toLowerCase();
      const designation = (u.designation || u.role || '').toLowerCase();
      const dept = (u.department || '').toLowerCase();
      
      const matchesSearch = !q || name.includes(q) || email.includes(q) || rollNumber.includes(q) || company.includes(q) || designation.includes(q) || dept.includes(q);
      
      let matchesVer = true;
      if (filters.verificationStatus) {
        matchesVer = u.verificationStatus === filters.verificationStatus;
      }
      
      let matchesDept = true;
      if (filters.department) {
        matchesDept = u.department === filters.department;
      }

      let matchesYear = true;
      if (filters.graduationYear) {
        const passout = u.passoutYear || u.graduationYear || u.graduation;
        matchesYear = String(passout) === String(filters.graduationYear);
      }

      return matchesSearch && matchesVer && matchesDept && matchesYear;
    });
  }, [alumniUsers, searchTerm, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const resetFilters = () => {
    setFilters({ verificationStatus: '', department: '', graduationYear: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || filters.verificationStatus || filters.department || filters.graduationYear);

  const getStatusStyle = (status) => {
    if(status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if(status === 'REJECTED') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-[#FFF4EB] text-[#F47C20] border-[#F47C20]/30';
  };

  const departments = [...new Set(alumniUsers.map(u => u.department).filter(Boolean))];

  const StatCard = ({ title, count, icon: Icon, palette, active, onClick }) => (
    <button onClick={onClick} className={`group relative w-full text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden shadow-xs focus:outline-none flex items-center justify-between h-[76px] ${active ? `border-[#F47C20] ${palette.bg}` : "bg-white border-slate-200"}`}>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <p className={`text-2xl font-extrabold tracking-tight ${palette.text}`}>{count}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.icon}`}><Icon size={18} /></div>
      {active && <div className="absolute bottom-0 left-0 h-1 w-full bg-[#F47C20]" />}
    </button>
  );

  return (
    <DashboardLayout role="admin">
      <div className="w-full max-w-[1600px] mx-auto pb-12 space-y-6">

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="text-[#F47C20]" size={28} />
            Manage Alumni
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Review, verify, and manage registered alumni accounts.
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Alumni" count={stats.total} icon={GraduationCap}
            palette={{ bg:"bg-blue-50", icon:"bg-blue-100 text-blue-600", text:"text-blue-700" }}
            active={!filters.verificationStatus} onClick={resetFilters} />
          <StatCard title="Verified" count={stats.verified} icon={ShieldCheck}
            palette={{ bg:"bg-emerald-50", icon:"bg-emerald-100 text-emerald-600", text:"text-emerald-700" }}
            active={filters.verificationStatus==="VERIFIED"} onClick={() => setFilters(p => ({...p, verificationStatus:"VERIFIED"}))} />
          <StatCard title="Pending" count={stats.pending} icon={RefreshCw}
            palette={{ bg:"bg-orange-50", icon:"bg-orange-100 text-orange-500", text:"text-orange-600" }}
            active={filters.verificationStatus==="PENDING"} onClick={() => setFilters(p => ({...p, verificationStatus:"PENDING"}))} />
          <StatCard title="Rejected" count={stats.rejected} icon={Ban}
            palette={{ bg:"bg-red-50", icon:"bg-red-100 text-red-600", text:"text-red-700" }}
            active={filters.verificationStatus==="REJECTED"} onClick={() => setFilters(p => ({...p, verificationStatus:"REJECTED"}))} />
        </div>

        {/* ALUMNI SEARCH & FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by alumni name, email, company, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20] focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 bg-slate-200/60 rounded-full transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {departments.length > 0 && (
              <select
                value={filters.department}
                onChange={(e) => setFilters(p => ({ ...p, department: e.target.value }))}
                className="h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <select
              value={filters.verificationStatus}
              onChange={(e) => setFilters(p => ({ ...p, verificationStatus: e.target.value }))}
              className="h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
            >
              <option value="">All Verification Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="h-11 px-4 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none"
                title="Reset filters"
              >
                <RefreshCw size={14} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ALUMNI CONTENT AREA: ERROR, LOADING, EMPTY, TABLE & CARDS */}
        {isError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <AlertCircle size={44} className="text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Unable to load alumni</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Please check your connection and try again.</p>
            <button
              onClick={fetchAlumni}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-sm rounded-xl select-none"
            >
              <RefreshCw size={16} className="text-[#F47C20]" />
              <span>Retry</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <TableLoader columns={5} rows={8} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mb-4 text-[#F47C20]">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No alumni found</h3>
            <p className="text-slate-500 text-sm max-w-md mb-6">
              {hasActiveFilters ? 'Try changing your search keywords or active filters.' : 'There are currently no registered alumni in the database.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl select-none"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-5">Alumni Profile</th>
                    <th className="py-3.5 px-4">Department & Passout</th>
                    <th className="py-3.5 px-4">Current Role & Company</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {currentUsers.map((alum) => (
                    <tr key={alum.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={alum.profileImageUrl || alum.user?.profileImageUrl}
                            name={alum.user?.name || alum.name || 'Alumni'}
                            size="md"
                            className="w-10 h-10 shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {toTitleCase(alum.user?.name || alum.name || 'Alumni')}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{alum.user?.email || alum.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{alum.department || 'N/A'}</p>
                        <p className="text-xs text-slate-400">Batch of {alum.passoutYear || alum.graduationYear || 'N/A'}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{alum.designation || 'Alumni'}</p>
                        <p className="text-xs text-slate-400">{alum.companyName || alum.company || 'Not Specified'}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(alum.verificationStatus)}`}>
                          {alum.verificationStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAlumni(alum)}
                            className="px-2.5 py-1.5 bg-white border border-[#F47C20]/40 text-[#F47C20] font-bold text-xs rounded-lg select-none"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => setDeletingAlum(alum)}
                            className="px-2.5 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold text-xs rounded-lg select-none"
                          >
                            Delete Alumni
                          </button>
                          {alum.verificationStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => verifyUser(alum.id, 'Verified')}
                                className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs rounded-lg select-none"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingAlum(alum)}
                                className="px-2.5 py-1.5 bg-red-50 border border-red-300 text-red-700 font-bold text-xs rounded-lg select-none"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {currentUsers.map((alum) => (
                <div key={alum.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={alum.profileImageUrl || alum.user?.profileImageUrl}
                      name={alum.user?.name || alum.name || 'Alumni'}
                      size="md"
                      className="w-12 h-12 shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {toTitleCase(alum.user?.name || alum.name || 'Alumni')}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{alum.user?.email || alum.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5">
                    <div>
                      <span className="text-slate-400 font-medium">Dept: </span>
                      <span className="font-semibold text-slate-800">{alum.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Status: </span>
                      <span className={`font-bold ${alum.verificationStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {alum.verificationStatus}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium">Company: </span>
                      <span className="font-semibold text-slate-800">{alum.companyName || alum.company || 'Not Specified'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedAlumni(alum)}
                      className="flex-1 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl text-center select-none"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => setDeletingAlum(alum)}
                      className="flex-1 py-1.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-extrabold text-xs rounded-xl text-center select-none"
                    >
                      Delete Alumni
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SHARED COMPACT PAGINATION */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={filteredUsers.length}
              pageSize={itemsPerPage}
              itemLabel="alumni"
            />
          </div>
        )}

      </div>

      {/* DETAILED PROFILE MODAL */}
      <AlumniDetailsModal
        alumni={selectedAlumni}
        isOpen={Boolean(selectedAlumni)}
        onClose={() => setSelectedAlumni(null)}
        onViewDocument={handleViewDocs}
      />

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDocs)}
        onClose={handleCloseDocModal}
        documentUrl={docBlobUrl}
        documentName={docMetadata?.documentName || 'Alumni Verification Document'}
        isLoading={isDocLoading}
        error={docError}
      />

      {/* DELETE ALUMNI MODAL */}
      {deletingAlum && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F47C20]">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Alumni Account</h3>
              <p className="text-sm text-slate-600 font-medium mb-1">Are you sure you want to permanently delete this alumni account ({toTitleCase(deletingAlum.user?.name || deletingAlum.name || 'Alumni')})?</p>
              <p className="text-xs text-[#F47C20] font-bold mb-3">This action cannot be undone. The alumni's account and all associated records will be permanently removed.</p>
              <p className="text-xs text-slate-500 mb-4">Type <span className="font-bold font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm deletion.</p>
            </div>
            <input 
              type="text" 
              placeholder="Type DELETE" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 mb-6 outline-none focus:border-[#F47C20] focus:bg-white transition-all font-mono text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeletingAlum(null); setDeleteConfirmText(""); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">Cancel</button>
              <button 
                onClick={handleDeleteAlumni} 
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">
                Delete Alumni
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
