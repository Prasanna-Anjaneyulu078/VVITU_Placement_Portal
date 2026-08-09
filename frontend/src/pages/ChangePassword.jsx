import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ChangePasswordCard } from '../components/common';

export default function ChangePassword() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleSuccess = () => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') navigate('/admin/dashboard');
    else if (role === 'ALUMNI') navigate('/alumni/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-[#F47C20] rounded-xl flex items-center justify-center shadow-md">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-800 tracking-tight">
          Change Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Enter your current password and choose a new secure password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl">
          <ChangePasswordCard 
            isModal={true} 
            apiEndpoint="/auth/change-password" 
            onSuccess={handleSuccess} 
          />
        </div>
      </div>
    </div>
  );
}

