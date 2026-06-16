import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Check, X, User as UserIcon, FileText, UserPlus } from 'lucide-react';
import './ManagerDashboard.scss';

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    total_leave_balance: 20
  });

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/leaves/all-requests');
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching all requests:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this request?`)) {
      try {
        await axios.put(`/api/admin/leaves/update-status/${id}`, { status });
        fetchRequests(); // Refresh list
      } catch (error) {
        alert(error.response?.data?.message || `Error updating status to ${status}`);
      }
    }
  };

  const viewUserProfile = async (userId) => {
    try {
      const res = await axios.get(`/api/admin/leaves/users/${userId}`);
      setSelectedUser(res.data);
      setIsModalOpen(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error fetching user profile.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/leaves/create-user', createFormData);
      alert("User created successfully! Temporary password: Welcome@123");
      setShowCreateModal(false);
      setCreateFormData({ name: '', email: '', role: 'employee', total_leave_balance: 20 });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Company Leave Requests</h2>
          <p>Review and manage employee leave applications below.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Create User
        </button>
      </div>

      <div className="card manager-history-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Details</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No leave requests found in the system.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div 
                        className="employee-cell cursor-pointer" 
                        onClick={() => viewUserProfile(req.user_id)}
                        title="Click to view profile"
                      >
                        <div className="avatar">
                          <UserIcon size={16} />
                        </div>
                        <span className="font-medium employee-name">{req.employee_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="details-cell">
                        <span className="type-label">{req.type_name}</span>
                        <div className="date-cell">
                          <Calendar size={14} />
                          <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="reason-cell">
                        <FileText size={14} className="icon" />
                        <span className="truncate" title={req.reason}>{req.reason}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'approved')} 
                            className="btn btn-success btn-sm"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'rejected')} 
                            className="btn btn-danger btn-sm"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee Profile</h3>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <div className="modal-body scrollable">
              {/* Profile Details */}
              <div className="profile-details-grid">
                <div className="profile-detail">
                  <span className="label">Name</span>
                  <span className="value">{selectedUser.user.name}</span>
                </div>
                <div className="profile-detail">
                  <span className="label">Email</span>
                  <span className="value">{selectedUser.user.email}</span>
                </div>
                <div className="profile-detail">
                  <span className="label">Role</span>
                  <span className="value badge badge-approved">{selectedUser.user.role}</span>
                </div>
                <div className="profile-detail">
                  <span className="label">Leave Balance</span>
                  <span className="value balance-highlight">{selectedUser.user.total_leave_balance} Days</span>
                </div>
              </div>

              {/* History Table */}
              <div className="user-history-section">
                <h4>Leave History</h4>
                {selectedUser.history.length === 0 ? (
                  <p className="text-muted">No history found for this employee.</p>
                ) : (
                  <table className="compact-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.history.map(req => (
                        <tr key={req.id}>
                          <td>{req.type_name}</td>
                          <td>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                              {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={req.reason}>
                              {req.reason}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${req.status}`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateUser}>
                <div className="form-group" style={{marginBottom: '16px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Full Name</label>
                  <input 
                    type="text" 
                    required
                    style={{width: '100%'}}
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{marginBottom: '16px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Email</label>
                  <input 
                    type="email" 
                    required
                    style={{width: '100%'}}
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  />
                </div>
                <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px'}}>
                  <div className="form-group">
                    <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Role</label>
                    <select 
                      style={{width: '100%'}}
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{display: 'block', marginBottom: '8px', fontSize: '0.875rem'}}>Leave Balance</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      style={{width: '100%'}}
                      value={createFormData.total_leave_balance}
                      onChange={(e) => setCreateFormData({...createFormData, total_leave_balance: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Create User
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
