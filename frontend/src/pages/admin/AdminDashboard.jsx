import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/common';
import { CardLoader, SectionLoader } from '../../components/common/loading';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import useAuth from '../../hooks/useAuth';
import { canCreateAdmin } from '../../utils/permissionUtils';
import { Users, UserCheck, Briefcase, FileText, CheckCircle, Percent, ArrowRight, Shield, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isSuperAdmin = canCreateAdmin(role);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculatePlacementRate = () => {
    if (!stats || stats.totalVerifiedStudents === 0) return 0;
    // Assuming 'selected' represents the total number of unique students selected or just selected applications.
    // Placement Percentage = Selected Students / Eligible (Verified) Students * 100
    const rate = (stats.selected / stats.totalVerifiedStudents) * 100;
    return rate > 100 ? 100 : rate.toFixed(1);
  };

  const statCards = [
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: <Users size={24} />, color: 'bg-blue-100 text-blue-600', link: '/admin/students?filter=all' },
    { title: 'Verified Students', value: stats?.totalVerifiedStudents || 0, icon: <UserCheck size={24} />, color: 'bg-emerald-100 text-emerald-600', link: '/admin/students?filter=verified' },
    { title: 'Resumes Uploaded', value: stats?.resumesUploaded || 0, icon: <FileText size={24} />, color: 'bg-purple-100 text-purple-600', link: '/admin/students?filter=resumeUploaded' },
    { title: 'Placement Ready', value: stats?.placementReady || 0, icon: <Briefcase size={24} />, color: 'bg-[#FFF4EB] text-[#F47C20]', link: '/admin/students?filter=placementReady' },
  ];

  return (
    <DashboardLayout role={isSuperAdmin ? 'super_admin' : 'admin'}>
      <PageHeader 
        title={isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"} 
        subtitle="Platform overview, statistics, and moderation tasks."
        actionButton={isSuperAdmin ? {
          label: "Add Admin",
          icon: <Plus size={16} />,
          onClick: () => navigate('/admin/profile')
        } : null}
      />

      <div className="space-y-8 mt-6">
        
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
             [...Array(4)].map((_, idx) => (
               <div key={idx} className="h-[88px]">
                 <CardLoader lines={2} />
               </div>
             ))
          ) : (
            statCards.map((card, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(card.link)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition-all group h-[88px]"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{card.title}</p>
                  <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} transition-transform shrink-0`}>
                  {card.icon}
                </div>
              </div>
            ))
          )}
        </div>

        {/* APPLICATION FUNNEL & OTHER METRICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="text-primary" size={20} /> Application Funnel
            </h3>
            
            {isLoading ? <SectionLoader rows={4} /> : (
              <div className="flex flex-col gap-2">
                {/* Applied */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Applied</p>
                    <p className="text-2xl font-bold text-blue-700">{stats?.totalApplications || 0}</p>
                  </div>
                </div>
                <div className="flex justify-center -my-3 z-10 relative pointer-events-none">
                  <div className="bg-white p-1 rounded-full border border-gray-100">
                    <ArrowRight className="text-gray-400 rotate-90" size={16} />
                  </div>
                </div>
                {/* Shortlisted */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex justify-between items-center mt-2">
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Shortlisted</p>
                    <p className="text-2xl font-bold text-amber-700">{stats?.shortlisted || 0}</p>
                  </div>
                </div>
                <div className="flex justify-center -my-3 z-10 relative pointer-events-none">
                  <div className="bg-white p-1 rounded-full border border-gray-100">
                    <ArrowRight className="text-gray-400 rotate-90" size={16} />
                  </div>
                </div>
                {/* Selected */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex justify-between items-center mt-2">
                  <div>
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Selected</p>
                    <p className="text-2xl font-bold text-green-700">{stats?.selected || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="text-primary" size={20} /> Verification Overview
            </h3>
            
            {isLoading ? <SectionLoader rows={5} /> : (
              <>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Verified Students</span>
                      <span className="font-bold text-gray-900">{stats?.totalVerifiedStudents || 0} / {stats?.totalStudents || 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(stats?.totalVerifiedStudents / Math.max(stats?.totalStudents || 1, 1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Verified Alumni</span>
                      <span className="font-bold text-gray-900">{stats?.totalVerifiedAlumni || 0} / {stats?.totalAlumni || 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(stats?.totalVerifiedAlumni / Math.max(stats?.totalAlumni || 1, 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                   <h4 className="font-bold text-gray-900 mb-4">Pending Tasks</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col items-center justify-center cursor-pointer transition-colors" onClick={() => navigate('/admin/verifications')}>
                         <span className="text-2xl font-bold text-yellow-700">{stats?.pendingVerifications || 0}</span>
                         <span className="text-xs font-semibold uppercase text-yellow-600 mt-1 text-center">Verifications</span>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center cursor-pointer transition-colors" onClick={() => navigate('/admin/jobs')}>
                         <span className="text-2xl font-bold text-orange-700">{(stats?.totalJobs || 0) - (stats?.activeJobs || 0)}</span>
                         <span className="text-xs font-semibold uppercase text-orange-600 mt-1 text-center">Jobs Pending</span>
                      </div>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
