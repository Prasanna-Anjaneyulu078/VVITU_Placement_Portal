import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Header.css';

export default function Header({ role, onToggleSidebar, isSidebarOpen }) {
  const location = useLocation();

  // Dynamic Route Title
  const getPageTitle = (pathname) => {
    if (pathname.includes('/manage')) return 'Manage Job';
    if (pathname.includes('/jobs/') && !['/student/jobs', '/admin/jobs', '/alumni/my-jobs'].includes(pathname)) {
      return 'Job Details';
    }
    if (pathname.includes('/edit-job/')) return 'Edit Job';

    const routesMap = {
      '/student/dashboard': 'Dashboard',
      '/student/jobs': 'Jobs',
      '/student/applications': 'Applications',
      '/student/profile': 'Profile',
      '/admin/dashboard': 'Dashboard',
      '/admin/students': 'Students',
      '/admin/users/students': 'Students',
      '/admin/alumni': 'Alumni',
      '/admin/jobs': 'Jobs',
      '/admin/post-job': 'Job Post',
      '/admin/verifications': 'Verifications',
      '/admin/shortlisted': 'Shortlisted',
      '/admin/users/admins': 'Manage Admins',
      '/admin/profile': 'Profile',
      '/admin/audit-logs': 'Audit Logs',
      '/admin/reports': 'Reports',
      '/alumni/dashboard': 'Dashboard',
      '/alumni/post-job': 'Post Job',
      '/alumni/my-jobs': 'My Jobs',
      '/alumni/applications': 'Applications',
      '/alumni/profile': 'Profile',
      '/change-password': 'Change Password',
      '/pending-verification': 'Pending Verification',
      '/rejected-verification': 'Rejected Verification'
    };

    if (routesMap[pathname]) return routesMap[pathname];

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    }

    return 'Dashboard';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="top-header">
      {/* LEFT SIDE: HAMBURGER + PAGE TITLE */}
      <div className="header-left">
        <button 
          className="hamburger-btn" 
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          aria-expanded={isSidebarOpen}
        >
          <Menu size={22} />
        </button>
        <h1 className="header-title">
          {currentTitle}
        </h1>
      </div>
    </header>
  );
}
