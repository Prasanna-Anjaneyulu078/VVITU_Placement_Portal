/**
 * Centralized Permission Matrix for VVIT Placement Portal Account Management
 * 
 * Matrix:
 * SUPER_ADMIN -> Create Admin (YES), Create Student (YES), Create Alumni from Account Management (NO)
 * ADMIN -> Create Admin (NO), Create Student (YES), Create Alumni from Account Management (NO)
 * ALUMNI -> Create Admin (NO), Create Student (NO), Create Alumni from Account Management (NO)
 * STUDENT -> Create Admin (NO), Create Student (NO), Create Alumni from Account Management (NO)
 */

export function canCreateAdmin(userRole) {
  if (!userRole || typeof userRole !== 'string') return false;
  return userRole.trim().toUpperCase() === 'SUPER_ADMIN';
}

export function canCreateStudent(userRole) {
  if (!userRole || typeof userRole !== 'string') return false;
  const r = userRole.trim().toUpperCase();
  return r === 'SUPER_ADMIN' || r === 'ADMIN';
}

export function canCreateAlumni() {
  // Alumni accounts are created EXCLUSIVELY via the public Alumni Registration Form.
  // Administrative Alumni account creation is strictly forbidden.
  return false;
}

export function canViewAdminAccounts(userRole) {
  if (!userRole || typeof userRole !== 'string') return false;
  return userRole.trim().toUpperCase() === 'SUPER_ADMIN';
}

export function canViewStudentAccounts(userRole) {
  if (!userRole || typeof userRole !== 'string') return false;
  const r = userRole.trim().toUpperCase();
  return r === 'SUPER_ADMIN' || r === 'ADMIN';
}

export default {
  canCreateAdmin,
  canCreateStudent,
  canCreateAlumni,
  canViewAdminAccounts,
  canViewStudentAccounts
};
