import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataProvider } from './context/DataContext';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import PendingVerification from './pages/PendingVerification';
import RejectedVerification from './pages/RejectedVerification';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentJobs from './pages/student/StudentJobs';
import StudentApplications from './pages/student/StudentApplications';
import StudentApplicationDetails from './pages/student/StudentApplicationDetails';

import AlumniDashboard from './pages/alumni/AlumniDashboard';
import AlumniStudentApplications from './pages/alumni/AlumniStudentApplications';
import AlumniPostJob from './pages/alumni/AlumniPostJob';
import AlumniEditJob from './pages/alumni/AlumniEditJob';
import AlumniMyJobs from './pages/alumni/AlumniMyJobs';
import AlumniProfile from './pages/alumni/AlumniProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminJobs from './pages/admin/AdminJobs';
import AdminShortlisted from './pages/admin/AdminShortlisted';
import AdminAlumni from './pages/admin/AdminAlumni';
import AdminProfile from './pages/admin/AdminProfile';
import StudentsPage from './pages/admin/UserManagement/StudentsPage';
import StudentManagement from './pages/admin/UserManagement/StudentManagement';
import AdminManagement from './pages/admin/UserManagement/AdminManagement';
import ChangePassword from './pages/ChangePassword';
import JobDetails from './pages/JobDetails';

/**
 * TokenGuard - Simplified since JWT is now HttpOnly and cannot be parsed here.
 * Expiry is handled by the axios interceptor on 401 response.
 */
function TokenGuard({ children }) {
  return children;
}

export default function App() {
  return (
    <DataProvider>
      <Router>
        <TokenGuard>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/rejected-verification" element={<RejectedVerification />} />

            {/* Student Routes — requires STUDENT role */}
            <Route path="/student/dashboard" element={<PrivateRoute role="STUDENT"><StudentDashboard /></PrivateRoute>} />
            <Route path="/student/profile"   element={<PrivateRoute role="STUDENT"><StudentProfile /></PrivateRoute>} />
            <Route path="/student/jobs"      element={<PrivateRoute role="STUDENT"><StudentJobs /></PrivateRoute>} />
            <Route path="/student/jobs/:id"  element={<PrivateRoute role="STUDENT"><JobDetails /></PrivateRoute>} />
            <Route path="/student/applications" element={<PrivateRoute role="STUDENT"><StudentApplications /></PrivateRoute>} />
            <Route path="/student/applications/:id" element={<PrivateRoute role="STUDENT"><StudentApplicationDetails /></PrivateRoute>} />


            {/* Alumni Routes — requires ALUMNI role */}
            <Route path="/alumni/dashboard" element={<PrivateRoute role="ALUMNI"><AlumniDashboard /></PrivateRoute>} />
            <Route path="/alumni/applications" element={<PrivateRoute role="ALUMNI"><AlumniStudentApplications /></PrivateRoute>} />
            <Route path="/alumni/jobs/:jobId/applications" element={<PrivateRoute role="ALUMNI"><AlumniStudentApplications /></PrivateRoute>} />
            <Route path="/alumni/jobs/:id/manage" element={<PrivateRoute role="ALUMNI"><AlumniStudentApplications /></PrivateRoute>} />
            <Route path="/alumni/post-job"  element={<PrivateRoute role="ALUMNI"><AlumniPostJob role="alumni" /></PrivateRoute>} />
            <Route path="/alumni/edit-job/:id" element={<PrivateRoute role="ALUMNI"><AlumniEditJob /></PrivateRoute>} />
            <Route path="/alumni/my-jobs"   element={<PrivateRoute role="ALUMNI"><AlumniMyJobs /></PrivateRoute>} />
            <Route path="/alumni/jobs/:id"  element={<PrivateRoute role="ALUMNI"><AlumniStudentApplications /></PrivateRoute>} />
            <Route path="/alumni/profile"   element={<PrivateRoute role="ALUMNI"><AlumniProfile /></PrivateRoute>} />

            {/* Admin Routes — requires ADMIN role */}
            <Route path="/admin/dashboard"     element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/verifications" element={<PrivateRoute role="ADMIN"><AdminVerifications /></PrivateRoute>} />
            <Route path="/admin/jobs"          element={<PrivateRoute role="ADMIN"><AdminJobs /></PrivateRoute>} />
            <Route path="/admin/jobs/:id/manage" element={<Navigate to="/admin/jobs" replace />} />
            <Route path="/admin/jobs/:id/applications" element={<Navigate to="/admin/jobs" replace />} />
            <Route path="/admin/post-job"      element={<PrivateRoute role="ADMIN"><AlumniPostJob role="admin" /></PrivateRoute>} />
            <Route path="/admin/jobs/:id"      element={<PrivateRoute role="ADMIN"><JobDetails /></PrivateRoute>} />
            <Route path="/admin/students"      element={<PrivateRoute role="ADMIN"><StudentsPage /></PrivateRoute>} />
            <Route path="/admin/shortlisted"   element={<Navigate to="/admin/students?tab=shortlisted" replace />} />
            <Route path="/admin/users/students" element={<Navigate to="/admin/students?tab=manage" replace />} />
            <Route path="/admin/alumni"        element={<PrivateRoute role="ADMIN"><AdminAlumni /></PrivateRoute>} />
            <Route path="/admin/profile"       element={<PrivateRoute role="ADMIN"><AdminProfile /></PrivateRoute>} />
            <Route path="/admin/users/admins"   element={<PrivateRoute role="SUPER_ADMIN"><AdminManagement /></PrivateRoute>} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TokenGuard>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </DataProvider>
  );
}
