import { useState, useCallback } from 'react';

/**
 * useToast - Custom hook for managing toast notifications.
 * Returns toasts array and showToast(message, type) function.
 * Types: 'success' | 'error' | 'info'
 */
export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
