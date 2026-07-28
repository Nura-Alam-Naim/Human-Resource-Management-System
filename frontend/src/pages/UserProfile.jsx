import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Calendar, Shield, Clock, ArrowLeft, KeyRound } from 'lucide-react';
import './UserProfile.scss';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/user/leaves/profile');
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await axios.put('/api/auth/change-password', { oldPassword, newPassword });
      setSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center align-center h-screen"><div className="spinner"></div></div>;
  }

  if (!profile) {
    return <div className="error-state">Failed to load profile data.</div>;
  }

  // Calculate Tenure
  const joinedDate = new Date(profile.created_at);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - joinedDate.getFullYear()) * 12 + (now.getMonth() - joinedDate.getMonth());
  const tenureText = monthsDiff === 0 ? 'Less than a month' : monthsDiff === 1 ? '1 month' : `${monthsDiff} months`;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <h2>My Profile</h2>
      </div>

      <div className="profile-grid">
        <div className="card profile-info-card">
          <div className="avatar-section">
            <div className="avatar-circle">
              <User size={48} />
            </div>
            <h3>{profile.name}</h3>
            <p className="role-badge">{profile.role}</p>
          </div>
          
          <div className="info-list">
            <div className="info-item">
              <Shield size={18} />
              <div>
                <span className="label">Email Address</span>
                <span className="value">{profile.email}</span>
              </div>
            </div>
            
            <div className="info-item">
              <Clock size={18} />
              <div>
                <span className="label">Company Tenure</span>
                <span className="value">Joined {tenureText} ago</span>
                <span className="sub-value">({joinedDate.toLocaleDateString()})</span>
              </div>
            </div>

            <div className="info-item">
              <Calendar size={18} />
              <div>
                <span className="label">Leave Statistics</span>
                <span className="value">{profile.total_leaves_taken} Approved Days Taken</span>
                <span className="sub-value">{profile.total_leave_balance} Days Remaining</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card security-card">
          <div className="security-header">
            <KeyRound size={24} />
            <h3>Security & Password</h3>
          </div>
          
          <p className="security-desc">
            Ensure your account is using a long, random password to stay secure.
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
