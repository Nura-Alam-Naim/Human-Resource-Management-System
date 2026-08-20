import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User as UserIcon, Mail, Calendar, Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import EmployeeProfileView from '../components/EmployeeProfileView';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import './AllEmployees.scss';

const AllEmployees = () => {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [designations, setDesignations] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDesignationId, setEditDesignationId] = useState('');
  
  // Member Request Modal states
  const [isMemberRequestModalOpen, setIsMemberRequestModalOpen] = useState(false);
  const [memberRequestForm, setMemberRequestForm] = useState({ requested_role: '', description: '' });
  const [memberRequests, setMemberRequests] = useState([]);
  
  const limit = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = loggedInUser.role === 'manager' ? '/api/manager/team/users' : '/api/admin/leaves/users';
      const res = await axios.get(`${endpoint}?page=${page}&limit=${limit}&search=${searchTerm}`);
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      let endpoint = '';
      if (loggedInUser.role === 'manager') {
        endpoint = '/api/manager/team/designations';
      } else if (loggedInUser.role === 'admin') {
        // Admin gets all designations, but since AllEmployees for Admin lists all users,
        // it's tricky. Let's just fetch all designations for admin.
        endpoint = '/api/designations';
      }
      if (endpoint) {
        const res = await axios.get(endpoint);
        setDesignations(res.data);
      }
    } catch (error) {
      console.error("Error fetching designations", error);
    }
  };

  const fetchMemberRequests = async () => {
    if (loggedInUser.role !== 'manager') return;
    try {
      const res = await axios.get('/api/manager/team/my-requests');
      setMemberRequests(res.data);
    } catch (error) {
      console.error("Error fetching member requests", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDesignations();
    fetchMemberRequests();
  }, [page, searchTerm]);

  const handleSaveRole = async (userId, newDesignationId) => {
    try {
      const endpoint = loggedInUser.role === 'manager' 
        ? `/api/manager/team/users/${userId}/designation`
        : `/api/admin/leaves/users/${userId}/designation`;
      
      await axios.put(endpoint, { designation_id: newDesignationId });
      toast.success("Working role updated successfully!");
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handlePromoteRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await axios.put(`/api/admin/leaves/users/${userId}/role`, { role: newRole });
      toast.success(`User successfully promoted to ${newRole}!`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to promote user");
    }
  };

  const handleSubmitMemberRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/manager/team/request-member', memberRequestForm);
      toast.success('Member request submitted to Admin!');
      setIsMemberRequestModalOpen(false);
      setMemberRequestForm({ requested_role: '', description: '' });
      fetchMemberRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    }
  };

  const viewUserProfile = async (userId) => {
    try {
      const endpoint = loggedInUser.role === 'manager' ? `/api/manager/team/users/${userId}` : `/api/admin/leaves/users/${userId}`;
      const res = await axios.get(endpoint);
      setSelectedUser(res.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching user profile.");
    }
  };

  // search and filtering is now handled server-side

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      <PageHeader
        title="All Employees"
        subtitle={`${users.length} total users in the system.`}
      />

      <div className="card search-card">
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center mt-8 mb-8"><div className="spinner"></div></div>
      ) : (
        <div className="tables-wrapper flex flex-col gap-8">
          
          {loggedInUser.role === 'admin' && (
            <div className="card">
              <div className="card-header p-4 border-b">
                <h3 className="m-0 text-lg font-semibold text-gray-800">System Administrators</h3>
              </div>
              <div className="table-container">
                <UserTable 
                  users={users.filter(u => u.role === 'admin')} 
                  loggedInUser={loggedInUser}
                  viewUserProfile={viewUserProfile}
                  editingUserId={editingUserId}
                  setEditingUserId={setEditingUserId}
                  editDesignationId={editDesignationId}
                  setEditDesignationId={setEditDesignationId}
                  designations={designations}
                  handleSaveRole={handleSaveRole}
                  handlePromoteRole={handlePromoteRole}
                />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header p-4 border-b">
              <h3 className="m-0 text-lg font-semibold text-gray-800">Managers</h3>
            </div>
            <div className="table-container">
              <UserTable 
                users={users.filter(u => u.role === 'manager')} 
                loggedInUser={loggedInUser}
                viewUserProfile={viewUserProfile}
                editingUserId={editingUserId}
                setEditingUserId={setEditingUserId}
                editDesignationId={editDesignationId}
                setEditDesignationId={setEditDesignationId}
                designations={designations}
                handleSaveRole={handleSaveRole}
                handlePromoteRole={handlePromoteRole}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header p-4 border-b flex justify-between items-center">
              <h3 className="m-0 text-lg font-semibold text-gray-800">Employees</h3>
              {loggedInUser.role === 'manager' && (
                <button 
                  className="btn btn-primary btn-sm flex items-center gap-1"
                  onClick={() => setIsMemberRequestModalOpen(true)}
                >
                  <UserIcon size={14} /> Request New Member
                </button>
              )}
            </div>
            <div className="table-container">
              <UserTable 
                users={users.filter(u => u.role === 'employee')} 
                loggedInUser={loggedInUser}
                viewUserProfile={viewUserProfile}
                editingUserId={editingUserId}
                setEditingUserId={setEditingUserId}
                editDesignationId={editDesignationId}
                setEditDesignationId={setEditDesignationId}
                designations={designations}
                handleSaveRole={handleSaveRole}
                handlePromoteRole={handlePromoteRole}
              />
            </div>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        isOpen={isProfileModalOpen && !!selectedUser}
        onClose={() => { setIsProfileModalOpen(false); setSelectedUser(null); }}
        title="Employee Profile"
        size="large"
      >
        <EmployeeProfileView data={selectedUser} onUpdate={() => { viewUserProfile(selectedUser.user.id); fetchUsers(); }} />
      </Modal>

      {/* Member Request Modal */}
      <Modal
        isOpen={isMemberRequestModalOpen}
        onClose={() => setIsMemberRequestModalOpen(false)}
        title="Request New Team Member"
      >
        <form onSubmit={handleSubmitMemberRequest} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Submit a request to Admin to assign a new employee to your department.
          </p>
          <div className="form-group">
            <label>Requested Role / Job Title</label>
            <input 
              type="text" 
              required 
              className="form-control"
              value={memberRequestForm.requested_role}
              onChange={e => setMemberRequestForm({...memberRequestForm, requested_role: e.target.value})}
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>
          <div className="form-group">
            <label>Why do you need this member? (Optional)</label>
            <textarea 
              className="form-control"
              rows="3"
              value={memberRequestForm.description}
              onChange={e => setMemberRequestForm({...memberRequestForm, description: e.target.value})}
              placeholder="e.g. We are expanding the team and need more capacity..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-outline" onClick={() => setIsMemberRequestModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* Display Manager's Pending Requests */}
      {loggedInUser.role === 'manager' && memberRequests.length > 0 && (
        <div className="card mt-8 border-indigo-500">
          <div className="card-header p-4 border-b">
            <h3 className="m-0 text-lg font-semibold text-indigo-600">Your Member Requests</h3>
          </div>
          <div className="table-container p-0">
            <table className="m-0">
              <thead>
                <tr>
                  <th>Requested Role</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {memberRequests.map(req => (
                  <tr key={req.id}>
                    <td className="font-medium">{req.requested_role}</td>
                    <td className="text-gray-600 text-sm">{req.description || 'N/A'}</td>
                    <td className="text-sm">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

const UserTable = ({ users, loggedInUser, viewUserProfile, editingUserId, setEditingUserId, editDesignationId, setEditDesignationId, designations, handleSaveRole, handlePromoteRole }) => {
  if (users.length === 0) {
    return <div className="text-center p-4 text-gray-500">No users found in this category.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Email</th>
          <th>Department</th>
          <th>Role</th>
          <th>Leave Balance</th>
          <th>Leaves Taken</th>
          <th>Avg Daily Hours</th>
          <th>Status</th>
          {(loggedInUser.role === 'admin' || loggedInUser.role === 'manager') && <th>System Access</th>}
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              <div
                className="employee-cell cursor-pointer"
                onClick={() => viewUserProfile(user.id)}
                title="Click to view full profile"
              >
                <div className="avatar">
                  <UserIcon size={16} />
                </div>
                <span className="font-medium employee-name">{user.name}</span>
              </div>
            </td>
            <td>
              <div className="email-cell">
                <Mail size={14} className="icon" />
                <span>{user.email}</span>
              </div>
            </td>
            <td>
              <span className="text-gray-600 text-sm font-medium">{user.department_name || 'N/A'}</span>
            </td>
            <td>
              {editingUserId === user.id ? (
                <div className="flex gap-2 align-center">
                  <select 
                    className="flex-1 p-2 border rounded"
                    style={{ minWidth: '150px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)' }}
                    value={editDesignationId}
                    onChange={(e) => setEditDesignationId(e.target.value)}
                  >
                    <option value="">-- Select Role --</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-success btn-sm p-1" 
                    onClick={() => handleSaveRole(user.id, editDesignationId)}
                  >
                    <Save size={14} />
                  </button>
                  <button 
                    className="btn btn-outline btn-sm p-1" 
                    onClick={() => setEditingUserId(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{user.designation_title || user.role}</span>
                  {(loggedInUser.role === 'manager' || loggedInUser.role === 'admin') && (
                    <button 
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Change Working Role"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDesignationId(user.designation_id || '');
                        setEditingUserId(user.id);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </td>
            <td>
              <span className="balance-cell">{user.total_leave_balance} days</span>
            </td>
            <td>
              <span className="taken-cell">{user.total_leaves_taken} days</span>
            </td>
            <td>
              <span className="font-mono">{user.avg_daily_hours || 0}h</span>
            </td>
            <td>
              {(user.avg_daily_hours || 0) >= 8 ? (
                <span className="badge badge-success">Meeting Req</span>
              ) : (
                <span className="badge badge-danger">Action Req</span>
              )}
            </td>
            {loggedInUser.role === 'admin' && (
              <td>
                <div className="flex gap-2">
                  {user.role !== 'admin' && (
                    <button className="btn btn-outline btn-sm text-xs py-1 px-2" onClick={() => handlePromoteRole(user.id, 'admin')}>Promote Admin</button>
                  )}
                  {user.role !== 'manager' && user.role !== 'admin' && (
                    <button className="btn btn-outline btn-sm text-xs py-1 px-2" onClick={() => handlePromoteRole(user.id, 'manager')}>Promote Manager</button>
                  )}
                  {user.role !== 'employee' && user.id !== loggedInUser.id && (
                    <button className="btn btn-outline btn-sm text-xs py-1 px-2" onClick={() => handlePromoteRole(user.id, 'employee')}>Demote</button>
                  )}
                  {user.id !== loggedInUser.id && (
                    <Link to={`/messages?user_id=${user.id}`} className="btn btn-outline btn-primary btn-sm text-xs py-1 px-2">Message</Link>
                  )}
                </div>
              </td>
            )}
            {loggedInUser.role === 'manager' && (
              <td>
                <div className="flex gap-2">
                  {user.id !== loggedInUser.id && (
                    <Link to={`/messages?user_id=${user.id}`} className="btn btn-outline btn-primary btn-sm text-xs py-1 px-2">Message</Link>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AllEmployees;
