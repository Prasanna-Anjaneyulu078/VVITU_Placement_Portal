import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute - Route guard that checks authentication and role.
 *
 * Props:
 *   children  - The component to render if authorized
 *   role      - Required role: 'STUDENT' | 'ALUMNI' | 'ADMIN'
 *               If omitted, only checks for a valid token (any role).
 */
const allowedRoleMap = {
  ADMIN: ['ADMIN', 'SUPER_ADMIN'],
  SUPER_ADMIN: ['SUPER_ADMIN'],
  ALUMNI: ['ALUMNI'],
  STUDENT: ['STUDENT'],
};

export default function PrivateRoute({ children, role }) {
  const userRole = localStorage.getItem('role');

  // Not logged in (or at least, no role stored)
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (role) {
    const allowedRoles = allowedRoleMap[role] || [role];
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
