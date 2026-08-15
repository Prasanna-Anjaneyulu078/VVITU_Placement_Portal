import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataProvider } from './context/DataContext';
import PrivateRoute from './components/common/PrivateRoute';
import { PageLoader, ErrorBoundary } from './components/common';

// Public & Auth Routes (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PendingVerification = lazy(() => import('./pages/PendingVerification'));
const RejectedVerification = lazy(() => import('./pages/RejectedVerification'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const JobDetails = lazy(() => import('./pages/JobDetails'));

// Student Routes (Lazy Loaded)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentJobs = lazy(() => import('./pages/student/StudentJobs'));
const StudentApplications = lazy(() => import('./pages/student/StudentApplications'));
const StudentApplicationDetails = lazy(() => import('./pages/student/StudentApplicationDetails'));

// Alumni Routes (Lazy Loaded)
const AlumniDashboard = lazy(() => import('./pages/alumni/AlumniDashboard'));
const AlumniStudentApplications = lazy(() => import('./pages/alumni/AlumniStudentApplications'));
const AlumniPostJob = lazy(() => import('./pages/alumni/AlumniPostJob'));
const AlumniEditJob = lazy(() => import('./pages/alumni/AlumniEditJob'));
const AlumniMyJobs = lazy(() => import('./pages/alumni/AlumniMyJobs'));
const AlumniProfile = lazy(() => import('./pages/alumni/AlumniProfile'));

// Admin Routes (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));
const AdminAlumni = lazy(() => import('./pages/admin/AdminAlumni'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const StudentsPage = lazy(() => import('./pages/admin/UserManagement/StudentsPage'));
const AdminManagement = lazy(() => import('./pages/admin/UserManagement/AdminManagement'));

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
          <ErrorBoundary title="Portal Navigation Error">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </ErrorBoundary>
        </TokenGuard>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </DataProvider>
  );
}
