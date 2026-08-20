import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Users, Moon, Sun, LogOut, Briefcase, Settings, Clock, Calendar, MessageSquare, DollarSign } from 'lucide-react';
import axios from 'axios';
import './Navbar.scss';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get('/api/messages/unread-count');
        setUnreadCount(res.data.unreadCount);
      } catch (error) {}
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s for notifications
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <h1>Leave Management</h1>
        </Link>
      </div>

      <div className="navbar-controls">
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar-circle" style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {user.profile_picture ? (
              <img src={`http://localhost:8800/${user.profile_picture}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        
        <div className="nav-links">
          <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={16} /> Profile
          </Link>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Briefcase size={16} /> {user.role === 'admin' ? 'Administration' : 'Dashboard'}
          </Link>

          {/* Admin and Manager Links */}
          {(user.role === 'manager' || user.role === 'admin') && (
            <>
              <Link to="/all-employees" className={`nav-link ${location.pathname === '/all-employees' ? 'active' : ''}`}>
                <Users size={16} /> Employees
              </Link>
            </>
          )}

          {/* Admin Only Links */}
          {user.role === 'admin' && (
            <>
              <Link to="/company-timesheets" className={`nav-link ${location.pathname === '/company-timesheets' ? 'active' : ''}`}>
                <Clock size={16} /> Timesheets
              </Link>
              <Link to="/holidays" className={`nav-link ${location.pathname === '/holidays' ? 'active' : ''}`}>
                <Calendar size={16} /> Holidays
              </Link>
              <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                <Settings size={16} /> Settings
              </Link>
              <Link to="/payroll" className={`nav-link ${location.pathname === '/payroll' ? 'active' : ''}`}>
                <DollarSign size={16} /> Payroll
              </Link>
            </>
          )}

          {/* Personal Employee Links (For Managers and Employees, NOT Admins) */}
          {user.role !== 'admin' && (
            <>
              <Link to="/my-timesheets" className={`nav-link ${location.pathname === '/my-timesheets' ? 'active' : ''}`}>
                <Clock size={16} /> My Timesheets
              </Link>
              <Link to="/my-payslips" className={`nav-link ${location.pathname === '/my-payslips' ? 'active' : ''}`}>
                <DollarSign size={16} /> My Payslips
              </Link>
            </>
          )}

          {/* Global Messaging (For Everyone) */}
          <Link to="/messages" className={`nav-link ${location.pathname === '/messages' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <MessageSquare size={16} /> Messages
            {unreadCount > 0 && (
              <span className="badge badge-danger rounded-full px-1 text-[10px] absolute -top-1 -right-2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <button onClick={handleLogout} className="btn btn-outline btn-sm logout-btn">
          <LogOut size={16} /> Logout
        </button>

        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
