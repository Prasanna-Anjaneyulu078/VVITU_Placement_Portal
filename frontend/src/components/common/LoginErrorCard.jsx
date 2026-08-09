import React, { useState, useEffect } from 'react';
import { AlertCircle, X, WifiOff, ShieldAlert, UserX, ServerCrash } from 'lucide-react';

export default function LoginErrorCard({ error, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  if (!error) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Helper to parse error details
  const getErrorDetails = (err) => {
    if (typeof err === 'string') {
      const lower = err.toLowerCase();
      if (lower.includes('network') || lower.includes('connect')) {
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection.',
          icon: WifiOff,
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50/90',
          iconBg: 'bg-orange-100 text-orange-600',
          titleColor: 'text-orange-950',
          descColor: 'text-orange-800'
        };
      }
      if (lower.includes('inactive') || lower.includes('disabled') || lower.includes('unauthorized')) {
        return {
          title: 'Access Restricted',
          description: err || 'Your account is inactive. Please contact the administrator.',
          icon: ShieldAlert,
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50/90',
          iconBg: 'bg-amber-100 text-amber-600',
          titleColor: 'text-amber-950',
          descColor: 'text-amber-800'
        };
      }
      return {
        title: 'Login Failed',
        description: err || 'Invalid email or password. Please check your credentials and try again.',
        icon: AlertCircle,
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50/95',
        iconBg: 'bg-orange-100 text-orange-600',
        titleColor: 'text-orange-950',
        descColor: 'text-orange-800'
      };
    }

    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message;

    if (!err?.response || err?.code === 'ERR_NETWORK') {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        icon: WifiOff,
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50/90',
        iconBg: 'bg-orange-100 text-orange-600',
        titleColor: 'text-orange-950',
        descColor: 'text-orange-800'
      };
    }

    switch (status) {
      case 401:
        return {
          title: 'Login Failed',
          description: 'Invalid email or password. Please check your credentials and try again.',
          icon: AlertCircle,
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50/95',
          iconBg: 'bg-orange-100 text-orange-600',
          titleColor: 'text-orange-950',
          descColor: 'text-orange-800'
        };
      case 403:
        return {
          title: 'Access Restricted',
          description: 'Your account is inactive. Please contact the administrator.',
          icon: ShieldAlert,
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50/90',
          iconBg: 'bg-amber-100 text-amber-600',
          titleColor: 'text-amber-950',
          descColor: 'text-amber-800'
        };
      case 404:
        return {
          title: 'Account Not Found',
          description: 'No account exists with this email address.',
          icon: UserX,
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50/90',
          iconBg: 'bg-red-100 text-red-600',
          titleColor: 'text-red-950',
          descColor: 'text-red-800'
        };
      case 500:
      case 502:
      case 503:
        return {
          title: 'Server Error',
          description: 'Something went wrong on our end. Please try again later.',
          icon: ServerCrash,
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50/90',
          iconBg: 'bg-red-100 text-red-600',
          titleColor: 'text-red-950',
          descColor: 'text-red-800'
        };
      default:
        return {
          title: 'Authentication Error',
          description: message || 'An unexpected error occurred. Please try again.',
          icon: AlertCircle,
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50/95',
          iconBg: 'bg-orange-100 text-orange-600',
          titleColor: 'text-orange-950',
          descColor: 'text-orange-800'
        };
    }
  };

  const { title, description, icon: Icon, borderColor, bgColor, iconBg, titleColor, descColor } = getErrorDetails(error);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`mb-6 p-4 rounded-2xl border ${borderColor} ${bgColor} shadow-md backdrop-blur-xs transition-all duration-300 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl ${iconBg} shrink-0 mt-0.5 shadow-2xs`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-2">
          <h4 className={`text-sm font-bold tracking-tight ${titleColor}`}>
            {title}
          </h4>
          <p className={`text-xs mt-0.5 leading-relaxed ${descColor}`}>
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
