import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import api from "../../../utils/axiosConfig";
import {
  Search, Plus, ShieldCheck, CheckCircle, X,
  Users, Download, Upload, AlertCircle, FileText,
  Check, Copy, Ban, KeyRound, Target, UploadCloud,
  ChevronLeft, ChevronRight, RefreshCw, Mail, Phone, Filter,
  Loader2, CheckCircle2, XCircle, SkipForward, FileSpreadsheet,
  MoreVertical, Trash2, Key
} from "lucide-react";
import { toast } from "react-toastify";
import ExportDataModal from "./ExportDataModal";
import useDepartments from "../../../hooks/useDepartments";
import { DocumentViewerModal, StudentDetailsDrawer } from "../../../components/common";
import Pagination from "../../../components/common/Pagination";
import { TableLoader } from "../../../components/common/loading";
import { toTitleCase } from "../../../utils/nameUtils";
import validateVVITRollNumber from "../../../utils/vvitRollNumberUtils";
import { getInitials } from "../../../utils/avatarUtils";
import Avatar from '../../../components/common/Avatar';

const Badge = ({ variant = "default", children }) => {
  const map = {
    verified:  "bg-emerald-500 text-white border-transparent shadow-sm",
    pending:   "bg-[#F47C20]  text-white  border-transparent shadow-sm",
    ready:     "bg-blue-50   text-blue-700   border-blue-200",
    needs:     "bg-red-50    text-red-600    border-red-200",
    resume:    "bg-purple-50 text-purple-700 border-purple-200",
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspended: "bg-red-50    text-red-600    border-red-200",
    default:   "bg-slate-50  text-slate-600  border-slate-200",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[variant]}`}>{children}</span>;
};

const StudentManagement = forwardRef(({ isTab = false, onCountsUpdate }, ref) => {
  const { departments } = useDepartments();
  
  useImperativeHandle(ref, () => ({
    openAddModal: () => setShowAddModal(true),
    openImportModal: () => setShowImportModal(true),
    openExportModal: () => setShowExportModal(true)
  }));

  const [students, setStudents]               = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCredsModal, setShowCredsModal]   = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsStudent, setDetailsStudent]   = useState(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [filters, setFilters] = useState({ department:"", semester:"", verificationStatus:"", placementReady:"", hasResume:"" });
  const [credentials, setCredentials]         = useState(null);
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 10;
  const [openMenuId, setOpenMenuId]           = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openMenuId !== null && !e.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showResetModal, setShowResetModal]     = useState(false);
  const [showRemoveModal, setShowRemoveModal]   = useState(false);
  const [removeConfirmText, setRemoveConfirmText] = useState("");
  const [copied, setCopied] = useState(false);

  // Document Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerMetadata, setViewerMetadata] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

// VVIT Roll Number Validation State
  const [rollNumberError, setRollNumberError] = useState('');

  // Add Student state
  const [formData, setFormData] = useState({
    name:"",
    email:"",
    mobileNumber:"",
    rollNumber:"",
    department:"",
    semester:1,
    academicYear:""
  });

  // Import state
  const [selectedFile, setSelectedFile]         = useState(null);
  const [importing, setImporting]               = useState(false);
  const [importProgress, setImportProgress]     = useState(0);
  const [importResult, setImportResult]         = useState(null); // { created, skipped, failed }
  const [importError, setImportError]           = useState(null);
  const [isDragging, setIsDragging]             = useState(false);
  const fileInputRef                            = useRef(null);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting]         = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // ── Admin Resume Handlers ─────────────────────────────────────────────────
  const handleAdminViewResume = async (student) => {
    setViewerOpen(true);
    setViewerError(null);
    setViewerMetadata({
      fileName: `${student.rollNumber || 'Student'}_Resume.pdf`,
      studentName: student.user?.name || student.name || 'Unknown Student',
      rollNumber: student.rollNumber
    });

    if (viewerUrl) {
      setViewerLoading(false);
      return;
    }

    setViewerLoading(true);
    try {
      const res = await api.get(`/admin/students/${student.id}/resume/view`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${student.rollNumber || 'Student'}_Resume.pdf`;
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      
      setViewerUrl(url);
      setViewerMetadata(prev => ({ ...prev, fileName: filename }));
    } catch (err) {
      console.error('Failed to view resume:', err);
      const status = err.response?.status;
      const errMsg = status === 404 ? '404: Resume Not Found' : status === 403 ? '403: Forbidden' : (err.message || 'Failed to view resume.');
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
    setViewerMetadata(null);
  };

  const handleAdminDownloadResume = async (studentId, rollNumber) => {
    try {
      const res = await api.get(`/admin/students/${studentId}/resume/download`, { responseType: 'blob' });
      // Try to read standardized filename from Content-Disposition header
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${rollNumber || 'Student'}_Resume.pdf`;
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download resume.');
    }
  };

  /** Validate if a URL string is a well-formed http/https URL */
  const isValidUrl = (url) => {
    if (!url || !url.trim()) return false;
    try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
  };

  const location = useLocation();
  const navigate = useNavigate();

  const stats = useMemo(() => ({
    total:          students.length,
    verified:       students.filter(s => s.verificationStatus === "VERIFIED").length,
    resumeUploaded: students.filter(s => s.hasResume).length,
    placementReady: students.filter(s => s.placementReady).length,
  }), [students]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (onCountsUpdate && stats?.total !== undefined) {
      onCountsUpdate(stats.total);
    }
  }, [stats.total]);

  const resetForm = () => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    if (filterParam) {
      if (filterParam === "verified") {
        setFilters(prev => ({ ...prev, verificationStatus: "VERIFIED" }));
      } else if (filterParam === "resumeUploaded") {
        setFilters(prev => ({ ...prev, hasResume: "true" }));
      } else if (filterParam === "placementReady") {
        setFilters(prev => ({ ...prev, placementReady: "READY" }));
      } else if (filterParam === "all") {
        setFilters({ department:"", semester:"", verificationStatus:"", placementReady:"", hasResume:"" });
      }
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try { const r = await api.get("/admin/users/students"); setStudents(r.data); }
    catch { toast.error("Failed to fetch students"); }
    finally { setIsLoading(false); }
  };

  const filteredStudents = useMemo(() => students.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    const sName = (s.user?.name || s.name || '').toLowerCase();
    const sRoll = (s.rollNumber || '').toLowerCase();
    const sEmail = (s.user?.email || s.email || '').toLowerCase();
    const sDept = (typeof s.department === 'object' ? (s.department.code || s.department.name || '') : s.department || '').toLowerCase();

    if (q && !sName.includes(q) && !sRoll.includes(q) && !sEmail.includes(q) && !sDept.includes(q)) return false;
    if (filters.department && s.department !== filters.department) return false;
    if (filters.semester && s.semester?.toString() !== filters.semester) return false;
    if (filters.verificationStatus && s.verificationStatus !== filters.verificationStatus) return false;
    if (filters.placementReady === "READY" && !s.placementReady) return false;
    if (filters.placementReady === "NEEDS_ATTENTION" && s.placementReady) return false;
    if (filters.hasResume === "true" && !s.hasResume) return false;
    if (filters.hasResume === "false" && s.hasResume) return false;
    return true;
  }), [students, searchTerm, filters]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);
  useEffect(() => setCurrentPage(1), [searchTerm, filters]);

  const resetFilters = () => { 
    setSearchTerm(""); 
    setFilters({ department:"", semester:"", verificationStatus:"", placementReady:"", hasResume:"" });
    if (location.search) navigate(location.pathname);
  };

  const handleApprove = async () => {
    try { 
      const res = await api.patch(`/admin/users/students/${selectedStudent.id}/approve`); 
      if (res.data.success !== false) {
        toast.success(res.data.message || "Student approved successfully."); 
        setShowApproveModal(false);
        setSelectedStudent({ ...selectedStudent, verificationStatus: "VERIFIED" });
        fetchStudents(); 
      } else {
        toast.error(res.data.message || "Student is already approved");
        setShowApproveModal(false);
      }
    }
    catch (err) { toast.error(err.response?.data?.message || "Unable to approve student"); }
  };
  const handleToggleStatus = async (userId, status) => {
    const next = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try { await api.put(`/admin/users/students/${userId}/status?status=${next}`); toast.success(`Account ${next.toLowerCase()}`); fetchStudents(); }
    catch { toast.error("Failed to update status"); }
  };
  const handleResetPassword = async () => {
    try { 
      const r = await api.post(`/admin/users/students/${selectedStudent.id}/reset-password`); 
      setCredentials(r.data); 
      setShowResetModal(false);
      setShowCredsModal(true); 
      toast.success("Password reset successfully. Temporary password generated."); 
    }
    catch { toast.error("Failed to reset password"); }
  };
  const handleAddStudent = async (e) => {
    e.preventDefault();
    // Validate VVIT roll number before submission
    const validation = validateVVITRollNumber(formData.rollNumber);
    if (!validation.isValid) {
      setRollNumberError(validation.message);
      toast.error(validation.message);
      return;
    }
    // Normalize roll number to uppercase before sending
    const normalizedFormData = { ...formData, rollNumber: validation.normalized };
    try {
      const r = await api.post("/admin/users/students", normalizedFormData);
      setCredentials(r.data); 
      toast.success("Student added successfully!");
      setShowAddModal(false); 
      setShowCredsModal(true); 
      fetchStudents();
      setFormData({ name:"", email:"", mobileNumber:"", rollNumber:"", department:"", semester:1, academicYear:"" });
    } catch (err) {
      let message = err.response?.data?.message || "Failed to add student. Please check the details and try again.";
      if (err.response?.data?.fieldErrors) {
        const details = Object.entries(err.response.data.fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        message = `Validation failed — ${details}`;
      }
      toast.error(message);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent || removeConfirmText !== selectedStudent.rollNumber) return;
    try { 
      const res = await api.delete(`/admin/students/${selectedStudent.id}`); 
      toast.success(res.data?.message || "Student account deleted successfully."); 
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        next.delete(selectedStudent.id);
        return next;
      });
      setShowRemoveModal(false);
      setRemoveConfirmText("");
      setSelectedStudent(null);
      fetchStudents(); 
    }
    catch (err) { 
      toast.error(err.response?.data?.message || "Unable to delete the student account. Please try again.");
    }
  };

  const handleExport = async (format, scope, fields) => {
    setIsExporting(true);
    let idsToExport = [];
    if (scope === 'all') {
      idsToExport = students.map(s => s.id);
    } else if (scope === 'filtered') {
      idsToExport = filteredStudents.map(s => s.id);
    } else if (scope === 'current_page') {
      idsToExport = paginatedStudents.map(s => s.id);
    } else if (scope === 'selected') {
      idsToExport = Array.from(selectedStudentIds);
    }

    try {
      const res = await api.post('/admin/users/students/export', {
        format,
        studentIds: idsToExport,
        fields
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'EXCEL' ? 'xlsx' : format === 'CSV' ? 'csv' : 'pdf';
      link.setAttribute('download', `Students_Export_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Export successful!");
      setShowExportModal(false);
    } catch (e) {
      toast.error("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(new Set(paginatedStudents.map(s => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── Bulk Import ──────────────────────────────────── */
  const VALID_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
  ];

  const validateFile = (file) => {
    if (!file) return "No file selected.";
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext))
      return `Unsupported format ".${ext}". Please upload .xlsx or .csv`;
    if (file.size === 0) return "The selected file is empty.";
    if (file.size > 10 * 1024 * 1024) return "File exceeds 10 MB limit.";
    return null;
  };

  const handleFileSelect = (file) => {
    setImportError(null);
    setImportResult(null);
    const err = validateFile(file);
    if (err) { setImportError(err); setSelectedFile(null); return; }
    setSelectedFile(file);
  };

  const handleImport = async () => {
    const err = validateFile(selectedFile);
    if (err) { setImportError(err); return; }

    setImporting(true);
    setImportProgress(0);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/admin/users/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setImportProgress(Math.round((evt.loaded / evt.total) * 80));
        },
      });
      setImportProgress(100);
      setImportResult(response.data);  // { created, skipped, failed }
      toast.success(`Import complete! Created: ${response.data.created ?? 0}`);
      fetchStudents();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || "Server error during import.";
      setImportError(typeof msg === "string" ? msg : "Import failed. Check file and try again.");
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setImportError(null);
  };

  const actionBtn = "inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F47C20] text-[#F47C20] font-semibold text-xs rounded-lg   active:scale-95 transition-all shadow-sm focus:outline-none whitespace-nowrap";
  const inputCls  = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/20 transition-all";
  const buttonStyle = { minWidth: '140px' };

  const StatCard = ({ title, count, icon: Icon, palette, active, onClick }) => (
    <button onClick={onClick} className={`group relative w-full text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden shadow-sm   focus:outline-none flex items-center justify-between ${active ? `border-[#F47C20] ${palette.bg}` : "bg-white border-slate-200  "}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${palette.icon}`}><Icon size={18} /></div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-xl font-extrabold ${palette.text}`}>{count}</p>
      </div>
    </button>
  );

  const hasFilters = searchTerm || filters.department || filters.semester || filters.verificationStatus || filters.placementReady || filters.hasResume;

  const content = (
    <div className="student-management-content w-full">

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total" count={stats.total} icon={Users}
          palette={{ bg:"bg-blue-50", icon:"bg-blue-100 text-blue-600", text:"text-blue-700" }}
          active={!hasFilters} onClick={resetFilters} />
        <StatCard title="Verified" count={stats.verified} icon={ShieldCheck}
          palette={{ bg:"bg-emerald-50", icon:"bg-emerald-100 text-emerald-600", text:"text-emerald-700" }}
          active={filters.verificationStatus==="VERIFIED"} onClick={() => setFilters(p => ({...p, verificationStatus: "VERIFIED"}))} />
        <StatCard title="Resumes" count={stats.resumeUploaded} icon={FileText}
          palette={{ bg:"bg-purple-50", icon:"bg-purple-100 text-purple-600", text:"text-purple-700" }}
          active={filters.hasResume==="true"} onClick={() => setFilters(p => ({...p, hasResume: "true"}))} />
        <StatCard title="Ready" count={stats.placementReady} icon={Target}
          palette={{ bg:"bg-orange-50", icon:"bg-orange-100 text-orange-500", text:"text-orange-600" }}
          active={filters.placementReady==="READY"} onClick={() => setFilters(p => ({...p, placementReady: "READY"}))} />
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll number, email, or department..."
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
          <select
            value={filters.department}
            onChange={(e) => setFilters(p => ({ ...p, department: e.target.value }))}
            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.code} value={d.code}>{d.name || d.code}</option>)}
          </select>

          <select
            value={filters.verificationStatus}
            onChange={(e) => setFilters(p => ({ ...p, verificationStatus: e.target.value }))}
            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F47C20] cursor-pointer"
          >
            <option value="">All Verification Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="h-11 px-3.5 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset filters"
            >
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total" count={stats.total} icon={Users}
          palette={{ bg:"bg-blue-50", icon:"bg-blue-100 text-blue-600", text:"text-blue-700" }}
          active={!hasFilters} onClick={resetFilters} />
        <StatCard title="Verified" count={stats.verified} icon={ShieldCheck}
          palette={{ bg:"bg-emerald-50", icon:"bg-emerald-100 text-emerald-600", text:"text-emerald-700" }}
          active={filters.verificationStatus==="VERIFIED"} onClick={() => setFilters(p => ({...p, verificationStatus: "VERIFIED"}))} />
        <StatCard title="Resumes" count={stats.resumeUploaded} icon={FileText}
          palette={{ bg:"bg-purple-50", icon:"bg-purple-100 text-purple-600", text:"text-purple-700" }}
          active={filters.hasResume==="true"} onClick={() => setFilters(p => ({...p, hasResume: "true"}))} />
        <StatCard title="Ready" count={stats.placementReady} icon={Target}
          palette={{ bg:"bg-orange-50", icon:"bg-orange-100 text-orange-500", text:"text-orange-600" }}
          active={filters.placementReady==="READY"} onClick={() => setFilters(p => ({...p, placementReady: "READY"}))} />
      </div>

      {/* TABLE & MOBILE CARDS */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <TableLoader columns={5} rows={10} />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300"/>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No students found</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
            Try searching for a different student name, roll number, email, or department.
          </p>
          <button onClick={resetFilters} className="px-5 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-sm shadow-sm transition-colors cursor-pointer">
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Details</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setDetailsStudent(s)}>
                    <td className="px-6 py-4"><Avatar name={s.user.name} src={s.profileImageUrl} size="md" /></td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800 text-sm hover:text-[#F47C20]" onClick={(e) => { e.stopPropagation(); setDetailsStudent(s); }}>{toTitleCase(s.user.name)}</p>
                      <p className="font-mono text-xs text-[#F47C20] font-bold">{s.rollNumber}</p>
                      <p className="text-xs text-slate-400">{s.user?.email || s.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-semibold text-slate-600">{s.department}</p>
                      <p className="text-xs text-slate-400">Sem {s.semester}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={s.verificationStatus === "VERIFIED" ? "verified" : "pending"}>
                        {s.verificationStatus === "VERIFIED" ? "Verified" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedStudent(s); setShowResetModal(true); }}
                          className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20]/40 text-[#F47C20] text-xs font-bold rounded-xl shadow-2xs whitespace-nowrap focus:outline-none"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => { setSelectedStudent(s); setShowRemoveModal(true); }}
                          className="px-3 py-1.5 bg-[#FFF4EB] border border-[#F47C20]/40 text-[#F47C20] text-xs font-bold rounded-xl shadow-2xs whitespace-nowrap focus:outline-none"
                        >
                          Delete Student
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS */}
          <div className="block md:hidden divide-y divide-slate-100">
            {paginatedStudents.map(s => (
              <div 
                key={s.id} 
                className="p-4 hover:bg-slate-50/80 transition-colors relative cursor-pointer"
                onClick={() => setDetailsStudent(s)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={s.user.name} src={s.profileImageUrl} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{toTitleCase(s.user.name)}</h4>
                      <p className="font-mono text-xs text-[#F47C20] font-bold">{s.rollNumber}</p>
                    </div>
                  </div>

                  {/* Compact Mobile Action Menu */}
                  <div className="relative action-menu-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                      aria-label="Student actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === s.id && (
                      <div className="absolute right-0 top-10 z-30 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => { setOpenMenuId(null); setSelectedStudent(s); setShowResetModal(true); }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#F47C20] flex items-center gap-2 transition-colors"
                        >
                          <Key size={14} className="text-[#F47C20]" /> Reset Password
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setSelectedStudent(s); setShowRemoveModal(true); }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#F47C20] flex items-center gap-2 transition-colors border-t border-slate-100"
                        >
                          <Trash2 size={14} className="text-[#F47C20]" /> Delete Student
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{s.department}</span>
                    <span>•</span>
                    <span>Sem {s.semester}</span>
                  </div>

                  <Badge variant={s.verificationStatus === "VERIFIED" ? "verified" : "pending"}>
                    {s.verificationStatus === "VERIFIED" ? "Verified" : "Pending"}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 mt-1.5 truncate">{s.user?.email || s.email}</p>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            totalItems={filteredStudents.length}
            pageSize={itemsPerPage}
            itemLabel="students"
          />
        </div>
      )}

      {/* STANDARDIZED STUDENT DETAILS DRAWER */}
      <StudentDetailsDrawer
        studentId={detailsStudent?.id}
        isOpen={Boolean(detailsStudent)}
        onClose={() => setDetailsStudent(null)}
        role="admin"
        showStatusActions={false}
      />

      {/* APPROVE STUDENT MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F47C20]">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Approve this student?</h3>
            <p className="text-sm text-slate-500 mb-6">This action will mark the student as verified by the Placement Cell.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2.5 text-[#F47C20] font-bold   rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Cancel</button>
              <button onClick={handleApprove} className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl   transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F47C20]">
              <KeyRound size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Reset password for this student?</h3>
            <p className="text-sm text-slate-500 mb-6">A temporary password will be generated for {toTitleCase(selectedStudent?.user?.name)}.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 py-2.5 text-[#F47C20] font-bold   rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Cancel</button>
              <button onClick={handleResetPassword} className="flex-1 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl   transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STUDENT MODAL */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFF4EB] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F47C20]">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Student Account</h3>
              <p className="text-sm text-slate-600 font-medium mb-1">Are you sure you want to permanently delete this student account?</p>
              <p className="text-xs text-[#F47C20] font-bold mb-3">This action cannot be undone. The student's account and all associated records will be permanently removed from the system.</p>
              <p className="text-xs text-slate-500 mb-4">Type the student's Roll Number <span className="font-bold font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{selectedStudent?.rollNumber}</span> to confirm deletion.</p>
            </div>
            <input 
              type="text" 
              placeholder={`Type ${selectedStudent?.rollNumber || 'Roll Number'}`} 
              value={removeConfirmText}
              onChange={(e) => setRemoveConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 mb-6 outline-none focus:border-[#F47C20] focus:bg-white transition-all font-mono text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => {setShowRemoveModal(false); setRemoveConfirmText("");}} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">Cancel</button>
              <button 
                onClick={handleDeleteStudent} 
                disabled={removeConfirmText !== selectedStudent?.rollNumber}
                className="flex-1 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Add New Student</h3>
                <p className="text-slate-400 text-xs mt-0.5">A temporary password will be generated automatically.</p>
              </div>
              <button onClick={()=>setShowAddModal(false)} className="w-9 h-9 flex items-center justify-center rounded-xl   text-slate-400 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="e.g. Ravi Kumar" className={inputCls}/>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                  <input required type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="student@example.com" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Roll Number *</label>
                  <input required type="text" value={formData.rollNumber} onChange={e=>setFormData({...formData,rollNumber:e.target.value})} placeholder="22A91A0501" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile *</label>
                  <input required type="text" value={formData.mobileNumber} onChange={e=>setFormData({...formData,mobileNumber:e.target.value})} placeholder="9999999999" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department *</label>
                  <select required value={formData.department} onChange={e=>setFormData({...formData,department:e.target.value})} className={inputCls}>
                    <option value="">Select Department</option>
                    {departments.map(d=><option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Semester *</label>
                  <select required value={formData.semester} onChange={e=>setFormData({...formData,semester:parseInt(e.target.value)})} className={inputCls}>
                    {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                  <input type="text" value={formData.academicYear} onChange={e=>setFormData({...formData,academicYear:e.target.value})} placeholder="e.g. 2024-25" className={inputCls}/>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100">
                <button type="button" onClick={()=>setShowAddModal(false)} className="px-5 py-2.5 text-[#F47C20] font-bold   rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl   transition-colors shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Create Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCredsModal && credentials && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-[#F47C20] to-orange-600 p-7 text-center relative overflow-hidden">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
                <CheckCircle size={32} className="text-white"/>
              </div>
              <h3 className="text-xl font-extrabold text-white">Account Created!</h3>
              <p className="text-orange-100 text-sm mt-1">Share these credentials with the student.</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 text-sm">Roll Number:</span>
                  <span className="font-bold text-slate-800 font-mono">{credentials?.identifier}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 text-sm">Email (Login ID):</span>
                  <span className="font-bold text-slate-800 font-mono">{credentials?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Temporary Password:</span>
                  <span className="font-bold text-slate-800 font-mono tracking-wider">{credentials?.temporaryPassword}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={()=>{navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl   transition-colors">
                  {copied?<><Check size={16} className="text-emerald-500"/>Copied!</>:<><Copy size={16}/>Copy Credentials</>}
                </button>
                <button onClick={()=>setShowCredsModal(false)} className="w-full py-3 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-sm rounded-xl   transition-colors shadow-sm">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800">Bulk Import Students</h3>
              <button onClick={closeImportModal} className="w-8 h-8 flex items-center justify-center rounded-xl   text-slate-400"><X size={18}/></button>
            </div>
            
            <div className="p-6 space-y-5">
              {!importResult ? (
                <>
                  <p className="text-sm text-slate-500">Upload an Excel (.xlsx) or CSV file. Duplicates are skipped.</p>
                  
                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p>{importError}</p>
                    </div>
                  )}

                  <div 
                    onClick={() => !importing && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (!importing && e.dataTransfer.files?.length) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 transition-all text-center group ${importing ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : isDragging ? 'border-[#F47C20] bg-[#FFF4EB]' : 'border-slate-200 bg-slate-50     cursor-pointer'}`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet size={36} className="text-[#F47C20]" />
                        <p className="text-sm font-bold text-slate-800 break-all">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={36} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-[#F47C20]' : 'text-slate-300  '}`} />
                        <p className="text-slate-600 font-semibold text-sm">Click to browse or drag and drop</p>
                        <p className="text-slate-400 text-xs mt-1">.xlsx or .csv, max 10 MB</p>
                      </>
                    )}
                  </div>

                  {importing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Uploading & Processing...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#F47C20] h-2.5 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={closeImportModal} disabled={importing} className="flex-1 py-3 text-[#F47C20] font-bold   rounded-xl text-sm transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2">Cancel</button>
                    <button 
                      onClick={handleImport}
                      disabled={!selectedFile || importing} 
                      className="flex-1 py-3 bg-white border border-[#F47C20] text-[#F47C20] font-bold rounded-xl text-sm   transition-colors shadow disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2"
                    >
                      {importing ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : "Upload File"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-800">Import Complete</h4>
                    <p className="text-slate-500 text-sm mt-1">The student data has been processed.</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                      <p className="text-2xl font-extrabold text-emerald-600">{importResult.created ?? 0}</p>
                      <p className="text-[10px] font-bold text-emerald-700/70 uppercase">Created</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                      <p className="text-2xl font-extrabold text-amber-600">{importResult.skipped ?? 0}</p>
                      <p className="text-[10px] font-bold text-amber-700/70 uppercase">Skipped</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                      <p className="text-2xl font-extrabold text-red-600">{importResult.failed ?? 0}</p>
                      <p className="text-[10px] font-bold text-red-700/70 uppercase">Failed</p>
                    </div>
                  </div>

                  {importResult.importedStudents && importResult.importedStudents.length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-xs font-bold text-gray-500 uppercase">Name</th>
                            <th className="p-2 text-xs font-bold text-gray-500 uppercase">Roll No</th>
                            <th className="p-2 text-xs font-bold text-gray-500 uppercase">Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {importResult.importedStudents.map((s, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-medium text-gray-800 truncate max-w-[100px]">{toTitleCase(s.name)}</td>
                              <td className="p-2 text-gray-600">{s.identifier}</td>
                              <td className="p-2 font-mono text-xs text-orange-600">{s.temporaryPassword}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button onClick={closeImportModal} className="w-full py-3 bg-white border border-[#F47C20] text-[#F47C20] font-bold text-sm rounded-xl   transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F47C20] focus:ring-offset-2 mt-4">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER PADDING FIX FOR OVERFLOWING CONTENT IN MODAL */}
      {selectedStudent && (
        <style dangerouslySetInnerHTML={{__html: `
          .flex-1.overflow-y-auto {
            /* padding-bottom to ensure admin actions are scrollable if screen is very short */
            padding-bottom: 2rem !important;
          }
        `}} />
      )}

      <ExportDataModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        onExport={handleExport}
        isExporting={isExporting}
        filteredCount={filteredStudents.length}
        totalCount={students.length}
        selectedCount={selectedStudentIds.size}
        currentPageCount={paginatedStudents.length}
      />
      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={closeDocumentViewer}
        documentUrl={viewerUrl}
        fileName={viewerMetadata?.fileName}
        studentName={viewerMetadata?.studentName}
        rollNumber={viewerMetadata?.rollNumber}
        isLoading={viewerLoading}
        error={viewerError}
        onRetry={handleAdminViewResume}
      />
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <DashboardLayout role="admin">
      {content}
    </DashboardLayout>
  );
});

export default StudentManagement;
