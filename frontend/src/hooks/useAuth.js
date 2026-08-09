import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useAuth - Custom hook for auth state and actions.
 * Reads token/role from localStorage and provides a logout function.
 */
export default function useAuth() {
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  const isAuthenticated = !!role;

  const logout = useCallback(() => {
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('profileImage');
    navigate('/login');
  }, [navigate]);

  return { role, userName, userEmail, isAuthenticated, logout };
}
