import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

import api from '../utils/axiosConfig';

/**
 * useAuth - Custom hook for auth state and actions.
 * Reads user state from localStorage and provides a cookie-clearing logout function.
 */
export default function useAuth() {
  const navigate = useNavigate();
  const { clearProfileImage } = useData() || {};

  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  const isAuthenticated = !!role;

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    }
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('profileImage');
    if (clearProfileImage) {
      clearProfileImage();
    }
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  }, [navigate, clearProfileImage]);

  return { role, userName, userEmail, isAuthenticated, logout };
}
