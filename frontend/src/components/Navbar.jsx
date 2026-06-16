import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Sun, LogOut, KeyRound } from 'lucide-react';
import './Navbar.scss';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
        <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit'}}>
          <h1>Leave Management</h1>
        </Link>
      </div>

      <div className="navbar-controls">
        <div className="user-info">
          <User size={18} />
          <span>{user.name} ({user.role})</span>
        </div>
        
        <Link to="/profile" className="btn btn-outline btn-sm" style={{display: 'flex', alignItems: 'center'}}>
          <User size={16} style={{marginRight: '6px'}} /> My Profile
        </Link>

        <button onClick={handleLogout} className="btn btn-primary btn-sm">
          <LogOut size={16} style={{marginRight: '6px'}} /> Logout
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
