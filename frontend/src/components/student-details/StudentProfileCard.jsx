import React from 'react';
import { Award, Phone, MapPin, Mail, User, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { toTitleCase } from '../../utils/nameUtils';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { getImageUrl } from '../../utils/imageUrl';

export default function StudentProfileCard({ details }) {
  if (!details) return null;

  const studentName = toTitleCase(details.studentName || details.name || details.user?.name || 'Student');
  const rollNumber = details.rollNumber || details.user?.studentProfile?.rollNumber || 'N/A';
  const departmentName = (typeof details.department === 'object' 
    ? (details.department.name || details.department.code) 
    : details.department) || 'N/A';
  
  const semVal = details.semester || details.user?.studentProfile?.semester;
  const semesterStr = semVal ? `Semester ${semVal}` : '';
  const academicYearStr = details.academicYear || details.graduationYear || details.user?.studentProfile?.academicYear;
  const yearSemDisplay = [semesterStr, academicYearStr ? `Year: ${academicYearStr}` : null, details.section ? `Sec ${details.section}` : null]
    .filter(Boolean)
    .join(' • ');

  const rawImg = details.profileImageUrl || details.user?.studentProfile?.profileImageUrl;
  const fallbackAvatar = generateAvatarSVG(studentName, 'F47C20', 'ffffff', 140);
  const avatarUrl = (rawImg && !rawImg.includes('ui-avatars.com')) ? getImageUrl(rawImg) : fallbackAvatar;

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
      case 'SELECTED': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHORTLISTED': 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INTERVIEW_SCHEDULED': 
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UNDER_REVIEW':
      case 'PENDING': 
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED': 
        return 'bg-red-50 text-red-700 border-red-200';
      default: 
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statusLabel = details.status || details.verificationStatus;
  const email = details.email || details.user?.email;
  const mobileNumber = details.mobileNumber || details.user?.studentProfile?.mobileNumber;
  const location = details.location || details.user?.studentProfile?.location;
  const cgpaValue = details.cgpa ?? details.user?.studentProfile?.cgpa;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm text-center flex flex-col items-center space-y-5 relative overflow-hidden">
      
      {/* Background Accent Decorative Bar */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-400 via-[#F47C20] to-amber-500" />

      {/* Centered Circular Profile Photo */}
      <div className="relative pt-2 shrink-0">
        <div className="p-1.5 bg-[#FFF4EB] border-2 border-orange-200/80 rounded-full shadow-md">
          <img 
            src={avatarUrl} 
            alt={studentName} 
            loading="lazy"
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-2 border-white shadow-inner bg-slate-100" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackAvatar;
            }}
          />
        </div>

        {statusLabel && (
          <span className={`absolute bottom-0 right-1/2 translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusColor(statusLabel)}`}>
            {statusLabel.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Centered Student Basic Information */}
      <div className="space-y-2 max-w-xl mx-auto w-full">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          {studentName}
        </h3>

        {/* Roll Number Badge */}
        <div className="pt-0.5">
          <span className="inline-block px-3.5 py-1 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-mono font-black text-[#F47C20] shadow-2xs tracking-wider">
            {rollNumber}
          </span>
        </div>

        {/* Department & Year / Semester */}
        <p className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center justify-center gap-1.5 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1 text-slate-800">
            <Building2 size={15} className="text-[#F47C20] shrink-0" />
            {departmentName}
          </span>
          {yearSemDisplay && (
            <span className="text-slate-400 font-normal">
              • {yearSemDisplay}
            </span>
          )}
        </p>

        {/* CGPA Badge */}
        {cgpaValue !== undefined && cgpaValue !== null && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black rounded-xl shadow-2xs">
              <Award size={15} className="text-[#F47C20]" />
              <span>CGPA:</span>
              <span className="text-sm font-black text-[#F47C20]">{cgpaValue}</span>
            </span>
          </div>
        )}
      </div>

      {/* Quick Contact & Location Information Row */}
      <div className="pt-2 w-full border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
          {email && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs truncate max-w-xs" title={email}>
              <Mail size={14} className="text-[#F47C20] shrink-0"/> {email}
            </span>
          )}

          {mobileNumber && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs">
              <Phone size={14} className="text-[#F47C20] shrink-0"/> {mobileNumber}
            </span>
          )}

          {location && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs">
              <MapPin size={14} className="text-[#F47C20] shrink-0"/> {location}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
