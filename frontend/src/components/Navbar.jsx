import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Users, Moon, Sun, LogOut } from 'lucide-react';
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
        <Link to="/" className="brand-link">
          <h1>Leave Management</h1>
        </Link>
      </div>

      <div className="navbar-controls">
        <div className="user-info">
          <User size={18} />
          <span>{user.name} ({user.role})</span>
        </div>
        
        <Link to="/profile" className="btn btn-outline btn-sm nav-link-btn">
          <User size={16} /> My Profile
        </Link>

        {user.role === 'manager' && (
          <Link to="/employees" className="btn btn-outline btn-sm nav-link-btn">
            <Users size={16} /> All Employees
          </Link>
        )}

        <button onClick={handleLogout} className="btn btn-primary btn-sm nav-link-btn">
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
