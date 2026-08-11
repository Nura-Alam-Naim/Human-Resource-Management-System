import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchUsers();
    fetchDesignations();
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

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Leave Balance</th>
                <th>Leaves Taken</th>
                <th>Avg Daily Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    <div className="flex justify-center mt-2 mb-2"><div className="spinner spinner-sm"></div></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No employees found.</td>
                </tr>
              ) : (
                users.map(user => (
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
                      {editingUserId === user.id ? (
                        <div className="flex gap-2 align-center">
                          <select 
                            className="form-control form-control-sm"
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={isProfileModalOpen && !!selectedUser}
        onClose={() => { setIsProfileModalOpen(false); setSelectedUser(null); }}
        title="Employee Profile"
        size="large"
      >
        <EmployeeProfileView data={selectedUser} onUpdate={() => { viewUserProfile(selectedUser.user.id); fetchUsers(); }} />
      </Modal>
    </div>
  );
};

export default AllEmployees;
