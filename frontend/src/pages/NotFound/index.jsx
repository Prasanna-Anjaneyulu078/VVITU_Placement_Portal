import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleGoHome = () => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'ALUMNI') navigate('/alumni/dashboard');
    else if (role === 'STUDENT') navigate('/student/dashboard');
    else navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)',
      fontFamily: "'Inter', 'Poppins', sans-serif",
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '3rem 4rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        maxWidth: '480px',
        width: '100%',
      }}>
        <div style={{
          width: '80px', height: '80px',
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <AlertTriangle size={36} color="#d97706" />
        </div>

        <h1 style={{ fontSize: '5rem', fontWeight: '800', color: '#1e293b', margin: '0 0 0.25rem', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#334155', margin: '0 0 0.75rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <button
          onClick={handleGoHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #F47C20, #e06010)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.75rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 4px 14px rgba(244,124,32,0.35)',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244,124,32,0.45)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(244,124,32,0.35)'; }}
        >
          <Home size={18} />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
