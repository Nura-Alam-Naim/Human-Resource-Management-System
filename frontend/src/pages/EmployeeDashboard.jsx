import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Edit2, XCircle, X } from 'lucide-react';
import './EmployeeDashboard.scss';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  
  // Apply Form State
  const [formData, setFormData] = useState({
    type_id: 1, // Default to 1 (Sick Leave)
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Edit Form State
  const [editingRequest, setEditingRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({
    type_id: 1,
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchData = async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        axios.get('/api/user/leaves/profile'),
        axios.get('/api/user/leaves/my-requests')
      ]);
      setProfile(profileRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/user/leaves/apply', formData);
      alert('Leave applied successfully!');
      setFormData({ type_id: 1, start_date: '', end_date: '', reason: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error applying for leave');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        await axios.put(`/api/user/leaves/cancel/${id}`);
        fetchData();
      } catch (error) {
        alert('Error cancelling request');
      }
    }
  };

  const openEditModal = (req) => {
    setEditingRequest(req);
    setEditFormData({
      type_id: req.type_id || 1,
      start_date: req.start_date.split('T')[0], // Extract YYYY-MM-DD
      end_date: req.end_date.split('T')[0],
      reason: req.reason
    });
  };

  const closeEditModal = () => {
    setEditingRequest(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/user/leaves/edit/${editingRequest.id}`, editFormData);
      alert('Leave request updated successfully!');
      closeEditModal();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error editing request');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Profile Header */}
      <div className="card profile-card">
        <div className="balance-info">
          <h3>Leave Balance</h3>
          <div className="balance-number">{profile?.total_leave_balance || 0}</div>
          <span className="balance-label">Days Remaining</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Apply Form */}
        <div className="card apply-card">
          <h3>Apply for Leave</h3>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Leave Type</label>
              <select 
                value={formData.type_id} 
                onChange={(e) => setFormData({...formData, type_id: Number(e.target.value)})}
              >
                <option value={1}>Sick Leave</option>
                <option value={2}>Casual Leave</option>
                <option value={3}>Annual Leave</option>
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <textarea 
                rows="3" 
                required
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Briefly explain your reason for leave..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary w-full">Submit Request</button>
          </form>
        </div>

        {/* History Table */}
        <div className="card history-card">
          <h3>My Leave History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No leave requests found.</td>
                  </tr>
                ) : (
                  requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.type_name}</td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <div className="action-buttons">
                            <button onClick={() => openEditModal(req)} className="btn btn-outline btn-sm" title="Edit Request">
                              <Edit2 size={16} /> Edit
                            </button>
                            <button onClick={() => handleCancel(req.id)} className="btn btn-outline btn-sm cancel-btn" title="Cancel Request">
                              <XCircle size={16} /> Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Request Modal */}
      {editingRequest && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Leave Request</h3>
              <button className="close-btn" onClick={closeEditModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select 
                    value={editFormData.type_id} 
                    onChange={(e) => setEditFormData({...editFormData, type_id: Number(e.target.value)})}
                  >
                    <option value={1}>Sick Leave</option>
                    <option value={2}>Casual Leave</option>
                    <option value={3}>Annual Leave</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={editFormData.start_date}
                      onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      required
                      value={editFormData.end_date}
                      onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <textarea 
                    rows="3" 
                    required
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full" style={{marginTop: '16px'}}>Update Request</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
