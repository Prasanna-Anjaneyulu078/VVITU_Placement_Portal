import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useData } from '../../context/DataContext';
import { toTitleCase } from '../../utils/nameUtils';
import { getImageUrl } from '../../utils/imageUrl';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  User, 
  Settings, 
  Users,
  Calendar,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import api from '../../utils/axiosConfig';
import './DashboardLayout.css';

export default function DashboardLayout({ children, role = 'student' }) {
  const { logout, userName, userEmail, role: authRole } = useAuth();
  const { profileImage, updateProfileImage } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDesignation, setUserDesignation] = useState('');
  const [fetchedName, setFetchedName] = useState('');
  const [fetchedAlumniId, setFetchedAlumniId] = useState('');

  const activeRole = authRole || role || 'student';
  const normalizedRole = activeRole.toLowerCase();

  React.useEffect(() => {
    let isMounted = true;
    if (normalizedRole === 'student') {
      api.get('/student/profile')
        .then(res => {
          if (!isMounted) return;
          if (res.data?.profileImageUrl) {
            updateProfileImage(res.data.profileImageUrl, { forceRefresh: true });
          }
          if (res.data?.name) {
            setFetchedName(res.data.name);
          }
        })
        .catch(err => console.error(err));
    } else if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
      api.get('/admin/profile')
        .then(res => {
          if (!isMounted) return;
          if (res.data?.profileImageUrl) {
            updateProfileImage(res.data.profileImageUrl, { forceRefresh: true });
          }
          if (res.data?.designation) {
            setUserDesignation(res.data.designation);
          }
          if (res.data?.name) {
            setFetchedName(res.data.name);
          }
        })
        .catch(err => {
          if (err?.response?.status !== 401) {
            console.error('Failed to fetch admin profile in DashboardLayout:', err);
          }
        });
    } else if (normalizedRole === 'alumni') {
      api.get('/alumni/profile')
        .then(res => {
          if (!isMounted) return;
          if (res.data?.id) {
            setFetchedAlumniId(res.data.id);
          }
          if (res.data?.profileImageUrl) {
            updateProfileImage(res.data.profileImageUrl, { forceRefresh: true });
          }
          if (res.data?.name) {
            setFetchedName(res.data.name);
          }
        })
        .catch(err => {
          if (err?.response?.status !== 401) {
            console.error('Failed to fetch alumni profile in DashboardLayout:', err);
          }
        });
    }
    
    return () => { isMounted = false; };
  }, [normalizedRole, updateProfileImage]);

  const handleLogout = () => {
    logout();
  };

  const getNavItems = () => {
    switch(normalizedRole) {
      case 'student':
        return [
          { icon: LayoutDashboard, label: 'Dashboard',    path: '/student/dashboard'    },
          { icon: Briefcase,       label: 'Job Board',    path: '/student/jobs'         },
          { icon: FileText,        label: 'Applications', path: '/student/applications' },
          { icon: User,            label: 'Profile',      path: '/student/profile'      },
        ];
      case 'alumni':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/alumni/dashboard' },
          { icon: Briefcase, label: 'Post Job', path: '/alumni/post-job' },
          { icon: Briefcase, label: 'My Jobs', path: '/alumni/my-jobs' },
          { icon: FileText, label: 'Applications', path: '/alumni/applications' },
          { icon: User, label: 'Profile', path: '/alumni/profile' },
        ];
      case 'admin':
      case 'super_admin':
        const adminItems = [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
          { icon: Users, label: 'Students', path: '/admin/students' },
          { icon: Users, label: 'Alumni', path: '/admin/alumni' },
          { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
          { icon: Briefcase, label: 'Job Post', path: '/admin/post-job' }
        ];
        
        if (normalizedRole === 'super_admin') {
          adminItems.push({ icon: Settings, label: 'Manage Admins', path: '/admin/users/admins' });
        }
        
        adminItems.push({ icon: User, label: 'Profile', path: '/admin/profile' });
        return adminItems;
      default:
        return [];
    }
  };

  const getUserInfo = () => {
    const displayName = toTitleCase(fetchedName || userName || 'User');
    const roleLabel = normalizedRole === 'student' ? 'Student Portal'
      : normalizedRole === 'alumni' ? 'Alumni Portal'
      : (userDesignation || 'Administrator');
      
    let formattedImg = profileImage;
    if (formattedImg) {
      formattedImg = getImageUrl(formattedImg);
    }

    return { name: displayName, role: roleLabel, img: formattedImg, designation: userDesignation };
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        navItems={getNavItems()} 
        user={getUserInfo()} 
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Header 
          role={normalizedRole} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
          user={getUserInfo()} 
          onLogout={handleLogout} 
        />
        <main className="page-content">
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
