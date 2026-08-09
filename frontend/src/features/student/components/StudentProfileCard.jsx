import React, { useState } from 'react';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { 
  MoreVertical, Eye, Edit2, Trash2, 
  Monitor, User, Calendar, Star, 
  Mail, Phone, Briefcase, Building2, 
  IdCard, ChevronRight 
} from 'lucide-react';

export default function StudentProfileCard({ user }) {
  if (!user) return null;
  // Fallbacks for data mapping
  const name = user.name || 'N/A';
  const rollNo = user.rollNo || user.rollNumber || 'N/A';
  const img = user.img || user.profileImageUrl || generateAvatarSVG(name, 'F47C20', 'fff');
  const department = user.department || 'N/A';
  const section = user.section || user.semester ? `Semester ${user.semester}` : 'N/A';
  const batch = user.batch || user.academicYear || 'N/A';
  const cgpa = user.cgpa || 'N/A';
  const email = user.email || (user.user && user.user.email) || 'N/A';
  const mobile = user.phone || user.mobileNumber || 'N/A';
  const status = user.verificationStatus || user.status || 'Active';
  const placementStatus = user.placementStatus || (user.isPlacementReady ? 'Ready' : 'Pending');
  const company = user.company || user.location || 'N/A';

  const isVerified = status === 'VERIFIED' || status === 'Active';

  const DetailItem = ({ icon: Icon, label, value, colorClass }) => (
    <div className="flex items-center justify-between md:justify-start group py-3 md:py-0 border-b border-slate-50 md:border-b-0 last:border-b-0 last:pb-0 transition-transform duration-200   cursor-default">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-[46px] h-[46px] rounded-2xl flex flex-shrink-0 items-center justify-center transition-colors duration-300 ${colorClass}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-semibold text-slate-500 mb-0.5 tracking-wide">{label}</span>
          <span className="text-[15px] font-bold text-slate-900 truncate" title={value}>{value}</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 md:hidden flex-shrink-0" />
    </div>
  );

  const ActionButtons = ({ className }) => (
    <div className={`flex gap-3 ${className}`}>
      <button className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center bg-white text-slate-600       border border-slate-200 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100" title="View Details">
        <Eye size={18} strokeWidth={2.5}/>
      </button>
      <button className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center bg-white text-slate-600       border border-slate-200 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-100" title="Edit Profile">
        <Edit2 size={18} strokeWidth={2.5}/>
      </button>
      <button className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center bg-white text-slate-600       border border-slate-200 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-100" title="Delete Profile">
        <Trash2 size={18} strokeWidth={2.5}/>
      </button>
    </div>
  );

  return (
    // Glassmorphism Premium Dashboard Card
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]  _12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-white/60 overflow-hidden relative">

      {/* Tablet Absolute Action Buttons (Top Right) */}
      <div className="absolute top-6 right-6 hidden md:block lg:hidden z-10">
        <ActionButtons className="flex-row" />
      </div>

      <div className="flex flex-col lg:flex-row h-full">
        
        {/* Left Section: Image + Name + RollNo */}
        <div className="flex flex-col items-center lg:items-start p-8 lg:p-10 lg:w-[380px] lg:border-r border-b lg:border-b-0 border-slate-200/60 relative shrink-0">
          
          <div className="relative mb-6 lg:mb-8 mt-2 lg:mt-0 group">
            {/* Gradient Border Avatar Container */}
            <div className="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] rounded-full p-[3px] bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 shadow-md transition-transform duration-300   relative z-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white relative">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = generateAvatarSVG(name, 'F47C20', 'fff');
                  }}
                />
              </div>
            </div>
            {/* Status Dot */}
            <div className={`absolute bottom-2 right-2 w-5 h-5 border-[3px] border-white rounded-full z-10 shadow-sm ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} title={isVerified ? 'Online' : 'Offline'}></div>
          </div>

          <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2 w-full flex-wrap">
              <h2 className="text-[24px] lg:text-[30px] font-bold text-slate-900 tracking-tight leading-tight max-w-[220px] truncate" title={name}>
                {name}
              </h2>
              {/* Placement Status Badge next to name */}
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm">
                {placementStatus}
              </span>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-500 mt-1">
              <IdCard size={18} strokeWidth={2} className="text-slate-400" />
              <span className="text-[16px] lg:text-[18px] font-medium tracking-wide">{rollNo}</span>
            </div>

            {/* Mobile Action Buttons (Horizontal Row Below Roll No) */}
            <div className="mt-6 md:hidden w-full flex justify-center">
              <ActionButtons className="flex-row" />
            </div>
          </div>
        </div>

        {/* Middle Section: Details Grid */}
        <div className="flex-1 p-8 lg:p-10 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-8 md:gap-x-12 lg:gap-x-16 h-full content-center">
            
            <DetailItem 
              icon={Monitor} label="Department" value={department} 
              colorClass="bg-blue-100/50 text-blue-600  " 
            />
            <DetailItem 
              icon={User} label="Section" value={section} 
              colorClass="bg-pink-100/50 text-pink-600  " 
            />
            <DetailItem 
              icon={Calendar} label="Batch" value={batch} 
              colorClass="bg-teal-100/50 text-teal-600  " 
            />
            <DetailItem 
              icon={Star} label="CGPA" value={cgpa} 
              colorClass="bg-amber-100/50 text-amber-600  " 
            />
            <DetailItem 
              icon={Mail} label="Email" value={email} 
              colorClass="bg-purple-100/50 text-purple-600  " 
            />
            <DetailItem 
              icon={Phone} label="Mobile" value={mobile} 
              colorClass="bg-indigo-100/50 text-indigo-600  " 
            />
            <DetailItem 
              icon={Briefcase} label="Placement Status" value={placementStatus} 
              colorClass="bg-emerald-100/50 text-emerald-600  " 
            />
            <DetailItem 
              icon={Building2} label="Company" value={company} 
              colorClass="bg-cyan-100/50 text-cyan-600  " 
            />

          </div>
        </div>

        {/* Right Section: Desktop Actions */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8 border-l border-slate-200/60 w-[120px] shrink-0 bg-white/40">
          <ActionButtons className="flex-col gap-4" />
        </div>

      </div>
    </div>
  );
}
