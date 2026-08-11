import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Users, Moon, Sun, LogOut, Briefcase, Settings, Clock, Calendar, MessageSquare } from 'lucide-react';
import './Navbar.scss';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

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
        <div className="user-info">
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
            </>
          )}

          {/* Personal Employee Links (For Managers and Employees, NOT Admins) */}
          {user.role !== 'admin' && (
            <>
              <Link to="/my-timesheets" className={`nav-link ${location.pathname === '/my-timesheets' ? 'active' : ''}`}>
                <Clock size={16} /> My Timesheets
              </Link>
            </>
          )}

          {/* Global Messaging (For Everyone) */}
          <Link to="/messages" className={`nav-link ${location.pathname === '/messages' ? 'active' : ''}`}>
            <MessageSquare size={16} /> Messages
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
