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

  // Documents
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('General');

  // Profile Picture
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
    
    const fetchDocuments = async () => {
      try {
        setDocLoading(true);
        const res = await axios.get('/api/documents/my-documents');
        setDocuments(res.data);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      } finally {
        setDocLoading(false);
      }
    };

    if (user) {
      fetchProfile();
      fetchDocuments();
    }
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

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    
    const formData = new FormData();
    formData.append('document', docFile);
    formData.append('doc_type', docType);

    try {
      await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh documents
      const res = await axios.get('/api/documents/my-documents');
      setDocuments(res.data);
      setDocFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to upload document.');
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/documents/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, profile_picture: res.data.profile_picture });
      // Tell parent/context to update if needed, or simply reload page
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
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
            <div className="avatar-circle" style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              <label htmlFor="avatar-upload" style={{ cursor: 'pointer', display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {profile.profile_picture ? (
                  <img src={`http://localhost:8800/${profile.profile_picture}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={48} />
                )}
                {isUploadingAvatar && <div className="spinner" style={{ position: 'absolute' }}></div>}
              </label>
              <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={isUploadingAvatar}/>
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

        <div className="card documents-card" style={{ gridColumn: '1 / -1' }}>
          <div className="documents-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h3>My Documents</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h4>Upload New Document</h4>
              <form onSubmit={handleDocumentUpload} style={{ marginTop: '12px' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Document Type</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} required>
                    <option value="General">General</option>
                    <option value="Medical Certificate">Medical Certificate</option>
                    <option value="ID Card">ID Card</option>
                    <option value="Resume">Resume</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>File</label>
                  <input type="file" onChange={(e) => setDocFile(e.target.files[0])} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={!docFile}>Upload Document</button>
              </form>
            </div>

            <div style={{ flex: 2, minWidth: '300px' }}>
              <h4>Uploaded Documents</h4>
              {docLoading ? (
                <div className="spinner" style={{ marginTop: '20px' }}></div>
              ) : documents.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>No documents uploaded yet.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '12px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Uploaded On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.file_name}</td>
                          <td><span className="role-badge" style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)' }}>{doc.doc_type}</span></td>
                          <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                          <td>
                            <a href={`http://localhost:8800/${doc.file_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', marginRight: '12px', textDecoration: 'none', fontSize: '0.875rem' }}>View</a>
                            <button onClick={() => handleDeleteDocument(doc.id)} style={{ color: 'var(--error-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
