import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

export default function PendingVerification() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-orange-500 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Pending</h2>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-8 text-left leading-relaxed">
          <p>Your account is awaiting verification by the Placement Cell.</p>
          <p className="mt-2">This process typically takes 1-2 business days. You will receive access to the dashboard once your submitted documents are approved.</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 text-gray-600   font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Login
        </button>
      </div>
    </div>
  );
}
