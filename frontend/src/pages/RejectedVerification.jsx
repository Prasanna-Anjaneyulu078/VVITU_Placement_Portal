import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import api from '../utils/axiosConfig';

export default function RejectedVerification() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('Your registration was not approved.');

  useEffect(() => {
    // We could fetch the exact reason from an endpoint if needed,
    // but the backend doesn't currently expose a specific /me endpoint that returns rejectionReason.
    // For now, we'll display a generic rejection message or fetch if we add it.
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Rejected</h2>
        
        <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm mb-8 text-left leading-relaxed">
          <p>Unfortunately, your alumni registration has been rejected by the Placement Cell.</p>
          {/* <p className="mt-2 font-semibold">Reason: {reason}</p> */}
          <p className="mt-2">Please contact the administration for further details or if you believe this was a mistake.</p>
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
