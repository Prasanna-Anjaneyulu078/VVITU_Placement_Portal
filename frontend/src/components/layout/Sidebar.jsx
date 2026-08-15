import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LogOut 
} from 'lucide-react';
import { Avatar } from '../common';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, navItems, user, onLogout }) {
  const closeBtnRef = useRef(null);

  // Close sidebar on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when sidebar is open on Mobile / Tablet
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button for accessibility
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose} 
          aria-hidden="true"
        />
      )}
      <aside 
        id="mobile-sidebar"
        className={`sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-box">
              <img src="https://res.cloudinary.com/dwxqqx0oe/image/upload/v1772097342/VVITU-logo_ejvk7p.jpg" className='website-logo' alt="VVIT University Logo" />
            </div>
            <span className="college-name">VVIT University</span>
          </div>
          <button 
            ref={closeBtnRef}
            className="close-sidebar-btn" 
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <Avatar src={user.img} name={user.name} size="md" />
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <p className="user-role">{user.role}</p>
            </div>
            <button 
              onClick={onLogout} 
              className="icon-btn icon-btn-sm text-slate-500   transition-colors"
              title="Sign Out"
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
