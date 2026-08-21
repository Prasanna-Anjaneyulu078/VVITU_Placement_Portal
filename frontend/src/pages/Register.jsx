import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Briefcase, Building, ArrowRight, Eye, EyeOff,
  Phone, Linkedin, CreditCard, GraduationCap, UploadCloud,
  AlertCircle, CheckCircle, Loader2, ScanSearch, FileText, Clock, X
} from 'lucide-react';
import api from '../utils/axiosConfig';
import useDepartments from '../hooks/useDepartments';
import { parseRollNumberAndEligibility } from '../utils/rollNumberUtils';

/* ─────────────────────────────────────────────
   Success Modal Component
───────────────────────────────────────────── */
function SuccessModal({ onClose, onGoToLogin }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,30,60,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0A4D8C] via-[#1a6fbe] to-orange-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400   transition-colors rounded-full p-1  "
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-8 pb-7 text-center">
          {/* Animated check circle */}
          <div className="mx-auto mb-5 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center"
              style={{ animation: 'pulse-once 0.6s ease 0.2s both' }}
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
            Registration Submitted<br />
            <span className="text-[#0A4D8C]">Successfully!</span>
          </h2>

          {/* Message */}
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            Your alumni registration has been submitted successfully.
            Your account is currently <strong className="text-gray-700">pending verification</strong> and
            approval by the Placement Cell Administration.
            <br /><br />
            You will be able to access the Alumni Dashboard after your account has been reviewed and approved.
            Please check your email regularly for status updates.
          </p>

          {/* Status Badge */}
          <div className="mx-auto mb-6 inline-flex flex-col items-center gap-1 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Registration Status</span>
            </div>
            <span className="text-sm font-bold text-amber-700 mt-0.5">⏳ Pending Admin Approval</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGoToLogin}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200   active:translate-y-0"
              style={{ background: 'linear-gradient(135deg,#0A4D8C,#1565c0)' }}
            >
              Back to Login
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-100   transition-all duration-200"
            >
              OK
            </button>
          </div>

          {/* VVIT branding */}
          <p className="mt-5 text-xs text-gray-400">
            VVIT Placement Portal · Alumni Verification System
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-once {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Name Verification Error Modal Component
───────────────────────────────────────────── */
function NameVerificationErrorModal({ error, onClose }) {
  if (!error) return null;

  let enteredName = '';
  let detectedName = '';

  const enteredMatch = error.match(/Entered Name:\s*([^\n]+)/);
  if (enteredMatch) enteredName = enteredMatch[1].trim();

  const detectedMatch = error.match(/Detected Name:\s*([^\n]+)/);
  if (detectedMatch) detectedName = detectedMatch[1].trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-red-100"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400   rounded-full p-1.5   transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">Name Verification Failed</h3>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mt-0.5">Strict Exact Match Required (100%)</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            The Full Name entered in the registration form does not match the Full Name detected in the uploaded official VVIT/VVITU document.
          </p>

          {(enteredName || detectedName) && (
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 mb-5 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-red-200/60 pb-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entered Name (Form)</span>
                <span className="text-sm font-black text-red-700 bg-white px-3 py-1 rounded-lg border border-red-200 shadow-2xs font-mono">{enteredName || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detected Name (OCR)</span>
                <span className="text-sm font-black text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-2xs font-mono">{detectedName || 'Not detected'}</span>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong className="font-bold">Security Rule:</strong> For security reasons, the names must match exactly. Please enter your name exactly as it appears on your official VVIT/VVITU document and upload the correct document.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-[#F47C20] bg-white border border-[#F47C20] shadow-sm transition-all duration-200 active:scale-[0.99]"
          >
            I Understand — Correct Name &amp; Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Register Component
───────────────────────────────────────────── */
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorReasonCode, setErrorReasonCode] = useState('');
  const [showNameErrorModal, setShowNameErrorModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { departments } = useDepartments();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '',
    rollNumber: '', department: '', degree: '',
    gradYear: '', mobile: '', gender: '',
    company: '', jobTitle: '', linkedin: '',
    document: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (file && file.type !== 'application/pdf') {
        setError('Invalid File Format — Only PDF documents are allowed for alumni verification. Please upload a valid PDF file.');
        setFormData(prev => ({ ...prev, document: null }));
        e.target.value = '';
        return;
      }
      setError('');
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const rollInfo = formData.rollNumber ? parseRollNumberAndEligibility(formData.rollNumber) : null;
  const calculatedGradYear = (rollInfo && rollInfo.isValid && rollInfo.expectedGraduationYear) ? String(rollInfo.expectedGraduationYear) : '';

  const validateStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.fullName.trim()) { setError('Full Name is required.'); return false; }
      if (!formData.email.trim()) { setError('Email is required.'); return false; }
      if (!formData.mobile.trim()) { setError('Mobile Number is required.'); return false; }
      return true;
    }
    if (currentStep === 2) {
      if (!formData.rollNumber.trim()) { setError('Roll Number is required.'); return false; }
      if (rollInfo && !rollInfo.isValid) { setError('Invalid Roll Number format.'); return false; }
      if (rollInfo && !rollInfo.isEligible) { setError(rollInfo.message); return false; }
      if (!formData.degree) { setError('Degree is required.'); return false; }
      if (!formData.department) { setError('Department is required.'); return false; }
      return true;
    }
    if (currentStep === 3) {
      if (!formData.company.trim()) { setError('Current Company is required.'); return false; }
      if (!formData.jobTitle.trim()) { setError('Job Title is required.'); return false; }
      return true;
    }
    if (currentStep === 4) {
      if (!formData.document) { setError('Verification document is required.'); return false; }
      if (formData.password.length < 6) { setError('Password must be at least 6 characters long.'); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // ── Frontend Validations ──
    if (!formData.rollNumber || !formData.rollNumber.trim()) {
      setError('Please enter a valid college roll number.');
      return;
    }
    if (rollInfo) {
      if (!rollInfo.isValid) {
        setError('Please enter a valid college roll number.');
        return;
      }
      if (!rollInfo.isEligible) {
        setError(rollInfo.message);
        return;
      }
    }
    if (!formData.document) {
      setError('Verification document is required.');
      return;
    }
    if (formData.document.type !== 'application/pdf') {
      setError('Invalid File Format — Only PDF documents are allowed for alumni verification.');
      return;
    }
    if (formData.document.size > 10 * 1024 * 1024) {
      setError('Document size exceeds the maximum allowed limit of 10 MB.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      setLoadingStage('uploading');
      const submitData = new FormData();
      submitData.append('name', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('company', formData.company);
      submitData.append('designation', formData.jobTitle);
      submitData.append('passingYear', calculatedGradYear || formData.gradYear);
      submitData.append('rollNumber', formData.rollNumber);
      submitData.append('department', formData.department);
      submitData.append('degree', formData.degree);
      submitData.append('mobileNumber', formData.mobile);
      submitData.append('gender', formData.gender);
      submitData.append('linkedinUrl', formData.linkedin);
      submitData.append('document', formData.document);

      setLoadingStage('verifying');
      await api.post('/auth/register/alumni', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: () => setLoadingStage('verifying'),
      });

      setLoadingStage('creating');
      await new Promise(r => setTimeout(r, 500));
      setShowSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Registration failed. Please verify your details and try again.';
      const code = err.response?.data?.reasonCode || err.response?.data?.code || '';
      setError(msg);
      setErrorReasonCode(code);
      if (msg.includes('Name Verification Failed') || code.includes('NAME')) {
        setShowNameErrorModal(true);
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const degrees    = ['B.Tech', 'M.Tech', 'MCA', 'MBA'];
  const genders    = ['Male', 'Female', 'Other'];
  const gradYears  = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      {/* ── Success Modal ── */}
      {showSuccess && (
        <SuccessModal
          onClose={() => { setShowSuccess(false); navigate('/login'); }}
          onGoToLogin={() => navigate('/login')}
        />
      )}

      {/* ── Name Verification Error Alert Dialog / Modal ── */}
      {showNameErrorModal && (
        <NameVerificationErrorModal
          error={error}
          onClose={() => setShowNameErrorModal(false)}
        />
      )}

      <div className="h-screen overflow-hidden flex font-sans bg-gray-50">
        {/* ── Left Branding Column ── */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-blue-900 overflow-hidden sticky top-0 h-screen">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
              alt="University Alumni"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/90 to-transparent" />
          </div>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000" />

          <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
            <div>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1 shadow-lg">
                  <img src="https://res.cloudinary.com/dwxqqx0oe/image/upload/v1772097342/VVITU-logo_ejvk7p.jpg" className="w-full h-full object-contain" alt="VVIT Logo" />
                </div>
                <span className="font-bold text-2xl text-white tracking-wide">VVIT Alumni</span>
              </div>
            </div>

            <div className="mb-20">
              <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                Join the <br /><span className="text-orange-500">Global Network.</span>
              </h1>
              <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                Reconnect with your alma mater, mentor students, and unlock exclusive alumni privileges.
              </p>
              <div className="mt-12 flex gap-6 flex-col">
                {[
                  { icon: <User className="text-orange-400 w-6 h-6" />, title: 'Build Your Profile', sub: 'Showcase your achievements and expertise' },
                  { icon: <Briefcase className="text-orange-400 w-6 h-6" />, title: 'Post Opportunities', sub: 'Hire top talent from your university' },
                ].map(f => (
                  <div key={f.title} className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm shrink-0">{f.icon}</div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{f.title}</h3>
                      <p className="text-blue-200 text-sm">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Column ── */}
        <div className="w-full lg:w-7/12 flex flex-col px-6 py-12 sm:px-16 md:px-20 xl:px-28 relative overflow-y-auto h-full">
          <div className="w-full max-w-2xl mx-auto">

            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
                  <img src="https://res.cloudinary.com/dwxqqx0oe/image/upload/v1772097342/VVITU-logo_ejvk7p.jpg" className="w-full h-full object-contain" alt="VVIT Logo" />
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">VVIT Alumni</span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center py-2 px-4 text-orange-500 font-bold text-sm min-h-[40px] focus:outline-none transition-colors bg-transparent border-none shadow-none"
              >
                Log In
              </button>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create your account</h2>
              <p className="text-gray-500 mt-2">Fill in the details below to join the alumni network.</p>
            </div>

            {/* Error Banner — enhanced for document verification errors */}
            {error && (() => {
              const isDocError = error.includes('Registration Restricted') ||
                error.includes('VVIT') ||
                error.includes('Roll Number') ||
                error.includes('name detected') ||
                error.includes('Hall Ticket');
              if (isDocError) {
                const paragraphs = error.split('\n\n').filter(Boolean);
                return (
                  <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2 bg-red-600 px-4 py-2.5">
                      <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-white text-sm font-bold tracking-wide">Document Verification Failed</span>
                    </div>
                    <div className="px-5 py-4 space-y-2">
                      {paragraphs.map((para, i) => (
                        <p key={i} className={`text-sm ${i === 0 ? 'font-bold text-red-800 text-base' : 'text-red-700'}`}>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              );
            })()}

            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-300" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-300 ${currentStep >= step ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-gray-200 text-gray-500'}`}>
                    {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500 px-1">
                <span className={currentStep >= 1 ? 'text-orange-600' : ''}>Personal</span>
                <span className={currentStep >= 2 ? 'text-orange-600' : ''}>Professional</span>
                <span className={currentStep >= 3 ? 'text-orange-600' : ''}>Verify</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">

              {/* ── Personal Information ── */}
              <div className={currentStep === 1 ? "block animate-fade-in" : "hidden"}>
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <User className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="fullName" type="text" required placeholder="John Doe" value={formData.fullName} onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:ring-2 sm:text-sm outline-none transition-all ${
                          (error.includes('Name Verification Failed') || errorReasonCode.includes('NAME'))
                            ? 'border-red-500 ring-2 ring-red-100 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
                        }`} />
                    </div>
                    {(error.includes('Name Verification Failed') || errorReasonCode.includes('NAME')) && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 shadow-xs">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-800">Name Verification Failed</p>
                          <p className="text-red-600 mt-0.5">The entered full name does not match the name detected on your VVIT/VVITU document.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Personal Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Mail className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="email" type="email" required placeholder="john.doe@example.com" value={formData.email} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all" />
                    </div>
                  </div>
                  {/* Roll Number */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Roll Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <CreditCard className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="rollNumber" type="text" required placeholder="23BQ1A5401 or 24BQ5A5403" value={formData.rollNumber} onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:ring-2 sm:text-sm outline-none transition-all uppercase ${
                          errorReasonCode.includes('ROLL')
                            ? 'border-red-500 ring-2 ring-red-100 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
                        }`} />
                    </div>

                    {/* Real-time Roll Number Eligibility Feedback Card */}
                    {formData.rollNumber && rollInfo && (
                      <div className={`mt-3 p-4 rounded-xl border text-xs leading-relaxed transition-all ${
                        rollInfo.isValid 
                          ? (rollInfo.isEligible ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900') 
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}>
                        <div className="flex items-center justify-between font-bold pb-2 border-b border-gray-200/60">
                          <span className="flex items-center gap-1.5 text-sm">
                            <GraduationCap className="w-4 h-4 text-gray-600" />
                            Student Type: <strong className="text-gray-900">{rollInfo.studentType || 'Unknown'}</strong>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                            rollInfo.isValid 
                              ? (rollInfo.isEligible ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800') 
                              : 'bg-red-200 text-red-800'
                          }`}>
                            {rollInfo.isValid ? (rollInfo.isEligible ? '✓ Eligible' : '⏳ Not Eligible Yet') : '✕ Invalid Format'}
                          </span>
                        </div>

                        {rollInfo.isValid && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-gray-700">
                            <div><span className="font-semibold text-gray-900">Admission Year:</span> {rollInfo.admissionYear}</div>
                            <div><span className="font-semibold text-gray-900">Expected Graduation Date:</span> {rollInfo.graduationCompletionDateStr}</div>
                          </div>
                        )}

                        <p className={`mt-2 font-medium text-xs ${
                          rollInfo.isValid ? (rollInfo.isEligible ? 'text-emerald-700 font-semibold' : 'text-amber-800') : 'text-red-700'
                        }`}>
                          {rollInfo.message}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Phone className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="mobile" type="tel" required placeholder="+91 9876543210" value={formData.mobile} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all" />
                    </div>
                  </div>
                  {/* Degree */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Degree</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <GraduationCap className="h-5 w-5 transition-colors" />
                      </div>
                      <select name="degree" required value={formData.degree} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all appearance-none cursor-pointer">
                        <option value="">Select Degree</option>
                        {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <GraduationCap className="h-5 w-5 transition-colors" />
                      </div>
                      <select name="department" required value={formData.department} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all appearance-none cursor-pointer">
                        <option value="" disabled>Select Department</option>
                        {departments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <User className="h-5 w-5 transition-colors" />
                      </div>
                      <select name="gender" value={formData.gender} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all appearance-none cursor-pointer">
                        <option value="">Select Gender</option>
                        {genders.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Graduation Year (Auto-calculated from Roll Number, Read-Only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Graduation Year <span className="text-xs font-normal text-orange-600 font-semibold">(Auto-calculated)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <GraduationCap className="h-5 w-5 transition-colors" />
                      </div>
                      <input
                        name="gradYear"
                        type="text"
                        readOnly
                        placeholder="Auto-calculated from Roll Number"
                        value={calculatedGradYear}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-gray-200 rounded-xl text-gray-800 font-bold sm:text-sm outline-none cursor-not-allowed select-none"
                      />
                    </div>
                    {formData.rollNumber && (!rollInfo || !rollInfo.isValid) && (
                      <p className="mt-1 text-xs text-red-600 font-medium">
                        Please enter a valid college roll number.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              </div>

              {/* ── Professional Information ── */}
              <div className={currentStep === 2 ? "block animate-fade-in" : "hidden"}>
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-500" /> Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Company</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Building className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="company" type="text" required placeholder="Tech Corp Inc." value={formData.company} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Job Title</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Briefcase className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="jobTitle" type="text" required placeholder="Senior Software Engineer" value={formData.jobTitle} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">LinkedIn Profile URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Linkedin className="h-5 w-5 transition-colors" />
                      </div>
                      <input name="linkedin" type="url" placeholder="https://linkedin.com/in/johndoe" value={formData.linkedin} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
              
              </div>

              {/* ── Verification & Security ── */}
              <div className={currentStep === 3 ? "block animate-fade-in" : "hidden"}>
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-500" /> Verification &amp; Security
                </h3>
                <div className="grid grid-cols-1 gap-5">

                  {/* Document Upload – PDF only */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Verification Document <span className="text-red-500">*</span>
                    </label>

                    {/* Guidance hint */}
                    <div className="flex items-start gap-2 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700 leading-relaxed">
                        <span className="font-semibold">Accepted Format: PDF Only</span> · Maximum Size: 10 MB<br />
                        Upload your Degree Certificate, Provisional Certificate,
                        Hall Ticket, or Consolidated Marks Memo.
                      </div>
                    </div>

                    <label
                      className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all group
                        ${formData.document
                          ? 'border-green-400 bg-green-50 py-4'
                          : 'border-gray-200 bg-gray-50     py-8'
                        }`}
                    >
                      {formData.document ? (
                        <div className="flex items-center gap-3 px-4">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{formData.document.name}</p>
                            <p className="text-xs text-gray-500">{(formData.document.size / 1024).toFixed(1)} KB · PDF Document</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 ml-auto" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          <UploadCloud className="w-10 h-10 text-gray-300   mb-2 transition-colors" />
                          <p className="text-sm font-semibold text-gray-500  ">Click to upload PDF document</p>
                          <p className="text-xs text-gray-400 mt-1">PDF only · Max 10 MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        name="document"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500">
                        <Lock className="h-5 w-5 transition-colors" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all"
                      />
                      <div
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400  "
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              </div>

              {/* ── OCR Progress Overlay ── */}
              {isLoading && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      {loadingStage === 'creating'
                        ? <CheckCircle className="w-9 h-9 text-green-500" />
                        : <ScanSearch className="w-9 h-9 text-orange-500 animate-pulse" />
                      }
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {loadingStage === 'uploading' && 'Uploading Document…'}
                      {loadingStage === 'verifying' && 'Verifying Document…'}
                      {loadingStage === 'creating'  && 'Account Created!'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      {loadingStage === 'uploading' && 'Securely uploading your PDF document.'}
                      {loadingStage === 'verifying' && 'Our system is reading your document to verify your Name, Roll Number, and VVIT affiliation. Please wait.'}
                      {loadingStage === 'creating'  && 'Finalising your registration…'}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${loadingStage !== '' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3" /> Upload
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${loadingStage === 'verifying' || loadingStage === 'creating' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                        <ScanSearch className="w-3 h-3" /> OCR Verify
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${loadingStage === 'creating' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-8 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 px-4 text-orange-500 font-bold rounded-xl transition-colors outline-none bg-transparent"
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-[2] flex justify-center items-center py-3.5 px-4 text-orange-500 font-bold rounded-xl transition-colors outline-none bg-transparent"
                  >
                    Next Step <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-[2] flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-bold text-orange-500 transition-all duration-200 outline-none bg-transparent
                      ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading
                      ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…</>
                      : <><CheckCircle className="w-5 h-5 mr-2" /> Complete Registration</>
                    }
                  </button>
                )}
              </div>
            </form>


            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-600">
                Already have an account?
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-6 text-orange-500 font-bold text-sm min-h-[44px] focus:outline-none transition-colors bg-transparent border-none shadow-none"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
