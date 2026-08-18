import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, GraduationCap, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import LoginErrorCard from '../components/common/LoginErrorCard';
import { useData } from '../context/DataContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateProfileImage } = useData() || {};

  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('session_expired_msg');
    if (expiredMsg) {
      toast.warning(expiredMsg, { toastId: 'session-expired-toast' });
      sessionStorage.removeItem('session_expired_msg');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: e.target.email.value,
        password: e.target.password.value
      });

      const { role: userRole, name, email, verificationStatus, profileImageUrl, user, token, accessToken } = response.data || {};
      const jwtToken = token || accessToken || user?.token;
      if (jwtToken) {
        localStorage.setItem('token', jwtToken);
      }
      
      const activeRole = userRole || user?.role;
      const activeName = name || user?.name;
      const activeEmail = email || user?.email;
      
      if (activeRole) localStorage.setItem('role', activeRole);
      if (activeName) localStorage.setItem('userName', activeName);
      if (activeEmail) localStorage.setItem('userEmail', activeEmail);

      const imgUrl = profileImageUrl || user?.profileImageUrl;
      if (imgUrl) {
        if (updateProfileImage) updateProfileImage(imgUrl, { forceRefresh: true });
      } else {
        if (updateProfileImage) updateProfileImage('');
      }

      if (userRole === 'ALUMNI' && verificationStatus === 'PENDING') {
        navigate('/pending-verification');
      } else if (userRole === 'ALUMNI' && verificationStatus === 'REJECTED') {
        navigate('/rejected-verification');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'ALUMNI') {
        navigate('/alumni/dashboard');
      } else {
        navigate('/student/dashboard');
      }

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Column - Branding / Imagery */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f"
            alt="University Campus"
            className="w-full h-full object-cover opacity-20"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/90 to-transparent"></div>
        </div>

        {/* Floating Abstract Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1 shadow-lg">
                <img
                  src="https://res.cloudinary.com/dwxqqx0oe/image/upload/v1772097342/VVITU-logo_ejvk7p.jpg"
                  className="w-full h-full object-contain"
                  alt="VVIT University Logo"
                />
              </div>
              <span className="font-bold text-2xl text-white tracking-wide">VVITU Placement Portal</span>
            </div>
          </div>

          <div className="mb-20">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Empowering your <br />
              <span className="text-orange-500">career journey.</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              Connect with top companies, access exclusive opportunities, and take the first step towards a successful future.
            </p>

            <div className="mt-12 flex gap-8">
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit backdrop-blur-sm">
                  <Briefcase className="text-orange-400 w-6 h-6" />
                </div>
                <span className="text-white font-medium text-sm">Top Companies</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 p-3 rounded-lg w-fit backdrop-blur-sm">
                  <GraduationCap className="text-orange-400 w-6 h-6" />
                </div>
                <span className="text-white font-medium text-sm">Global Alumni</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative overflow-y-auto py-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
              <img
                src="https://res.cloudinary.com/dwxqqx0oe/image/upload/v1772097342/VVITU-logo_ejvk7p.jpg"
                className="w-full h-full object-contain"
                alt="VVIT University Logo"
              />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">VVIT University</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mt-2">Sign in to your account. Your role will be automatically detected.</p>
          </div>

          <LoginErrorCard error={error} onClose={() => setError(null)} />

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all duration-200 shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm outline-none transition-all duration-200 shadow-sm"
                  required
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer text-gray-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-200 mt-6 btn btn-primary
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <LogIn className="w-4 h-4 ml-2" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm font-medium text-gray-600">
              Don't have an alumni account?
            </p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full py-3 px-4 rounded-xl border border-orange-500 bg-[#FFF4EB] text-orange-600 font-bold text-sm min-h-[44px] inline-flex items-center justify-center gap-2 shadow-2xs focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-colors"
            >
              Register as Alumni <GraduationCap className="w-4 h-4 text-orange-600" />
            </button>
            <p className="text-xs text-gray-400">
              Students and Admins are registered directly by the university.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
