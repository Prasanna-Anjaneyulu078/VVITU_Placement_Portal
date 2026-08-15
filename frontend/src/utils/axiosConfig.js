import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api',
  withCredentials: true,
});

// Flag to prevent multiple simultaneous redirect loops
let isRedirecting = false;

// Response interceptor: handle 401, 403, 404, 500 & Network Errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network failure or backend un-reachable
      toast.error('Connection Error: Unable to connect to the server. Please check your network connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message || data?.error;

    if (status === 401) {
      // 401 Unauthorized: Expired or missing token
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('profileImage');
        sessionStorage.setItem('session_expired_msg', serverMessage || 'Your login session has expired. Please sign in again to continue.');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        } else {
          isRedirecting = false;
        }
      }
    } else if (status === 403) {
      toast.error(serverMessage || 'Access Denied: You do not have permission to access this resource.');
    } else if (status === 404) {
      toast.error(serverMessage || 'Resource Not Found: The requested information could not be found.');
    } else if (status === 500) {
      toast.error(serverMessage || 'Server Error: Something went wrong on our server. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
