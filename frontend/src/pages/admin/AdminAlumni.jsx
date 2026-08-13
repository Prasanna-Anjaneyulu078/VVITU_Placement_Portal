import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { DocumentViewerModal, Modal } from '../../components/common';
import { TableLoader } from '../../components/common/loading';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { toTitleCase } from '../../utils/nameUtils';
import { getImageUrl } from '../../utils/imageUrl';
import {
  Search, ShieldCheck, CheckCircle, X,
  Users, AlertCircle, FileText,
  Target, ChevronLeft, ChevronRight, RefreshCw, Trash2,
  ScanSearch, GraduationCap, Building2, CheckCircle2,
  Ban
} from "lucide-react";

export default function AdminAlumni() {
  const [alumniUsers, setAlumniUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
      
      // Determine file name from header if possible, or fallback
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
    try {
      const res = await api.get('/admin/alumni');
      setAlumniUsers(res.data);
    } catch (err) {
      console.error('Failed to load alumni', err);
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

  // Filtering
  const filteredUsers = useMemo(() => {
    return alumniUsers.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const name = (u.user?.name || u.name || '').toLowerCase();
      const email = (u.user?.email || u.email || '').toLowerCase();
      const company = (u.companyName || u.company || u.currentCompany || '').toLowerCase();
      const designation = (u.designation || u.role || '').toLowerCase();
      const dept = (u.department || '').toLowerCase();
      
      const matchesSearch = !q || name.includes(q) || email.includes(q) || company.includes(q) || designation.includes(q) || dept.includes(q);
      
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
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setFilters({ verificationStatus: '', department: '', graduationYear: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusStyle = (status) => {
    if(status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if(status === 'REJECTED') return 'bg-red-50 text-red-600 border-red-200';
    return 'bg-[#FFF4EB] text-[#F47C20] border-[#F47C20]/30';
  };

  const departments = [...new Set(alumniUsers.map(u => u.department).filter(Boolean))];
  const graduationYears = [...new Set(alumniUsers.map(u => u.passoutYear || u.graduationYear || u.graduation).filter(Boolean))].sort((a, b) => b - a);

  const StatCard = ({ title, count, icon: Icon, palette, active, onClick }) => (
    <button onClick={onClick} className={`group relative w-full text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden shadow-sm   focus:outline-none flex items-center justify-between h-[76px] ${active ? `border-[#F47C20] ${palette.bg}` : "bg-white border-slate-200  "}`}>
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
      
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by alumni name, email, company, or department..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F47C20] focus:bg-white transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-slate-200/60 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
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
              onChange={(e) => { setFilters(p => ({ ...p, department: e.target.value })); setCurrentPage(1); }}
              className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <select
            value={filters.verificationStatus}
            onChange={(e) => { setFilters(p => ({ ...p, verificationStatus: e.target.value })); setCurrentPage(1); }}
            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
          >
            <option value="">All Verification Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {(searchTerm || filters.department || filters.verificationStatus || filters.graduationYear) && (
            <button
              onClick={resetFilters}
              className="h-11 px-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset filters"
            >
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ALUMNI TABLE */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <TableLoader columns={4} rows={10} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="text-slate-400" size={24}/>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Alumni Found</h3>
          <p className="text-slate-500 text-sm max-w-md">Try adjusting your search or filters to find the alumni you're looking for.</p>
          <button onClick={resetFilters} className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl   transition-colors">Clear All Filters</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="py-4 px-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">Alumni Details</th>
                  <th className="py-4 px-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">Professional Info</th>
                  <th className="py-4 px-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">Status & OCR</th>
                  <th className="py-4 px-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentUsers.map(alum => (
                  <tr key={alum.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center">
                           <img src={getImageUrl(alum.profileImageUrl) || generateAvatarSVG(alum.user?.name || 'Unknown', 'random')} onError={(e) => { e.target.onerror = null; e.target.src = generateAvatarSVG(alum.user?.name || 'Unknown', 'random'); }} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate leading-tight transition-colors">{toTitleCase(alum.user?.name)}</p>
                          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{alum.department || "N/A"}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{alum.passingYear ? `Class of ${alum.passingYear}` : 'Year N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{alum.company || "Not Provided"}</div>
                      {alum.designation && <div className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[200px]">{alum.designation}</div>}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-2 items-start">
                         <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(alum.verificationStatus)}`}>
                            {alum.verificationStatus}
                         </span>
                         <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            alum.ocrVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`} title={alum.ocrVerified ? 'OCR Verified' : 'OCR not verified'}>
                            <ScanSearch className="w-2.5 h-2.5" />
                            {alum.ocrVerified ? 'OCR ✓' : 'OCR —'}
                          </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right align-middle">
                      <button onClick={() => setSelectedAlumni(alum)}
                        className="px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] text-[11px] font-bold rounded-lg active:scale-95 transition-all shadow-sm focus:outline-none whitespace-nowrap cursor-pointer">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS */}
          <div className="block md:hidden divide-y divide-slate-100">
            {currentUsers.map(alum => (
              <div key={alum.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                      <img src={getImageUrl(alum.profileImageUrl) || generateAvatarSVG(alum.user?.name || 'Unknown', 'random')} onError={(e) => { e.target.onerror = null; e.target.src = generateAvatarSVG(alum.user?.name || 'Unknown', 'random'); }} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{toTitleCase(alum.user?.name)}</h4>
                      <p className="text-xs font-semibold text-[#F47C20] truncate">{alum.company || 'Company N/A'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedAlumni(alum)}
                    className="px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-2xs shrink-0 cursor-pointer"
                  >
                    Details
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{alum.department || 'N/A'}</span>
                    {alum.passingYear && <span>• Class of {alum.passingYear}</span>}
                  </div>

                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(alum.verificationStatus)}`}>
                    {alum.verificationStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600     disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={15}/>
                </button>
                {[...Array(Math.min(totalPages,7))].map((_,i) => {
                  const pg = totalPages<=7 ? i+1 : currentPage<=4 ? i+1 : currentPage>=totalPages-3 ? totalPages-6+i : currentPage-3+i;
                  return (
                    <button key={pg} onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage===pg ? "border border-[#F47C20] bg-white text-[#F47C20] shadow-sm" : "border border-slate-200 bg-white text-slate-600      "}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600     disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={15}/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAILED PROFILE MODAL */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAlumni(null)}/>
          <div className="relative w-full max-w-7xl max-h-[90vh] bg-[#F8FAFC] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="font-extrabold text-slate-800 text-lg">Alumni Profile</h3>
              <button onClick={() => setSelectedAlumni(null)} className="w-8 h-8 flex items-center justify-center rounded-xl   text-slate-400   transition-colors"><X size={20}/></button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* LEFT COLUMN (Identity & Quick Actions) */}
                <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-0">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-100 shadow-sm shrink-0">
                       <img src={getImageUrl(selectedAlumni.profileImageUrl) || generateAvatarSVG(selectedAlumni.user?.name || 'Unknown', 'random')} onError={(e) => { e.target.onerror = null; e.target.src = generateAvatarSVG(selectedAlumni.user?.name || 'Unknown', 'random'); }} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{toTitleCase(selectedAlumni.user?.name)}</h2>
                    <p className="text-[#F47C20] font-bold text-base mb-4">{selectedAlumni.rollNumber || "No Roll No"}</p>
                    
                    <div className="w-full h-px bg-slate-100 my-4"></div>
                    
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Department</span>
                        <span className="font-bold text-slate-800">{selectedAlumni.department || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-semibold">Class of</span>
                        <span className="font-bold text-slate-800">{selectedAlumni.passingYear || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-slate-500 font-semibold">Status</span>
                        {selectedAlumni.verificationStatus === "VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle size={10}/> VERIFIED</span>
                        ) : selectedAlumni.verificationStatus === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200"><Ban size={10}/> REJECTED</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF4EB] text-[#F47C20] border border-[#F47C20]/30"><AlertCircle size={10}/> PENDING</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Information */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h4 className="font-bold text-[#F47C20] text-sm mb-4 flex items-center gap-2 uppercase tracking-wide"><Users size={16} /> Personal Info</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                        <p className="text-sm font-semibold text-slate-800 break-all">{selectedAlumni.user?.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p>
                          <p className="text-sm font-semibold text-slate-800">{selectedAlumni.mobileNumber || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>

                {/* RIGHT COLUMN (Content & Details) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Professional Info */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h4 className="font-bold text-[#F47C20] text-sm mb-4 flex items-center gap-2 uppercase tracking-wide"><Building2 size={16} /> Professional Info</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Organization</p>
                          <p className="text-base font-extrabold text-slate-800">{selectedAlumni.company || "Not Provided"}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                          <p className="text-base font-extrabold text-slate-800">{selectedAlumni.designation || "Not Provided"}</p>
                       </div>
                    </div>
                  </div>

                  {/* Document Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h4 className="font-bold text-[#F47C20] text-sm mb-4 flex items-center gap-2 uppercase tracking-wide"><FileText size={16}/> Verification Document</h4>
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 bg-[#FFF4EB] rounded-xl flex items-center justify-center text-[#F47C20] flex-shrink-0">
                          <FileText size={24} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-sm truncate">ID / Degree Document</h3>
                          <p className="text-xs text-slate-500">Ready for review</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleViewDocs(selectedAlumni)} disabled={isDocLoading} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[#F47C20] text-[#F47C20] text-xs font-bold rounded-lg   disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 flex items-center gap-2 justify-center">
                          {isDocLoading && <RefreshCw size={14} className="animate-spin" />}
                          {isDocLoading ? 'Loading...' : 'View Document'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Actions */}
                  <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 mt-auto border-t-4 border-t-[#F47C20]">
                    <h4 className="font-bold text-[#F47C20] text-sm mb-4 flex items-center gap-2 uppercase tracking-wide"><ShieldCheck size={16}/> Administrative Actions</h4>
                    <div className="flex flex-row gap-3">
                      {selectedAlumni.verificationStatus !== "VERIFIED" && (
                        <button onClick={() => verifyUser(selectedAlumni.id, 'Verified')} className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] text-sm font-bold rounded-xl   shadow-sm flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">
                          <CheckCircle size={16}/> Approve 
                        </button>
                      )}
                      {selectedAlumni.verificationStatus !== "REJECTED" && (
                        <button onClick={() => setRejectingAlum(selectedAlumni)} className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] text-sm font-bold rounded-xl   shadow-sm flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">
                          <Ban size={16}/> Reject 
                        </button>
                      )}
                      <button onClick={() => setDeletingAlum(selectedAlumni)} className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] text-sm font-bold rounded-xl   shadow-sm flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">
                        <Trash2 size={16}/> Delete Alumni
                      </button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT ALUMNI MODAL */}
      <Modal
        isOpen={!!rejectingAlum}
        onClose={() => setRejectingAlum(null)}
        title="Reject Alumni"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl   text-sm font-bold transition-all focus:outline-none" onClick={() => setRejectingAlum(null)}>Cancel</button>
            <button className="px-6 py-2 bg-white border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold   transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 flex items-center gap-2" onClick={submitRejection}><Ban size={16}/> Confirm Reject</button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting {toTitleCase(rejectingAlum?.user?.name)}. This will be stored for audit purposes.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#F47C20]/20 focus:border-[#F47C20]"
            rows={4}
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* DELETE ALUMNI MODAL */}
      <Modal
        isOpen={!!deletingAlum}
        onClose={() => setDeletingAlum(null)}
        title="Delete Alumni Account"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl   text-sm font-bold transition-all focus:outline-none" onClick={() => setDeletingAlum(null)}>Cancel</button>
            <button 
              className="px-6 py-2 bg-white border border-[#F47C20] text-[#F47C20] rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed   transition-all focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 flex items-center gap-2" 
              onClick={handleDeleteAlumni}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              <Trash2 size={16}/> Delete Account
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-[#FFF4EB] border border-[#F47C20]/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-white rounded-full p-1 shadow-sm mt-0.5 shrink-0 text-[#F47C20]">
               <AlertCircle size={18} />
            </div>
            <div>
               <h4 className="text-sm font-bold text-[#F47C20] mb-1">Are you sure you want to delete this alumni?</h4>
               <p className="text-xs font-medium text-[#F47C20]/80">
                 This action is permanent and cannot be undone. All data associated with this account will be removed.
               </p>
            </div>
          </div>
          
          {deletingAlum && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#F47C20]"></div>
              <div className="flex items-center gap-3 mb-2 ml-2">
                 <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 border border-red-200 overflow-hidden">
                    <img src={generateAvatarSVG(deletingAlum.user?.name || 'Unknown', 'random')} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <p className="text-sm font-extrabold text-slate-800 leading-tight">{toTitleCase(deletingAlum.user?.name)}</p>
                    <p className="text-xs font-semibold text-slate-500">{deletingAlum.department || 'N/A'}</p>
                 </div>
              </div>
              <div className="h-px w-full bg-slate-100 my-1 ml-2"></div>
              <div className="flex justify-between items-center text-sm ml-2">
                 <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Roll Number</span>
                 <span className="font-semibold text-slate-800">{deletingAlum.rollNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm ml-2">
                 <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Company</span>
                 <span className="font-semibold text-slate-800 truncate max-w-[150px] text-right">{deletingAlum.company || 'N/A'}</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Type <span className="font-mono text-[#F47C20] select-none bg-[#FFF4EB] px-1.5 py-0.5 rounded border border-[#F47C20]/20">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="block w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all"
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={!!viewingDocs}
        onClose={handleCloseDocModal}
        documentUrl={docBlobUrl}
        fileName={viewingDocs ? `${viewingDocs.rollNumber || viewingDocs.id}_VerificationDocument.${docMetadata?.documentName?.split('.').pop() || 'pdf'}` : ''}
        alumniName={viewingDocs?.user?.name || 'Unknown Alumni'}
        rollNumber={viewingDocs?.rollNumber}
        uploadDate={docMetadata?.uploadDate ? new Date(docMetadata.uploadDate).toLocaleDateString() : undefined}
        isLoading={isDocLoading}
        error={docError}
        onRetry={() => handleViewDocs(viewingDocs)}
      />
    </DashboardLayout>
  );
}
